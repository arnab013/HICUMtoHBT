import React, { useMemo } from 'react';
import katex from 'katex';

export interface FormulaViewProps {
  latex: string;
  displayMode?: boolean;
  inline?: boolean;
  className?: string;
  title?: string;
  onClick?: () => void;
}

export const FormulaView: React.FC<FormulaViewProps> = ({
  latex,
  displayMode,
  inline,
  className = '',
  title,
  onClick,
}) => {
  const isDisplay = useMemo(() => {
    if (displayMode !== undefined) return displayMode;
    if (inline !== undefined) return !inline;
    return false;
  }, [displayMode, inline]);

  const renderedHtml = useMemo(() => {
    if (!latex) return '';
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: isDisplay,
        strict: false,
        trust: true,
      });
    } catch {
      return latex;
    }
  }, [latex, isDisplay]);

  return (
    <span
      title={title}
      onClick={onClick}
      className={`${
        isDisplay ? 'block my-1 overflow-x-auto py-0.5' : 'inline-block align-baseline'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

export default FormulaView;
