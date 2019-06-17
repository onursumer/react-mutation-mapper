import {DefaultTooltip} from "cbioportal-frontend-commons";
import * as React from "react";

import {Mutation} from "../../model/Mutation";
import styles from "./mutationStatus.module.scss";

interface IMutationStatusProps {
    mutation: Mutation;
}

export default class MutationStatus extends React.Component<IMutationStatusProps, {}>
{
    public render() {
        const value = this.props.mutation.mutationStatus;
        let content: JSX.Element;
        let needTooltip = false;

        if (value)
        {
            if (value.toLowerCase().indexOf("somatic") > -1) {
                content = <span className={styles.somatic}>S</span>;
                needTooltip = true;
            }
            else if (value.toLowerCase().indexOf("germline") > -1) {
                content = <span className={styles.germline}>G</span>;
                needTooltip = true;
            }
            else {
                content = <span className={styles.unknown}>{value}</span>;
            }
        }
        else {
            content = <span />;
        }

        if (needTooltip)
        {
            content = (
                <DefaultTooltip
                    overlay={<span>{value}</span>}
                    placement="right"
                >
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }
}
