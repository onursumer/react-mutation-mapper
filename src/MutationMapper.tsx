import {action, computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";

import {Mutation} from "./model/Mutation";
import MutationMapperStore from "./model/MutationMapperStore";
import DefaultMutationMapperStore from "./store/DefaultMutationMapperStore";
import LollipopMutationPlot from "./LollipopMutationPlot";
import DefaultMutationRateSummary, {MutationRate} from "./DefaultMutationRateSummary";
import DefaultMutationTable from "./DefaultMutationTable";
import GeneSummary from "./GeneSummary";

export type MutationMapperProps = {
    hugoSymbol: string;
    data: Partial<Mutation>[];
    store?: MutationMapperStore;
    mutationTable?: JSX.Element;
    mutationRates?: MutationRate[];
    // TODO annotateMutations?: boolean;
    showTranscriptDropDown?: boolean;
    showOnlyAnnotatedTranscriptsInDropdown?: boolean;
    filterMutationsBySelectedTranscript?: boolean;
    isoformOverrideSource?: string;
    loadingIndicator?: JSX.Element;
};

@observer
export default class MutationMapper extends React.Component<MutationMapperProps, {}>
{
    public static defaultProps: Partial<MutationMapperProps> = {
        showOnlyAnnotatedTranscriptsInDropdown: false,
        showTranscriptDropDown: false,
        filterMutationsBySelectedTranscript: false,
    };

    @computed
    get store(): MutationMapperStore {
        return this.props.store || new DefaultMutationMapperStore(
            {
                // TODO entrezGeneId: ???,
                hugoGeneSymbol: this.props.hugoSymbol
            },
            {
                isoformOverrideSource: this.props.isoformOverrideSource,
                filterMutationsBySelectedTranscript: this.props.filterMutationsBySelectedTranscript
            },
            () => this.props.data as Mutation[]);
    }

    get mutationTableComponent() {
        return this.props.mutationTable || (
            <DefaultMutationTable
                dataStore={this.store.dataStore}
            />
        );
    }

    get mutationPlot() {
        return (
            <LollipopMutationPlot
                store={this.store}
                geneWidth={666}
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
                loadingIndicator={this.props.loadingIndicator}
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
        return this.props.loadingIndicator || <i className="fa fa-spinner fa-pulse fa-2x" />;
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
    private handleTranscriptChange(transcriptId: string)
    {
        this.store.activeTranscript = transcriptId;
        // TODO this.close3dPanel();
    }
}
