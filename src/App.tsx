import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  HICUM_PARAMETERS,
  PARAMETER_SECTIONS,
  PARAMETER_MAP,
} from './data/hicumParameters';
import {
  CIRCUIT_ELEMENTS,
  CIRCUIT_NODES,
  OPERATING_POINT_SPECS,
  PHYSICAL_MECHANISMS,
} from './data/hicumCircuit';
import { HICUM_EQUATIONS } from './data/hicumEquations';
import { SENTAURUS_3D_REGIONS } from './data/sentaurus3DModel';
import {
  MODEL_CARD_PRESETS,
  evaluateOperatingPoint,
  ModelCardPreset,
} from './engine/hicumSolver';
import { BiasState, PlotCategoryId } from './data/hicumTypes';

import { EquivalentCircuitDiagram } from './components/EquivalentCircuitDiagram';
import { InteractivePlotPanel } from './components/InteractivePlotPanel';
import { ParameterInspectorPanel } from './components/ParameterInspectorPanel';
import { OperatingPointDashboard } from './components/OperatingPointDashboard';
import { ParameterDatabaseView } from './components/ParameterDatabaseView';
import { EquationsReferenceView } from './components/EquationsReferenceView';
import { CrossSectionDiagrams } from './components/CrossSectionDiagrams';
import { Interactive3DTransistorView } from './components/Interactive3DTransistorView';
import { VerilogAExplorerView } from './components/VerilogAExplorerView';
import { ToastProvider, useToast } from './components/Toast';
import {
  MANUAL_PDF_URL,
  VA_SOURCE_URL,
  SENTAURUS_SOURCE_URL,
  manualPageUrl,
} from './components/CitationBadges';
import {
  Cpu,
  Database,
  BookOpen,
  Box,
  Code2,
  RotateCcw,
  Sliders,
  Search,
  CheckCircle2,
  Thermometer,
  FileText,
  ChevronsRight,
  Menu,
  X,
  ExternalLink,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Activity,
  TrendingUp,
  Flame,
  Layers,
} from 'lucide-react';

export type MainTabId =
  | 'dashboard'
  | 'cross_section'
  | 'circuit'
  | 'operating_point'
  | 'lab'
  | 'parameters'
  | 'equations'
  | 'veriloga';

interface NavItem {
  id: MainTabId;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  source: string;
  sourcePage?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    sub: '3D Transistor & Activity',
    icon: Box,
    source: 'sentaurus_sige_hbt.cmd · Manual Fig. 2.1.0/1, p. 8',
    sourcePage: 8,
  },
  {
    id: 'cross_section',
    label: '2D Cross-Section',
    sub: 'Physical Mapping & Callouts',
    icon: Layers,
    source: 'Manual Fig. 2.1.0/1, p. 8 · Sentaurus TCAD Cross Section',
    sourcePage: 8,
  },
  {
    id: 'circuit',
    label: 'Equivalent Circuit',
    sub: 'Complete HICUM/L2 Schematic',
    icon: Cpu,
    source: 'Manual Ch. 2.1, Fig. 2.1.0/1, p. 8 · 17 Nodes, 23 Branches',
    sourcePage: 8,
  },
  {
    id: 'operating_point',
    label: 'Operating Point',
    sub: 'DC / AC / RF Biases & FOMs',
    icon: Sliders,
    source: 'Manual Ch. 4, Operating Point Calculation, pp. 113–115',
    sourcePage: 113,
  },
  {
    id: 'lab',
    label: 'Simulation Lab',
    sub: 'Live Gummel & f_T Curves',
    icon: Activity,
    source: 'Manual Ch. 2 & Ch. 4 · Live Parameter Solvers',
    sourcePage: 8,
  },
  {
    id: 'parameters',
    label: 'Parameter Database',
    sub: 'All 163 HICUM Parameters',
    icon: Database,
    source: 'Manual Ch. 3, Tables 3.1–3.17, pp. 101–111',
    sourcePage: 101,
  },
  {
    id: 'equations',
    label: 'Equations Reference',
    sub: 'Ch. 2 Physics & Verifications',
    icon: BookOpen,
    source: 'Manual Ch. 2, pp. 7–99 · GICCR & Transit Time',
    sourcePage: 7,
  },
  {
    id: 'veriloga',
    label: 'Verilog-A Code',
    sub: 'hicumL2V2p34.va Source',
    icon: Code2,
    source: 'hicumL2V2p34.va (2,066 lines, CMC release)',
  },
];

