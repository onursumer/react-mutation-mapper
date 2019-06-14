import {HotspotFilter} from "./HotspotFilter";
import {OncoKbFilter} from "./OncoKbFilter";

export type DataFilter = {
    position?: number[];
    hotspot?: HotspotFilter[];
    oncokb?: OncoKbFilter[];
}

export type CustomFilterApplier = <T>(filter: DataFilter,
                                      datum: T,
                                      positions: {[position: string]: {position: number}}) => boolean;
