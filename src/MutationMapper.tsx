import {computed} from "mobx";
import * as React from "react";

import {Mutation} from "./model/Mutation";
import MutationMapperStore from "./model/MutationMapperStore";
import DefaultMutationMapperStore from "./store/DefaultMutationMapperStore";
import LollipopMutationPlot from "./LollipopMutationPlot";
import DefaultMutationTable from "./DefaultMutationTable";
import autobind from "autobind-decorator";

export interface IMutationMapperProps {
    hugoSymbol: string;
    data: Mutation[];
    store?: MutationMapperStore;
    mutationTable?: JSX.Element;
}

export default class MutationMapper extends React.Component<IMutationMapperProps, {}>
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
                data={this.props.data}
                isHighlighted={this.isMutationHighlighted}
            />
        );
    }

    render() {
        return (
            <React.Fragment>
                <LollipopMutationPlot
                    store={this.store}
                    geneWidth={666}
                />
                {this.mutationTable}
            </React.Fragment>
        );
    }

    @autobind
    protected isMutationHighlighted(mutation: Mutation) {
        return this.store.dataStore.dataHighlightFilter(mutation);
    }
}
