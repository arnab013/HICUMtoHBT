import React, { useState, useMemo } from 'react';
import {
  HicumParameter,
  ParameterSectionId,
  SpatialNature,
} from '../data/hicumTypes';
import { FormulaView } from './FormulaView';
import { CitationBadges } from './CitationBadges';
import { EmptyState } from './EmptyState';
import { Search, Filter, ArrowUpRight, Layers, Database } from 'lucide-react';

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
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/60',
    tooltip: 'Directly maps to a distinct physical junction, layer, or contact region in the 3D SiGe HBT.',
  },
  distributed: {
    label: 'Distributed / 2D-3D',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60',
    tooltip: 'Represents a spatially distributed resistance, capacitance partitioning, or 2D/3D current spreading effect.',
  },
  conceptual: {
    label: 'Empirical / Smoothing',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/60',
    tooltip: 'Mathematical smoothing constant, global temperature coefficient, or lumped compact-model parameter.',
  },
  flag: {
    label: 'Model Control Flag',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
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

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSection('all');
    setSelectedSpatial('all');
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 font-semibold">
                Manual Chapter 3 · Tables 3.1–3.17 (pp. 101–111)
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/60 font-medium">
                {parameters.length} Verified Parameters
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 tracking-tight">
              Complete HICUM/L2 Model Parameter Knowledge Database
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Every parameter extracted systematically from M. Schröter &amp; A. Pawlak,{' '}
              <em>HICUM/L2 v2.4.0 Manual</em> and <code>hicumL2V2p34.va</code>, including default
              simulator values, full-physics test card values, M-scaling factors, and physical localization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`btn-elite px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Structured Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`btn-elite px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Detailed Physics Cards
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-5 pt-5 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3.5">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parameter (e.g. c10, rbi0, hjei, thcs), mechanism, or region…"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-all cursor-pointer"
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
            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedSpatial}
              onChange={(e) => setSelectedSpatial(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-all cursor-pointer"
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
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedSection('all')}
            className={`btn-elite px-2.5 py-1 text-xs font-mono rounded-md border transition-all ${
              selectedSection === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({parameters.length})
          </button>
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedSection(sec.id)}
              className={`btn-elite px-2.5 py-1 text-xs font-mono rounded-md border transition-all ${
                selectedSection === sec.id
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={sec.title}
            >
              §{sec.id} {sec.title.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200">{filteredParams.length}</strong> of{' '}
          <strong className="text-slate-800 dark:text-slate-200">{parameters.length}</strong> documented parameters
        </span>
        <span className="hidden sm:inline">Click any parameter row to inspect equations &amp; tune in Circuit Lab</span>
      </div>

      {/* Empty State when no matches */}
      {filteredParams.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No parameters match your criteria"
          description="We couldn't find any parameters matching your active search query or filter selection. Try adjusting your search term."
          actionLabel="Reset search filters"
          onAction={handleResetFilters}
        />
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  <th className="py-3 px-3.5">Sec</th>
                  <th className="py-3 px-3.5">Parameter</th>
                  <th className="py-3 px-3.5">Symbol</th>
                  <th className="py-3 px-4">Manual Description &amp; Physical Role</th>
                  <th className="py-3 px-3.5 text-right">Default</th>
                  <th className="py-3 px-3.5 text-right">Test Card</th>
                  <th className="py-3 px-3.5 text-right">Active Value</th>
                  <th className="py-3 px-3.5">Range / Unit / M</th>
                  <th className="py-3 px-3.5">Localization</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
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
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-950/60'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-3 px-3.5 font-mono text-xs text-slate-400 whitespace-nowrap">
                        §{p.section}.{p.tableNo}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {p.name}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-800 dark:text-slate-200">
                        <FormulaView latex={p.symbolLatex} inline />
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{p.description}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {p.physicalMeaning}
                        </div>
                        <CitationBadges
                          className="mt-2"
                          compact
                          manualCitation={p.manualCitation}
                          manualPage={p.manualPages[0]}
                          vaCitation={p.vaCitation || `hicumL2V2p34.va, l. ${p.vaLine}`}
                        />
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {p.circuitElements.slice(0, 3).map((el) => (
                            <span
                              key={el}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            >
                              EC:{el}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-xs text-slate-500 dark:text-slate-400 text-right tabular-nums whitespace-nowrap">
                        {p.defaultDisplay}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-right tabular-nums whitespace-nowrap">
                        {p.testDisplay}
                      </td>
                      <td
                        className="py-3 px-3.5 text-right whitespace-nowrap"
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
                          className="w-24 px-2 py-1 text-xs font-mono text-right tabular-nums bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-slate-900 dark:text-slate-100"
                        />
                      </td>
                      <td className="py-3 px-3.5 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div>{p.rangeStr || '(-inf:inf)'}</div>
                        <div className="text-[11px] text-slate-400">
                          Unit: <strong className="text-slate-700 dark:text-slate-300">{p.unit}</strong> · M: <strong className="text-slate-700 dark:text-slate-300">{p.mFactor || '—'}</strong>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          title={badge.tooltip}
                          className={`inline-block text-[10.5px] font-medium px-2 py-0.5 rounded-md border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[160px] truncate">
                          {p.physicalRegion}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectParam(p.id, true);
                          }}
                          className="btn-elite inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                        >
                          Lab <ArrowUpRight className="w-3.5 h-3.5" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredParams.map((p) => {
            const badge = SPATIAL_BADGES[p.spatialNature];
            const activeVal = activeParamValues[p.id] ?? p.testValue;
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                        {p.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        (<FormulaView latex={p.symbolLatex} inline />)
                      </span>
                    </div>
                    <span
                      className={`text-[10.5px] font-medium px-2 py-0.5 rounded-md border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-2">
                    {p.description}
                  </div>

                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {p.physicalMeaning}
                  </div>

                  <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong className="text-slate-900 dark:text-slate-100">Operation &amp; Curve Effect:</strong>{' '}
                    {p.operationEffect}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-3">
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase">Default</div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {p.defaultDisplay} {p.unit !== '-' ? p.unit : ''}
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200/70 dark:border-emerald-900/60">
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase">Test Card</div>
                      <div className="font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {p.testDisplay} {p.unit !== '-' ? p.unit : ''}
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase">Range / M</div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                        {p.rangeStr} ({p.mFactor || '1'})
                      </div>
                    </div>
                  </div>

                  <CitationBadges
                    className="mb-3"
                    compact
                    manualCitation={p.manualCitation}
                    manualPage={p.manualPages[0]}
                    vaCitation={p.vaCitation || `hicumL2V2p34.va, l. ${p.vaLine}`}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      §{p.section} · Active: <strong className="text-slate-800 dark:text-slate-200">{activeVal}</strong>
                    </span>
                    <button
                      onClick={() => onSelectParam(p.id, true)}
                      className="btn-elite inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                    >
                      Inspect &amp; Plot <ArrowUpRight className="w-3.5 h-3.5" />
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

export default ParameterDatabaseView;
