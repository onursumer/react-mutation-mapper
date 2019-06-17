import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";

import MutationStatus from "./component/column/MutationStatus";
import ProteinChange, {proteinChangeSortMethod} from "./component/column/ProteinChange";
import {Mutation} from "./model/Mutation";
import DataTable, {IDataTableProps} from "./DataTable";

export enum MutationColumn {
    PROTEIN_CHANGE = "proteinChange",
    MUTATION_STATUS = "mutationStatus"
}

@observer
class DefaultMutationTableComponent extends DataTable<Mutation> {}

@observer
export default class DefaultMutationTable extends React.Component<IDataTableProps<Mutation>, {}>
{
    @computed
    get columns() {
        return [
            {
                id: MutationColumn.PROTEIN_CHANGE,
                accessor: MutationColumn.PROTEIN_CHANGE,
                Cell: (column: any) => <ProteinChange mutation={column.original} />,
                Header: "Protein Change",
                sortMethod: proteinChangeSortMethod
            },
            {
                id: MutationColumn.MUTATION_STATUS,
                accessor: MutationColumn.MUTATION_STATUS,
                Cell: (column: any) => <MutationStatus mutation={column.original} />,
                Header: "Mutation Status"
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
