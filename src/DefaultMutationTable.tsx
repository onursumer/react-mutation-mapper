import {computed} from "mobx";
import * as React from "react";

import {calcProteinChangeSortValue} from "cbioportal-frontend-commons";

import {Mutation} from "./model/Mutation";
import {defaultSortMethod} from "./util/ReactTableUtils";
import DataTable, {IDataTableProps} from "./DataTable";

class DefaultMutationTableComponent extends DataTable<Mutation> {}

export default class DefaultMutationTable extends React.Component<IDataTableProps<Mutation>, {}>
{
    @computed
    get columns() {
        return [
            {
                id: "proteinChange",
                accessor: "proteinChange",
                Header: "Protein Change",
                sortMethod: (a: string, b: string) =>
                    defaultSortMethod(calcProteinChangeSortValue(a || ""), calcProteinChangeSortValue(b || ""))
            }
        ];
    }

    public render() {
        return (
            <DefaultMutationTableComponent
                {...this.props}
                columns={this.columns}
            />
        );
    }
}
