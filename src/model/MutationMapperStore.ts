import {Hotspot, IHotspotIndex} from "./CancerHotspot";
import DataStore from "./DataStore";
import {Gene} from "./Gene";
import {EnsemblTranscript} from "./EnsemblTranscript";
import {Mutation} from "./Mutation";
import {IndicatorQueryResp} from "./OncoKb";
import {PfamDomain} from "./Pfam";
import {PostTranslationalModification} from "./PostTranslationalModification";
import {RemoteData} from "./RemoteData";
import {VariantAnnotation} from "../generated/GenomeNexusAPI";

export interface MutationMapperStore {
    gene: Gene;
    dataStore: DataStore;
    uniprotId: RemoteData<string | undefined>;
    activeTranscript?: string;
    canonicalTranscript: RemoteData<EnsemblTranscript | undefined>,
    mutationAlignerLinks: RemoteData<{[pfamAccession:string]:string} | undefined>;
    pfamDomainData: RemoteData<PfamDomain[] | undefined>;
    allTranscripts: RemoteData<EnsemblTranscript[] | undefined>;
    transcriptsByTranscriptId: {[transcriptId: string]: EnsemblTranscript};
    mutationsByPosition: {[pos:number]: Mutation[]};
    uniqueMutationCountsByPosition: {[pos: number]: number};
    ptmDataByProteinPosStart: RemoteData<{[pos: number]: PostTranslationalModification[]} | undefined>;
    ptmDataByTypeAndProteinPosStart: RemoteData<{[type: string] : {[position: number] : PostTranslationalModification[]}} | undefined>;
    indexedHotspotData: RemoteData<IHotspotIndex | undefined>;
    hotspotsByPosition: {[pos: number]: Hotspot[]};
    oncoKbDataByPosition: {[pos: number]: IndicatorQueryResp[]};
    indexedVariantAnnotations: RemoteData<{[genomicLocation: string]: VariantAnnotation} | undefined>;
    transcriptsWithAnnotations: RemoteData<string[] | undefined>;
    transcriptsWithProteinLength: RemoteData<string[] | undefined>;
    mutationsByTranscriptId: {[transcriptId:string]: Mutation[]};
}

export default MutationMapperStore;
