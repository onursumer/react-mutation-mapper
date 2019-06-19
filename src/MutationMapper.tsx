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
    data: Mutation[];
    store?: MutationMapperStore;
    mutationTable?: JSX.Element;
    mutationRates?: MutationRate[];
    showTranscriptDropDown?: boolean;
    showOnlyAnnotatedTranscriptsInDropdown?: boolean;
    loadingIndicator?: JSX.Element;
};

@observer
export default class MutationMapper extends React.Component<MutationMapperProps, {}>
{
    @computed
    get store(): MutationMapperStore {
        return this.props.store || new DefaultMutationMapperStore(
            // TODO entrezGeneId?
            {hugoGeneSymbol: this.props.hugoSymbol} as any,
            {isoformOverrideSource: "mskcc"},
            () => this.props.data);
    }

    get mutationTable() {
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

    // TODO add missing components!
    render() {
        return (
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
        // this.close3dPanel();
    }
}
