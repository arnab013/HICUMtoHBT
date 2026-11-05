import React, { useState, useMemo } from 'react';
import {
  HicumParameter,
  ParameterSectionId,
  SpatialNature,
} from '../data/hicumTypes';
import { FormulaView } from './FormulaView';
import { CitationBadges } from './CitationBadges';
import { Search, Filter, ArrowUpRight, Layers } from 'lucide-react';

interface ParameterDatabaseViewProps {
  parameters: HicumParameter[];
  sections: { id: ParameterSectionId; title: string; description: string }[];
  activeParamValues: Record<string, number>;
  selectedParamId: string | null;
  onSelectParam: (paramId: string, switchToLab?: boolean) => void;
  onUpdateParamValue: (paramId: string, newValue: number) => void;
}

const SPATIAL_BADGES: Record<
  SpatialNature,
  { label: string; className: string; tooltip: string }
> = {
  localized: {
    label: 'Physically Localized',
    className: 'bg-[#E6F0EE] text-[#2A645E] border-[#C0D8D4]',
    tooltip: 'Directly maps to a distinct physical junction, layer, or contact region in the 3D SiGe HBT.',
  },
  distributed: {
    label: 'Distributed / 2D-3D',
    className: 'bg-[#E7EEF4] text-[#2B4C65] border-[#C5D4E2]',
    tooltip: 'Represents a spatially distributed resistance, capacitance partitioning, or 2D/3D current spreading effect.',
  },
  conceptual: {
    label: 'Empirical / Smoothing / Thermal',
    className: 'bg-[#F4EAE3] text-[#824726] border-[#DFC8B8]',
    tooltip: 'Mathematical smoothing constant, global temperature coefficient, or lumped compact-model parameter.',
  },
  flag: {
    label: 'Model Control Flag',
    className: 'bg-[#EAE8E1] text-[#334155] border-[#D8D4CA]',
    tooltip: 'Simulator switch or version/topology selector.',
  },
};

