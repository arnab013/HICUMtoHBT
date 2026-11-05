import React, { useState, useMemo } from 'react';
import {
  HicumEquation,
  HicumParameter,
  PhysicalMechanismGuide,
} from '../data/hicumTypes';
import { FormulaView } from './FormulaView';
import {
  BookOpen,
  Search,
  Code2,
  ArrowUpRight,
  CheckSquare,
  Layers,
  GitCompare,
} from 'lucide-react';

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
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#DBEAFE] text-[#1E40AF] font-semibold">
                Manual Chapter 2 (pp. 7–99) & Chapter 4 (pp. 113–115)
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#CCFBF1] text-[#0F766E] font-medium">
                {equations.length} Documented Equations · {mechanisms.length} Physical Mechanisms
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A] mt-1.5 font-scientific">
              HICUM/L2 Mathematical Formulation & Physical Mechanisms Reference
            </h2>
            <p className="text-sm text-[#475569] mt-1 max-w-3xl">
              Complete physics-based model equations from the official HICUM/L2 v2.4.0 documentation.
              Framed equations (<span className="font-mono text-[#1E40AF]">[Implemented in VA]</span>)
              denote the exact equations coded in <code>hicumL2V2p34.va</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('equations')}
              className={`px-3.5 py-2 text-xs font-medium rounded border transition-colors ${
                activeTab === 'equations'
                  ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                  : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
              }`}
            >
              Documented Equations ({equations.length})
            </button>
            <button
              onClick={() => setActiveTab('mechanisms')}
              className={`px-3.5 py-2 text-xs font-medium rounded border transition-colors ${
                activeTab === 'mechanisms'
                  ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                  : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
              }`}
            >
              Physical Mechanisms & SGPM Comparison ({mechanisms.length})
            </button>
          </div>
        </div>

        {activeTab === 'equations' && (
          <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-7 relative">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search equation number (e.g. 2.2.0-1, 2.3.1-7), topic (GICCR, Kirk, barrier, NQS), or parameter..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded focus:outline-none focus:border-[#1E40AF] focus:bg-white text-[#0F172A]"
                />
              </div>
              <div className="md:col-span-5">
                <select
                  value={activeSectionId}
                  onChange={(e) => setActiveSectionId(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded focus:outline-none focus:border-[#1E40AF] text-[#0F172A]"
                >
                  <option value="all">All Chapter 2 & Chapter 4 Sections</option>
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
                className={`px-2.5 py-1 text-[11px] font-mono rounded border ${
                  activeSectionId === 'all'
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#E2E8F0]'
                }`}
              >
                All Sections
              </button>
              {sectionList.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded border ${
                    activeSectionId === sec.id
                      ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                      : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#E2E8F0]'
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
        <div className="space-y-4">
          {filteredEquations.map((eq) => {
            const isSelected = selectedEquationId === eq.id;
            return (
              <div
                key={eq.id}
                id={eq.id}
                onClick={() => onSelectEquation(eq.id)}
                className={`bg-white border rounded-lg p-5 shadow-sm transition-all ${
                  isSelected
                    ? 'border-[#1E40AF] ring-2 ring-[#DBEAFE]'
                    : 'border-[#E2E8F0] hover:border-[#94A3B8]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#0F172A] text-white">
                        Eq. {eq.eqNumber}
                      </span>
                      <span className="text-xs font-mono text-[#1E40AF] font-semibold">
                        {eq.section}
                      </span>
                      <span className="text-xs font-mono text-[#64748B]">
                        Manual p.{eq.manualPage} · {eq.vaReference}
                      </span>
                      {eq.isBoxedImplemented && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]">
                          <CheckSquare className="w-3 h-3" /> Framed VA Equation
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#0F172A] mt-1.5 font-scientific">
                      {eq.title}
                    </h3>
                  </div>
                </div>

                {/* Framed Mathematical Equation Box */}
                <div
                  className={`mt-3 p-4 rounded-md overflow-x-auto ${
                    eq.isBoxedImplemented
                      ? 'bg-[#F8FAFC] border-2 border-[#1E40AF]/80 shadow-inner'
                      : 'bg-[#F8FAFC] border border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 overflow-x-auto">
                      <FormulaView latex={eq.latex} displayMode />
                    </div>
                    <div className="text-xs font-mono font-bold text-[#475569] shrink-0">
                      {eq.eqNumber}
                    </div>
                  </div>
                </div>

                {/* Physical Meaning & Derivation */}
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-7 space-y-2">
                    <div className="text-xs font-semibold text-[#0F172A]">
                      {eq.summary}
                    </div>
                    <p className="text-xs text-[#334155] leading-relaxed">
                      {eq.physicalDerivation}
                    </p>
                  </div>

                  {/* Variables Table */}
                  <div className="lg:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#475569] font-semibold mb-2">
                      Symbols & Variables in {eq.eqNumber}
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {eq.variables.map((v, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-2 border-b border-[#E2E8F0] last:border-b-0 pb-1 last:pb-0"
                        >
                          <span className="shrink-0 font-medium text-[#0F172A]">
                            <FormulaView latex={v.symbolLatex} inline />
                          </span>
                          <span className="text-[#475569] text-right flex-1">
                            {v.meaning}{' '}
                            {v.unit && (
                              <span className="font-mono text-[10px] text-[#64748B]">
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
                <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono text-[#64748B] mr-1">
                      Model Parameters:
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
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-semibold rounded bg-[#DBEAFE]/60 text-[#1E40AF] border border-[#BFDBFE] hover:bg-[#1E40AF] hover:text-white transition-colors"
                          title={p ? `${p.description} (Test: ${p.testDisplay} ${p.unit})` : pid}
                        >
                          {pid}
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono text-[#64748B] mr-1">
                      Circuit Branches:
                    </span>
                    {eq.circuitElements.map((cid) => (
                      <button
                        key={cid}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectElementInLab(cid);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded bg-[#CCFBF1]/60 text-[#0F766E] border border-[#99F6E4] hover:bg-[#0F766E] hover:text-white transition-colors"
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {mechanisms.map((mech) => (
            <div
              key={mech.id}
              className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-[#DBEAFE] text-[#1E40AF]">
                    Sections {mech.manualSections.join(', ')} · Manual pp. {mech.manualPages}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] font-scientific">
                  {mech.title}
                </h3>
                <p className="text-xs text-[#334155] leading-relaxed">{mech.overview}</p>

                <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#0F766E] font-bold">
                    Semiconductor Physics & Carrier Transport Mechanism
                  </div>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    {mech.physicalInsight}
                  </p>
                </div>

                <div className="p-3 rounded bg-[#FEF3C7]/35 border border-[#FDE68A] space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#B45309] font-bold">
                    <GitCompare className="w-3.5 h-3.5" /> Advantage Over SPICE Gummel-Poon (SGPM)
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {mech.sgpmComparison}
                  </p>
                </div>

                <div className="p-3 rounded bg-[#CCFBF1]/30 border border-[#99F6E4] space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#0F766E] font-bold">
                    <Layers className="w-3.5 h-3.5" /> Physical Localization in 3D SiGe HBT
                  </div>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    {mech.spatialLocalization}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[11px] font-mono text-[#64748B] mr-1">
                    Key Params:
                  </span>
                  {mech.keyParameters.map((pid) => (
                    <button
                      key={pid}
                      onClick={() => onSelectParamInLab(pid)}
                      className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-[#DBEAFE]/60 text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors"
                    >
                      {pid}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {mech.circuitElements.slice(0, 4).map((cid) => (
                    <button
                      key={cid}
                      onClick={() => onSelectElementInLab(cid)}
                      className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] hover:bg-[#0F172A] hover:text-white transition-colors"
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
