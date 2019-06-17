import {DefaultTooltip, getCanonicalMutationType} from "cbioportal-frontend-commons";
import * as React from 'react';

import styles from "./mutationType.module.scss";
import {Mutation} from "../../model/Mutation";

interface IMutationTypeProps {
    mutation: Mutation;
}

interface IMutationTypeFormat {
    label?: string;
    className: string;
}

export const MAIN_MUTATION_TYPE_MAP: {[key: string]: IMutationTypeFormat} =
{
    missense: {
        label: "Missense",
        className: "missense-mutation",
    },
    inframe: {
        label: "IF",
        className: "inframe-mutation",
    },
    truncating: {
        label: "Truncating",
        className: "trunc-mutation",
    },
    nonsense: {
        label: "Nonsense",
        className: "trunc-mutation",
    },
    nonstop: {
        label: "Nonstop",
        className: "trunc-mutation",
    },
    nonstart: {
        label: "Nonstart",
        className: "trunc-mutation",
    },
    frameshift: {
        label: "FS",
        className: "trunc-mutation",
    },
    frame_shift_del: {
        label: "FS del",
        className: "trunc-mutation",
    },
    frame_shift_ins: {
        label: "FS ins",
        className: "trunc-mutation",
    },
    in_frame_ins: {
        label: "IF ins",
        className: "inframe-mutation",
    },
    in_frame_del: {
        label: "IF del",
        className: "inframe-mutation",
    },
    splice_site: {
        label: "Splice",
        className: "trunc-mutation",
    },
    fusion: {
        label: "Fusion",
        className: "fusion",
    },
    silent: {
        label: "Silent",
        className: "other-mutation",
    },
    other: {
        label: "Other",
        className: "other-mutation",
    }
};

/**
 * Determines the display value by using the impact field.
 *
 * @param data  column formatter data
 * @returns {string}    mutation assessor text value
 */
function getDisplayValue(mutation: Mutation): string
{
    const entry: IMutationTypeFormat|undefined = getMapEntry(mutation);

    // first, try to find a mapped value
    if (entry && entry.label) {
        return entry.label;
    }
    // if no mapped value, then return the text value as is
    else {
        return mutation.mutationType || "";
    }
}

function getClassName(mutation: Mutation): string
{
    const value: IMutationTypeFormat|undefined = getMapEntry(mutation);

    if (value && value.className) {
        return value.className;
    }
    // for unmapped values, use the "other" style
    else {
        return MAIN_MUTATION_TYPE_MAP["other"].className;
    }
}

function getMapEntry(mutation: Mutation)
{
    const mutationType = mutation.mutationType;

    if (mutationType) {
        return MAIN_MUTATION_TYPE_MAP[getCanonicalMutationType(mutationType)];
    }
    else {
        return undefined;
    }
}


export default class MutationType extends React.Component<IMutationTypeProps, {}>
{
    public render()
    {
        // use text for all purposes (display, sort, filter)
        const text = getDisplayValue(this.props.mutation);
        const className = getClassName(this.props.mutation);

        // use actual value for tooltip
        const toolTip = this.props.mutation.mutationType;

        let content = <span className={styles[className]}>{text}</span>;

        // add tooltip only if the display value differs from the actual text value!
        if (toolTip && toolTip.toLowerCase() !== text.toLowerCase())
        {
            content = (
                <DefaultTooltip
                    overlay={<span>{toolTip}</span>}
                    placement="left"
                >
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }
}
