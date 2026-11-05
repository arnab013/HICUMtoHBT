import React, { useState, useMemo } from 'react';
import {
  BiasState,
  PlotCategoryId,
} from './data/hicumTypes';
import {
  HICUM_PARAMETERS,
  PARAMETER_SECTIONS,
  PARAMETER_MAP,
} from './data/hicumParameters';
import { HICUM_EQUATIONS } from './data/hicumEquations';
import {
  CIRCUIT_NODES,
  CIRCUIT_ELEMENTS,
  OPERATING_POINT_SPECS,
  PHYSICAL_MECHANISMS,
} from './data/hicumCircuit';
import {
  MODEL_CARD_PRESETS,
  evaluateOperatingPoint,
} from './engine/hicumSolver';
import { EquivalentCircuitDiagram } from './components/EquivalentCircuitDiagram';
import { InteractivePlotPanel } from './components/InteractivePlotPanel';
import { ParameterInspectorPanel } from './components/ParameterInspectorPanel';
import { OperatingPointDashboard } from './components/OperatingPointDashboard';
import { ParameterDatabaseView } from './components/ParameterDatabaseView';
import { EquationsReferenceView } from './components/EquationsReferenceView';
import { CrossSectionDiagrams } from './components/CrossSectionDiagrams';
import { VerilogAExplorerView } from './components/VerilogAExplorerView';
import {
  Cpu,
  Database,
  BookOpen,
  Layers,
  Code2,
  RotateCcw,
  Sliders,
  Search,
  CheckCircle2,
  Activity,
  Thermometer,
  Zap,
  Gauge,
} from 'lucide-react';

