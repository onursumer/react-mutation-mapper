import autobind from "autobind-decorator";
import _ from "lodash";
import {computed, observable} from "mobx";
import MobxPromise, {cached} from "mobxpromise";

import {remoteData} from "cbioportal-frontend-commons";

import {AggregatedHotspots, Hotspot, IHotspotIndex} from "../model/CancerHotspot";
import {DataFilter} from "../model/DataFilter";
import DataStore from "../model/DataStore";
import {EnsemblTranscript} from "../model/EnsemblTranscript";
import {Gene} from "../model/Gene";
import {Mutation} from "../model/Mutation";
import MutationMapperStore from "../model/MutationMapperStore";
import {CancerGene, IndicatorQueryResp, IOncoKbData} from "../model/OncoKb";
import {PfamDomain, PfamDomainRange} from "../model/Pfam";
import {PostTranslationalModification} from "../model/PostTranslationalModification";
import {
    defaultHotspotFilter,
    groupCancerHotspotDataByPosition,
    groupHotspotsByMutations,
    indexHotspotsData,
    isHotspot
} from "../util/CancerHotspotsUtils";
import {ONCOKB_DEFAULT_DATA} from "../util/DataFetcherUtils";
import {groupMutationsByProteinStartPos} from "../util/MutationUtils";
import {
    defaultOncoKbFilter,
    defaultOncoKbIndicatorFilter,
    groupOncoKbIndicatorDataByMutations
} from "../util/OncoKbUtils";
import {groupPtmDataByPosition, groupPtmDataByTypeAndPosition} from "../util/PtmUtils";
import {DefaultMutationMapperDataStore} from "./DefaultMutationMapperDataStore";
import {DefaultMutationMapperDataFetcher} from "./DefaultMutationMapperDataFetcher";

interface DefaultMutationMapperStoreConfig {
    isoformOverrideSource?: string;
    filterMutationsBySelectedTranscript?: boolean;
}

class DefaultMutationMapperStore implements MutationMapperStore
{
    @observable
    private _activeTranscript: string | undefined = undefined;

    constructor(
        public gene: Gene,
        protected config: DefaultMutationMapperStoreConfig,
        protected getMutations: () => Mutation[]
    ) {

    }

    @computed
    public get activeTranscript(): string | undefined
    {
        if (this._activeTranscript !== undefined) {
            return this._activeTranscript;
        }
        else if (!this.canonicalTranscript.isPending && this.canonicalTranscript.result) {
            return this.canonicalTranscript.result.transcriptId;
        }
        else {
            return undefined;
        }
    }

    public set activeTranscript(transcript: string | undefined) {
        this._activeTranscript = transcript;
    }

    @computed
    public get isoformOverrideSource(): string {
        return this.config.isoformOverrideSource || "uniprot";
    }

    @cached
    public get dataStore(): DataStore {
        return new DefaultMutationMapperDataStore(this.mutations, this.customFilterApplier);
    }

    @computed
    public get mutations(): Mutation[] {
        return this.getMutations();
    }

    @computed
    public get dataFetcher(): DefaultMutationMapperDataFetcher {
        return new DefaultMutationMapperDataFetcher({});
    }

    @computed
    public get mutationsByPosition(): {[pos:number]: Mutation[]} {
        return groupMutationsByProteinStartPos(_.flatten(this.dataStore.sortedFilteredData));
    }

    @computed
    public get uniqueMutationCountsByPosition(): {[pos: number]: number} {
        const map: {[pos: number]: number} = {};

        Object.keys(this.mutationsByPosition).forEach(pos => {
            const position = parseInt(pos, 10);
            // for each position multiple mutations for the same patient is counted only once
            const mutations = this.mutationsByPosition[position];
            if (mutations) {
                map[position] = this.countUniqueMutations(mutations);
            }
        });

        return map;
    }

    @computed
    public get transcriptsByTranscriptId(): {[transcriptId:string]: EnsemblTranscript} {
        return _.keyBy(this.allTranscripts.result, (transcript: EnsemblTranscript) => transcript.transcriptId);
    }

