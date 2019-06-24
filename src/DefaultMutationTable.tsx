import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";

import MutationStatus from "./component/column/MutationStatus";
import MutationType from "./component/column/MutationType";
import ProteinChange, {proteinChangeSortMethod} from "./component/column/ProteinChange";
import {IHotspotIndex} from "./model/CancerHotspot";
import {Mutation} from "./model/Mutation";
import {CancerGene, IOncoKbData} from "./model/OncoKb";
import {RemoteData} from "./model/RemoteData";
import DataTable, {DataTableProps} from "./DataTable";
import ColumnHeader from "./component/column/ColumnHeader";
import Annotation, {annotationSortMethod, getAnnotationData} from "./component/column/Annotation";

export type DefaultMutationTableProps = {
    hotspotData?: RemoteData<IHotspotIndex | undefined>;
    oncoKbData?: RemoteData<IOncoKbData | Error | undefined>;
    oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>;
} & DataTableProps<Mutation>;

export enum MutationColumn {
    PROTEIN_CHANGE = "proteinChange",
    ANNOTATION = "annotation",
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
    [MutationColumn.ANNOTATION]: (
        <ColumnHeader headerContent={<span>Annotation</span>} />
    ),
    [MutationColumn.MUTATION_STATUS]: (
        <ColumnHeader headerContent={<span>Mutation Status</span>} />
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
export default class DefaultMutationTable extends React.Component<DefaultMutationTableProps, {}>
{
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
                id: MutationColumn.ANNOTATION,
                // TODO workaround: returning a function as an accessor to make sorting works,
                // there might be a better way to fix this problem
                accessor: (mutation: Mutation) => () => getAnnotationData(
                    mutation,
                    this.props.oncoKbCancerGenes,
                    this.props.hotspotData,
                    this.props.oncoKbData
                ),
                Cell: (column: any) =>
                    <Annotation
                        mutation={column.original}
                        enableOncoKb={true}
                        enableHotspot={true}
                        hotspotData={this.props.hotspotData}
                        oncoKbData={this.props.oncoKbData}
                        oncoKbCancerGenes={this.props.oncoKbCancerGenes}
                    />,
                Header: HEADERS[MutationColumn.ANNOTATION],
                sortMethod: annotationSortMethod
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
                columns={this.columns}
            />
        );
    }
}
