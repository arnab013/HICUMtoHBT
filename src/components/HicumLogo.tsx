import React from 'react';

/**
 * HICUM Explorer brand mark: a stylised SiGe HBT cross-section
 * (emitter contact, N+ emitter, base contacts, P SiGe base, N+ buried collector).
 * `tone="dark"` = dark tile (favicon / light surfaces);
 * `tone="light"` = alabaster tile for use on the dark matte sidebar.
 */
interface HicumLogoMarkProps {
  size?: number;
  tone?: 'dark' | 'light';
  className?: string;
}

const PALETTES = {
  dark: {
    tile: '#1D2530',
    collector: '#4F8F86',
    base: '#C98A5E',
    emitter: '#8FB0CC',
    metal: '#E8E6DF',
  },
  light: {
    tile: '#F3F2EE',
    collector: '#2A645E',
    base: '#9A5833',
    emitter: '#2B4C65',
    metal: '#1D2530',
  },
} as const;

export const HicumLogoMark: React.FC<HicumLogoMarkProps> = ({
  size = 36,
  tone = 'dark',
  className,
}) => {
  const c = PALETTES[tone];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="HICUM Explorer logo"
    >
      <rect width="64" height="64" rx="14" fill={c.tile} />
      <rect x="9" y="42" width="46" height="11" rx="2" fill={c.collector} />
      <rect x="15" y="32" width="34" height="7.5" rx="1.5" fill={c.base} />
      <rect x="24.5" y="18" width="15" height="11.5" rx="1.5" fill={c.emitter} />
      <rect x="27" y="12" width="10" height="3.5" rx="1" fill={c.metal} />
      <rect x="15" y="26" width="6.5" height="3.5" rx="1" fill={c.metal} />
      <rect x="42.5" y="26" width="6.5" height="3.5" rx="1" fill={c.metal} />
    </svg>
  );
};

interface HicumLogoProps {
  collapsed?: boolean;
  onDark?: boolean;
}

/** Mark + wordmark lockup used in the sidebar brand area. */
export const HicumLogo: React.FC<HicumLogoProps> = ({ collapsed = false, onDark = true }) => (
  <div className="flex items-center gap-3 min-w-0">
    <HicumLogoMark size={38} tone={onDark ? 'light' : 'dark'} className="shrink-0" />
    {!collapsed && (
      <div className="min-w-0 leading-tight">
        <div
          className={`font-scientific font-bold text-[17px] tracking-tight truncate ${
            onDark ? 'text-[#F3F2EE]' : 'text-[#161E29]'
          }`}
        >
          HICUM Explorer
        </div>
        <div
          className={`font-mono text-[10px] tracking-wide truncate ${
            onDark ? 'text-[#8E9AAB]' : 'text-[#526071]'
          }`}
        >
          HICUM/L2 · SiGe HBT · TCAD
        </div>
      </div>
    )}
  </div>
);

export default HicumLogo;