export const ParameterDatabaseView: React.FC<ParameterDatabaseViewProps> = ({
  parameters,
  sections,
  activeParamValues,
  selectedParamId,
  onSelectParam,
  onUpdateParamValue,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedSpatial, setSelectedSpatial] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredParams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return parameters.filter((p) => {
      if (selectedSection !== 'all' && p.section !== selectedSection) return false;
      if (selectedSpatial !== 'all' && p.spatialNature !== selectedSpatial) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.physicalMeaning.toLowerCase().includes(q) ||
        p.physicalRegion.toLowerCase().includes(q) ||
        p.sectionTitle.toLowerCase().includes(q) ||
        p.circuitElements.some((el) => el.toLowerCase().includes(q))
      );
    });
  }, [parameters, searchQuery, selectedSection, selectedSpatial]);

  return (
    <div className="space-y-5">
      {/* Header & Filter Controls */}
      <div className="bg-white border border-[#E5E2DA] rounded-lg p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#E7EEF4] text-[#2B4C65] font-semibold">
                Manual Chapter 3 (Tables 3.1–3.17 · pp. 101–111)
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#E6F0EE] text-[#2A645E] font-medium">
                {parameters.length} Verified Parameters
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A] mt-1.5 font-scientific">
              Complete HICUM/L2 Model Parameter Knowledge Database
            </h2>
            <p className="text-sm text-[#475569] mt-1 max-w-3xl">
              Every parameter extracted systematically from M. Schröter & A. Pawlak,{' '}
              <em>HICUM/L2 v2.4.0 Manual</em> and <code>hicumL2V2p34.va</code>, including default
              simulator values, full-physics test card values, M-scaling factors, linked equations,
              and physical localization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#2B4C65] text-white border-[#2B4C65]'
                  : 'bg-white text-[#475569] border-[#D8D4CA] hover:bg-[#EAE8E1]'
              }`}
            >
              Structured Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[#2B4C65] text-white border-[#2B4C65]'
                  : 'bg-white text-[#475569] border-[#D8D4CA] hover:bg-[#EAE8E1]'
              }`}
            >
              Detailed Physics Cards
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-4 pt-4 border-t border-[#E5E2DA] grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parameter name (e.g. c10, rbi0, hjei, thcs, vcbar), mechanism, or region..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F6F2] border border-[#D8D4CA] rounded focus:outline-none focus:border-[#2B4C65] focus:bg-white text-[#0F172A]"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#64748B] shrink-0" />
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-[#F7F6F2] border border-[#D8D4CA] rounded focus:outline-none focus:border-[#2B4C65] text-[#0F172A]"
            >
              <option value="all">All 17 Manual Sections ({parameters.length} parameters)</option>
              {sections.map((sec) => {
                const count = parameters.filter((p) => p.section === sec.id).length;
                return (
                  <option key={sec.id} value={sec.id}>
                    Sec {sec.id}: {sec.title} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#64748B] shrink-0" />
            <select
              value={selectedSpatial}
              onChange={(e) => setSelectedSpatial(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-[#F7F6F2] border border-[#D8D4CA] rounded focus:outline-none focus:border-[#2B4C65] text-[#0F172A]"
            >
              <option value="all">All Spatial Classifications</option>
              <option value="localized">Physically Localized (Junction/Layer)</option>
              <option value="distributed">Distributed / 2D-3D Geometry</option>
              <option value="conceptual">Empirical / Smoothing / Thermal TC</option>
              <option value="flag">Simulator / Version Flag</option>
            </select>
          </div>
        </div>

        {/* Section Quick-Pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedSection('all')}
            className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
              selectedSection === 'all'
                ? 'bg-[#0F172A] text-white border-[#0F172A]'
                : 'bg-[#F7F6F2] text-[#475569] border-[#E5E2DA] hover:bg-[#E5E2DA]'
            }`}
          >
            All ({parameters.length})
          </button>
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedSection(sec.id)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                selectedSection === sec.id
                  ? 'bg-[#2B4C65] text-white border-[#2B4C65]'
                  : 'bg-[#F7F6F2] text-[#475569] border-[#E5E2DA] hover:bg-[#E5E2DA]'
              }`}
              title={sec.title}
            >
              §{sec.id} {sec.title.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[#475569] px-1">
        <span>
          Showing <strong>{filteredParams.length}</strong> of <strong>{parameters.length}</strong>{' '}
          documented HICUM/L2 parameters
        </span>
        <span>Click any parameter to inspect equations & simulate its effect in the Circuit Lab</span>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white border border-[#E5E2DA] rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EAE8E1] border-b border-[#D8D4CA] text-[11px] font-mono uppercase text-[#475569]">
                  <th className="py-2.5 px-3">Sec / #</th>
                  <th className="py-2.5 px-3">Parameter</th>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-4">Manual Description & Physical Role</th>
                  <th className="py-2.5 px-3">Default</th>
                  <th className="py-2.5 px-3">Test Card</th>
                  <th className="py-2.5 px-3">Active Value</th>
                  <th className="py-2.5 px-3">Range / Unit / M</th>
                  <th className="py-2.5 px-3">Localization</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DA] text-xs">
                {filteredParams.map((p) => {
                  const isSelected = selectedParamId === p.id;
                  const activeVal = activeParamValues[p.id] ?? p.testValue;
                  const badge = SPATIAL_BADGES[p.spatialNature];

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectParam(p.id, false)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#E7EEF4]/35 hover:bg-[#E7EEF4]/50'
                          : 'hover:bg-[#F7F6F2]'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                        §{p.section}.{p.tableNo}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#2B4C65] whitespace-nowrap">
                        {p.name}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <FormulaView latex={p.symbolLatex} inline />
                      </td>
                      <td className="py-2.5 px-4 max-w-md">
                        <div className="font-semibold text-[#0F172A]">{p.description}</div>
                        <div className="text-[11px] text-[#475569] line-clamp-2 mt-0.5">
                          {p.physicalMeaning}
                        </div>
                        <CitationBadges
                          className="mt-1.5"
                          compact
                          manualCitation={p.manualCitation}
                          manualPage={p.manualPages[0]}
                          vaCitation={p.vaCitation || `hicumL2V2p34.va, l. ${p.vaLine}`}
                        />
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {p.circuitElements.slice(0, 3).map((el) => (
                            <span
                              key={el}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EAE8E1] text-[#334155] border border-[#D8D4CA]"
                            >
                              EC:{el}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                        {p.defaultDisplay}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] font-medium text-[#2A645E] whitespace-nowrap">
                        {p.testDisplay}
                      </td>
                      <td
                        className="py-2.5 px-3 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="number"
                          step="any"
                          value={activeVal}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!Number.isNaN(v)) onUpdateParamValue(p.id, v);
                          }}
                          className="w-24 px-2 py-1 text-xs font-mono bg-white border border-[#D8D4CA] rounded focus:outline-none focus:border-[#2B4C65]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#475569] whitespace-nowrap">
                        <div>{p.rangeStr || '(-inf:inf)'}</div>
                        <div className="text-[10px] text-[#64748B]">
                          Unit: <strong>{p.unit}</strong> · M: <strong>{p.mFactor || '—'}</strong>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          title={badge.tooltip}
                          className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <div className="text-[10px] text-[#64748B] mt-0.5 max-w-[160px] truncate">
                          {p.physicalRegion}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectParam(p.id, true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-[#2B4C65] text-white hover:bg-[#23435C] transition-colors"
                        >
                          Lab <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredParams.map((p) => {
            const badge = SPATIAL_BADGES[p.spatialNature];
            const activeVal = activeParamValues[p.id] ?? p.testValue;
            return (
              <div
                key={p.id}
                className="bg-white border border-[#E5E2DA] rounded-lg p-4 shadow-sm hover:border-[#94A3B8] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-[#2B4C65]">
                        {p.name}
                      </span>
                      <span className="text-sm text-[#334155]">
                        (<FormulaView latex={p.symbolLatex} inline />)
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-[#0F172A] mt-1">
                    {p.description}
                  </div>

                  <div className="mt-2 text-xs text-[#334155] leading-relaxed">
                    {p.physicalMeaning}
                  </div>

                  <div className="mt-2 p-2.5 rounded bg-[#F7F6F2] border border-[#E5E2DA] text-[11px] text-[#475569]">
                    <strong className="text-[#0F172A]">Operation & Curve Effect:</strong>{' '}
                    {p.operationEffect}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#E5E2DA]">
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono mb-2.5">
                    <div className="bg-[#F7F6F2] p-1.5 rounded border border-[#E5E2DA]">
                      <div className="text-[9px] text-[#64748B] uppercase">Default</div>
                      <div className="font-semibold text-[#0F172A]">
                        {p.defaultDisplay} {p.unit !== '-' ? p.unit : ''}
                      </div>
                    </div>
                    <div className="bg-[#E6F0EE]/30 p-1.5 rounded border border-[#C0D8D4]">
                      <div className="text-[9px] text-[#2A645E] uppercase">Manual Test</div>
                      <div className="font-semibold text-[#2A645E]">
                        {p.testDisplay} {p.unit !== '-' ? p.unit : ''}
                      </div>
                    </div>
                    <div className="bg-[#F7F6F2] p-1.5 rounded border border-[#E5E2DA]">
                      <div className="text-[9px] text-[#64748B] uppercase">Range / M</div>
                      <div className="font-semibold text-[#0F172A] truncate">
                        {p.rangeStr} ({p.mFactor || '1'})
                      </div>
                    </div>
                  </div>

                  <CitationBadges
                    className="mb-2.5"
                    compact
                    manualCitation={p.manualCitation}
                    manualPage={p.manualPages[0]}
                    vaCitation={p.vaCitation || `hicumL2V2p34.va, l. ${p.vaLine}`}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-[#526071]">
                      §{p.section} · Active: <strong>{activeVal}</strong>
                    </span>
                    <button
                      onClick={() => onSelectParam(p.id, true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-[#2B4C65] text-white hover:bg-[#23435C]"
                    >
                      Inspect & Plot <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
