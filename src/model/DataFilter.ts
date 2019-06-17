import {HotspotFilter} from "./HotspotFilter";
import {OncoKbFilter} from "./OncoKbFilter";

export type DataFilter = {
    position?: number[];
    hotspot?: HotspotFilter[];
    oncokb?: OncoKbFilter[];
}

export type CustomFilterApplier = (filter: DataFilter,
                                   datum: any,
                                   positions: {[position: string]: {position: number}}) => boolean;
