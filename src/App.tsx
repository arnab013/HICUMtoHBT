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
import { HicumLogo } from './components/HicumLogo';
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
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
  ExternalLink,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

type MainTabId = 'cross_section' | 'lab' | 'parameters' | 'equations' | 'veriloga';

interface NavItem {
  id: MainTabId;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  group: 'Device' | 'Model' | 'Reference';
  source: string;
  sourcePage?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'cross_section',
    label: '3D Device Workspace',
    sub: 'SiGe HBT ↔ HICUM mapping',
    icon: Box,
    count: SENTAURUS_3D_REGIONS.length,
    group: 'Device',
    source: 'sentaurus_sige_hbt.cmd (205 lines) · Manual Fig. 2.1.0/1, p. 8',
    sourcePage: 8,
  },
  {
    id: 'lab',
    label: 'Circuit & Simulation Lab',
    sub: 'Equivalent circuit · live plots',
    icon: Cpu,
    count: CIRCUIT_ELEMENTS.length,
    group: 'Model',
    source: 'Manual Ch. 2.1, Fig. 2.1.0/1, p. 8 · Ch. 4, pp. 113–115',
    sourcePage: 8,
  },
  {
    id: 'parameters',
    label: 'Parameter Database',
    sub: 'Tables 3.1 – 3.17',
    icon: Database,
    count: HICUM_PARAMETERS.length,
    group: 'Model',
    source: 'Manual Ch. 3, Tables 3.1–3.17, pp. 101–111',
    sourcePage: 101,
  },
  {
    id: 'equations',
    label: 'Equations & Physics',
    sub: 'Ch. 2 derivations · mechanisms',
    icon: BookOpen,
    count: HICUM_EQUATIONS.length,
    group: 'Reference',
    source: 'Manual Ch. 2, pp. 7–99 · Ch. 4, pp. 113–115',
    sourcePage: 7,
  },
  {
    id: 'veriloga',
    label: 'Verilog-A Reference',
    sub: 'hicumL2V2p34.va source',
    icon: Code2,
    group: 'Reference',
    source: 'hicumL2V2p34.va (2,066 lines, CMC release)',
  },
];

const NAV_GROUPS: NavItem['group'][] = ['Device', 'Model', 'Reference'];

