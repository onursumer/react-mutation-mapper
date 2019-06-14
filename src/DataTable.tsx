import autobind from "autobind-decorator";
import * as React from 'react';
import {observer} from "mobx-react";
import ReactTable, {Column, RowInfo} from "react-table";
import classnames from "classnames";
import {computed} from "mobx";

export interface IDataTableProps<T> {
    data: T[];
    columns?: Column<T>[];
    isHighlighted?: (datum: T) => boolean;
    className?: string;

    initialSortColumn?: string;
    initialSortDirection?: 'asc'|'desc';
    initialItemsPerPage?: number;
}

@observer
export default class DataTable<T> extends React.Component<IDataTableProps<T>, {}>
{
    public static defaultProps = {
        data: [],
        initialSortDirection: "desc",
        initialItemsPerPage: 10
    };

    @computed
    get columns(): Column[] {
        return this.props.columns || [];
    }

    public render()
    {
        const {
            data,
            initialSortColumn,
            initialSortDirection,
            initialItemsPerPage,
        } = this.props;

        const showPagination = data.length >
            (this.props.initialItemsPerPage || DataTable.defaultProps.initialItemsPerPage);

        const defaultSorted = initialSortColumn ? [{
                id: initialSortColumn,
                desc: initialSortDirection === 'desc'
            }] : undefined;

        return (
            <div className={classnames(this.props.className, 'cbioportal-frontend', 'default-data-table')}>
                <ReactTable
                    data={data}
                    columns={this.columns}
                    getTrProps={this.props.isHighlighted ? this.getTrProps : undefined}
                    defaultSorted={defaultSorted}
                    defaultPageSize={data.length > initialItemsPerPage! ? initialItemsPerPage : data.length}
                    showPagination={showPagination}
                    showPaginationTop={true}
                    showPaginationBottom={false}
                    className="-striped -highlight"
                    previousText="<"
                    nextText=">"
                />
            </div>
        );
    }

    @autobind
    protected getTrProps(state: any, row: RowInfo) {
        return {
            style: {
                background: this.isRowHighlighted(row.original) ? "red" : undefined
            }
        };
    }

    @autobind
    protected isRowHighlighted(datum: T) {
        return this.props.isHighlighted && this.props.isHighlighted(datum);
    }
}