    public countUniqueMutations(mutations: Mutation[]): number
    {
        // assume by default all mutations are unique
        // child classes need to override this method to have a custom way of counting unique mutations
        return mutations.length;
    }

    readonly mutationData = remoteData({
        await: () => [
            this.canonicalTranscript
        ],
        invoke: async () => {
            return this.mutations;
        }
    }, []);

    readonly swissProtId: MobxPromise<string> = remoteData({
        invoke: async() => {
            // do not try fetching swissprot data for invalid entrez gene ids,
            // just return the default value
            if (!this.gene.entrezGeneId || this.gene.entrezGeneId < 1) {
                return "";
            }

            const accession:string|string[] = await this.dataFetcher.fetchSwissProtAccession(this.gene.entrezGeneId);

            if (_.isArray(accession)) {
                return accession[0];
            }
            else {
                return accession;
            }
        },
        onError: () => {
            // fail silently
        }
    }, "");

    readonly uniprotId: MobxPromise<string | undefined> = remoteData({
        await: () => [
            this.swissProtId
        ],
        invoke: async() => {
            if (this.swissProtId.result) {
                return this.dataFetcher.fetchUniprotId(this.swissProtId.result);
            }
            else {
                return "";
            }
        },
        onError: () => {
            // fail silently
        }
    }, "");

    readonly mutationAlignerLinks: MobxPromise<{[pfamAccession: string]: string} | undefined> = remoteData({
        await: () => [
            this.canonicalTranscript,
            this.allTranscripts,
        ],
        invoke: () => (new Promise((resolve,reject) => {
            const regions = (
                this.allTranscripts.result &&
                this.activeTranscript &&
                this.transcriptsByTranscriptId[this.activeTranscript]
            ) ? this.transcriptsByTranscriptId[this.activeTranscript].pfamDomains : undefined;

            const responsePromises:Promise<Response>[] = [];
            for (let i=0; regions && i<regions.length; i++) {
                // have to do a for loop because seamlessImmutable will make result of .map immutable,
                // and that causes infinite loop here
                // TODO fix `as any`
                responsePromises.push(this.dataFetcher.fetchMutationAlignerLink(regions[i].pfamDomainId) as any);
            }
            const allResponses = Promise.all(responsePromises);
            allResponses.then(responses => {
                // TODO fix `as any`
                const data = responses.map(r => JSON.parse(r.text as any));
                const ret:{[pfamAccession:string]:string} = {};
                let mutationAlignerData:any;
                let pfamAccession:string|null;
                for (let i=0; i<data.length; i++) {
                    mutationAlignerData = data[i];
                    pfamAccession = regions ? regions[i].pfamDomainId : null;
                    if (pfamAccession && mutationAlignerData.linkToMutationAligner) {
                        ret[pfamAccession] = mutationAlignerData.linkToMutationAligner;
                    }
                }
                resolve(ret);
            });
            allResponses.catch(reject);
        }))
    }, {});

    readonly pfamDomainData: MobxPromise<PfamDomain[] | undefined> = remoteData({
        await: ()=> [
            this.canonicalTranscript,
            this.transcriptsWithProteinLength
        ],
        invoke: async() => {
            if (this.canonicalTranscript.result && this.canonicalTranscript.result.pfamDomains && this.canonicalTranscript.result.pfamDomains.length > 0) {
                let domainRanges = this.canonicalTranscript.result.pfamDomains;
                if (this.config.filterMutationsBySelectedTranscript && this.transcriptsWithProteinLength.result && this.transcriptsWithProteinLength.result.length > 0) {
                    // add domain ranges for all transcripts to this call
                    domainRanges = [].concat.apply([domainRanges], _.compact(this.transcriptsWithProteinLength.result.map((transcriptId:string) => this.transcriptsByTranscriptId[transcriptId].pfamDomains)));
                }
                return this.dataFetcher.fetchPfamDomainData(domainRanges.map((x: PfamDomainRange) => x.pfamDomainId));
            } else {
                return undefined;
            }
        }
    }, undefined);