const AppInner: React.FC = () => {
  const { success, info } = useToast();
  const [activeTab, setActiveTab] = useState<MainTabId>('dashboard');
  const [activePresetId, setActivePresetId] = useState<string>('manual_test');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Theme Management (Light by default as required by user)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('hicum-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('hicum-theme', theme);
    } catch {}
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    info(
      nextTheme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled',
      'Display preferences updated'
    );
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setQuickSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setQuickSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const baselineParams = useMemo(() => {
    const preset = MODEL_CARD_PRESETS.find((p: ModelCardPreset) => p.id === activePresetId) || MODEL_CARD_PRESETS[0];
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

  // Synchronized selection state
  const [selectedElementId, setSelectedElementId] = useState<string | null>('it');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedParamId, setSelectedParamId] = useState<string | null>('c10');
  const [selectedEquationId, setSelectedEquationId] = useState<string | null>('eq-2.2.0-1');
  const [activePlotCategory, setActivePlotCategory] = useState<PlotCategoryId>('transfer_gummel');

  // Global quick search
  const [quickSearch, setQuickSearch] = useState<string>('');
  const [quickSearchOpen, setQuickSearchOpen] = useState<boolean>(false);

  const navigateTo = (tab: MainTabId) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };

  const handleSelectPreset = (presetId: string) => {
    const found = MODEL_CARD_PRESETS.find((p: ModelCardPreset) => p.id === presetId);
    if (!found) return;
    setActivePresetId(presetId);
    setActiveParams({ ...found.params });
    success('Model card loaded', found.name);
  };

  const handleUpdateParamValue = (paramId: string, newValue: number) => {
    setActiveParams((prev) => ({ ...prev, [paramId]: newValue }));
  };

  const handleResetParam = (paramId: string) => {
    if (baselineParams[paramId] !== undefined) {
      setActiveParams((prev) => ({ ...prev, [paramId]: baselineParams[paramId] }));
      info('Parameter reset to card baseline', paramId);
    }
  };

  const handleResetAllParams = () => {
    setActiveParams({ ...baselineParams });
    success('All parameters reset', `Restored ${modifiedParamCount} parameters to baseline`);
  };

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

  const opResult = useMemo(() => evaluateOperatingPoint(activeParams, bias), [activeParams, bias]);
  const refOpResult = useMemo(
    () => evaluateOperatingPoint(baselineParams, bias),
    [baselineParams, bias]
  );

  const handleSelectElement = (elementId: string, switchToLab = false) => {
    const el = CIRCUIT_ELEMENTS.find((e) => e.id === elementId);
    setSelectedElementId(elementId);
    setSelectedNodeId(null);
    if (el) {
      setActivePlotCategory(el.plotCategory);
      if (el.parameters.length > 0) setSelectedParamId(el.parameters[0]);
      if (el.governingEquations.length > 0) setSelectedEquationId(el.governingEquations[0]);
    }
    if (switchToLab) navigateTo('lab');
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
      if (param.equations.length > 0) setSelectedEquationId(param.equations[0]);
    }
    if (switchToLab) navigateTo('lab');
  };

  const handleSelectEquation = (eqId: string, switchToEquationsTab = true) => {
    setSelectedEquationId(eqId);
    if (switchToEquationsTab) navigateTo('equations');
  };

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
    if (selectedParam) return HICUM_PARAMETERS.filter((p) => p.section === selectedParam.section);
    return [];
  }, [selectedElement, selectedParam]);

  const linkedEquations = useMemo(() => {
    const eqIds = new Set<string>();
    selectedElement?.governingEquations.forEach((id) => eqIds.add(id));
    selectedParam?.equations.forEach((id) => eqIds.add(id));
    return HICUM_EQUATIONS.filter((eq) => eqIds.has(eq.id));
  }, [selectedElement, selectedParam]);

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

  const activeNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  /* ---------------------------------------------------------------- Sidebar Component */
  const renderSidebar = () => (
    <aside className="w-full lg:w-64 bg-white rounded-3xl shadow-sm border border-slate-200/60 p-5 flex flex-col justify-between shrink-0">
      <div>
        {/* Brand / Logo (matching reference image) */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[#0D7C66] font-mono font-black text-xl tracking-tighter">//</span>
            <span className="text-[#0D7C66] font-bold text-lg tracking-tight">HICUM Explorer</span>
          </div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device Profile Card Widget (Avatar with dashed teal ring) */}
        <div className="text-center py-2 mb-4">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#0D7C66] p-1 flex items-center justify-center mx-auto shadow-2xs">
            <div className="w-full h-full rounded-full bg-teal-50 flex items-center justify-center text-[#0D7C66]">
              <Box className="w-8 h-8" />
            </div>
          </div>
          <div className="font-bold text-slate-800 text-xs tracking-wider uppercase mt-2.5">
            SiGe HBT (NPN)
          </div>
          <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/80 text-slate-600 text-[10px] font-semibold rounded-full px-2.5 py-0.5 mt-1 shadow-2xs">
            <span className="text-amber-500">★</span>
            <span>HICUM/L2 v2.4.0</span>
          </div>
        </div>

        {/* Navigation Menu ("Tabs on the left", matching reference layout) */}
        <nav className="space-y-1.5" aria-label="Dashboard navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-left text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-teal-50/80 text-slate-900 font-bold border border-teal-100 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0D7C66]' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-6 h-6 rounded-full bg-[#0D7C66] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sidebar Action Button */}
      <div className="pt-6 border-t border-slate-100 mt-6 space-y-3">
        <button
          onClick={() => {
            navigateTo('dashboard');
            handleResetAllParams();
          }}
          className="w-full bg-[#0D7C66] hover:bg-[#0A5C4C] text-white rounded-full py-2.5 px-4 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all duration-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Dashboard</span>
        </button>

        <div className="text-[10px] text-slate-400 text-center leading-relaxed">
          Sentaurus TCAD · HICUM/L2 v2.4.0
        </div>
      </div>
    </aside>
  );

  /* ---------------------------------------------------------------- Views */
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Interactive3DTransistorView
            parameters={HICUM_PARAMETERS}
            elements={CIRCUIT_ELEMENTS}
            nodes={CIRCUIT_NODES}
            bias={bias}
            opResult={opResult}
            selectedParamId={selectedParamId}
            selectedElementId={selectedElementId}
            onSelectParamInLab={(paramId) => handleSelectParam(paramId, false)}
            onSelectElementInLab={(elId) => handleSelectElement(elId, false)}
            onUpdateBias={(b) => setBias((prev) => ({ ...prev, ...b }))}
          />
        );
      case 'cross_section':
        return (
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm">
            <CrossSectionDiagrams
              parameters={HICUM_PARAMETERS}
              elements={CIRCUIT_ELEMENTS}
              onSelectParamInLab={(paramId) => handleSelectParam(paramId, true)}
              onSelectElementInLab={(elId) => handleSelectElement(elId, true)}
            />
          </div>
        );
      case 'circuit':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-7 bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm">
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
            </div>
            <div className="xl:col-span-5 bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm xl:sticky xl:top-6">
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
        );
      case 'operating_point':
        return (
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm">
            <OperatingPointDashboard
              specs={OPERATING_POINT_SPECS}
              opValues={opResult.opMap}
              refOpValues={refOpResult.opMap}
            />
          </div>
        );
      case 'lab':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-7 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm">
                  <InteractivePlotPanel
                    activeCategory={activePlotCategory}
                    onSelectCategory={setActivePlotCategory}
                    params={activeParams}
                    baselineParams={baselineParams}
                    bias={bias}
                    opResult={opResult}
                    selectedParamName={
                      selectedParam ? `${selectedParam.name} (${selectedParam.description})` : null
                    }
                    onSelectEquation={(eqId) => handleSelectEquation(eqId, true)}
                  />
                </div>
              </div>
              <div className="xl:col-span-5 xl:sticky xl:top-6 bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm">
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
          </div>
        );
      case 'parameters':
        return (
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm">
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
          </div>
        );
      case 'equations':
        return (
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm">
            <EquationsReferenceView
              equations={HICUM_EQUATIONS}
              mechanisms={PHYSICAL_MECHANISMS}
              parameters={HICUM_PARAMETERS}
              selectedEquationId={selectedEquationId}
              onSelectEquation={(eqId) => setSelectedEquationId(eqId)}
              onSelectParamInLab={(paramId) => handleSelectParam(paramId, true)}
              onSelectElementInLab={(elId) => handleSelectElement(elId, true)}
            />
          </div>
        );
      case 'veriloga':
        return (
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm">
            <VerilogAExplorerView
              onSelectParamInLab={(paramId) => handleSelectParam(paramId, true)}
              onSelectElementInLab={(elId) => handleSelectElement(elId, true)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const hasResults =
    quickSearchResults.params.length + quickSearchResults.elements.length + quickSearchResults.equations.length > 0;

  return (
    <div className="min-h-screen bg-[#EDF2F2] text-slate-800 p-4 lg:p-6 flex flex-col lg:flex-row gap-5 font-sans antialiased">
      {/* Desktop Sidebar (Freestanding white card with tabs on the left) */}
      <div className="hidden lg:block shrink-0">
        {renderSidebar()}
      </div>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full p-4">
            {renderSidebar()}
          </div>
        </div>
      )}

      {/* Main Workspace Column */}
      <main className="flex-1 min-w-0 flex flex-col gap-5 overflow-y-auto pr-1">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-700"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#0D7C66] tracking-tight">
                {activeNav.label}
              </h1>
              <p className="text-slate-400 text-xs font-normal mt-0.5">
                {activeNav.sub} · Authoritative HICUM/L2 v2.4.0 &amp; Sentaurus TCAD
              </p>
            </div>
          </div>

          {/* Right Controls: Pill Search & Model Preset */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Pill (matching reference image) */}
            <div className="relative">
              <div className="flex items-center bg-[#0D7C66] text-white rounded-full px-4 py-2 text-xs shadow-inner focus-within:ring-2 focus-within:ring-teal-300 transition-all">
                <Search className="w-3.5 h-3.5 text-teal-200 mr-2 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={quickSearch}
                  onFocus={() => setQuickSearchOpen(true)}
                  onBlur={() => setTimeout(() => setQuickSearchOpen(false), 180)}
                  onChange={(e) => {
                    setQuickSearch(e.target.value);
                    setQuickSearchOpen(true);
                  }}
                  placeholder="Search parameter, equation… (⌘K)"
                  className="bg-transparent outline-none w-44 sm:w-56 text-white placeholder:text-teal-200/70"
                />
              </div>

              {quickSearchOpen && quickSearch.trim().length > 0 && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 space-y-3 text-xs">
                  {quickSearchResults.params.length > 0 && (
                    <div>
                      <div className="px-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
                        Parameters
                      </div>
                      {quickSearchResults.params.map((p) => (
                        <button
                          key={p.id}
                          onMouseDown={() => {
                            handleSelectParam(p.id, true);
                            setQuickSearch('');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2"
                        >
                          <span className="min-w-0">
                            <span className="font-mono font-bold text-[#0D7C66]">{p.id}</span>
                            <span className="text-slate-600 text-xs ml-2 truncate">{p.description}</span>
                          </span>
                          <span className="shrink-0 text-[10px] font-mono text-slate-400">
                            p. {p.manualPages[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {quickSearchResults.elements.length > 0 && (
                    <div>
                      <div className="px-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
                        Circuit branches
                      </div>
                      {quickSearchResults.elements.map((el) => (
                        <button
                          key={el.id}
                          onMouseDown={() => {
                            handleSelectElement(el.id, true);
                            setQuickSearch('');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2"
                        >
                          <span className="min-w-0">
                            <span className="font-mono font-bold text-[#0D7C66]">{el.id}</span>
                            <span className="text-slate-600 text-xs ml-2 truncate">{el.name}</span>
                          </span>
                          <span className="shrink-0 text-[10px] font-mono text-slate-400">
                            VA ll. {el.vaLines}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!hasResults && (
                    <div className="text-slate-400 text-center py-4 text-xs">
                      No matching parameters, branches, or equations
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Model Card Preset Pill */}
            <div className="flex items-center gap-2 bg-white rounded-full border border-slate-200/80 px-3.5 py-1.5 shadow-2xs">
              <Sliders className="w-3.5 h-3.5 text-[#0D7C66] shrink-0" />
              <select
                value={activePresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                {MODEL_CARD_PRESETS.map((preset: ModelCardPreset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dark/Light toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Top KPI Stat Bar (Card with 4 circular teal badges, strictly matching Image 3) */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/60 p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Metric 1: I_C */}
          <div className="flex items-center gap-3.5 px-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0D7C66] to-[#0A5C4C] text-white flex items-center justify-center shadow-xs shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Collector (I_C)
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  {(opResult.Ic * 1e3).toFixed(2)} mA
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  ↑ <span className="text-[10px] ml-0.5">opt</span>
                </span>
              </div>
            </div>
          </div>

          {/* Metric 2: f_T */}
          <div className="flex items-center gap-3.5 px-2 pt-3 lg:pt-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0D7C66] to-[#0A5C4C] text-white flex items-center justify-center shadow-xs shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Cutoff (f_T)
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  {(opResult.Ft / 1e9).toFixed(1)} GHz
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  ↑ <span className="text-[10px] ml-0.5">peak</span>
                </span>
              </div>
            </div>
          </div>

          {/* Metric 3: beta_DC */}
          <div className="flex items-center gap-3.5 px-2 pt-3 lg:pt-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0D7C66] to-[#0A5C4C] text-white flex items-center justify-center shadow-xs shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Gain (β_DC)
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  {opResult.Betadc.toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  ↑ <span className="text-[10px] ml-0.5">185</span>
                </span>
              </div>
            </div>
          </div>

          {/* Metric 4: Self-Heating / P_diss */}
          <div className="flex items-center gap-3.5 px-2 pt-3 lg:pt-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0D7C66] to-[#0A5C4C] text-white flex items-center justify-center shadow-xs shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Self-Heating (P_diss)
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  {(opResult.Ic * bias.Vce * 1e3).toFixed(1)} mW
                </span>
                <span className="text-xs font-semibold text-amber-600 flex items-center">
                  +{opResult.Dtsh.toFixed(1)}°C
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab View Content Container */}
        <div className="flex-1">
          {renderActiveView()}
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto px-2">
            <span>
              <strong>HICUM Explorer</strong> · Compact Modeling Scientific Dashboard
            </span>
            <span>
              {HICUM_PARAMETERS.length} Parameters · {HICUM_EQUATIONS.length} Equations · {SENTAURUS_3D_REGIONS.length} TCAD Regions
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
};

export default App;
