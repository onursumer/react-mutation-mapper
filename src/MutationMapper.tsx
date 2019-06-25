import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";

import {MobxCache} from "./model/MobxCache";
import {Mutation} from "./model/Mutation";
import MutationMapperStore from "./model/MutationMapperStore";
import DefaultMutationMapperStore from "./store/DefaultMutationMapperStore";
import LollipopMutationPlot from "./LollipopMutationPlot";
import DefaultMutationRateSummary, {MutationRate} from "./DefaultMutationRateSummary";
import DefaultMutationTable from "./DefaultMutationTable";
import GeneSummary from "./GeneSummary";
import {TrackVisibility} from "./TrackSelector";
import {initDefaultTrackVisibility} from "./util/TrackUtils";

export type MutationMapperProps = {
    hugoSymbol: string;
    data: Partial<Mutation>[];
    store?: MutationMapperStore;
    trackVisibility?: TrackVisibility;
    mutationTable?: JSX.Element;
    mutationRates?: MutationRate[];
    pubMedCache?: MobxCache;
    // TODO annotateMutations?: boolean;
    genomeNexusUrl?: string;
    showTranscriptDropDown?: boolean;
    showOnlyAnnotatedTranscriptsInDropdown?: boolean;
    filterMutationsBySelectedTranscript?: boolean;
    isoformOverrideSource?: string;
    mainLoadingIndicator?: JSX.Element;
    geneSummaryLoadingIndicator?: JSX.Element;
};

@observer
export default class MutationMapper extends React.Component<MutationMapperProps, {}>
{
    public static defaultProps: Partial<MutationMapperProps> = {
        // TODO pubMedCache
        showOnlyAnnotatedTranscriptsInDropdown: false,
        showTranscriptDropDown: false,
        filterMutationsBySelectedTranscript: false,
    };

    @observable
    private _trackVisibility: TrackVisibility | undefined;

    @computed
    get geneWidth(){
        // TODO return WindowStore.size.width * 0.7 - this.lollipopPlotGeneX;
        return 666;
    }

    @computed
    protected get trackVisibility(): TrackVisibility
    {
        if (this.props.trackVisibility) {
            return this.props.trackVisibility!;
        }
        else {
            if (!this._trackVisibility) {
                this._trackVisibility = initDefaultTrackVisibility();
            }

            return this._trackVisibility;
        }
    }

    @computed
    get store(): MutationMapperStore {
        return this.props.store || new DefaultMutationMapperStore(
            {
                // TODO entrezGeneId: ???,
                hugoGeneSymbol: this.props.hugoSymbol
            },
            {
                isoformOverrideSource: this.props.isoformOverrideSource,
                filterMutationsBySelectedTranscript: this.props.filterMutationsBySelectedTranscript,
                genomeNexusUrl: this.props.genomeNexusUrl
            },
            () => this.props.data as Mutation[]);
    }

    // TODO for this we need to implement data table items label first...
    // @computed
    // get multipleMutationInfo(): string {
    //     const count = this.store.dataStore.duplicateMutationCountInMultipleSamples;
    //     const mutationsLabel = count === 1 ? "mutation" : "mutations";
    //
    //     return count > 0 ? `: includes ${count} duplicate ${mutationsLabel} in patients with multiple samples` : "";
    // }
    //
    // @computed get itemsLabelPlural(): string {
    //     return `Mutations${this.multipleMutationInfo}`;
    // }

    get mutationTableComponent() {
        return this.props.mutationTable || (
            <DefaultMutationTable
                dataStore={this.store.dataStore}
                hotspotData={this.store.indexedHotspotData}
                oncoKbData={this.store.oncoKbData}
                oncoKbCancerGenes={this.store.oncoKbCancerGenes}
                oncoKbEvidenceCache={this.store.oncoKbEvidenceCache}
            />
        );
    }

    get mutationPlot() {
        return (
            <LollipopMutationPlot
                store={this.store}
                pubMedCache={this.props.pubMedCache}
                geneWidth={this.geneWidth}
                trackVisibility={this.trackVisibility}
                // TODO set more props
                // onXAxisOffset={this.onXAxisOffset}
                // trackDataStatus={this.trackDataStatus}
                // onTrackVisibilityChange={this.onTrackVisibilityChange}
            />
        );
    }

    get geneSummary():JSX.Element
    {
        return (
            <GeneSummary
                hugoGeneSymbol={this.store.gene.hugoGeneSymbol}
                uniprotId={this.store.uniprotId.result}
                showDropDown={!!this.props.showTranscriptDropDown}
                showOnlyAnnotatedTranscriptsInDropdown={!!this.props.showOnlyAnnotatedTranscriptsInDropdown}
                transcriptsByTranscriptId={this.store.transcriptsByTranscriptId}
                canonicalTranscript={this.store.canonicalTranscript}
                loadingIndicator={this.props.geneSummaryLoadingIndicator}
                activeTranscript={this.store.activeTranscript}
                indexedVariantAnnotations={this.store.indexedVariantAnnotations}
                transcriptsWithAnnotations={this.store.transcriptsWithAnnotations}
                transcriptsWithProteinLength={this.store.transcriptsWithProteinLength}
                mutationsByTranscriptId={this.store.mutationsByTranscriptId}
                onTranscriptChange={this.handleTranscriptChange}
            />
        );
    }

    get mutationRateSummary(): JSX.Element|null {
        return this.props.mutationRates ? <DefaultMutationRateSummary rates={this.props.mutationRates} /> : null;
    }

    get isMutationTableDataLoading() {
        // Child classes should override this method
        return false;
    }

    get mutationTable(): JSX.Element|null
    {
        return (
            <span>
                {this.mutationTableComponent}
            </span>
        );
    }

    get isMutationPlotDataLoading() {
        return this.store.pfamDomainData.isPending;
    }

    get isLoading() {
        return this.store.mutationData.isPending || this.isMutationPlotDataLoading || this.isMutationTableDataLoading;
    }

    get loadingIndicator() {
        return this.props.mainLoadingIndicator || <i className="fa fa-spinner fa-pulse fa-2x" />;
    }

    // TODO add missing components!
    public render()
    {
        return this.isLoading ? this.loadingIndicator : (
            <div>
                {/*!this.props.store.dataStore.showingAllData && this.filterResetPanel()*/}
                <div style={{ display:'flex' }}>
                    <div className="borderedChart" style={{ marginRight: "1rem" }}>
                        {this.mutationPlot}
                        {/*this.proteinChainPanel*/}
                    </div>
                    <div className="mutationMapperMetaColumn">
                        {this.geneSummary}
                        {this.mutationRateSummary}
                        {/*this.proteinImpactTypePanel*/}
                        {/*this.view3dButton*/}
                    </div>
                </div>
                {this.mutationTable}
            </div>
        );
    }

    @action.bound
    protected handleTranscriptChange(transcriptId: string)
    {
        this.store.activeTranscript = transcriptId;
        // TODO this.close3dPanel();
    }
}
