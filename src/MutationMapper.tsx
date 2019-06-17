import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";

import {Mutation} from "./model/Mutation";
import MutationMapperStore from "./model/MutationMapperStore";
import DefaultMutationMapperStore from "./store/DefaultMutationMapperStore";
import LollipopMutationPlot from "./LollipopMutationPlot";
import DefaultMutationTable from "./DefaultMutationTable";

export interface IMutationMapperProps {
    hugoSymbol: string;
    data: Mutation[];
    store?: MutationMapperStore;
    mutationTable?: JSX.Element;
}

@observer
export default class MutationMapper extends React.Component<IMutationMapperProps, {}>
{
    @computed
    get tableData(): Mutation[]
    {
        let data = this.props.data;

        if (this.props.store && this.props.store.dataStore) {
            data = this.props.store.dataStore.sortedFilteredSelectedData.length > 0 ?
                this.props.store.dataStore.sortedFilteredSelectedData : this.props.store.dataStore.sortedFilteredData
        }

        return data;
    }

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
                data={this.tableData}
                dataStore={this.store.dataStore}
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
}
