import * as React from 'react';
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import {observer} from "mobx-react";
import {observable, computed} from "mobx";
import {HitZoneConfig, defaultHitzoneConfig, initHitZoneFromConfig} from "cbioportal-frontend-commons";

import LollipopPlotNoTooltip from "./LollipopPlotNoTooltip";
import DataStore from "./model/DataStore";
import SequenceSpec from "./model/SequenceSpec";
import LollipopSpec from "./model/LollipopSpec";
import DomainSpec from "./model/DomainSpec";

export type LollipopPlotProps = {
    sequence: SequenceSpec;
    lollipops: LollipopSpec[];
    domains: DomainSpec[];
    vizWidth: number;
    vizHeight: number;
    xMax: number;
    yMax?: number;
    hugoGeneSymbol: string;
    dataStore: DataStore;
    onXAxisOffset?: (offset: number) => void;
};

@observer
export default class LollipopPlot extends React.Component<LollipopPlotProps, {}> {
    @observable private hitZoneConfig: HitZoneConfig = defaultHitzoneConfig();

    private plot: LollipopPlotNoTooltip|undefined;
    private handlers: any;

    constructor(props: LollipopPlotProps) {
        super(props);

        this.handlers = {
            ref: (plot:LollipopPlotNoTooltip)=>{ this.plot = plot; },
            setHitZone:(hitRect:{x:number, y:number, width:number, height:number},
                        content?:JSX.Element,
                        onMouseOver?:()=>void,
                        onClick?:()=>void,
                        onMouseOut?:()=>void,
                        cursor: string = "pointer",
                        tooltipPlacement: string = "top") => {
                this.hitZoneConfig = {
                    hitRect, content, onMouseOver, onClick, onMouseOut, cursor, tooltipPlacement
                };
            },
            getOverlay:()=><Tooltip id={"lollipop-plot-tooltip"}>{this.hitZoneConfig.content}</Tooltip>,
            getOverlayPlacement:()=>this.hitZoneConfig.tooltipPlacement,
            onMouseLeave:()=>{
                this.hitZoneConfig.onMouseOut && this.hitZoneConfig.onMouseOut();
            },
            onBackgroundMouseMove:()=>{
                this.hitZoneConfig.onMouseOut && this.hitZoneConfig.onMouseOut();
            }
        };
    }

    @computed private get tooltipVisible() {
        return !!this.hitZoneConfig.content;
    }

    @computed private get hitZone() {
        return initHitZoneFromConfig(this.hitZoneConfig);
    }

    public toSVGDOMNode():Element {
        if (this.plot) {
            // Clone node
            return this.plot.toSVGDOMNode();
        } else {
            return document.createElementNS("http://www.w3.org/2000/svg", "svg");
        }
    }

    render() {
        const tooltipVisibleProps:any = {};
        if (!this.tooltipVisible) {
            tooltipVisibleProps.visible = false;
        }
        return (
            <div style={{position:"relative"}} data-test="LollipopPlot">
                <OverlayTrigger
                    placement={this.handlers.getOverlayPlacement()}
                    overlay={this.handlers.getOverlay()}
                >
                    {this.hitZone}
                </OverlayTrigger>
                <LollipopPlotNoTooltip
                    ref={this.handlers.ref}
                    setHitZone={this.handlers.setHitZone}
                    onMouseLeave={this.handlers.onMouseLeave}
                    onBackgroundMouseMove={this.handlers.onBackgroundMouseMove}
                    {...this.props}
                />
            </div>
        );
    }
}
