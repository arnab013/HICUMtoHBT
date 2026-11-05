import React, { useState } from 'react';
import { OperatingPointSpec } from '../data/hicumTypes';
import { FormulaView } from './FormulaView';
import { Activity, Cpu, Zap, Thermometer, Gauge, Sliders } from 'lucide-react';

interface OperatingPointDashboardProps {
  specs: OperatingPointSpec[];
  opValues: Record<string, number>;
  refOpValues?: Record<string, number>;
  onSelectVariable?: (id: string) => void;
}

function formatSciValue(val: number | undefined, unit: string): string {
  if (val === undefined || Number.isNaN(val)) return '—';
  if (val === 0) return `0 ${unit}`.trim();
  const abs = Math.abs(val);
  if (unit === 'Hz') {
    if (abs >= 1e9) return `${(val / 1e9).toFixed(2)} GHz`;
    if (abs >= 1e6) return `${(val / 1e6).toFixed(2)} MHz`;
  }
  if (unit === 's') {
    if (abs < 1e-9 && abs >= 1e-13) return `${(val * 1e12).toFixed(2)} ps`;
  }
  if (unit === 'F') {
    if (abs < 1e-11 && abs >= 1e-16) return `${(val * 1e15).toFixed(2)} fF`;
    if (abs < 1e-8 && abs >= 1e-11) return `${(val * 1e12).toFixed(2)} pF`;
  }
  if (unit === 'A') {
    if (abs >= 1e-3) return `${(val * 1e3).toFixed(3)} mA`;
    if (abs >= 1e-6) return `${(val * 1e6).toFixed(2)} μA`;
    if (abs >= 1e-9) return `${(val * 1e9).toFixed(2)} nA`;
    return `${val.toExponential(2)} A`;
  }
  if (unit === 'A/V') {
    if (abs >= 1e-3) return `${(val * 1e3).toFixed(2)} mS`;
    if (abs >= 1e-6) return `${(val * 1e6).toFixed(2)} μS`;
    return `${val.toExponential(2)} S`;
  }
  if (unit === 'Ohm' || unit === 'Ω') {
    if (abs >= 1e6) return `${(val / 1e6).toFixed(2)} MΩ`;
    if (abs >= 1e3) return `${(val / 1e3).toFixed(2)} kΩ`;
    return `${val.toFixed(2)} Ω`;
  }
  if (abs >= 0.01 && abs < 10000) {
    return `${val.toFixed(3)} ${unit}`.trim();
  }
  return `${val.toExponential(3)} ${unit}`.trim();
}

const CATEGORY_META: Record<
  OperatingPointSpec['category'],
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  figure_of_merit: {
    label: 'Figures of Merit (Ch. 4)',
    badgeClass: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
    icon: <Gauge className="w-4 h-4 text-[#1E40AF]" />,
  },
  terminal_dc: {
    label: 'Terminal Voltages & Currents',
    badgeClass: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]',
    icon: <Zap className="w-4 h-4 text-[#0F766E]" />,
  },
  small_signal_conductance: {
    label: 'Small-Signal Transconductance & Resistances',
    badgeClass: 'bg-[#E0E7FF] text-[#4338CA] border-[#C7D2FE]',
    icon: <Activity className="w-4 h-4 text-[#4338CA]" />,
  },
  small_signal_capacitance: {
    label: 'Small-Signal Hybrid-π Capacitances',
    badgeClass: 'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]',
    icon: <Cpu className="w-4 h-4 text-[#334155]" />,
  },
  resistance: {
    label: 'Operating-Point Series Resistances',
    badgeClass: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    icon: <Sliders className="w-4 h-4 text-[#B45309]" />,
  },
  thermal: {
    label: 'Electro-Thermal Operating State',
    badgeClass: 'bg-[#FFE4E6] text-[#9F1239] border-[#FECDD3]',
    icon: <Thermometer className="w-4 h-4 text-[#9F1239]" />,
  },
};

