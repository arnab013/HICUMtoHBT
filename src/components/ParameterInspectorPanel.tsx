import React from 'react';
import {
  HicumParameter,
  HicumEquation,
  CircuitElement,
  CircuitNode,
  SpatialNature,
} from '../data/hicumTypes';
import { FormulaView } from './FormulaView';
import { CitationBadges } from './CitationBadges';
import {
  Sliders,
  RotateCcw,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ParameterInspectorPanelProps {
  selectedElement: CircuitElement | null;
  selectedNode: CircuitNode | null;
  selectedParam: HicumParameter | null;
  elementParams: HicumParameter[];
  linkedEquations: HicumEquation[];
  activeParamValues: Record<string, number>;
  refParamValues: Record<string, number>;
  onSelectParam: (paramId: string) => void;
  onUpdateParamValue: (paramId: string, value: number) => void;
  onResetParam: (paramId: string) => void;
  onSelectEquation?: (eqId: string) => void;
}

const SPATIAL_STYLE: Record<
  SpatialNature,
  { badge: string; label: string; desc: string }
> = {
  localized: {
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/60',
    label: 'Physically Localized',
    desc: 'Directly tied to a specific physical junction, layer, or contact in the 3D SiGe HBT.',
  },
  distributed: {
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60',
    label: 'Distributed 2D/3D Effect',
    desc: 'Models lateral voltage drops, RC transmission line partitioning, or multi-dimensional current spreading.',
  },
  conceptual: {
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/60',
    label: 'Mathematical / Thermal',
    desc: 'Hyperbolic smoothing constant, global temperature exponent, or lumped thermal network parameter.',
  },
  flag: {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    label: 'Simulator / Topology Flag',
    desc: 'Discrete switch controlling model version compatibility or sub-network activation.',
  },
};

export const ParameterInspectorPanel: React.FC<ParameterInspectorPanelProps> = ({
  selectedElement,
  selectedNode,
  selectedParam,
  elementParams,
  linkedEquations,
  activeParamValues,
  refParamValues,
  onSelectParam,
  onUpdateParamValue,
  onResetParam,
  onSelectEquation,
}) => {
  if (!selectedParam && !selectedElement && !selectedNode) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 text-center shadow-xs animate-card-enter">
        <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Select any circuit component, node, or parameter to inspect its physical meaning,
          governing equations, and interactive tuning controls.
        </p>
      </div>
    );
  }

  const activeVal = selectedParam
    ? activeParamValues[selectedParam.id] ?? selectedParam.testValue
    : 0;
  const refVal = selectedParam
    ? refParamValues[selectedParam.id] ?? selectedParam.testValue
    : 0;
  const isModified =
    selectedParam && Math.abs(activeVal - refVal) > 1e-12 * (Math.abs(refVal) + 1e-24);

  const renderSliderControl = (param: HicumParameter) => {
    if (param.isFlag && param.flagOptions && param.flagOptions.length > 0) {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {param.flagOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdateParamValue(param.id, opt.value)}
              className={`btn-elite px-3 py-1 text-xs rounded-lg font-mono border transition-all ${
                activeVal === opt.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt.label} ({opt.value})
            </button>
          ))}
        </div>
      );
    }

    const min = param.sliderMin !== undefined ? param.sliderMin : activeVal > 0 ? activeVal * 0.1 : -10;
    const max = param.sliderMax !== undefined ? param.sliderMax : activeVal > 0 ? activeVal * 5 : 10;
    const step = (max - min) / 100 || 0.01;

    return (
      <div className="mt-3 flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={activeVal}
          onChange={(e) => onUpdateParamValue(param.id, parseFloat(e.target.value))}
          className="flex-1 cursor-pointer accent-blue-600"
        />
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Circuit Component Context Header */}
      {selectedElement && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3 animate-card-enter">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                Branch: {selectedElement.id}
              </span>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                Between nodes {selectedElement.fromNode} ↔ {selectedElement.toNode}
              </span>
            </div>
            <span className="text-[11px] font-mono uppercase text-slate-400">
              {selectedElement.subsystem || selectedElement.network}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {selectedElement.name}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {selectedElement.summary}
            </p>
          </div>

          <CitationBadges
            compact
            manualCitation={selectedElement.manualCitation}
            vaCitation={selectedElement.vaCitation}
          />

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-slate-100">Physical Origin:</strong>{' '}
            {selectedElement.physicalDescription || selectedElement.summary}
          </div>

          {elementParams.length > 0 && (
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                Governing Parameters ({elementParams.length}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {elementParams.map((p) => {
                  const isSel = selectedParam?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectParam(p.id)}
                      className={`btn-elite px-2.5 py-1 text-xs font-mono rounded-lg border transition-all ${
                        isSel
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Active Parameter Interactive Control Card */}
      {selectedParam && (
        <div
          key={`param-${selectedParam.id}`}
          className="bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 rounded-xl p-5 space-y-4 shadow-xs animate-card-enter"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                  Parameter §{selectedParam.section}.{selectedParam.tableNo}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                    SPATIAL_STYLE[selectedParam.spatialNature].badge
                  }`}
                >
                  {SPATIAL_STYLE[selectedParam.spatialNature].label}
                </span>
              </div>

              <CitationBadges
                className="mt-2"
                manualCitation={selectedParam.manualCitation}
                manualPage={selectedParam.manualPages[0]}
                vaCitation={selectedParam.vaCitation || `hicumL2V2p34.va, l. ${selectedParam.vaLine}`}
              />

              <div className="flex flex-wrap items-center gap-3 mt-2.5">
                <span className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                  {selectedParam.name}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
                  <FormulaView latex={selectedParam.symbolLatex} inline />
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Unit: <strong>{selectedParam.unit}</strong> · Range:{' '}
                  <strong>{selectedParam.rangeStr}</strong> · M:{' '}
                  <strong>{selectedParam.mFactor || '—'}</strong>
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1.5">
                {selectedParam.description}
              </div>
            </div>

            {isModified ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60">
                <AlertCircle className="w-3.5 h-3.5" /> Sweep Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
                <CheckCircle2 className="w-3.5 h-3.5" /> Card Value
              </span>
            )}
          </div>

          {/* Interactive Value & Slider Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Value Control:
                </span>
                <input
                  type="number"
                  step="any"
                  value={activeVal}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v)) onUpdateParamValue(selectedParam.id, v);
                  }}
                  className="w-32 px-2.5 py-1 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                />
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {selectedParam.unit !== '-' ? selectedParam.unit : ''}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {!selectedParam.isFlag && activeVal !== 0 && (
                  <>
                    <button
                      onClick={() =>
                        onUpdateParamValue(
                          selectedParam.id,
                          Number((activeVal * 0.5).toPrecision(4))
                        )
                      }
                      className="btn-elite px-2.5 py-1 text-xs font-mono rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      ×0.5
                    </button>
                    <button
                      onClick={() =>
                        onUpdateParamValue(
                          selectedParam.id,
                          Number((activeVal * 1.5).toPrecision(4))
                        )
                      }
                      className="btn-elite px-2.5 py-1 text-xs font-mono rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      ×1.5
                    </button>
                  </>
                )}
                <button
                  onClick={() => onUpdateParamValue(selectedParam.id, selectedParam.defaultValue)}
                  className="btn-elite px-2.5 py-1 text-xs font-mono rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  title={`Default (${selectedParam.defaultDisplay})`}
                >
                  Def ({selectedParam.defaultDisplay})
                </button>
                <button
                  onClick={() => onResetParam(selectedParam.id)}
                  className="btn-elite inline-flex items-center gap-1 px-3 py-1 text-xs font-mono font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  title={`Reset to Card Value (${selectedParam.testDisplay})`}
                >
                  <RotateCcw className="w-3 h-3" /> Test ({selectedParam.testDisplay})
                </button>
              </div>
            </div>

            {renderSliderControl(selectedParam)}
          </div>

          {/* Physical Meaning & Operation Effect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="text-xs font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold mb-1">
                Physical Meaning &amp; Origin
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedParam.physicalMeaning}
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700 text-[11px] text-slate-400">
                <strong>Device Localization:</strong> {selectedParam.physicalRegion}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40">
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                Effect on Equations &amp; Curves
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedParam.operationEffect}
              </p>
              <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[11px] text-emerald-700 dark:text-emerald-400">
                <strong>Spatial Nature:</strong> {SPATIAL_STYLE[selectedParam.spatialNature].desc}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Linked Documented Equations */}
      {linkedEquations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 space-y-3.5 shadow-xs animate-card-enter">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Governing Documented Equations ({linkedEquations.length})
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Manual Page &amp; Line Citations
            </span>
          </div>

          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
            {linkedEquations.map((eq) => (
              <div
                key={eq.id}
                onClick={() => onSelectEquation?.(eq.id)}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-500 transition-colors cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                      {eq.eqNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{eq.title}</span>
                  </div>
                  <CitationBadges
                    compact
                    manualCitation={eq.manualLines ? `Eq. (${eq.eqNumber}), ${eq.manualLines}` : undefined}
                    manualPage={eq.manualPage}
                    vaCitation={eq.vaReference}
                  />
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-3 py-2 overflow-x-auto text-slate-900 dark:text-slate-100">
                  <FormulaView latex={eq.latex} displayMode />
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {eq.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParameterInspectorPanel;