    readonly canonicalTranscript: MobxPromise<EnsemblTranscript | undefined> = remoteData({
        await: () => [
            this.transcriptsByHugoSymbol
        ],
        invoke: async() => {
            if (this.gene) {
                return this.dataFetcher.fetchCanonicalTranscriptWithFallback(
                    this.gene.hugoGeneSymbol, this.isoformOverrideSource, this.transcriptsByHugoSymbol.result);
            } else {
                return undefined;
            }
        },
        onError: () => {
            throw new Error("Failed to get canonical transcript");
        }
    }, undefined);

    readonly allTranscripts: MobxPromise<EnsemblTranscript[] | undefined> = remoteData({
        await: () => [
            this.transcriptsByHugoSymbol,
            this.canonicalTranscript
        ],
        invoke: async() => {
            return _.compact(_.unionBy(
                this.transcriptsByHugoSymbol.result,
                [this.canonicalTranscript.result],
                (t) => t && t.transcriptId
            ));
        },
        onError: () => {
            throw new Error("Failed to get all transcripts");
        }
    }, undefined);

    readonly transcriptsByHugoSymbol: MobxPromise<EnsemblTranscript[] | undefined> = remoteData({
        invoke: async() => {
            if (this.gene) {
                return this.dataFetcher.fetchEnsemblTranscriptsByEnsemblFilter(
                    {"hugoSymbols":[this.gene.hugoGeneSymbol]});
            } else {
                return undefined;
            }
        },
        onError: () => {
            throw new Error("Failed to fetch all transcripts");
        }
    }, undefined);

    readonly transcriptsWithProteinLength: MobxPromise<string[] | undefined> = remoteData({
        await: () => [
            this.allTranscripts,
            this.canonicalTranscript
        ],
        invoke: async()=>{
            if (this.allTranscripts.result && this.canonicalTranscript.result) {
                // ignore transcripts without protein length
                // TODO: better solution is to hide lollipop plot for those transcripts
                return _.compact(this.allTranscripts.result.map((et: EnsemblTranscript) => et.proteinLength && et.transcriptId));
            } else {
                return [];
            }
        },
        onError: () => {
            throw new Error("Failed to get transcriptsWithProteinLength");
        }
    }, undefined);

    readonly ptmData: MobxPromise<PostTranslationalModification[]> = remoteData({
        await: () => [
            this.mutationData
        ],
        invoke: async () => {
            if (this.activeTranscript) {
                return this.dataFetcher.fetchPtmData(this.activeTranscript);
            }
            else {
                return [];
            }
        },
        onError: () => {
            // fail silently
        }
    }, []);

    readonly ptmDataByProteinPosStart: MobxPromise<{[pos: number]: PostTranslationalModification[]} | undefined> = remoteData({
        await: () => [
            this.ptmData
        ],
        invoke: async() => this.ptmData.result ? groupPtmDataByPosition(this.ptmData.result) : {}
    }, {});

    readonly ptmDataByTypeAndProteinPosStart: MobxPromise<{[type: string] : {[position: number] : PostTranslationalModification[]}} | undefined> = remoteData({
        await: () => [
            this.ptmData
        ],
        invoke: async() => this.ptmData.result ? groupPtmDataByTypeAndPosition(this.ptmData.result) : {}
    }, {});

    readonly cancerHotspotsData: MobxPromise<Hotspot[]> = remoteData({
        await: () => [
            this.mutationData
        ],
        invoke: async () => {
            if (this.activeTranscript) {
                // TODO resolve protein start pos if missing
                return this.dataFetcher.fetchCancerHotspotData(this.activeTranscript);
            }
            else {
                return [];
            }
        },
        onError: () => {
            // fail silently
        }
    }, []);

    readonly cancerHotspotsDataByProteinPosStart: MobxPromise<{[pos: number]: Hotspot[]}> = remoteData({
        await: () => [
            this.cancerHotspotsData
        ],
        invoke: async() => this.ptmData.result ? groupCancerHotspotDataByPosition(this.cancerHotspotsData.result!) : {}
    }, {});

