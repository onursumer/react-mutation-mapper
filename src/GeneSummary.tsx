import {observer} from "mobx-react";
import * as React from "react";
import {getNCBIlink} from "cbioportal-frontend-commons";

import {EnsemblTranscript} from "./model/EnsemblTranscript";
import {RemoteData} from "./model/RemoteData";
import TranscriptDropdown from "./TranscriptDropdown";
import {VariantAnnotation} from "./generated/GenomeNexusAPI";
import {Mutation} from "./model/Mutation";


export interface IGeneSummaryProps {
    hugoGeneSymbol: string;
    uniprotId?: string;
    showDropDown: boolean;
    showOnlyAnnotatedTranscriptsInDropdown: boolean;
    transcriptsByTranscriptId: {[transcriptId: string]: EnsemblTranscript};
    activeTranscript?: string;
    canonicalTranscript: RemoteData<EnsemblTranscript | undefined>;
    transcriptsWithProteinLength: RemoteData<string[] | undefined>;
    transcriptsWithAnnotations: RemoteData<string[] | undefined>;
    indexedVariantAnnotations: RemoteData<{[genomicLocation: string]: VariantAnnotation} | undefined>;
    mutationsByTranscriptId?: {[transcriptId: string]: Mutation[]};
    loadingIndicator?: JSX.Element;
}

@observer
export default class GeneSummary extends React.Component<IGeneSummaryProps, {}>
{
    // TODO add styling
    public render()
    {
        const {
            hugoGeneSymbol,
            uniprotId,
            showDropDown,
            showOnlyAnnotatedTranscriptsInDropdown,
            canonicalTranscript,
            activeTranscript,
            transcriptsByTranscriptId,
            transcriptsWithAnnotations,
            transcriptsWithProteinLength,
            indexedVariantAnnotations,
            mutationsByTranscriptId,
            loadingIndicator
        } = this.props;

        const canonicalTranscriptId = canonicalTranscript.result &&
            canonicalTranscript.result.transcriptId;
        const transcript = activeTranscript && (activeTranscript === canonicalTranscriptId)?
            canonicalTranscript.result as EnsemblTranscript :
            transcriptsByTranscriptId[activeTranscript!];
        const refseqMrnaId = transcript && transcript.refseqMrnaId;
        const ccdsId = transcript && transcript.ccdsId;

        return (
            <div style={{'paddingBottom':10}}>
                <h4>{hugoGeneSymbol}</h4>
                <TranscriptDropdown
                    showDropDown={showDropDown}
                    showOnlyAnnotatedTranscriptsInDropdown={showOnlyAnnotatedTranscriptsInDropdown}
                    activeTranscript={activeTranscript}
                    transcriptsByTranscriptId={transcriptsByTranscriptId}
                    canonicalTranscript={canonicalTranscript}
                    transcriptsWithProteinLength={transcriptsWithProteinLength}
                    transcriptsWithAnnotations={transcriptsWithAnnotations}
                    indexedVariantAnnotations={indexedVariantAnnotations}
                    mutationsByTranscriptId={mutationsByTranscriptId}
                    loadingIndicator={loadingIndicator}
                />
                <div>
                    <span data-test="GeneSummaryRefSeq">{'RefSeq: '}
                        {refseqMrnaId? (
                            <a
                                href={getNCBIlink(`/nuccore/${refseqMrnaId}`)}
                                target="_blank"
                            >
                                {refseqMrnaId}
                            </a>
                        ) : '-'}
                    </span>
                </div>
                {showDropDown? (activeTranscript && (
                    <div>
                        <span>Ensembl: </span>
                        <a
                            href={`http://grch37.ensembl.org/homo_sapiens/Transcript/Summary?t=${activeTranscript}`}
                            target="_blank"
                        >
                            {activeTranscript}
                        </a>
                    </div>
                )) : (canonicalTranscriptId && (
                    // down't show drop down, only the canonical transcript
                    <div>
                        <span>Ensembl: </span>
                        <a
                            href={`http://grch37.ensembl.org/homo_sapiens/Transcript/Summary?t=${canonicalTranscriptId}`}
                            target="_blank"
                        >
                            {canonicalTranscriptId}
                        </a>
                    </div>
                ))}
                <div>
                    <span data-test="GeneSummaryCCDS">{'CCDS: '}
                        {ccdsId? (
                            <a
                                href={getNCBIlink({
                                    pathname: '/CCDS/CcdsBrowse.cgi',
                                    query: {
                                        'REQUEST': 'CCDS',
                                        'DATA': ccdsId
                                    }
                                })}
                                target="_blank"
                            >
                                {ccdsId}
                            </a>
                        ) : '-'}
                    </span>
                </div>
                <div>
                    <span data-test="GeneSummaryUniProt">{'UniProt: '}
                        {uniprotId? (
                            <a
                                href={`http://www.uniprot.org/uniprot/${uniprotId}`}
                                target="_blank"
                            >
                                {uniprotId}
                            </a>
                        ) : '-'}
                    </span>
                </div>
            </div>
        );
    }
}