const AppInner: React.FC = () => {
  const { success, info } = useToast();
  const [activeTab, setActiveTab] = useState<MainTabId>('cross_section');
  const [activePresetId, setActivePresetId] = useState<string>('manual_test');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Elite Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('hicum-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
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

  const telemetry = [
    { label: 'I_C', value: `${(opResult.Ic * 1e3).toFixed(3)} mA` },
    { label: 'I_B', value: `${(opResult.Ib * 1e6).toFixed(2)} µA` },
    { label: 'β_DC', value: opResult.Betadc.toFixed(1) },
    { label: 'f_T', value: `${(opResult.Ft / 1e9).toFixed(1)} GHz` },
    { label: 'f_max', value: `${(opResult.Fmax / 1e9).toFixed(1)} GHz` },
    { label: 'I_CK', value: `${(opResult.Ick * 1e3).toFixed(2)} mA` },
    { label: 'ΔT_j', value: `${opResult.Dtsh.toFixed(2)} K` },
  ];

  /* ---------------------------------------------------------------- Sidebar */
  const renderSidebarContent = (collapsed: boolean, isMobile: boolean) => (
    <div className="h-full flex flex-col bg-[#0B0F19] text-slate-300 border-r border-[#1E293B]">
      {/* Brand */}
      <div className={`px-4 pt-5 pb-4 flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between'}`}>
        <HicumLogo collapsed={collapsed} onDark />
        {isMobile && (
          <button
            onClick={() => setMobileNavOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white btn-elite"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="mx-4 mb-4 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400 leading-relaxed flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Manual v2.4.0 · Verilog-A · TCAD</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5 pb-4" aria-label="Main navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group}>
            {!collapsed && (
              <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group}
              </div>
            )}
            {collapsed && <div className="mx-2 mb-2 h-px bg-slate-800" />}
            <div className="space-y-1">
              {NAV_ITEMS.filter((n) => n.group === group).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    title={collapsed ? `${item.label} — ${item.sub}` : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={`btn-elite group relative w-full flex items-center gap-3 rounded-lg text-left ${
                      collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-medium'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors ${
                        isActive ? 'bg-blue-700 text-white' : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    {!collapsed && (
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">{item.label}</span>
                          {item.count !== undefined && (
                            <span
                              className={`text-xs font-mono px-1.5 py-0.5 rounded-md ${
                                isActive ? 'bg-blue-700/80 text-blue-100' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {item.count}
                            </span>
                          )}
                        </span>
                        <span
                          className={`block text-xs truncate mt-0.5 ${
                            isActive ? 'text-blue-100/80' : 'text-slate-400'
                          }`}
                        >
                          {item.sub}
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Live telemetry */}
        {!collapsed && (
          <div className="pt-2">
            <div className="px-2.5 mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Operating Point</span>
              <span className="normal-case tracking-normal font-mono text-slate-400">Ch. 4</span>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 divide-y divide-slate-800/70 overflow-hidden">
              {telemetry.map((t) => (
                <div key={t.label} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <span className="font-mono text-slate-400 font-medium">{t.label}</span>
                  <span className="font-mono font-semibold text-slate-200 tabular-nums">{t.value}</span>
                </div>
              ))}
            </div>
            <div className="px-2 mt-2 text-[11px] text-slate-400 leading-relaxed">
              V<sub>BE</sub> {bias.Vbe.toFixed(3)} V · V<sub>CE</sub> {bias.Vce.toFixed(2)} V ·{' '}
              {bias.Tamb.toFixed(0)} K
            </div>
          </div>
        )}
      </nav>

      {/* Sources */}
      <div className={`border-t border-slate-800/80 ${collapsed ? 'px-2 py-3' : 'px-3 py-3'} space-y-1`}>
        {!collapsed && (
          <div className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Primary Sources
          </div>
        )}
        {[
          { href: MANUAL_PDF_URL, label: 'HICUM/L2 v2.4.0 Manual (PDF)', icon: FileText },
          { href: VA_SOURCE_URL, label: 'hicumL2V2p34.va', icon: Code2 },
          { href: SENTAURUS_SOURCE_URL, label: 'Sentaurus SDE structure', icon: Box },
        ].map((s) => (
          <a
            key={s.href}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            title={s.label}
            className={`btn-elite flex items-center gap-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white ${
              collapsed ? 'justify-center py-2' : 'px-2.5 py-1.5'
            }`}
          >
            <s.icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            {!collapsed && (
              <>
                <span className="truncate flex-1">{s.label}</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </>
            )}
          </a>
        ))}
        {!isMobile && (
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className={`btn-elite mt-1.5 w-full flex items-center gap-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white ${
              collapsed ? 'justify-center py-2' : 'px-2.5 py-1.5'
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        )}
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ Views */
  const renderActiveView = () => {
    switch (activeTab) {
      case 'lab':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-7 space-y-6">
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
                  selectedParamName={
                    selectedParam ? `${selectedParam.name} (${selectedParam.description})` : null
                  }
                  onSelectEquation={(eqId) => handleSelectEquation(eqId, true)}
                />
              </div>
              <div className="xl:col-span-5 xl:sticky xl:top-6">
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
            <OperatingPointDashboard
              specs={OPERATING_POINT_SPECS}
              opValues={opResult.opMap}
              refOpValues={refOpResult.opMap}
            />
          </div>
        );
      case 'parameters':
        return (
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
        );
      case 'equations':
        return (
          <EquationsReferenceView
            equations={HICUM_EQUATIONS}
            mechanisms={PHYSICAL_MECHANISMS}
            parameters={HICUM_PARAMETERS}
            selectedEquationId={selectedEquationId}
            onSelectEquation={(eqId) => setSelectedEquationId(eqId)}
            onSelectParamInLab={(paramId) => handleSelectParam(paramId, true)}
            onSelectElementInLab={(elId) => handleSelectElement(elId, true)}
          />
        );
      case 'veriloga':
        return (
          <VerilogAExplorerView
            onSelectParamInLab={(paramId) => handleSelectParam(paramId, true)}
            onSelectElementInLab={(elId) => handleSelectElement(elId, true)}
          />
        );
      case 'cross_section':
      default:
        return (
          <div className="space-y-6">
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
            />
            <CrossSectionDiagrams
              parameters={HICUM_PARAMETERS}
              elements={CIRCUIT_ELEMENTS}
              onSelectParamInLab={(paramId) => handleSelectParam(paramId, true)}
              onSelectElementInLab={(elId) => handleSelectElement(elId, true)}
            />
          </div>
        );
    }
  };

  const hasResults =
    quickSearchResults.params.length + quickSearchResults.elements.length + quickSearchResults.equations.length > 0;

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-[#090D16] text-slate-800 dark:text-slate-200 overflow-hidden font-sans">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[264px]'
        }`}
      >
        {renderSidebarContent(sidebarCollapsed, false)}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-[280px] max-w-[85vw] h-full animate-drawer-in">
            {renderSidebarContent(false, true)}
          </aside>
        </div>
      )}

      {/* Workspace column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 z-30 transition-colors">
          <div className="px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 btn-elite"
                aria-label="Open navigation"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div key={activeTab} className="min-w-0 animate-view-enter">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight truncate">
                  {activeNav.label}
                </h1>
                <a
                  href={activeNav.sourcePage ? manualPageUrl(activeNav.sourcePage) : VA_SOURCE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-full transition-colors"
                  title="Open the authoritative source for this view"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Source: {activeNav.source}</span>
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Global search */}
              <div className="relative">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-lg px-3 py-1.5 text-xs focus-within:ring-2 focus-within:ring-blue-500/25 focus-within:border-blue-500 transition-all">
                  <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
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
                    className="bg-transparent outline-none w-44 sm:w-64 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    aria-label="Global search"
                  />
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                    ⌘K
                  </kbd>
                </div>

                {quickSearchOpen && quickSearch.trim().length > 0 && (
                  <div className="absolute right-0 mt-2 w-[22rem] sm:w-[26rem] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card p-3 z-50 space-y-3 text-xs animate-card-enter">
                    {quickSearchResults.params.length > 0 && (
                      <div>
                        <div className="px-1.5 text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
                          Parameters
                        </div>
                        {quickSearchResults.params.map((p) => (
                          <button
                            key={p.id}
                            onMouseDown={() => {
                              handleSelectParam(p.id, true);
                              setQuickSearch('');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-2 btn-elite"
                          >
                            <span className="min-w-0">
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{p.id}</span>
                              <span className="text-slate-600 dark:text-slate-300 text-xs ml-2 truncate">{p.description}</span>
                            </span>
                            <span className="shrink-0 text-[10.5px] font-mono text-slate-400">
                              p. {p.manualPages[0]} · VA l. {p.vaLine}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {quickSearchResults.elements.length > 0 && (
                      <div>
                        <div className="px-1.5 text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
                          Circuit branches
                        </div>
                        {quickSearchResults.elements.map((el) => (
                          <button
                            key={el.id}
                            onMouseDown={() => {
                              handleSelectElement(el.id, true);
                              setQuickSearch('');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-2 btn-elite"
                          >
                            <span className="min-w-0">
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{el.id}</span>
                              <span className="text-slate-600 dark:text-slate-300 text-xs ml-2 truncate">{el.name}</span>
                            </span>
                            <span className="shrink-0 text-[10.5px] font-mono text-slate-400">
                              VA ll. {el.vaLines}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {quickSearchResults.equations.length > 0 && (
                      <div>
                        <div className="px-1.5 text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
                          Documented equations
                        </div>
                        {quickSearchResults.equations.map((eq) => (
                          <button
                            key={eq.id}
                            onMouseDown={() => {
                              handleSelectEquation(eq.id, true);
                              setQuickSearch('');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-2 btn-elite"
                          >
                            <span className="min-w-0">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">({eq.eqNumber})</span>
                              <span className="text-slate-600 dark:text-slate-300 text-xs ml-2 truncate">{eq.title}</span>
                            </span>
                            <span className="shrink-0 text-[10.5px] font-mono text-slate-400">
                              {eq.manualLines || `p. ${eq.manualPage}`}
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

              {/* Model card selector */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-lg px-3 py-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <select
                  value={activePresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                  aria-label="Model card preset"
                >
                  {MODEL_CARD_PRESETS.map((preset: ModelCardPreset) => (
                    <option key={preset.id} value={preset.id} className="dark:bg-slate-900">
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset button */}
              {modifiedParamCount > 0 ? (
                <button
                  onClick={handleResetAllParams}
                  className="btn-elite inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60 hover:bg-rose-100"
                  title="Reset all adjusted parameters to the selected model card"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ({modifiedParamCount})</span>
                </button>
              ) : (
                <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Reference card</span>
                </span>
              )}

              {/* Dark / Light Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="btn-elite p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {/* Bias control strip */}
          <div className="px-4 lg:px-6 py-2.5 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
              Bias
            </span>
            {[
              {
                key: 'Vbe' as const,
                label: 'V_BE',
                min: 0.5,
                max: 1.0,
                step: 0.005,
                fmt: (v: number) => `${v.toFixed(3)} V`,
                color: 'text-blue-600 dark:text-blue-400',
              },
              {
                key: 'Vce' as const,
                label: 'V_CE',
                min: 0.1,
                max: 3.5,
                step: 0.05,
                fmt: (v: number) => `${v.toFixed(2)} V`,
                color: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                key: 'Tamb' as const,
                label: 'T_amb',
                min: 230,
                max: 430,
                step: 5,
                fmt: (v: number) => `${v.toFixed(0)} K`,
                color: 'text-amber-600 dark:text-amber-400',
              },
            ].map((b) => (
              <label
                key={b.key}
                className="flex items-center gap-2.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-2xs"
              >
                {b.key === 'Tamb' && <Thermometer className="w-3.5 h-3.5 text-amber-500" />}
                <span className={`font-mono font-semibold ${b.color}`}>{b.label}</span>
                <input
                  type="range"
                  min={b.min}
                  max={b.max}
                  step={b.step}
                  value={bias[b.key]}
                  onChange={(e) => setBias((prev) => ({ ...prev, [b.key]: parseFloat(e.target.value) }))}
                  className="w-20 sm:w-28 cursor-pointer accent-blue-600"
                />
                <span className="font-mono w-14 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {b.fmt(bias[b.key])}
                </span>
              </label>
            ))}
            <span className="ml-auto hidden md:inline text-xs text-slate-400">
              Illustrative evaluation of documented equations.
            </span>
          </div>
        </header>

        {/* Main scroll area */}
        <main className="flex-1 overflow-y-auto">
          <div key={activeTab} className="max-w-[1640px] mx-auto px-4 lg:px-6 py-6 animate-view-enter">
            {renderActiveView()}
          </div>

          <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-4 px-4 lg:px-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="max-w-[1640px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">HICUM Explorer</span> — built from the HICUM/L2
                v2.4.0 manual (M. Schröter &amp; A. Pawlak), <code>hicumL2V2p34.va</code>, and Sentaurus TCAD.
              </div>
              <div className="font-mono text-xs text-slate-400">
                {HICUM_PARAMETERS.length} parameters · {HICUM_EQUATIONS.length} equations ·{' '}
                {OPERATING_POINT_SPECS.length} OP outputs
              </div>
            </div>
          </footer>
        </main>
      </div>
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