type MainTabId = 'lab' | 'parameters' | 'equations' | 'cross_section' | 'veriloga';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTabId>('lab');
  const [activePresetId, setActivePresetId] = useState<string>('manual_test');

  const baselineParams = useMemo(() => {
    const preset = MODEL_CARD_PRESETS.find((p) => p.id === activePresetId) || MODEL_CARD_PRESETS[0];
    return { ...preset.params };
  }, [activePresetId]);

  const [activeParams, setActiveParams] = useState<Record<string, number>>(() => ({
    ...MODEL_CARD_PRESETS[0].params,
  }));

  const [bias, setBias] = useState<BiasState>({
    Vbe: 0.86,
    Vce: 1.5,
    Vsc: 0.0,
    Tamb: 300.15,
  });

  // Synchronized selection state in the Interactive Lab
  const [selectedElementId, setSelectedElementId] = useState<string | null>('it');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedParamId, setSelectedParamId] = useState<string | null>('c10');
  const [selectedEquationId, setSelectedEquationId] = useState<string | null>('eq-2.2.0-1');
  const [activePlotCategory, setActivePlotCategory] = useState<PlotCategoryId>('transfer_gummel');

  // Global quick search state
  const [quickSearch, setQuickSearch] = useState<string>('');
  const [quickSearchOpen, setQuickSearchOpen] = useState<boolean>(false);

  // Switch preset model card
  const handleSelectPreset = (presetId: string) => {
    const found = MODEL_CARD_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(presetId);
    setActiveParams({ ...found.params });
  };

  // Update a single parameter value
  const handleUpdateParamValue = (paramId: string, newValue: number) => {
    setActiveParams((prev) => ({
      ...prev,
      [paramId]: newValue,
    }));
  };

  // Reset a single parameter to baseline
  const handleResetParam = (paramId: string) => {
    if (baselineParams[paramId] !== undefined) {
      setActiveParams((prev) => ({
        ...prev,
        [paramId]: baselineParams[paramId],
      }));
    }
  };

  // Reset all parameters to active preset baseline
  const handleResetAllParams = () => {
    setActiveParams({ ...baselineParams });
  };

  // Count modified parameters
  const modifiedParamCount = useMemo(() => {
    let count = 0;
    for (const k of Object.keys(activeParams)) {
      if (
        baselineParams[k] !== undefined &&
        Math.abs(activeParams[k] - baselineParams[k]) > 1e-12 * (Math.abs(baselineParams[k]) + 1e-24)
      ) {
        count++;
      }
    }
    return count;
  }, [activeParams, baselineParams]);

  // Evaluate Operating Point for active parameters and baseline parameters
  const opResult = useMemo(
    () => evaluateOperatingPoint(activeParams, bias),
    [activeParams, bias]
  );

  const refOpResult = useMemo(
    () => evaluateOperatingPoint(baselineParams, bias),
    [baselineParams, bias]
  );

  // Synchronized selection handlers
  const handleSelectElement = (elementId: string, switchToLab = false) => {
    const el = CIRCUIT_ELEMENTS.find((e) => e.id === elementId);
    setSelectedElementId(elementId);
    setSelectedNodeId(null);
    if (el) {
      setActivePlotCategory(el.plotCategory);
      if (el.parameters.length > 0) {
        setSelectedParamId(el.parameters[0]);
      }
      if (el.governingEquations.length > 0) {
        setSelectedEquationId(el.governingEquations[0]);
      }
    }
    if (switchToLab) {
      setActiveTab('lab');
    }
  };

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedElementId(null);
  };

  const handleSelectParam = (paramId: string, switchToLab = false) => {
    const param = PARAMETER_MAP[paramId];
    setSelectedParamId(paramId);
    if (param) {
      setActivePlotCategory(param.plotCategory);
      if (param.circuitElements.length > 0) {
        setSelectedElementId(param.circuitElements[0]);
        setSelectedNodeId(null);
      }
      if (param.equations.length > 0) {
        setSelectedEquationId(param.equations[0]);
      }
    }
    if (switchToLab) {
      setActiveTab('lab');
    }
  };

  const handleSelectEquation = (eqId: string, switchToEquationsTab = true) => {
    setSelectedEquationId(eqId);
    if (switchToEquationsTab) {
      setActiveTab('equations');
    }
  };

  // Resolved selected entities for ParameterInspectorPanel
  const selectedElement = useMemo(
    () => CIRCUIT_ELEMENTS.find((e) => e.id === selectedElementId) || null,
    [selectedElementId]
  );

  const selectedNode = useMemo(
    () => CIRCUIT_NODES.find((n) => n.id === selectedNodeId) || null,
    [selectedNodeId]
  );

  const selectedParam = useMemo(
    () => (selectedParamId ? PARAMETER_MAP[selectedParamId] || null : null),
    [selectedParamId]
  );

  const elementParams = useMemo(() => {
    if (selectedElement) {
      return selectedElement.parameters
        .map((id) => PARAMETER_MAP[id])
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
    }
    if (selectedParam) {
      return HICUM_PARAMETERS.filter((p) => p.section === selectedParam.section);
    }
    return [];
  }, [selectedElement, selectedParam]);

  const linkedEquations = useMemo(() => {
    const eqIds = new Set<string>();
    if (selectedElement) {
      selectedElement.governingEquations.forEach((id) => eqIds.add(id));
    }
    if (selectedParam) {
      selectedParam.equations.forEach((id) => eqIds.add(id));
    }
    return HICUM_EQUATIONS.filter((eq) => eqIds.has(eq.id));
  }, [selectedElement, selectedParam]);

  // Quick search results across parameters, elements, and equations
  const quickSearchResults = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return { params: [], elements: [], equations: [] };
    return {
      params: HICUM_PARAMETERS.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.physicalRegion.toLowerCase().includes(q)
      ).slice(0, 6),
      elements: CIRCUIT_ELEMENTS.filter(
        (e) =>
          e.id.toLowerCase().includes(q) ||
          e.name.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q)
      ).slice(0, 4),
      equations: HICUM_EQUATIONS.filter(
        (eq) =>
          eq.eqNumber.toLowerCase().includes(q) ||
          eq.title.toLowerCase().includes(q) ||
          eq.summary.toLowerCase().includes(q)
      ).slice(0, 4),
    };
  }, [quickSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Scientific Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Documentation Authority */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-800 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
              H2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 font-scientific leading-tight">
                  HICUM/L2 Interactive Physics & Circuit Explorer
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-blue-50 text-blue-800 border border-blue-200">
                  v2.4.0 Manual · v2.34 Verilog-A
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                High Current Model for Bipolar & SiGe HBT Transistors (M. Schröter & A. Pawlak) — 136 Parameters · 47 Equations · 34 Branches
              </p>
            </div>
          </div>

          {/* Right Controls: Global Search, Model Card Selector & Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Search Input */}
            <div className="relative">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus-within:border-blue-600 focus-within:bg-white transition-all">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                <input
                  type="text"
                  value={quickSearch}
                  onFocus={() => setQuickSearchOpen(true)}
                  onBlur={() => setTimeout(() => setQuickSearchOpen(false), 180)}
                  onChange={(e) => {
                    setQuickSearch(e.target.value);
                    setQuickSearchOpen(true);
                  }}
                  placeholder="Jump to param, branch, eq (e.g. c10, rbi0, ICK)..."
                  className="bg-transparent outline-none w-48 sm:w-64 text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {/* Quick Search Dropdown */}
              {quickSearchOpen && quickSearch.trim().length > 0 && (
                <div className="absolute right-0 mt-1 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-lg p-3 z-50 space-y-2.5 text-xs">
                  {quickSearchResults.params.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
                        Parameters
                      </div>
                      <div className="space-y-1">
                        {quickSearchResults.params.map((p) => (
                          <button
                            key={p.id}
                            onMouseDown={() => {
                              handleSelectParam(p.id, true);
                              setQuickSearch('');
                            }}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-blue-50 flex items-center justify-between gap-2"
                          >
                            <span className="font-mono font-bold text-blue-800">{p.id}</span>
                            <span className="text-slate-600 truncate text-[11px]">{p.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {quickSearchResults.elements.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
                        Circuit Branches
                      </div>
                      <div className="space-y-1">
                        {quickSearchResults.elements.map((el) => (
                          <button
                            key={el.id}
                            onMouseDown={() => {
                              handleSelectElement(el.id, true);
                              setQuickSearch('');
                            }}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-teal-50 flex items-center justify-between gap-2"
                          >
                            <span className="font-mono font-bold text-teal-800">{el.id}</span>
                            <span className="text-slate-600 truncate text-[11px]">{el.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {quickSearchResults.equations.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
                        Documented Equations
                      </div>
                      <div className="space-y-1">
                        {quickSearchResults.equations.map((eq) => (
                          <button
                            key={eq.id}
                            onMouseDown={() => {
                              handleSelectEquation(eq.id, true);
                              setQuickSearch('');
                            }}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center justify-between gap-2"
                          >
                            <span className="font-mono font-bold text-slate-800">{eq.eqNumber}</span>
                            <span className="text-slate-600 truncate text-[11px]">{eq.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {quickSearchResults.params.length === 0 &&
                    quickSearchResults.elements.length === 0 &&
                    quickSearchResults.equations.length === 0 && (
                      <div className="text-slate-400 text-center py-2">
                        No matching parameters, branches, or equations
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Model Card Preset Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <Sliders className="w-3.5 h-3.5 text-blue-800 shrink-0" />
              <span className="text-[11px] font-medium text-slate-500 hidden md:inline">Card:</span>
              <select
                value={activePresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                {MODEL_CARD_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Modified Parameter Counter & Reset Button */}
            {modifiedParamCount > 0 ? (
              <button
                onClick={handleResetAllParams}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
                title="Reset all user-adjusted parameters back to the verified reference card"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ({modifiedParamCount} Modified)</span>
              </button>
            ) : (
              <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Card Active</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs & Live Bias Strip */}
        <div className="bg-slate-50/90 border-t border-slate-200/80">
          <div className="max-w-[1600px] mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-3">
            {/* Main Navigation Tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto py-0.5">
              <button
                onClick={() => setActiveTab('lab')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'lab'
                    ? 'bg-blue-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>1. Interactive Circuit & Physics Lab</span>
              </button>

              <button
                onClick={() => setActiveTab('parameters')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'parameters'
                    ? 'bg-blue-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>2. Parameter Database (136)</span>
              </button>

              <button
                onClick={() => setActiveTab('equations')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'equations'
                    ? 'bg-blue-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>3. Equations & Mechanisms (Ch. 2 & 4)</span>
              </button>

              <button
                onClick={() => setActiveTab('cross_section')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'cross_section'
                    ? 'bg-blue-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>4. SiGe HBT Cross-Sections & Localization</span>
              </button>

              <button
                onClick={() => setActiveTab('veriloga')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'veriloga'
                    ? 'bg-blue-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>5. Verilog-A Implementation (`hic2_full`)</span>
              </button>
            </nav>

            {/* Live Bias Sliders & Key Figure-of-Merit Readouts */}
            <div className="flex items-center flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <span className="font-mono font-semibold text-blue-800">V_BE:</span>
                <input
                  type="range"
                  min={0.5}
                  max={1.0}
                  step={0.005}
                  value={bias.Vbe}
                  onChange={(e) => setBias((b) => ({ ...b, Vbe: parseFloat(e.target.value) }))}
                  className="w-20 accent-blue-800 cursor-pointer"
                />
                <span className="font-mono w-12 text-right font-semibold">{bias.Vbe.toFixed(3)}V</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <span className="font-mono font-semibold text-teal-800">V_CE:</span>
                <input
                  type="range"
                  min={0.1}
                  max={3.5}
                  step={0.05}
                  value={bias.Vce}
                  onChange={(e) => setBias((b) => ({ ...b, Vce: parseFloat(e.target.value) }))}
                  className="w-20 accent-teal-700 cursor-pointer"
                />
                <span className="font-mono w-11 text-right font-semibold">{bias.Vce.toFixed(2)}V</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <Thermometer className="w-3.5 h-3.5 text-amber-700" />
                <span className="font-mono font-semibold text-amber-900">T_amb:</span>
                <input
                  type="range"
                  min={230}
                  max={430}
                  step={5}
                  value={bias.Tamb}
                  onChange={(e) => setBias((b) => ({ ...b, Tamb: parseFloat(e.target.value) }))}
                  className="w-16 accent-amber-700 cursor-pointer"
                />
                <span className="font-mono w-11 text-right font-semibold">{bias.Tamb.toFixed(0)}K</span>
              </div>

              {/* Instant Readout Pills */}
              <div className="hidden 2xl:flex items-center gap-2 font-mono text-[11px]">
                <span className="px-2 py-1 rounded bg-blue-50 text-blue-900 border border-blue-200">
                  I_C={(opResult.Ic * 1e3).toFixed(2)}mA
                </span>
                <span className="px-2 py-1 rounded bg-teal-50 text-teal-900 border border-teal-200">
                  β_DC={opResult.Betadc.toFixed(1)}
                </span>
                <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-900 border border-indigo-200">
                  f_T={(opResult.Ft / 1e9).toFixed(1)}GHz
                </span>
                <span className="px-2 py-1 rounded bg-rose-50 text-rose-900 border border-rose-200">
                  ΔT_j={opResult.Dtsh.toFixed(1)}K
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-4">
        {activeTab === 'lab' && (
          <div className="space-y-5">
            {/* Top 12-Column Interactive Workspace: Left 7 Cols (Schematic + Plot) | Right 5 Cols (Inspector & Sliders) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Left 7 Columns: Interactive Equivalent Circuit + Synchronized Plot */}
              <div className="xl:col-span-7 space-y-5">
                <EquivalentCircuitDiagram
                  nodes={CIRCUIT_NODES}
                  elements={CIRCUIT_ELEMENTS}
                  selectedElementId={selectedElementId}
                  selectedNodeId={selectedNodeId}
                  highlightedElementIds={selectedParam ? selectedParam.circuitElements : []}
                  opResult={opResult}
                  onSelectElement={(id) => handleSelectElement(id, false)}
                  onSelectNode={handleSelectNode}
                />

                <InteractivePlotPanel
                  activeCategory={activePlotCategory}
                  onSelectCategory={setActivePlotCategory}
                  params={activeParams}
                  baselineParams={baselineParams}
                  bias={bias}
                  opResult={opResult}
                  selectedParamName={selectedParam ? `${selectedParam.name} (${selectedParam.description})` : null}
                  onSelectEquation={(eqId) => handleSelectEquation(eqId, true)}
                />
              </div>

              {/* Right 5 Columns: Synchronized Parameter, Element & Equation Inspector */}
              <div className="xl:col-span-5 xl:sticky xl:top-28">
                <ParameterInspectorPanel
                  selectedElement={selectedElement}
                  selectedNode={selectedNode}
                  selectedParam={selectedParam}
                  elementParams={elementParams}
                  linkedEquations={linkedEquations}
                  activeParamValues={activeParams}
                  refParamValues={baselineParams}
                  onSelectParam={(paramId) => handleSelectParam(paramId, false)}
                  onUpdateParamValue={handleUpdateParamValue}
                  onResetParam={handleResetParam}
                  onSelectEquation={(eqId) => handleSelectEquation(eqId, true)}
                />
              </div>
            </div>

            {/* Full 31-Variable Chapter 4 Operating Point Table Below */}
            <OperatingPointDashboard
              specs={OPERATING_POINT_SPECS}
              opValues={opResult.opMap}
              refOpValues={refOpResult.opMap}
            />
          </div>
        )}

        {activeTab === 'parameters' && (
          <ParameterDatabaseView
            parameters={HICUM_PARAMETERS}
            sections={PARAMETER_SECTIONS.map((s) => ({
              id: s.id,
              title: s.title,
              description: s.summary,
            }))}
            activeParamValues={activeParams}
            selectedParamId={selectedParamId}
            onSelectParam={(paramId, switchToLab) => handleSelectParam(paramId, Boolean(switchToLab))}
            onUpdateParamValue={handleUpdateParamValue}
          />
        )}

        {activeTab === 'equations' && (
          <EquationsReferenceView
            equations={HICUM_EQUATIONS}
            mechanisms={PHYSICAL_MECHANISMS}
            parameters={HICUM_PARAMETERS}
            selectedEquationId={selectedEquationId}
            onSelectEquation={(eqId) => setSelectedEquationId(eqId)}
            onSelectParamInLab={(paramId) => handleSelectParam(paramId, true)}
            onSelectElementInLab={(elId) => handleSelectElement(elId, true)}
          />
        )}

        {activeTab === 'cross_section' && (
          <CrossSectionDiagrams
            parameters={HICUM_PARAMETERS}
            elements={CIRCUIT_ELEMENTS}
            onSelectParamInLab={(paramId) => handleSelectParam(paramId, true)}
            onSelectElementInLab={(elId) => handleSelectElement(elId, true)}
          />
        )}

        {activeTab === 'veriloga' && (
          <VerilogAExplorerView
            onSelectParamInLab={(paramId) => handleSelectParam(paramId, true)}
            onSelectElementInLab={(elId) => handleSelectElement(elId, true)}
          />
        )}
      </main>

      {/* Scientific Footer */}
      <footer className="bg-white border-t border-slate-200 mt-8 py-4 px-4 text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-700">HICUM/L2 Interactive Explorer</span> — Built from official HICUM/L2 v2.4.0 documentation (M. Schröter & A. Pawlak, 2017) and CMC standard Verilog-A release <code>hicumL2V2p34.va</code>.
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            136 Parameters (Tables 3.1–3.17) · 47 Documented Equations · 31 Operating Point Outputs (Ch. 4)
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
