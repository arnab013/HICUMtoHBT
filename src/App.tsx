import React, { useState, useMemo } from 'react';
import { BiasState, PlotCategoryId } from './data/hicumTypes';
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
import { SENTAURUS_3D_REGIONS } from './data/sentaurus3DModel';
import { MODEL_CARD_PRESETS, evaluateOperatingPoint } from './engine/hicumSolver';
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
} from 'lucide-react';

type MainTabId = 'cross_section' | 'lab' | 'parameters' | 'equations' | 'veriloga';

interface NavItem {
  id: MainTabId;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  group: 'Device' | 'Model' | 'Reference';
  /** Authoritative source summary shown in the header for this view. */
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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTabId>('cross_section');
  const [activePresetId, setActivePresetId] = useState<string>('manual_test');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

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
    const found = MODEL_CARD_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(presetId);
    setActiveParams({ ...found.params });
  };

  const handleUpdateParamValue = (paramId: string, newValue: number) => {
    setActiveParams((prev) => ({ ...prev, [paramId]: newValue }));
  };

  const handleResetParam = (paramId: string) => {
    if (baselineParams[paramId] !== undefined) {
      setActiveParams((prev) => ({ ...prev, [paramId]: baselineParams[paramId] }));
    }
  };

  const handleResetAllParams = () => setActiveParams({ ...baselineParams });

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
    <div className="h-full flex flex-col">
      {/* Brand */}
      <div className={`px-4 pt-5 pb-4 flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between'}`}>
        <HicumLogo collapsed={collapsed} onDark />
        {isMobile && (
          <button
            onClick={() => setMobileNavOpen(false)}
            className="p-1.5 rounded-md text-[#8E9AAB] hover:bg-[#273241] hover:text-white matte-btn-transition"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="mx-4 mb-3 px-2.5 py-1.5 rounded-md bg-[#232D3A] border border-[#2F3B4B] text-[10px] font-mono text-[#A9B4C2] leading-relaxed">
          Manual v2.4.0 · Verilog-A v2.34 · Sentaurus TCAD
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 space-y-4 pb-4" aria-label="Main navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group}>
            {!collapsed && (
              <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6E7B8D]">
                {group}
              </div>
            )}
            {collapsed && <div className="mx-3 mb-1.5 h-px bg-[#2F3B4B]" />}
            <div className="space-y-0.5">
              {NAV_ITEMS.filter((n) => n.group === group).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    title={collapsed ? `${item.label} — ${item.sub}` : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative w-full flex items-center gap-3 rounded-lg text-left transition-colors duration-200 ${
                      collapsed ? 'justify-center px-0 py-2.5' : 'px-2.5 py-2'
                    } ${
                      isActive
                        ? 'bg-[#2E4C66] text-white'
                        : 'text-[#C3CCD7] hover:bg-[#273241] hover:text-white'
                    }`}
                  >
                    <span
                      className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#C98A5E] transition-opacity duration-200 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-md shrink-0 transition-colors duration-200 ${
                        isActive ? 'bg-[#3A5D7B]' : 'bg-[#232D3A] group-hover:bg-[#2F3B4B]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    {!collapsed && (
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-semibold truncate">{item.label}</span>
                          {item.count !== undefined && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-px rounded ${
                                isActive ? 'bg-[#3A5D7B] text-[#E3ECF4]' : 'bg-[#232D3A] text-[#8E9AAB]'
                              }`}
                            >
                              {item.count}
                            </span>
                          )}
                        </span>
                        <span
                          className={`block text-[11px] truncate ${
                            isActive ? 'text-[#C4D5E4]' : 'text-[#7F8B9B]'
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
          <div>
            <div className="px-2.5 mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6E7B8D]">
              <span>Operating Point</span>
              <span className="normal-case tracking-normal font-mono text-[#5E6B7D]">Ch. 4</span>
            </div>
            <div className="mx-1 rounded-lg bg-[#232D3A] border border-[#2F3B4B] divide-y divide-[#2F3B4B]">
              {telemetry.map((t) => (
                <div key={t.label} className="flex items-center justify-between px-2.5 py-1.5 text-[11px]">
                  <span className="font-mono text-[#8E9AAB]">{t.label}</span>
                  <span className="font-mono font-semibold text-[#E8ECF1] tabular-nums">{t.value}</span>
                </div>
              ))}
            </div>
            <div className="px-2.5 mt-1.5 text-[10px] text-[#6E7B8D] leading-snug">
              V<sub>BE</sub> {bias.Vbe.toFixed(3)} V · V<sub>CE</sub> {bias.Vce.toFixed(2)} V ·{' '}
              {bias.Tamb.toFixed(0)} K — illustrative evaluation of the documented equations.
            </div>
          </div>
        )}
      </nav>

      {/* Sources */}
      <div className={`border-t border-[#2A3543] ${collapsed ? 'px-2 py-3' : 'px-3 py-3'} space-y-1`}>
        {!collapsed && (
          <div className="px-1.5 mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6E7B8D]">
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
            className={`flex items-center gap-2 rounded-md text-[11.5px] text-[#A9B4C2] hover:bg-[#273241] hover:text-white matte-btn-transition ${
              collapsed ? 'justify-center py-2' : 'px-1.5 py-1.5'
            }`}
          >
            <s.icon className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && (
              <>
                <span className="truncate flex-1">{s.label}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </>
            )}
          </a>
        ))}
        {!isMobile && (
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className={`mt-1 w-full flex items-center gap-2 rounded-md text-[11.5px] text-[#7F8B9B] hover:bg-[#273241] hover:text-white matte-btn-transition ${
              collapsed ? 'justify-center py-2' : 'px-1.5 py-1.5'
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="w-3.5 h-3.5" /> : <ChevronsLeft className="w-3.5 h-3.5" />}
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
          <div className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
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
                  selectedParamName={
                    selectedParam ? `${selectedParam.name} (${selectedParam.description})` : null
                  }
                  onSelectEquation={(eqId) => handleSelectEquation(eqId, true)}
                />
              </div>
              <div className="xl:col-span-5 xl:sticky xl:top-4">
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
          <div className="space-y-8">
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
    <div className="h-screen flex bg-[#F3F2EE] text-[#161E29] overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:block shrink-0 bg-[#1D2530] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden ${
          sidebarCollapsed ? 'w-[76px]' : 'w-[268px]'
        }`}
      >
        {renderSidebarContent(sidebarCollapsed, false)}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-[#161E29]/45"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-[284px] max-w-[85vw] h-full bg-[#1D2530] animate-drawer-in">
            {renderSidebarContent(false, true)}
          </aside>
        </div>
      )}

      {/* Workspace column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="shrink-0 bg-white border-b border-[#D8D4CA] z-30">
          <div className="px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-2 rounded-md border border-[#D8D4CA] text-[#2C3746] hover:bg-[#EAE8E1] matte-btn-transition"
                aria-label="Open navigation"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div key={activeTab} className="min-w-0 animate-view-enter">
                <h1 className="text-lg font-bold font-scientific text-[#161E29] leading-tight truncate">
                  {activeNav.label}
                </h1>
                <a
                  href={activeNav.sourcePage ? manualPageUrl(activeNav.sourcePage) : VA_SOURCE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#526071] hover:text-[#2B4C65] truncate max-w-full"
                  title="Open the authoritative source for this view"
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">Source: {activeNav.source}</span>
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Global search */}
              <div className="relative">
                <div className="flex items-center bg-[#F7F6F2] border border-[#D8D4CA] rounded-lg px-2.5 py-1.5 text-xs focus-within:border-[#2B4C65] focus-within:bg-white transition-colors">
                  <Search className="w-3.5 h-3.5 text-[#7F8B9B] mr-1.5" />
                  <input
                    type="text"
                    value={quickSearch}
                    onFocus={() => setQuickSearchOpen(true)}
                    onBlur={() => setTimeout(() => setQuickSearchOpen(false), 180)}
                    onChange={(e) => {
                      setQuickSearch(e.target.value);
                      setQuickSearchOpen(true);
                    }}
                    placeholder="Search parameter, branch, equation…"
                    className="bg-transparent outline-none w-44 sm:w-60 text-[#161E29] placeholder:text-[#8E9AAB]"
                    aria-label="Global search"
                  />
                </div>

                {quickSearchOpen && quickSearch.trim().length > 0 && (
                  <div className="absolute right-0 mt-1.5 w-[22rem] sm:w-[26rem] bg-white rounded-lg border border-[#D8D4CA] shadow-[0_8px_24px_rgba(22,30,41,0.10)] p-2.5 z-50 space-y-2.5 text-xs animate-card-enter">
                    {quickSearchResults.params.length > 0 && (
                      <div>
                        <div className="px-1.5 text-[10px] font-mono uppercase tracking-wider text-[#7F8B9B] font-semibold mb-1">
                          Parameters
                        </div>
                        {quickSearchResults.params.map((p) => (
                          <button
                            key={p.id}
                            onMouseDown={() => {
                              handleSelectParam(p.id, true);
                              setQuickSearch('');
                            }}
                            className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[#E7EEF4] flex items-center justify-between gap-2"
                          >
                            <span className="min-w-0">
                              <span className="font-mono font-bold text-[#2B4C65]">{p.id}</span>
                              <span className="text-[#526071] text-[11px] ml-2 truncate">{p.description}</span>
                            </span>
                            <span className="shrink-0 text-[10px] font-mono text-[#7F8B9B]">
                              p. {p.manualPages[0]} · VA l. {p.vaLine}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {quickSearchResults.elements.length > 0 && (
                      <div>
                        <div className="px-1.5 text-[10px] font-mono uppercase tracking-wider text-[#7F8B9B] font-semibold mb-1">
                          Circuit branches
                        </div>
                        {quickSearchResults.elements.map((el) => (
                          <button
                            key={el.id}
                            onMouseDown={() => {
                              handleSelectElement(el.id, true);
                              setQuickSearch('');
                            }}
                            className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[#E6F0EE] flex items-center justify-between gap-2"
                          >
                            <span className="min-w-0">
                              <span className="font-mono font-bold text-[#2A645E]">{el.id}</span>
                              <span className="text-[#526071] text-[11px] ml-2 truncate">{el.name}</span>
                            </span>
                            <span className="shrink-0 text-[10px] font-mono text-[#7F8B9B]">
                              VA ll. {el.vaLines}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {quickSearchResults.equations.length > 0 && (
                      <div>
                        <div className="px-1.5 text-[10px] font-mono uppercase tracking-wider text-[#7F8B9B] font-semibold mb-1">
                          Documented equations
                        </div>
                        {quickSearchResults.equations.map((eq) => (
                          <button
                            key={eq.id}
                            onMouseDown={() => {
                              handleSelectEquation(eq.id, true);
                              setQuickSearch('');
                            }}
                            className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[#EAE8E1] flex items-center justify-between gap-2"
                          >
                            <span className="min-w-0">
                              <span className="font-mono font-bold text-[#161E29]">({eq.eqNumber})</span>
                              <span className="text-[#526071] text-[11px] ml-2 truncate">{eq.title}</span>
                            </span>
                            <span className="shrink-0 text-[10px] font-mono text-[#7F8B9B]">
                              {eq.manualLines || `p. ${eq.manualPage}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!hasResults && (
                      <div className="text-[#8E9AAB] text-center py-2">
                        No matching parameters, branches, or equations
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Model card */}
              <div className="flex items-center gap-1.5 bg-[#F7F6F2] border border-[#D8D4CA] rounded-lg px-2.5 py-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#2B4C65] shrink-0" />
                <select
                  value={activePresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#161E29] outline-none cursor-pointer"
                  aria-label="Model card preset"
                >
                  {MODEL_CARD_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>

              {modifiedParamCount > 0 ? (
                <button
                  onClick={handleResetAllParams}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F4EAE3] text-[#824726] border border-[#DFC8B8] hover:bg-[#EBDACD] matte-btn-transition"
                  title="Reset all adjusted parameters to the selected model card"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ({modifiedParamCount})</span>
                </button>
              ) : (
                <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#E6F0EE] text-[#22544F] border border-[#C0D8D4]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Reference card</span>
                </span>
              )}
            </div>
          </div>

          {/* Bias strip */}
          <div className="px-4 lg:px-6 py-2 bg-[#F7F6F2] border-t border-[#E5E2DA] flex flex-wrap items-center gap-2.5 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7F8B9B] mr-1">Bias</span>
            {[
              { key: 'Vbe' as const, label: 'V_BE', min: 0.5, max: 1.0, step: 0.005, fmt: (v: number) => `${v.toFixed(3)} V`, accent: 'accent-[#2B4C65]', color: 'text-[#2B4C65]' },
              { key: 'Vce' as const, label: 'V_CE', min: 0.1, max: 3.5, step: 0.05, fmt: (v: number) => `${v.toFixed(2)} V`, accent: 'accent-[#2A645E]', color: 'text-[#2A645E]' },
              { key: 'Tamb' as const, label: 'T_amb', min: 230, max: 430, step: 5, fmt: (v: number) => `${v.toFixed(0)} K`, accent: 'accent-[#9A5833]', color: 'text-[#9A5833]' },
            ].map((b) => (
              <label
                key={b.key}
                className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-[#D8D4CA]"
              >
                {b.key === 'Tamb' && <Thermometer className="w-3.5 h-3.5 text-[#9A5833]" />}
                <span className={`font-mono font-semibold ${b.color}`}>{b.label}</span>
                <input
                  type="range"
                  min={b.min}
                  max={b.max}
                  step={b.step}
                  value={bias[b.key]}
                  onChange={(e) => setBias((prev) => ({ ...prev, [b.key]: parseFloat(e.target.value) }))}
                  className={`w-20 sm:w-24 cursor-pointer ${b.accent}`}
                />
                <span className="font-mono w-14 text-right font-semibold tabular-nums">{b.fmt(bias[b.key])}</span>
              </label>
            ))}
            <span className="ml-auto hidden md:inline text-[11px] text-[#7F8B9B]">
              Numerical values are illustrative evaluations of the documented equations, not measured data.
            </span>
          </div>
        </header>

        {/* Main scroll area */}
        <main className="flex-1 overflow-y-auto">
          <div key={activeTab} className="max-w-[1640px] mx-auto px-4 lg:px-6 py-5 animate-view-enter">
            {renderActiveView()}
          </div>

          <footer className="border-t border-[#D8D4CA] bg-white/60 py-4 px-4 lg:px-6 text-xs text-[#526071]">
            <div className="max-w-[1640px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-[#2C3746]">HICUM Explorer</span> — built from the HICUM/L2
                v2.4.0 manual (M. Schröter &amp; A. Pawlak), the CMC Verilog-A release{' '}
                <code>hicumL2V2p34.va</code>, and the supplied Sentaurus SDE structure.
              </div>
              <div className="font-mono text-[11px] text-[#7F8B9B]">
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

export default App;
