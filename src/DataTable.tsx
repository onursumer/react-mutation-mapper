import autobind from "autobind-decorator";
import * as React from 'react';
import {observer} from "mobx-react";
import ReactTable, {Column, RowInfo} from "react-table";
import classnames from "classnames";
import {computed} from "mobx";

import {DataStore} from "./model/DataStore";
import './defaultDataTable.scss';

export interface IDataTableProps<T> {
    data: T[];
    columns?: Column<T>[];
    dataStore?: DataStore;
    className?: string;

    initialSortColumn?: string;
    initialSortDirection?: 'asc'|'desc';
    initialItemsPerPage?: number;

    highlightColorLight?: string;
    highlightColorDark?: string;
}

@observer
export default class DataTable<T> extends React.Component<IDataTableProps<T>, {}>
{
    public static defaultProps = {
        data: [],
        initialSortDirection: "desc",
        initialItemsPerPage: 10,
        highlightColorLight: "#B0BED9",
        highlightColorDark: "#9FAFD1"
    };

    @computed
    get columns(): Column[] {
        return this.props.columns || [];
    }

    @computed
    get needToCustomizeRowStyle() {
        return this.props.dataStore && this.props.dataStore.highlightFilters;
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
                    getTrProps={this.needToCustomizeRowStyle ? this.getTrProps : undefined}
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
    protected getTrProps(state: any, row: RowInfo)
    {
        return {
            style: {
                background: state && this.getRowBackground(row)
            }
        };
    }

    protected isRowHighlighted(datum: T) {
        return this.props.dataStore && this.props.dataStore.dataHighlightFilter(datum);
    }

    protected getRowBackground(row: RowInfo)
    {
        let background: string | undefined;

        if (this.isRowHighlighted(row.original)) {
            background = row.index % 2 === 1 ? this.props.highlightColorDark : this.props.highlightColorLight;
        }

        return background;
    }
}
