import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";

import MutationStatus from "./component/column/MutationStatus";
import MutationType from "./component/column/MutationType";
import ProteinChange, {proteinChangeSortMethod} from "./component/column/ProteinChange";
import {Mutation} from "./model/Mutation";
import DataTable, {IDataTableProps} from "./DataTable";
import ColumnHeader from "./component/column/ColumnHeader";

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

const HEADERS = {
    [MutationColumn.PROTEIN_CHANGE]: (
        <ColumnHeader headerContent={<span>Protein Change</span>} />
    ),
    [MutationColumn.MUTATION_STATUS]: (
        <ColumnHeader headerContent={<span>MS</span>} overlay={<span>Mutation Status</span>} />
    ),
    [MutationColumn.MUTATION_TYPE]: (
        <ColumnHeader headerContent={<span>Mutation Type</span>} />
    ),
    [MutationColumn.CHROMOSOME]: (
        <ColumnHeader headerContent={<span>Chromosome</span>} />
    ),
    [MutationColumn.START_POSITION]: (
        <ColumnHeader headerContent={<span>Start Pos</span>} />
    ),
    [MutationColumn.END_POSITION]: (
        <ColumnHeader headerContent={<span>End Pos</span>} />
    ),
    [MutationColumn.REFERENCE_ALLELE]: (
        <ColumnHeader headerContent={<span>Ref</span>} overlay={<span>Reference Allele</span>} />
    ),
    [MutationColumn.VARIANT_ALLELE]: (
        <ColumnHeader headerContent={<span>Var</span>} overlay={<span>Variant Allele</span>} />
    ),
};

@observer
class DefaultMutationTableComponent extends DataTable<Mutation> {}

@observer
export default class DefaultMutationTable extends React.Component<IDataTableProps<Mutation>, {}>
{
    @computed
    get tableData(): Mutation[]
    {
        return this.props.dataStore && this.props.dataStore.selectionFilters.length > 0 ?
            this.props.data.filter(m => this.props.dataStore!.dataSelectFilter(m)) : this.props.data;
    }

    @computed
    get columns() {
        return [
            {
                id: MutationColumn.PROTEIN_CHANGE,
                accessor: MutationColumn.PROTEIN_CHANGE,
                Cell: (column: any) => <ProteinChange mutation={column.original} />,
                Header: HEADERS[MutationColumn.PROTEIN_CHANGE],
                sortMethod: proteinChangeSortMethod
            },
            {
                id: MutationColumn.MUTATION_TYPE,
                accessor: MutationColumn.MUTATION_TYPE,
                Cell: (column: any) => <MutationType mutation={column.original} />,
                Header: HEADERS[MutationColumn.MUTATION_TYPE]
            },
            {
                id: MutationColumn.MUTATION_STATUS,
                accessor: MutationColumn.MUTATION_STATUS,
                Cell: (column: any) => <MutationStatus mutation={column.original} />,
                Header: HEADERS[MutationColumn.MUTATION_STATUS]
            },
            {
                id: MutationColumn.CHROMOSOME,
                accessor: MutationColumn.CHROMOSOME,
                Header: HEADERS[MutationColumn.CHROMOSOME]
            },
            {
                id: MutationColumn.START_POSITION,
                accessor: MutationColumn.START_POSITION,
                Header: HEADERS[MutationColumn.START_POSITION]
            },
            {
                id: MutationColumn.END_POSITION,
                accessor: MutationColumn.END_POSITION,
                Header: HEADERS[MutationColumn.END_POSITION]
            },
            {
                id: MutationColumn.REFERENCE_ALLELE,
                accessor: MutationColumn.REFERENCE_ALLELE,
                Header: HEADERS[MutationColumn.REFERENCE_ALLELE]
            },
            {
                id: MutationColumn.VARIANT_ALLELE,
                accessor: MutationColumn.VARIANT_ALLELE,
                Header: HEADERS[MutationColumn.VARIANT_ALLELE]
            }
        ];
    }

    public render() {
        return (
            <DefaultMutationTableComponent
                {...this.props}
                data={this.tableData}
                columns={this.columns}
            />
        );
    }
}
