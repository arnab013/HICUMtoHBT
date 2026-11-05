import React, { useState } from 'react';
import { OperatingPointSpec } from '../data/hicumTypes';
import { FormulaView } from './FormulaView';
import { CitationBadges } from './CitationBadges';
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
    label: 'Figures of Merit',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60',
    icon: <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
  },
  terminal_dc: {
    label: 'Terminal DC',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/60',
    icon: <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  },
  small_signal_conductance: {
    label: 'Small-Signal Conductance',
    badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-900/60',
    icon: <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
  },
  small_signal_capacitance: {
    label: 'Hybrid-π Capacitances',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    icon: <Cpu className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
  },
  resistance: {
    label: 'Series Resistances',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/60',
    icon: <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
  },
  thermal: {
    label: 'Electro-Thermal',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/80 dark:border-rose-900/60',
    icon: <Thermometer className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors">
      <div className="p-6 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 font-semibold">
              Manual Chapter 4 (pp. 113–115) &amp; VA Lines 1980–2063
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2 tracking-tight">
            Live Circuit Simulator Operating Point (<code>CALC_OP</code>)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Exact small-signal linearized hybrid-π parameters and DC operating point values evaluated from active bias and model card.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`btn-elite px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            All ({specs.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn-elite px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 p-5 bg-slate-50/40 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800">
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
              className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {item.id}
                </span>
                {Math.abs(diffPct) > 0.05 && (
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                      diffPct > 0
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}
                  >
                    {diffPct > 0 ? '+' : ''}
                    {diffPct.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-slate-100 mt-2 tabular-nums">
                {formatSciValue(val, item.unit)}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 truncate">{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Detailed Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              <th className="py-3 px-4">OP Variable</th>
              <th className="py-3 px-3.5 text-right">Live Value</th>
              <th className="py-3 px-3.5 text-right">Baseline (Test Card)</th>
              <th className="py-3 px-4">Documented Definition (Manual Ch. 4)</th>
              <th className="py-3 px-4">Description &amp; VA Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
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
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    changed ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                        {spec.id}
                      </span>
                      <span className="text-slate-400">
                        (<FormulaView latex={spec.symbolLatex} inline />)
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 font-mono font-semibold text-slate-900 dark:text-slate-100 text-right tabular-nums whitespace-nowrap">
                    {formatSciValue(val, spec.unit)}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-slate-500 dark:text-slate-400 text-right tabular-nums whitespace-nowrap">
                    {formatSciValue(refVal, spec.unit)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs text-slate-800 dark:text-slate-200 overflow-x-auto max-w-md">
                      <FormulaView latex={spec.definitionLatex} inline />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-700 dark:text-slate-300 font-medium">{spec.description}</div>
                    <CitationBadges
                      className="mt-1.5"
                      compact
                      manualCitation={spec.manualCitation}
                      manualPage={spec.manualPage}
                      vaCitation={`hicumL2V2p34.va, l. ${spec.vaLine}`}
                    />
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

export default OperatingPointDashboard;
