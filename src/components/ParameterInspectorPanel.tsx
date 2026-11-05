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
    badge: 'bg-[#E6F0EE] text-[#22544F] border-[#C0D8D4]',
    label: 'Physically Localized Effect',
    desc: 'Directly tied to a specific physical junction, layer, or contact in the 3D SiGe HBT.',
  },
  distributed: {
    badge: 'bg-[#E7EEF4] text-[#23435C] border-[#C5D4E2]',
    label: 'Distributed 2D/3D Effect',
    desc: 'Models lateral voltage drops, RC transmission line partitioning, or multi-dimensional current spreading.',
  },
  conceptual: {
    badge: 'bg-[#F4EAE3] text-[#824726] border-[#DFC8B8]',
    label: 'Mathematical / Thermal Parameter',
    desc: 'Hyperbolic smoothing constant, global temperature exponent, or lumped thermal network parameter.',
  },
  flag: {
    badge: 'bg-[#EAE8E1] text-[#334155] border-[#D8D4CA]',
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
      <div className="matte-card p-6 text-center animate-card-enter">
        <p className="text-sm text-[#475569]">
          Select any circuit component, node, or parameter to inspect its physical meaning,
          verified manual page & line citations, governing equations, and live numerical controls.
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
              className={`px-3 py-1.5 text-xs font-mono rounded border matte-btn-transition ${
                activeVal === opt.value
                  ? 'bg-[#2B4C65] text-white border-[#2B4C65]'
                  : 'bg-white text-[#334155] border-[#D8D4CA] hover:bg-[#EAE8E1]'
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
            className="w-full accent-[#2B4C65] cursor-pointer h-1.5 bg-[#D8D4CA] rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#526071]">
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
          className="w-full accent-[#2B4C65] cursor-pointer h-1.5 bg-[#D8D4CA] rounded-lg"
        />
        <div className="flex justify-between text-[10px] font-mono text-[#526071]">
          <span>Min: {param.sliderMin}</span>
          <span>Linear Sweep</span>
          <span>Max: {param.sliderMax}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Selected Circuit Element Context Card */}
      {selectedElement && (
        <div
          key={`el-${selectedElement.id}`}
          className="matte-card p-4 animate-card-enter"
        >
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E5E2DA] pb-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#E7EEF4] text-[#23435C] border border-[#C5D4E2] font-semibold">
                  Equivalent Circuit Branch · {selectedElement.manualSection}
                </span>
                <span className="text-[11px] font-mono text-[#526071]">
                  Nodes: <strong>{selectedElement.fromNode}</strong> →{' '}
                  <strong>{selectedElement.toNode}</strong> ({selectedElement.vaBranch})
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-1.5">
                <h3 className="text-lg font-bold text-[#161E29] font-scientific">
                  {selectedElement.name}
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#F7F6F2] border border-[#D8D4CA] text-sm">
                  <FormulaView latex={selectedElement.symbolLatex} inline />
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                SPATIAL_STYLE[selectedElement.spatialNature].badge
              }`}
            >
              {SPATIAL_STYLE[selectedElement.spatialNature].label}
            </span>
          </div>

          {/* Authoritative Manual Page+Line & Verilog-A Citations */}
          <CitationBadges
            className="mt-2.5"
            manualCitation={selectedElement.manualCitation}
            vaCitation={selectedElement.vaCitation || `hicumL2V2p34.va, ll. ${selectedElement.vaLines}`}
          />

          <p className="text-xs text-[#2C3746] leading-relaxed mt-2.5">
            {selectedElement.physicalDescription}
          </p>

          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-[#22544F] bg-[#E6F0EE] border border-[#C0D8D4] px-2.5 py-1.5 rounded">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>Physical Device Region:</strong> {selectedElement.physicalRegion} (VA lines{' '}
              {selectedElement.vaLines})
            </span>
          </div>

          {/* Element's Parameters Selector Pills */}
          {elementParams.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#E5E2DA]">
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
                      className={`px-2.5 py-1 rounded text-xs font-mono border matte-btn-transition flex items-center gap-1.5 ${
                        isSel
                          ? 'bg-[#2B4C65] text-white border-[#2B4C65] font-bold'
                          : mod
                          ? 'bg-[#F4EAE3] text-[#824726] border-[#DFC8B8] font-semibold'
                          : 'bg-[#F7F6F2] text-[#2C3746] border-[#D8D4CA] hover:bg-[#EAE8E1]'
                      }`}
                    >
                      <span>{ep.name}</span>
                      <span
                        className={`text-[10px] ${
                          isSel ? 'text-[#D6E4F0]' : 'text-[#526071]'
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
        <div
          key={`node-${selectedNode.id}`}
          className="matte-card p-4 animate-card-enter"
        >
          <div className="flex items-center justify-between border-b border-[#E5E2DA] pb-2.5">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#E6F0EE] text-[#22544F] border border-[#C0D8D4] font-semibold">
                {selectedNode.isExternal ? 'External Terminal Node' : 'Internal Equivalent Circuit Node'}
              </span>
              <h3 className="text-lg font-bold text-[#161E29] mt-1 font-scientific">
                Node {selectedNode.id} (Verilog-A: <code>{selectedNode.vaName}</code>) — {selectedNode.label}
              </h3>
            </div>
          </div>

          <CitationBadges
            className="mt-2.5"
            manualCitation={selectedNode.manualCitation}
            vaCitation={selectedNode.vaCitation}
          />

          <p className="text-xs text-[#2C3746] leading-relaxed mt-2">
            {selectedNode.description}
          </p>
          <div className="mt-2 text-xs text-[#23435C] font-mono bg-[#E7EEF4] px-2.5 py-1.5 rounded border border-[#C5D4E2]">
            Physical Location: {selectedNode.physicalLocation}
          </div>
        </div>
      )}

      {/* 2. Active Parameter Interactive Control & Explanation Card */}
      {selectedParam && (
        <div
          key={`param-${selectedParam.id}`}
          className="bg-white border-2 border-[#2B4C65] rounded-[10px] p-4 space-y-3.5 animate-card-enter"
        >
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E5E2DA] pb-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#1D2530] text-white">
                  Parameter §{selectedParam.section}.{selectedParam.tableNo}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    SPATIAL_STYLE[selectedParam.spatialNature].badge
                  }`}
                >
                  {SPATIAL_STYLE[selectedParam.spatialNature].label}
                </span>
              </div>

              {/* Verified Manual & Verilog-A Page + Line Citations */}
              <CitationBadges
                className="mt-2"
                manualCitation={selectedParam.manualCitation}
                manualPage={selectedParam.manualPages[0]}
                vaCitation={selectedParam.vaCitation || `hicumL2V2p34.va, l. ${selectedParam.vaLine}`}
              />

              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-2xl font-mono font-bold text-[#2B4C65]">
                  {selectedParam.name}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#F7F6F2] border border-[#D8D4CA] text-base">
                  <FormulaView latex={selectedParam.symbolLatex} inline />
                </span>
                <span className="text-xs font-mono text-[#526071]">
                  Unit: <strong>{selectedParam.unit}</strong> · Range:{' '}
                  <strong>{selectedParam.rangeStr}</strong> · M-Factor:{' '}
                  <strong>{selectedParam.mFactor || '—'}</strong>
                </span>
              </div>
              <div className="text-sm font-semibold text-[#161E29] mt-1">
                {selectedParam.description}
              </div>
            </div>

            {isModified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-[#F4EAE3] text-[#824726] border border-[#DFC8B8]">
                <AlertCircle className="w-3.5 h-3.5" /> Illustrative Sweep Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-[#E6F0EE] text-[#22544F] border border-[#C0D8D4]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Manual Card Value
              </span>
            )}
          </div>

          {/* Interactive Value & Slider Box */}
          <div className="p-3.5 rounded-md bg-[#F7F6F2] border border-[#D8D4CA]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#2B4C65]" />
                <span className="text-xs font-bold text-[#161E29]">
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
                  className="w-32 px-2.5 py-1 text-xs font-mono font-bold text-[#2B4C65] bg-white border border-[#2B4C65] rounded focus:outline-none"
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
                      className="px-2 py-1 text-[11px] font-mono rounded bg-white border border-[#D8D4CA] text-[#2C3746] hover:bg-[#EAE8E1] matte-btn-transition"
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
                      className="px-2 py-1 text-[11px] font-mono rounded bg-white border border-[#D8D4CA] text-[#2C3746] hover:bg-[#EAE8E1] matte-btn-transition"
                    >
                      ×1.5
                    </button>
                  </>
                )}
                <button
                  onClick={() => onUpdateParamValue(selectedParam.id, selectedParam.defaultValue)}
                  className="px-2 py-1 text-[11px] font-mono rounded bg-white border border-[#D8D4CA] text-[#475569] hover:bg-[#EAE8E1] matte-btn-transition"
                  title={`Set to Manual Default (${selectedParam.defaultDisplay})`}
                >
                  Default ({selectedParam.defaultDisplay})
                </button>
                <button
                  onClick={() => onResetParam(selectedParam.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded bg-[#2A645E] text-white hover:bg-[#22544F] matte-btn-transition"
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
            <div className="p-3 rounded bg-[#F7F6F2] border border-[#D8D4CA]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#2B4C65] font-bold mb-1">
                Physical Meaning & Origin
              </div>
              <p className="text-xs text-[#2C3746] leading-relaxed">
                {selectedParam.physicalMeaning}
              </p>
              <div className="mt-2 pt-2 border-t border-[#E5E2DA] text-[11px] text-[#475569]">
                <strong>3D Device Localization:</strong> {selectedParam.physicalRegion}
              </div>
            </div>

            <div className="p-3 rounded bg-[#E6F0EE] border border-[#C0D8D4]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#22544F] font-bold mb-1">
                Effect on Equations, Curves & Operation
              </div>
              <p className="text-xs text-[#2C3746] leading-relaxed">
                {selectedParam.operationEffect}
              </p>
              <div className="mt-2 pt-2 border-t border-[#C0D8D4] text-[11px] text-[#22544F]">
                <strong>Spatial Classification:</strong>{' '}
                {SPATIAL_STYLE[selectedParam.spatialNature].desc}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Linked Documented Equations */}
      {linkedEquations.length > 0 && (
        <div className="matte-card p-4 space-y-3 animate-card-enter">
          <div className="flex items-center justify-between border-b border-[#E5E2DA] pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2B4C65]" />
              <h4 className="text-sm font-bold text-[#161E29] font-scientific">
                Governing Documented Equations ({linkedEquations.length})
              </h4>
            </div>
            <span className="text-[11px] font-mono text-[#526071]">
              Exact Manual Page & Line Citations
            </span>
          </div>

          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
            {linkedEquations.map((eq) => (
              <div
                key={eq.id}
                onClick={() => onSelectEquation?.(eq.id)}
                className="p-3 rounded border border-[#D8D4CA] bg-[#F7F6F2] hover:border-[#2B4C65] transition-colors cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-[#1D2530] text-white">
                      {eq.eqNumber}
                    </span>
                    <span className="text-xs font-bold text-[#161E29]">{eq.title}</span>
                  </div>
                  <CitationBadges
                    compact
                    manualCitation={eq.manualLines ? `Eq. (${eq.eqNumber}), ${eq.manualLines}` : undefined}
                    manualPage={eq.manualPage}
                    vaCitation={eq.vaReference}
                  />
                </div>

                <div className="bg-white border border-[#D8D4CA] rounded px-3 py-2 overflow-x-auto">
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
