import React, { useState, useMemo } from 'react';
import {
  HicumEquation,
  HicumParameter,
  PhysicalMechanismGuide,
} from '../data/hicumTypes';
import { FormulaView } from './FormulaView';
import { CitationBadges } from './CitationBadges';
import { EmptyState } from './EmptyState';
import { Search, ArrowUpRight, CheckSquare, Layers, GitCompare, BookOpen } from 'lucide-react';

interface EquationsReferenceViewProps {
  equations: HicumEquation[];
  mechanisms: PhysicalMechanismGuide[];
  parameters: HicumParameter[];
  selectedEquationId: string | null;
  onSelectEquation: (eqId: string) => void;
  onSelectParamInLab: (paramId: string) => void;
  onSelectElementInLab: (elementId: string) => void;
}

export const EquationsReferenceView: React.FC<EquationsReferenceViewProps> = ({
  equations,
  mechanisms,
  parameters,
  selectedEquationId,
  onSelectEquation,
  onSelectParamInLab,
  onSelectElementInLab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'equations' | 'mechanisms'>('equations');

  const sectionList = useMemo(() => {
    const map = new Map<string, string>();
    equations.forEach((eq) => {
      if (!map.has(eq.sectionId)) {
        map.set(eq.sectionId, eq.section);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [equations]);

  const filteredEquations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return equations.filter((eq) => {
      if (activeSectionId !== 'all' && eq.sectionId !== activeSectionId) return false;
      if (!q) return true;
      return (
        eq.eqNumber.toLowerCase().includes(q) ||
        eq.title.toLowerCase().includes(q) ||
        eq.summary.toLowerCase().includes(q) ||
        eq.physicalDerivation.toLowerCase().includes(q) ||
        eq.parameters.some((p) => p.toLowerCase().includes(q)) ||
        eq.circuitElements.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [equations, searchQuery, activeSectionId]);

  const paramMap = useMemo(() => {
    const m = new Map<string, HicumParameter>();
    parameters.forEach((p) => m.set(p.id, p));
    return m;
  }, [parameters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 font-semibold">
                Manual Chapter 2 (pp. 7–99) &amp; Chapter 4 (pp. 113–115)
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/60 font-medium">
                {equations.length} Documented Equations · {mechanisms.length} Physical Mechanisms
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 tracking-tight">
              HICUM/L2 Mathematical Formulation &amp; Physical Mechanisms Reference
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Complete physics-based model equations from the official HICUM/L2 v2.4.0 documentation.
              Framed equations denote the exact formulations implemented in <code>hicumL2V2p34.va</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('equations')}
              className={`btn-elite px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                activeTab === 'equations'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Documented Equations ({equations.length})
            </button>
            <button
              onClick={() => setActiveTab('mechanisms')}
              className={`btn-elite px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                activeTab === 'mechanisms'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Physical Mechanisms &amp; SGPM Comparison ({mechanisms.length})
            </button>
          </div>
        </div>

        {activeTab === 'equations' && (
          <div className="mt-5 pt-5 border-t border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              <div className="md:col-span-7 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search equation number (e.g. 2.2.0-1), topic (GICCR, Kirk, barrier), or parameter…"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all"
                />
              </div>
              <div className="md:col-span-5">
                <select
                  value={activeSectionId}
                  onChange={(e) => setActiveSectionId(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-all cursor-pointer"
                >
                  <option value="all">All Chapter 2 &amp; Chapter 4 Sections</option>
                  {sectionList.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveSectionId('all')}
                className={`btn-elite px-2.5 py-1 text-xs font-mono rounded-md border transition-all ${
                  activeSectionId === 'all'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                All Sections
              </button>
              {sectionList.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`btn-elite px-2.5 py-1 text-xs font-mono rounded-md border transition-all ${
                    activeSectionId === sec.id
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  §{sec.id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {activeTab === 'equations' ? (
        filteredEquations.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No equations match your search"
            description="We couldn't find any documented equations matching your query. Try searching by equation number like '2.2.0-1' or physical keyword like 'transit time'."
            actionLabel="Reset search query"
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <div className="space-y-4">
            {filteredEquations.map((eq) => {
              const isSelected = selectedEquationId === eq.id;
              return (
                <div
                  key={eq.id}
                  id={eq.id}
                  onClick={() => onSelectEquation(eq.id)}
                  className={`bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                          Eq. {eq.eqNumber}
                        </span>
                        <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                          {eq.section}
                        </span>
                        {eq.isBoxedImplemented && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60 font-medium">
                            <CheckSquare className="w-3.5 h-3.5" /> Framed VA Equation
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2 tracking-tight">
                        {eq.title}
                      </h3>
                      <CitationBadges
                        className="mt-2"
                        manualCitation={eq.manualLines ? `Eq. (${eq.eqNumber}), ${eq.manualLines}` : undefined}
                        manualPage={eq.manualPage}
                        vaCitation={eq.vaReference}
                      />
                    </div>
                  </div>

                  {/* Framed Mathematical Equation Box */}
                  <div
                    className={`mt-4 p-4 rounded-xl overflow-x-auto ${
                      eq.isBoxedImplemented
                        ? 'bg-slate-50 dark:bg-slate-800/80 border-2 border-blue-500/60'
                        : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 overflow-x-auto text-slate-900 dark:text-slate-100">
                        <FormulaView latex={eq.latex} displayMode />
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-400 shrink-0">
                        ({eq.eqNumber})
                      </div>
                    </div>
                  </div>

                  {/* Physical Meaning & Derivation */}
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7 space-y-2">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {eq.summary}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {eq.physicalDerivation}
                      </p>
                    </div>

                    {/* Variables Table */}
                    <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3.5">
                      <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                        Symbols &amp; Variables in {eq.eqNumber}
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {eq.variables.map((v, idx) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 last:border-b-0 pb-1.5 last:pb-0"
                          >
                            <span className="shrink-0 font-medium text-slate-900 dark:text-slate-100">
                              <FormulaView latex={v.symbolLatex} inline />
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-right flex-1">
                              {v.meaning}{' '}
                              {v.unit && (
                                <span className="font-mono text-[10.5px] text-slate-400">
                                  [{v.unit}]
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Linked Parameters & Circuit Elements */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-mono text-slate-400 mr-1">
                        Parameters:
                      </span>
                      {eq.parameters.map((pid) => {
                        const p = paramMap.get(pid);
                        return (
                          <button
                            key={pid}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectParamInLab(pid);
                            }}
                            className="btn-elite inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-mono font-semibold rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 hover:bg-blue-600 hover:text-white transition-colors"
                            title={p ? `${p.description} (Test: ${p.testDisplay} ${p.unit})` : pid}
                          >
                            {pid}
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-mono text-slate-400 mr-1">
                        Branches:
                      </span>
                      {eq.circuitElements.map((cid) => (
                        <button
                          key={cid}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElementInLab(cid);
                          }}
                          className="btn-elite inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-mono font-medium rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/60 hover:bg-emerald-600 hover:text-white transition-colors"
                        >
                          EC:{cid}
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mechanisms.map((mech) => (
            <div
              key={mech.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60">
                    Sections {mech.manualSections.join(', ')} · pp. {mech.manualPages}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {mech.title}
                </h3>
                <CitationBadges
                  manualCitation={mech.manualCitation || `pp. ${mech.manualPages}`}
                  vaCitation={mech.vaCitation}
                />
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{mech.overview}</p>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                  <div className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                    Semiconductor Physics &amp; Carrier Transport Mechanism
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {mech.physicalInsight}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold">
                    <GitCompare className="w-3.5 h-3.5" /> Advantage Over SPICE Gummel-Poon (SGPM)
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {mech.sgpmComparison}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-blue-700 dark:text-blue-400 font-bold">
                    <Layers className="w-3.5 h-3.5" /> Physical Localization in 3D SiGe HBT
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {mech.spatialLocalization}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-mono text-slate-400 mr-1">
                    Key Params:
                  </span>
                  {mech.keyParameters.map((pid) => (
                    <button
                      key={pid}
                      onClick={() => onSelectParamInLab(pid)}
                      className="btn-elite px-2.5 py-0.5 text-xs font-mono font-semibold rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      {pid}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {mech.circuitElements.slice(0, 4).map((cid) => (
                    <button
                      key={cid}
                      onClick={() => onSelectElementInLab(cid)}
                      className="btn-elite px-2.5 py-0.5 text-xs font-mono font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-colors"
                    >
                      EC:{cid}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EquationsReferenceView;
