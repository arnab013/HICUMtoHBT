import React from 'react';
import {
  HicumParameter,
  HicumEquation,
  CircuitElement,
  CircuitNode,
  SpatialNature,
} from '../data/hicumTypes';
import { FormulaView } from './FormulaView';
import {
  Sliders,
  RotateCcw,
  BookOpen,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Code2,
  Sparkles,
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
    badge: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]',
    label: 'Physically Localized Effect',
    desc: 'Directly tied to a specific physical junction, layer, or contact in the 3D SiGe HBT.',
  },
  distributed: {
    badge: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
    label: 'Distributed 2D/3D Effect',
    desc: 'Models lateral voltage drops, RC transmission line partitioning, or multi-dimensional current spreading.',
  },
  conceptual: {
    badge: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    label: 'Mathematical / Thermal Parameter',
    desc: 'Hyperbolic smoothing constant, global temperature exponent, or lumped thermal network parameter.',
  },
  flag: {
    badge: 'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]',
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
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm text-center">
        <p className="text-sm text-[#475569]">
          Select any circuit component, node, or parameter to inspect its physical meaning,
          governing equations, and live numerical controls.
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

  // Slider helper for log vs linear scale
  const renderSliderControl = (param: HicumParameter) => {
    if (param.isFlag && param.flagOptions && param.flagOptions.length > 0) {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {param.flagOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdateParamValue(param.id, opt.value)}
              className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
                activeVal === opt.value
                  ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                  : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F1F5F9]'
              }`}
            >
              {opt.value}: {opt.label}
            </button>
          ))}
        </div>
      );
    }

    const useLog =
      param.isLogScale && param.sliderMin > 0 && param.sliderMax > param.sliderMin && activeVal > 0;

    if (useLog) {
      const logMin = Math.log10(param.sliderMin);
      const logMax = Math.log10(param.sliderMax);
      const currentLog = Math.min(
        logMax,
        Math.max(logMin, Math.log10(Math.max(param.sliderMin, activeVal)))
      );

      return (
        <div className="space-y-1.5 mt-2">
          <input
            type="range"
            min={logMin}
            max={logMax}
            step={(logMax - logMin) / 200}
            value={currentLog}
            onChange={(e) => {
              const nextVal = Math.pow(10, parseFloat(e.target.value));
              onUpdateParamValue(param.id, Number(nextVal.toPrecision(4)));
            }}
            className="w-full accent-[#1E40AF] cursor-pointer h-1.5 bg-[#E2E8F0] rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#64748B]">
            <span>{param.sliderMin.toExponential(1)} (Log Min)</span>
            <span>Logarithmic Sweep</span>
            <span>{param.sliderMax.toExponential(1)} (Log Max)</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1.5 mt-2">
        <input
          type="range"
          min={param.sliderMin}
          max={param.sliderMax}
          step={param.sliderStep || (param.sliderMax - param.sliderMin) / 200 || 0.01}
          value={Math.min(param.sliderMax, Math.max(param.sliderMin, activeVal))}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isNaN(v)) onUpdateParamValue(param.id, v);
          }}
          className="w-full accent-[#1E40AF] cursor-pointer h-1.5 bg-[#E2E8F0] rounded-lg"
        />
        <div className="flex justify-between text-[10px] font-mono text-[#64748B]">
          <span>Min: {param.sliderMin}</span>
          <span>Linear Sweep</span>
          <span>Max: {param.sliderMax}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Selected Circuit Element or Node Context Card */}
      {selectedElement && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E2E8F0] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#DBEAFE] text-[#1E40AF] font-semibold">
                  Equivalent Circuit Element · {selectedElement.manualSection}
                </span>
                <span className="text-[11px] font-mono text-[#64748B]">
                  Nodes: <strong>{selectedElement.fromNode}</strong> →{' '}
                  <strong>{selectedElement.toNode}</strong> ({selectedElement.vaBranch})
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-1.5">
                <h3 className="text-lg font-bold text-[#0F172A] font-scientific">
                  {selectedElement.name}
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#CBD5E1] text-sm">
                  <FormulaView latex={selectedElement.symbolLatex} inline />
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                SPATIAL_STYLE[selectedElement.spatialNature].badge
              }`}
            >
              {SPATIAL_STYLE[selectedElement.spatialNature].label}
            </span>
          </div>

          <p className="text-xs text-[#334155] leading-relaxed mt-2.5">
            {selectedElement.physicalDescription}
          </p>

          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-[#0F766E] bg-[#CCFBF1]/30 border border-[#99F6E4] px-2.5 py-1.5 rounded">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>Physical Device Region:</strong> {selectedElement.physicalRegion} (VA lines{' '}
              {selectedElement.vaLines})
            </span>
          </div>

          {/* Element's Parameters Selector Pills */}
          {elementParams.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#475569] font-semibold mb-1.5">
                Governing Model Parameters ({elementParams.length}) — Click to Adjust & Plot:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {elementParams.map((ep) => {
                  const isSel = selectedParam?.id === ep.id;
                  const val = activeParamValues[ep.id] ?? ep.testValue;
                  const ref = refParamValues[ep.id] ?? ep.testValue;
                  const mod = Math.abs(val - ref) > 1e-12 * (Math.abs(ref) + 1e-24);
                  return (
                    <button
                      key={ep.id}
                      onClick={() => onSelectParam(ep.id)}
                      className={`px-2.5 py-1 rounded text-xs font-mono border transition-all flex items-center gap-1.5 ${
                        isSel
                          ? 'bg-[#1E40AF] text-white border-[#1E40AF] shadow-sm font-bold'
                          : mod
                          ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A] font-semibold'
                          : 'bg-[#F8FAFC] text-[#334155] border-[#CBD5E1] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      <span>{ep.name}</span>
                      <span
                        className={`text-[10px] ${
                          isSel ? 'text-blue-100' : 'text-[#64748B]'
                        }`}
                      >
                        ({ep.symbolLatex.replace(/\\/g, '')})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Node Context if a Node was clicked */}
      {selectedNode && !selectedElement && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#CCFBF1] text-[#0F766E] font-semibold">
                {selectedNode.isExternal ? 'External Terminal Node' : 'Internal Equivalent Circuit Node'}
              </span>
              <h3 className="text-lg font-bold text-[#0F172A] mt-1 font-scientific">
                Node {selectedNode.id} (Verilog-A: <code>{selectedNode.vaName}</code>) — {selectedNode.label}
              </h3>
            </div>
          </div>
          <p className="text-xs text-[#334155] leading-relaxed mt-2">
            {selectedNode.description}
          </p>
          <div className="mt-2 text-xs text-[#1E40AF] font-mono bg-[#DBEAFE]/30 px-2.5 py-1.5 rounded border border-[#BFDBFE]">
            Physical Location: {selectedNode.physicalLocation}
          </div>
        </div>
      )}

      {/* 2. Active Parameter Interactive Control & Explanation Card */}
      {selectedParam && (
        <div className="bg-white border-2 border-[#1E40AF]/80 rounded-lg p-4 shadow-sm space-y-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E2E8F0] pb-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#0F172A] text-white">
                  Parameter §{selectedParam.section}.{selectedParam.tableNo}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                  Manual p.{selectedParam.manualPages.join(', ')} · VA Line {selectedParam.vaLine}
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                    SPATIAL_STYLE[selectedParam.spatialNature].badge
                  }`}
                >
                  {SPATIAL_STYLE[selectedParam.spatialNature].label}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xl font-mono font-bold text-[#1E40AF]">
                  {selectedParam.name}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#F8FAFC] border border-[#CBD5E1] text-base">
                  <FormulaView latex={selectedParam.symbolLatex} inline />
                </span>
                <span className="text-xs font-mono text-[#64748B]">
                  Unit: <strong>{selectedParam.unit}</strong> · Range:{' '}
                  <strong>{selectedParam.rangeStr}</strong> · M-Factor:{' '}
                  <strong>{selectedParam.mFactor || '—'}</strong>
                </span>
              </div>
              <div className="text-sm font-semibold text-[#0F172A] mt-1">
                {selectedParam.description}
              </div>
            </div>

            {isModified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                <AlertCircle className="w-3.5 h-3.5" /> Illustrative Sweep Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Manual Card Value
              </span>
            )}
          </div>

          {/* Interactive Value & Slider Box */}
          <div className="p-3.5 rounded-md bg-[#F8FAFC] border border-[#CBD5E1]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#1E40AF]" />
                <span className="text-xs font-bold text-[#0F172A]">
                  Interactive Parameter Control:
                </span>
                <input
                  type="number"
                  step="any"
                  value={activeVal}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v)) onUpdateParamValue(selectedParam.id, v);
                  }}
                  className="w-32 px-2.5 py-1 text-xs font-mono font-bold text-[#1E40AF] bg-white border border-[#1E40AF] rounded focus:outline-none"
                />
                <span className="text-xs font-mono text-[#475569]">
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
                      className="px-2 py-1 text-[11px] font-mono rounded bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
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
                      className="px-2 py-1 text-[11px] font-mono rounded bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
                    >
                      ×1.5
                    </button>
                  </>
                )}
                <button
                  onClick={() => onUpdateParamValue(selectedParam.id, selectedParam.defaultValue)}
                  className="px-2 py-1 text-[11px] font-mono rounded bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9]"
                  title={`Set to Manual Default (${selectedParam.defaultDisplay})`}
                >
                  Default ({selectedParam.defaultDisplay})
                </button>
                <button
                  onClick={() => onResetParam(selectedParam.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded bg-[#0F766E] text-white hover:bg-[#115E59]"
                  title={`Reset to Manual Test Card Value (${selectedParam.testDisplay})`}
                >
                  <RotateCcw className="w-3 h-3" /> Test ({selectedParam.testDisplay})
                </button>
              </div>
            </div>

            {renderSliderControl(selectedParam)}
          </div>

          {/* Physical Meaning & Operation Effect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#1E40AF] font-bold mb-1">
                Physical Meaning & Origin
              </div>
              <p className="text-xs text-[#334155] leading-relaxed">
                {selectedParam.physicalMeaning}
              </p>
              <div className="mt-2 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#475569]">
                <strong>3D Device Localization:</strong> {selectedParam.physicalRegion}
              </div>
            </div>

            <div className="p-3 rounded bg-[#CCFBF1]/25 border border-[#99F6E4]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0F766E] font-bold mb-1">
                Effect on Equations, Curves & Operation
              </div>
              <p className="text-xs text-[#334155] leading-relaxed">
                {selectedParam.operationEffect}
              </p>
              <div className="mt-2 pt-2 border-t border-[#99F6E4]/60 text-[11px] text-[#0F766E]">
                <strong>Spatial Classification:</strong>{' '}
                {SPATIAL_STYLE[selectedParam.spatialNature].desc}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Linked Documented Equations */}
      {linkedEquations.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1E40AF]" />
              <h4 className="text-sm font-bold text-[#0F172A] font-scientific">
                Governing Documented Equations ({linkedEquations.length})
              </h4>
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">
              Framed equations are directly implemented in VA
            </span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {linkedEquations.map((eq) => (
              <div
                key={eq.id}
                onClick={() => onSelectEquation?.(eq.id)}
                className="p-3 rounded border border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#1E40AF] transition-colors cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-[#0F172A] text-white">
                      {eq.eqNumber}
                    </span>
                    <span className="text-xs font-bold text-[#0F172A]">{eq.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B]">
                    Manual p.{eq.manualPage} · {eq.vaReference}
                  </span>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded px-3 py-2 overflow-x-auto">
                  <FormulaView latex={eq.latex} displayMode />
                </div>

                <p className="text-[11px] text-[#475569] mt-1.5 leading-relaxed">
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