    // Hotspots
    readonly hotspotData: MobxPromise<AggregatedHotspots[]> = remoteData({
        await:()=>[
            this.mutationData
        ],
        invoke:()=>{
            return this.dataFetcher.fetchAggregatedHotspotsData(this.mutations);
        }
    });

    readonly indexedHotspotData: MobxPromise<IHotspotIndex | undefined> = remoteData({
        await:()=>[
            this.hotspotData
        ],
        invoke: ()=>Promise.resolve(indexHotspotsData(this.hotspotData))
    });

    @computed
    get hotspotsByPosition(): {[pos: number]: Hotspot[]}
    {
        if (this.indexedHotspotData.result)
        {
            return groupHotspotsByMutations(
                this.mutationsByPosition, this.indexedHotspotData.result, defaultHotspotFilter);
        }
        else {
            return {};
        }
    }

    readonly oncoKbCancerGenes: MobxPromise<CancerGene[] | Error> = remoteData({
        invoke: () => this.dataFetcher.fetchOncoKbCancerGenes()
    }, []);

    readonly oncoKbAnnotatedGenes: MobxPromise<{ [entrezGeneId: number]: boolean }> = remoteData({
        await: () => [this.oncoKbCancerGenes],
        invoke: () => Promise.resolve(
            _.reduce(this.oncoKbCancerGenes.result, (map: { [entrezGeneId: number]: boolean }, next: CancerGene) => {
                if (next.oncokbAnnotated) {
                    map[next.entrezGeneId] = true;
                }
                return map;
            }, {})
        )
    }, {});

    readonly oncoKbData: MobxPromise<IOncoKbData | Error> = remoteData({
        await: () => [
            this.mutationData,
            this.oncoKbAnnotatedGenes
        ],
        invoke: () => this.dataFetcher.fetchOncoKbData(
            this.mutations,
            this.oncoKbAnnotatedGenes.result!,
            this.getDefaultTumorType,
            this.getDefaultEntrezGeneId
        ),
        onError: () => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, ONCOKB_DEFAULT_DATA);

    @computed
    get oncoKbDataByPosition(): {[pos: number]: IndicatorQueryResp[]}
    {
        if (this.oncoKbData.result &&
            !(this.oncoKbData.result instanceof Error))
        {
            return groupOncoKbIndicatorDataByMutations(
                this.mutationsByPosition,
                this.oncoKbData.result,
                this.getDefaultTumorType,
                this.getDefaultEntrezGeneId,
                defaultOncoKbIndicatorFilter);
        }
        else {
            return {};
        }
    }

    @autobind
    protected getDefaultTumorType(mutation: Mutation): string {
        // TODO get actual tumor type for a given mutation (if possible)
        return mutation ? "Unknown" : "";
    }

    @autobind
    protected getDefaultEntrezGeneId(mutation: Mutation): number {
        // assuming all mutations in this store is for the same gene
        return this.gene.entrezGeneId || (mutation.gene && mutation.gene.entrezGeneId) || 0;
    }

    @autobind
    protected customFilterApplier(filter: DataFilter,
                                  mutation: Mutation,
                                  positions: {[position: string]: {position: number}})
    {
        let pick = true;

        if (filter.position) {
            pick = !!positions[mutation.proteinPosStart+""];
        }

        if (pick &&
            filter.hotspot &&
            this.indexedHotspotData.result)
        {
            // TODO for now ignoring the actual filter value and treating as a boolean
            pick = isHotspot(mutation, this.indexedHotspotData.result, defaultHotspotFilter);
        }

        if (pick &&
            filter.oncokb &&
            this.oncoKbData.result &&
            !(this.oncoKbData.result instanceof Error))
        {
            // TODO for now ignoring the actual filter value and treating as a boolean
            pick = defaultOncoKbFilter(mutation,
                this.oncoKbData.result,
                this.getDefaultTumorType,
                this.getDefaultEntrezGeneId);
        }

        if (pick &&
            filter.mutation)
        {
            // TODO add a separate function to apply mutation filters
            pick = !filter.mutation
                .map(f => f.mutationType === undefined || mutation.mutationType === f.mutationType)
                .includes(false);
        }

        return pick;
    }
}

export default DefaultMutationMapperStore;
