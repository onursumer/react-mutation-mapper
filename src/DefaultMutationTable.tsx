import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";

import MutationStatus from "./component/column/MutationStatus";
import MutationType from "./component/column/MutationType";
import ProteinChange, {proteinChangeSortMethod} from "./component/column/ProteinChange";
import {Mutation} from "./model/Mutation";
import DataTable, {IDataTableProps} from "./DataTable";

export enum MutationColumn {
    PROTEIN_CHANGE = "proteinChange",
    MUTATION_STATUS = "mutationStatus",
    MUTATION_TYPE = "mutationType",
    CHROMOSOME = "chromosome",
    START_POSITION = "startPosition",
    END_POSITION = "endPosition",
    REFERENCE_ALLELE = "referenceAllele",
    VARIANT_ALLELE = "variantAllele"
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
            },
            {
                id: MutationColumn.MUTATION_TYPE,
                accessor: MutationColumn.MUTATION_TYPE,
                Cell: (column: any) => <MutationType mutation={column.original} />,
                Header: "Mutation Type"
            },
            {
                id: MutationColumn.CHROMOSOME,
                accessor: MutationColumn.CHROMOSOME,
                Header: "Chromosome"
            },
            {
                id: MutationColumn.START_POSITION,
                accessor: MutationColumn.START_POSITION,
                Header: "Start Pos"
            },
            {
                id: MutationColumn.END_POSITION,
                accessor: MutationColumn.END_POSITION,
                Header: "End Pos"
            },
            {
                id: MutationColumn.REFERENCE_ALLELE,
                accessor: MutationColumn.REFERENCE_ALLELE,
                Header: "Ref"
            },
            {
                id: MutationColumn.VARIANT_ALLELE,
                accessor: MutationColumn.VARIANT_ALLELE,
                Header: "Var"
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
