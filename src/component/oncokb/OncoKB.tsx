// import autobind from "autobind-decorator";
import * as React from "react";
import {observable} from "mobx";
import {observer} from "mobx-react";
// import {DefaultTooltip} from "cbioportal-frontend-commons";

import {Query} from "../../generated/OncoKbAPI";
import {MobxCache} from "../../model/MobxCache";
import {IndicatorQueryResp} from "../../model/OncoKb";
import {
    calcOncogenicScore,
    calcResistanceLevelScore,
    calcSensitivityLevelScore,
    normalizeLevel,
    oncogenicXPosition,
    oncogenicYPosition
} from "../../util/OncoKbUtils";
import {errorIcon, loaderIcon} from "../StatusHelpers";

// import OncoKbTooltip from "./OncoKbTooltip";
// import OncoKbFeedback from "./OncoKbFeedback";
// import {getCurrentURLWithoutHash} from "../../../api/urls";

import annotationStyles from "../column/annotation.module.scss";
import oncogenicIconStyles from "./main.module.scss";
// import '../styles/oncokb/oncokb.scss';

export interface IOncoKbProps {
    status: "pending" | "error" | "complete";
    indicator?: IndicatorQueryResp;
    evidenceCache?: MobxCache;
    evidenceQuery?: Query;
    pubMedCache?: MobxCache;
    isCancerGene:boolean;
    geneNotExist:boolean;
    hugoGeneSymbol:string;
    userEmailAddress?:string;
}

function getOncogenicIconsStyle(indicator: IndicatorQueryResp | undefined)
{
    return {
        backgroundPositionX: oncogenicXPosition(
            indicator ? normalizeLevel(indicator.highestSensitiveLevel) : ''),
        backgroundPositionY: indicator ?
            oncogenicYPosition(indicator.oncogenic, indicator.vus, normalizeLevel(indicator.highestResistanceLevel)) :
            oncogenicYPosition('', false, '')
    };
}

export function sortValue(indicator?: IndicatorQueryResp|undefined|null): number[]
{
    const values: number[] = [0, 0, 0];

    if (indicator) {
        values[0] = calcOncogenicScore(indicator.oncogenic);
        values[1] = calcSensitivityLevelScore(indicator.highestSensitiveLevel);
        values[2] = calcResistanceLevelScore(indicator.highestResistanceLevel);
    }

    return values;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

@observer
export default class OncoKB extends React.Component<IOncoKbProps, {}>
{
    @observable showFeedback:boolean = false;
    @observable tooltipDataLoadComplete:boolean = false;

    public static download(indicator?: IndicatorQueryResp|undefined|null): string
    {
        if (!indicator) {
            return "NA";
        }

        const oncogenic = indicator.oncogenic ? indicator.oncogenic : "Unknown";
        const level = indicator.highestSensitiveLevel ? indicator.highestSensitiveLevel.toLowerCase() : "level NA";

        return `${oncogenic}, ${level}`;
    }

    public render()
    {
        let oncoKbContent:JSX.Element = (
            <span className={`${annotationStyles["annotation-item"]}`} />
        );

        if (this.props.status === "error") {
            oncoKbContent = errorIcon("Error fetching OncoKB data");
        }
        else if (this.props.status === "pending") {
            oncoKbContent = loaderIcon("pull-left");
        }
        else
        {
            oncoKbContent = (
                <span className={`${annotationStyles["annotation-item"]}`}>
                    <i
                        className={`${oncogenicIconStyles['oncogenic-icon-image']}`}
                        style={getOncogenicIconsStyle(this.props.indicator)}
                        data-test='oncogenic-icon-image'
                        data-test2={this.props.hugoGeneSymbol}
                    />
                </span>
            );
            // if (this.showFeedback)
            // {
            //     oncoKbContent = (
            //         <span>
            //             {oncoKbContent}
            //             <OncoKbFeedback
            //                 userEmailAddress={this.props.userEmailAddress}
            //                 hugoSymbol={this.props.hugoGeneSymbol}
            //                 alteration={this.props.evidenceQuery ? this.props.evidenceQuery.alteration : undefined}
            //                 showFeedback={this.showFeedback}
            //                 handleFeedbackClose={this.handleFeedbackClose}
            //             />
            //         </span>
            //     );
            // }
            // else if (this.tooltipDataLoadComplete || this.props.evidenceCache && this.props.evidenceQuery)
            // {
            //     oncoKbContent = (
            //         <DefaultTooltip
            //             overlayClassName="oncokb-tooltip"
            //             overlay={this.tooltipContent}
            //             placement="right"
            //             trigger={['hover', 'focus']}
            //             onPopupAlign={hideArrow}
            //             destroyTooltipOnHide={true}
            //         >
            //             {oncoKbContent}
            //         </DefaultTooltip>
            //     );
            // }
        }

        return oncoKbContent;
    }

    // @autobind
    // private tooltipContent(): JSX.Element
    // {
    //     return (
    //         <OncoKbTooltip
    //             hugoSymbol={this.props.hugoGeneSymbol}
    //             geneNotExist={this.props.geneNotExist}
    //             isCancerGene={this.props.isCancerGene}
    //             indicator={this.props.indicator || undefined}
    //             evidenceCache={this.props.evidenceCache}
    //             evidenceQuery={this.props.evidenceQuery}
    //             pubMedCache={this.props.pubMedCache}
    //             handleFeedbackOpen={this.handleFeedbackOpen}
    //             onLoadComplete={this.handleLoadComplete}
    //         />
    //     );
    // }

    // purpose of this callback is to trigger re-instantiation
    // of the tooltip upon full load of the tooltip data
    // @autobind
    // private handleLoadComplete(): void {
    //     // update only once to avoid unnecessary re-rendering
    //     if (!this.tooltipDataLoadComplete) {
    //         this.tooltipDataLoadComplete = true;
    //     }
    // }

    // @autobind
    // private handleFeedbackOpen(): void {
    //     this.showFeedback = true;
    // }

    // @autobind
    // private handleFeedbackClose(): void {
    //     this.showFeedback = false;
    // }
}