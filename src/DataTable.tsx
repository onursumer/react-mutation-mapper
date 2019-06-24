import autobind from "autobind-decorator";
import classnames from "classnames";
import _ from "lodash";
import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import ReactTable, {Column, RowInfo} from "react-table";

import {DataStore} from "./model/DataStore";
import {RemoteData} from "./model/RemoteData";
import './defaultDataTable.scss';
import {getRemoteDataGroupStatus} from "./util/RemoteDataUtils";

export type DataTableProps<T> =
{
    data?: T[];
    dataStore?: DataStore;
    columns?: Column<T>[];
    className?: string;

    initialSortColumnData?: (RemoteData<any>|undefined)[];
    initialSortColumn?: string;
    initialSortDirection?: 'asc'|'desc';
    initialItemsPerPage?: number;

    highlightColorLight?: string;
    highlightColorDark?: string;
};

export function getInitialColumnDataStatus(initialSortColumnData?: (RemoteData<any>|undefined)[]) {
    return initialSortColumnData ? getRemoteDataGroupStatus(_.compact(initialSortColumnData)) : "complete";
}

@observer
export default class DataTable<T> extends React.Component<DataTableProps<T>, {}>
{
    public static defaultProps = {
        data: [],
        initialSortDirection: "desc",
        initialItemsPerPage: 10,
        highlightColorLight: "#B0BED9",
        highlightColorDark: "#9FAFD1"
    };

    @computed
    get tableData(): T[] | undefined
    {
        let data = this.props.data;

        if (this.props.dataStore) {
            data = this.props.dataStore.sortedFilteredSelectedData.length > 0 ?
                this.props.dataStore.sortedFilteredSelectedData : this.props.dataStore.sortedFilteredData
        }

        return data;
    }

    @computed
    get columns(): Column[] {
        return this.props.columns || [];
    }

    @computed
    get needToCustomizeRowStyle() {
        return this.props.dataStore && this.props.dataStore.highlightFilters;
    }

    @computed
    get showPagination() {
        const initialItemsPerPage = this.props.initialItemsPerPage;

        return (
            this.tableData !== undefined &&
            this.tableData.length > initialItemsPerPage!
        );
    }

    @computed
    get defaultPageSize() {
        const initialItemsPerPage = this.props.initialItemsPerPage;

        return this.tableData ?
            (this.tableData.length > initialItemsPerPage! ? initialItemsPerPage : this.tableData.length) : 1;
    }

    @computed
    get initialColumnDataStatus() {
        return getInitialColumnDataStatus(this.props.initialSortColumnData);
    }

    @computed
    get defaultSorted() {
        const {
            initialSortColumn,
            initialSortDirection
        } = this.props;

        if (initialSortColumn === undefined || this.initialColumnDataStatus === "pending") {
            return undefined;
        }
        else {
            return [{
                id: initialSortColumn,
                desc: initialSortDirection === 'desc'
            }];
        }
    }

    public render()
    {
        return (
            <div className={classnames(this.props.className, 'cbioportal-frontend', 'default-data-table')}>
                <ReactTable
                    data={this.tableData}
                    columns={this.columns}
                    getTrProps={this.needToCustomizeRowStyle ? this.getTrProps : undefined}
                    defaultSorted={this.defaultSorted}
                    defaultPageSize={this.defaultPageSize}
                    showPagination={this.showPagination}
                    className="-striped -highlight"
                    previousText="<"
                    nextText=">"
                />
            </div>
        );
    }

    @autobind
    protected getTrProps(state: any, row?: RowInfo)
    {
        return {
            style: {
                background: state && row && this.getRowBackground(row)
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
            background = row.viewIndex % 2 === 1 ? this.props.highlightColorDark : this.props.highlightColorLight;
        }

        return background;
    }
}