export const OperatingPointDashboard: React.FC<OperatingPointDashboardProps> = ({
  specs,
  opValues,
  refOpValues,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: OperatingPointSpec['category'][] = [
    'figure_of_merit',
    'terminal_dc',
    'small_signal_conductance',
    'small_signal_capacitance',
    'resistance',
    'thermal',
  ];

  const filteredSpecs =
    selectedCategory === 'all'
      ? specs
      : specs.filter((s) => s.category === selectedCategory);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#DBEAFE] text-[#1E40AF] font-semibold">
              Manual Chapter 4 (pp. 113–115) & VA Lines 1980–2063
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#0F172A] mt-1 font-scientific">
            Live Circuit Simulator Operating Point (`CALC_OP`)
          </h3>
          <p className="text-xs text-[#475569]">
            Exact small-signal linearized hybrid-π parameters and DC operating point values evaluated from the active bias and model card.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
            }`}
          >
            All ({specs.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                  : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
              }`}
            >
              {CATEGORY_META[cat].label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Key Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-[#F8FAFC]/60 border-b border-[#E2E8F0]">
        {[
          { id: 'FT', label: 'Transit Freq. fT', unit: 'Hz' },
          { id: 'TF', label: 'Forward Transit τf', unit: 's' },
          { id: 'BETADC', label: 'DC Gain βDC', unit: '' },
          { id: 'BETAAC', label: 'AC Gain βAC', unit: '' },
          { id: 'GMi', label: 'Intrinsic gmi', unit: 'A/V' },
          { id: 'RBI', label: 'Modulated RBi*', unit: 'Ohm' },
        ].map((item) => {
          const val = opValues[item.id];
          const refVal = refOpValues?.[item.id];
          const diffPct =
            val !== undefined && refVal !== undefined && Math.abs(refVal) > 1e-25
              ? ((val - refVal) / Math.abs(refVal)) * 100
              : 0;
          return (
            <div
              key={item.id}
              className="bg-white border border-[#E2E8F0] rounded p-2.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-[#1E40AF]">
                  {item.id}
                </span>
                {Math.abs(diffPct) > 0.05 && (
                  <span
                    className={`text-[10px] font-mono px-1 rounded ${
                      diffPct > 0
                        ? 'bg-[#CCFBF1] text-[#0F766E]'
                        : 'bg-[#FEF3C7] text-[#B45309]'
                    }`}
                  >
                    {diffPct > 0 ? '+' : ''}
                    {diffPct.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="text-sm font-mono font-bold text-[#0F172A] mt-1">
                {formatSciValue(val, item.unit)}
              </div>
              <div className="text-[10px] text-[#64748B] truncate">{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Detailed Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F1F5F9] border-b border-[#CBD5E1] text-[11px] font-mono uppercase text-[#475569]">
              <th className="py-2.5 px-4">OP Variable</th>
              <th className="py-2.5 px-3">Live Value</th>
              <th className="py-2.5 px-3">Baseline (Test Card)</th>
              <th className="py-2.5 px-4">Documented Definition (Manual Ch. 4)</th>
              <th className="py-2.5 px-4">Description & VA Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-xs">
            {filteredSpecs.map((spec) => {
              const val = opValues[spec.id];
              const refVal = refOpValues?.[spec.id];
              const changed =
                val !== undefined &&
                refVal !== undefined &&
                Math.abs(val - refVal) > 1e-9 * (Math.abs(refVal) + 1e-18);

              return (
                <tr
                  key={spec.id}
                  className={`hover:bg-[#F8FAFC] transition-colors ${
                    changed ? 'bg-[#DBEAFE]/15' : ''
                  }`}
                >
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#1E40AF] text-xs">
                        {spec.id}
                      </span>
                      <span className="text-[#64748B]">
                        (<FormulaView latex={spec.symbolLatex} inline />)
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#0F172A] whitespace-nowrap">
                    {formatSciValue(val, spec.unit)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#64748B] whitespace-nowrap">
                    {formatSciValue(refVal, spec.unit)}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="text-xs text-[#0F172A] overflow-x-auto max-w-md">
                      <FormulaView latex={spec.definitionLatex} inline />
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="text-[#334155] font-medium">{spec.description}</div>
                    <div className="text-[11px] font-mono text-[#64748B] mt-0.5">
                      Manual p.{spec.manualPage} · VA line {spec.vaLine}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
