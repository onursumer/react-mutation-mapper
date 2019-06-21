import _ from "lodash";
import {generateQueryVariantId} from "cbioportal-frontend-commons";

import {Mutation} from "../model/Mutation";
import {IndicatorQueryResp, IOncoKbData} from "../model/OncoKb";

// oncogenic value => oncogenic class name
const ONCOGENIC_CLASS_NAMES:{[oncogenic:string]: string} = {
    'Likely Neutral': 'likely-neutral',
    'Unknown': 'unknown-oncogenic',
    'Inconclusive': 'unknown-oncogenic',
    'Predicted Oncogenic': 'oncogenic',
    'Likely Oncogenic': 'oncogenic',
    'Oncogenic': 'oncogenic',
};

// oncogenic value => score
// (used for sorting purposes)
const ONCOGENIC_SCORE:{[oncogenic:string]: number} = {
    'Unknown': 0,
    'Inconclusive': 0,
    'Likely Neutral': 0,
    'Predicted Oncogenic': 5,
    'Likely Oncogenic': 5,
    'Oncogenic': 5
};

// sensitivity level => score
// (used for sorting purposes)
const SENSITIVITY_LEVEL_SCORE:{[level:string]: number} = {
    '4': 1,
    '3B': 2,
    '3A': 3,
    '2B': 4,
    '2A': 5,
    '1': 6
};

// resistance level <-> score
// (used for sorting purposes)
const RESISTANCE_LEVEL_SCORE:{[level:string]: number} = {
    'R3': 1,
    'R2': 2,
    'R1': 3,
};

export function normalizeLevel(level:string):string|null
{
    if (level)
    {
        const matchArray = level.match(/LEVEL_(R?\d[AB]?)/);

        if (matchArray && matchArray.length >= 2) {
            return matchArray[1];
        }
        else {
            return level;
        }
    }
    else {
        return null;
    }
}

export function oncogenicXPosition(highestSensitiveLevel: string | null) {
    const map: { [id: string]: number } = {
        '1': 1,
        '2A': 2,
        '2B': 3,
        '3A': 4,
        '3B': 5,
        '4': 6
    };

    let levelIndex = highestSensitiveLevel === null ? 0 : (map[highestSensitiveLevel] || 0);
    return -(8 + levelIndex * 30);
}

export function oncogenicYPosition(oncogenicity: string, isVUS: boolean, resistanceLevel: string | null) {
    const oncogenicityMap: { [id: string]: number } = {
        'Oncogenic': 0,
        'Predicted Oncogenic': 0,
        'Likely Oncogenic': 0,
        'Neutral': 1,
        'Likely Neutral': 1,
        'Unknown': 2,
        'Inconclusive': 2
    };
    const resistanceLevelMap: { [id: string]: number } = {
        'R1': 1,
        'R2': 2,
        'R3': 3
    };

    let oncogenicityIndex = oncogenicityMap[oncogenicity];
    if (oncogenicityIndex === undefined) {
        oncogenicityIndex = 4;
    }
    if (oncogenicityIndex > 1 && isVUS) {
        oncogenicityIndex = 3;
    }

    const defaultIndexForUnrecognizedResistanceLevel = 0;
    let resistanceLevelIndex = resistanceLevel === null ? defaultIndexForUnrecognizedResistanceLevel
        : (resistanceLevelMap[resistanceLevel] || defaultIndexForUnrecognizedResistanceLevel);
    return -(7 + oncogenicityIndex * 120 + resistanceLevelIndex * 30);
}

export function oncogenicImageClassNames(oncogenic: string,
                                         isVUS: boolean,
                                         highestSensitiveLevel:string,
                                         highestResistanceLevel:string):string[]
{
    const classNames = ["", ""];

    const sl = normalizeLevel(highestSensitiveLevel);
    const rl = normalizeLevel(highestResistanceLevel);

    if (!rl && sl)
    {
        classNames[0] = 'level' + sl;
    }
    else if (rl && !sl)
    {
        classNames[0] = 'level' + rl;
    }
    else if (rl && sl)
    {
        classNames[0] = 'level' + sl + 'R';
    }

    classNames[1] = ONCOGENIC_CLASS_NAMES[oncogenic] || "no-info-oncogenic";

    if(classNames[1] === 'no-info-oncogenic' && isVUS)
    {
        classNames[1] = 'vus';
    }

    return classNames;
}

export function calcOncogenicScore(oncogenic:string)
{
    return ONCOGENIC_SCORE[oncogenic] || 0;
}

export function calcSensitivityLevelScore(level:string)
{
    return SENSITIVITY_LEVEL_SCORE[normalizeLevel(level) || ""] || 0;
}

export function calcResistanceLevelScore(level:string)
{
    return RESISTANCE_LEVEL_SCORE[normalizeLevel(level) || ""] || 0;
}


export function groupOncoKbIndicatorDataByMutations(mutationsByPosition: {[pos: number]: Mutation[]},
                                                    oncoKbData: IOncoKbData,
                                                    getTumorType: (mutation: Mutation) => string,
                                                    getEntrezGeneId: (mutation: Mutation) => number,
                                                    filter?: (indicator: IndicatorQueryResp) => boolean): {[pos: number]: IndicatorQueryResp[]}
{
    const indicatorMap: {[pos: number]: IndicatorQueryResp[]} = {};

    _.keys(mutationsByPosition).forEach(key => {
        const position = Number(key);
        const indicators: IndicatorQueryResp[] = mutationsByPosition[position]
            .map(mutation => getIndicatorData(mutation, oncoKbData, getTumorType, getEntrezGeneId))
            .filter(indicator =>
                indicator !== undefined && (!filter || filter(indicator))) as IndicatorQueryResp[];

        if (position > 0 && indicators.length > 0) {
            indicatorMap[position] = indicators;
        }
    });

    return indicatorMap;
}

export function getIndicatorData(mutation: Mutation,
                                 oncoKbData: IOncoKbData,
                                 getTumorType: (mutation: Mutation) => string,
                                 getEntrezGeneId: (mutation: Mutation) => number): IndicatorQueryResp|undefined
{
    if (oncoKbData.indicatorMap === null) {
        return undefined;
    }

    const id = generateQueryVariantId(getEntrezGeneId(mutation),
        getTumorType(mutation),
        mutation.proteinChange,
        mutation.mutationType);

    return oncoKbData.indicatorMap[id];
}

export function defaultOncoKbIndicatorFilter(indicator: IndicatorQueryResp) {
    return indicator.oncogenic.toLowerCase().trim().includes("oncogenic");
}

export function defaultOncoKbFilter(mutation: Mutation,
                                    oncoKbData?: IOncoKbData,
                                    getTumorType?: (mutation: Mutation) => string,
                                    getEntrezGeneId?: (mutation: Mutation) => number): boolean
{
    let filter = true;

    if (oncoKbData && getTumorType && getEntrezGeneId) {
        const indicatorData = getIndicatorData(mutation, oncoKbData, getTumorType, getEntrezGeneId);
        filter = indicatorData ? defaultOncoKbIndicatorFilter(indicatorData) : false;
    }

    return filter;
}
