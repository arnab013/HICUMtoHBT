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
 * Clickable source citations with elite design tokens:
 * HICUM/L2 v2.4.0 manual (page + line, opens PDF),
 * hicumL2V2p34.va, and Sentaurus SDE command file.
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
          className="btn-elite inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80"
          title={`HICUM/L2 v2.4.0 Manual — ${manualText} (opens PDF${page ? ` at page ${page}` : ''})`}
        >
          <FileText className="w-3 h-3 shrink-0 text-slate-500 dark:text-slate-400" />
          <span className={compact ? 'truncate max-w-[200px]' : ''}>Manual · {manualText}</span>
          {!compact && <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />}
        </a>
      )}
      {vaCitation && (
        <a
          href={VA_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          onClick={stop}
          className="btn-elite inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-blue-50 hover:bg-blue-100/80 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60"
          title={`Verilog-A source — ${vaCitation}`}
        >
          <Code2 className="w-3 h-3 shrink-0 text-blue-500 dark:text-blue-400" />
          <span className={compact ? 'truncate max-w-[200px]' : ''}>{vaCitation}</span>
          {!compact && <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />}
        </a>
      )}
      {sentaurusCitation && (
        <a
          href={SENTAURUS_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          onClick={stop}
          className="btn-elite inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/60"
          title={`Sentaurus SDE structure file — ${sentaurusCitation}`}
        >
          <Box className="w-3 h-3 shrink-0 text-emerald-500 dark:text-emerald-400" />
          <span className={compact ? 'truncate max-w-[200px]' : ''}>{sentaurusCitation}</span>
          {!compact && <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />}
        </a>
      )}
    </div>
  );
};

export default CitationBadges;
