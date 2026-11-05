import React from 'react';
import { FileText, Code2, Box, ExternalLink } from 'lucide-react';

export const MANUAL_PDF_URL = './docs/hicum_L2V2p4p0_manual.pdf';
export const VA_SOURCE_URL = './docs/hicumL2V2p34.va.txt';
export const SENTAURUS_SOURCE_URL = './docs/sentaurus_sige_hbt.cmd';

/** Extract the first manual page number from a citation like "Table 3.1, p. 101, row 1" or "pp. 9-17". */
export function firstManualPage(citation?: string, fallback?: number): number | undefined {
  if (citation) {
    const m = citation.match(/pp?\.\s*(\d+)/);
    if (m) return parseInt(m[1], 10);
  }
  return fallback;
}

export function manualPageUrl(page?: number): string {
  return page ? `${MANUAL_PDF_URL}#page=${page}` : MANUAL_PDF_URL;
}

interface CitationBadgesProps {
  manualCitation?: string;
  manualPage?: number;
  vaCitation?: string;
  sentaurusCitation?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Clickable source citations: HICUM/L2 v2.4.0 manual (page + line, opens the PDF at the page),
 * hicumL2V2p34.va (line numbers) and the Sentaurus SDE command file (line numbers).
 */
export const CitationBadges: React.FC<CitationBadgesProps> = ({
  manualCitation,
  manualPage,
  vaCitation,
  sentaurusCitation,
  compact = false,
  className = '',
}) => {
  const page = firstManualPage(manualCitation, manualPage);
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const manualText = manualCitation || (manualPage ? `p. ${manualPage}` : undefined);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {manualText && (
        <a
          href={manualPageUrl(page)}
          target="_blank"
          rel="noreferrer"
          onClick={stop}
          className="citation-badge-manual"
          title={`HICUM/L2 v2.4.0 Manual — ${manualText} (opens PDF${page ? ` at page ${page}` : ''})`}
        >
          <FileText className="w-3 h-3 shrink-0" />
          <span className={compact ? 'truncate max-w-[220px]' : ''}>Manual · {manualText}</span>
          {!compact && <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />}
        </a>
      )}
      {vaCitation && (
        <a
          href={VA_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          onClick={stop}
          className="citation-badge-va"
          title={`Verilog-A source — ${vaCitation}`}
        >
          <Code2 className="w-3 h-3 shrink-0" />
          <span className={compact ? 'truncate max-w-[220px]' : ''}>{vaCitation}</span>
          {!compact && <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />}
        </a>
      )}
      {sentaurusCitation && (
        <a
          href={SENTAURUS_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          onClick={stop}
          className="citation-badge-tcad"
          title={`Sentaurus SDE structure file — ${sentaurusCitation}`}
        >
          <Box className="w-3 h-3 shrink-0" />
          <span className={compact ? 'truncate max-w-[220px]' : ''}>{sentaurusCitation}</span>
          {!compact && <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />}
        </a>
      )}
    </div>
  );
};

export default CitationBadges;
