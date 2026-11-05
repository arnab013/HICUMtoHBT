import React from 'react';
import { CircuitSymbolType } from '../data/sentaurus3DModel';

interface CircuitSymbolGlyphProps {
  cx: number;
  cy: number;
  symbolType: CircuitSymbolType;
  orientation: 'horizontal' | 'vertical';
  label: string;
  showLabel: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const CircuitSymbolGlyph: React.FC<CircuitSymbolGlyphProps> = ({
  cx,
  cy,
  symbolType,
  orientation,
  label,
  showLabel,
  isSelected,
  isHovered,
  isHighlighted,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const active = isSelected || isHovered || isHighlighted;
  const strokeColor = isSelected
    ? '#B85D43'
    : isHovered || isHighlighted
    ? '#2C6E63'
    : '#1E293B';
  const badgeBg = isSelected
    ? '#FEF3EE'
    : isHovered || isHighlighted
    ? '#EFF7F5'
    : '#FFFFFF';
  const strokeW = active ? 2.1 : 1.5;

  const isVert = orientation === 'vertical';

  return (
    <g
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="cursor-pointer select-none"
    >
      {/* Subtle halo for click hit-target and clean separation from 3D mesh */}
      <circle
        cx={cx}
        cy={cy}
        r={active ? 15 : 12.5}
        fill={badgeBg}
        fillOpacity={active ? 0.96 : 0.88}
        stroke={active ? strokeColor : '#CBD5E1'}
        strokeWidth={active ? 1.6 : 0.9}
      />

      {/* IEEE / IEC Standard Schematic Symbol */}
      {symbolType === 'resistor' &&
        (isVert ? (
          <rect
            x={cx - 4.2}
            y={cy - 8.5}
            width={8.4}
            height={17}
            rx={1}
            fill="#FFFFFF"
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
        ) : (
          <rect
            x={cx - 8.5}
            y={cy - 4.2}
            width={17}
            height={8.4}
            rx={1}
            fill="#FFFFFF"
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
        ))}

      {symbolType === 'capacitor' &&
        (isVert ? (
          <g stroke={strokeColor} strokeWidth={strokeW + 0.3} strokeLinecap="round">
            <line x1={cx - 6.5} y1={cy - 2.6} x2={cx + 6.5} y2={cy - 2.6} />
            <line x1={cx - 6.5} y1={cy + 2.6} x2={cx + 6.5} y2={cy + 2.6} />
            <line x1={cx} y1={cy - 8.5} x2={cx} y2={cy - 2.6} strokeWidth={strokeW - 0.2} />
            <line x1={cx} y1={cy + 2.6} x2={cx} y2={cy + 8.5} strokeWidth={strokeW - 0.2} />
          </g>
        ) : (
          <g stroke={strokeColor} strokeWidth={strokeW + 0.3} strokeLinecap="round">
            <line x1={cx - 2.6} y1={cy - 6.5} x2={cx - 2.6} y2={cy + 6.5} />
            <line x1={cx + 2.6} y1={cy - 6.5} x2={cx + 2.6} y2={cy + 6.5} />
            <line x1={cx - 8.5} y1={cy} x2={cx - 2.6} y2={cy} strokeWidth={strokeW - 0.2} />
            <line x1={cx + 2.6} y1={cy} x2={cx + 8.5} y2={cy} strokeWidth={strokeW - 0.2} />
          </g>
        ))}

      {(symbolType === 'diode' || symbolType === 'tunnel_diode') && (
        <g stroke={strokeColor} strokeWidth={strokeW}>
          <polygon
            points={`${cx - 5.2},${cy - 5.2} ${cx + 5.2},${cy - 5.2} ${cx},${cy + 4.8}`}
            fill={strokeColor}
          />
          <line x1={cx - 5.8} y1={cy + 5.2} x2={cx + 5.8} y2={cy + 5.2} strokeLinecap="round" />
          {symbolType === 'tunnel_diode' && (
            <>
              <line x1={cx - 5.8} y1={cy + 5.2} x2={cx - 5.8} y2={cy + 2.2} />
              <line x1={cx + 5.8} y1={cy + 5.2} x2={cx + 5.8} y2={cy + 2.2} />
            </>
          )}
        </g>
      )}

      {symbolType === 'current_source' && (
        <g stroke={strokeColor} strokeWidth={strokeW}>
          <circle cx={cx} cy={cy} r={8.2} fill="#FFFFFF" />
          <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 4.5} strokeLinecap="round" />
          <polyline
            points={`${cx - 3.2},${cy + 1.5} ${cx},${cy + 5.2} ${cx + 3.2},${cy + 1.5}`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {symbolType === 'charge_storage' && (
        <g stroke={strokeColor} strokeWidth={strokeW}>
          <polygon
            points={`${cx},${cy - 7.5} ${cx + 7.5},${cy} ${cx},${cy + 7.5} ${cx - 7.5},${cy}`}
            fill="#FFFFFF"
          />
          <line x1={cx - 4} y1={cy - 1.5} x2={cx + 4} y2={cy - 1.5} />
          <line x1={cx - 4} y1={cy + 1.5} x2={cx + 4} y2={cy + 1.5} />
        </g>
      )}

      {symbolType === 'thermal_rc' && (
        <g stroke="#B85D43" strokeWidth={strokeW}>
          <rect
            x={cx - 7.5}
            y={cy - 5.5}
            width={15}
            height={11}
            rx={2}
            fill="#FFF7ED"
          />
          <text
            x={cx}
            y={cy + 3}
            textAnchor="middle"
            className="fill-[#B85D43] font-mono font-bold text-[7.5px]"
            stroke="none"
          >
            ΔTj
          </text>
        </g>
      )}

      {/* Optional Component Label Tag */}
      {showLabel && (
        <g transform={`translate(${isVert ? cx + 15 : cx}, ${isVert ? cy + 3 : cy - 15})`}>
          <rect
            x={isVert ? -2 : -label.length * 3.1 - 4}
            y={-8.5}
            width={label.length * 6.2 + 8}
            height={13}
            rx={3}
            fill={isSelected ? '#B85D43' : '#FFFFFF'}
            fillOpacity={0.94}
            stroke={isSelected ? '#B85D43' : '#CBD5E1'}
            strokeWidth={0.9}
          />
          <text
            x={isVert ? (label.length * 6.2 + 4) / 2 : 0}
            y={0.8}
            textAnchor="middle"
            className={`font-mono font-bold text-[8.5px] ${
              isSelected ? 'fill-white' : 'fill-slate-800'
            }`}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
};
export default CircuitSymbolGlyph;
