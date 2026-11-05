import React, { useState, useMemo } from 'react';
import {
  HicumParameter,
  CircuitElement,
} from '../data/hicumTypes';
import { FormulaView } from './FormulaView';
import { CitationBadges } from './CitationBadges';
import {
  Layers,
  Cpu,
  ArrowUpRight,
  CheckCircle2,
  Box,
  Image as ImageIcon,
  Columns,
  Eye,
  Info,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface CrossSectionDiagramsProps {
  parameters: HicumParameter[];
  elements: CircuitElement[];
  onSelectParamInLab: (paramId: string) => void;
  onSelectElementInLab: (elementId: string) => void;
}

interface ComponentAnnotation {
  id: string;
  elementId: string;
  name: string;
  symbol: string;
  category: 'intrinsic' | 'extrinsic' | 'substrate' | 'thermal' | 'parasitic';
  calloutTitle?: string;
  description: string;
  manualCitation: string;
  vaCitation: string;
  keyParams: string[];
}

const EMBEDDED_ANNOTATIONS: Record<string, ComponentAnnotation> = {
  ceox: {
    id: 'ceox',
    elementId: 'cbepar1',
    name: 'Oxide Overlap Capacitance C_EOX',
    symbol: 'C_{EOX}',
    category: 'parasitic',
    description: 'Parasitic metal-to-metal and poly overlap capacitance between base metallization and emitter contact over the field oxide.',
    manualCitation: 'Ch. 2.9, p. 58, ll. 10–22; Table 3.10, p. 106, row 1',
    vaCitation: 'hicumL2V2p34.va, ll. 720, 1828',
    keyParams: ['cbepar', 'fbepar'],
  },
  re: {
    id: 're',
    elementId: 're',
    name: 'Emitter Series Resistance R_E',
    symbol: 'R_E',
    category: 'parasitic',
    description: 'Ohmic series resistance of the emitter poly, contact interface, and mono-crystalline emitter plug leading to internal node E\'.',
    manualCitation: 'Ch. 2.8.3, p. 56, ll. 1–15; Table 3.6, p. 104, row 8',
    vaCitation: 'hicumL2V2p34.va, ll. 683, 1836–1840',
    keyParams: ['re', 'zetare'],
  },
  rbx: {
    id: 'rbx',
    elementId: 'rbx',
    name: 'Extrinsic Base Resistance R_BX',
    symbol: 'R_{BX}',
    category: 'extrinsic',
    description: 'Extrinsic base resistance connecting external base contact B through poly-base silicide and spacer link region to perimeter node B*.',
    manualCitation: 'Ch. 2.7, p. 48, Fig. 2.7.0/1; Table 3.6, p. 104, row 6',
    vaCitation: 'hicumL2V2p34.va, ll. 681, 1796–1800',
    keyParams: ['rbx', 'zetarbx'],
  },
  rbi: {
    id: 'rbi',
    elementId: 'rbi',
    name: 'Internal Pinch Base Resistance R_BI',
    symbol: 'R_{BI}',
    category: 'intrinsic',
    calloutTitle: 'AC Crowding',
    description: 'Modulated internal pinch base sheet resistance beneath the emitter window, subject to DC current crowding and conductivity modulation.',
    manualCitation: 'Ch. 2.6, p. 45, ll. 1–25; Table 3.6, p. 104, rows 1–5',
    vaCitation: 'hicumL2V2p34.va, ll. 680, 1801–1805',
    keyParams: ['rbi0', 'fdqr0', 'fgeo', 'fcrbi'],
  },
  crbi: {
    id: 'crbi',
    elementId: 'crbi',
    name: 'AC Base Crowding Capacitance C_RBI',
    symbol: 'C_{RBI}',
    category: 'intrinsic',
    calloutTitle: 'AC Crowding',
    description: 'High-frequency AC base crowding shunt capacitance in parallel with internal base resistance R_BI, representing distributed base dynamics.',
    manualCitation: 'Ch. 2.6, p. 47, ll. 10–20 (Eq. 2.6.0-18); Table 3.6, p. 104, row 4',
    vaCitation: 'hicumL2V2p34.va, ll. 1803–1805',
    keyParams: ['fcrbi', 'rbi0'],
  },
  it: {
    id: 'it',
    elementId: 'it',
    name: 'Main Transfer Current Source I_T',
    symbol: 'I_T',
    category: 'intrinsic',
    calloutTitle: 'Intrinsic Transistor',
    description: 'Core Generalized Integral Charge-Control Relation (GICCR) forward and reverse transport current between internal nodes C\' and E\'.',
    manualCitation: 'Ch. 2.2, p. 9, ll. 15–26 (Eq. 2.2.0-1); Table 3.1, p. 101, rows 1–11',
    vaCitation: 'hicumL2V2p34.va, ll. 663–666, 1448–1596',
    keyParams: ['c10', 'qp0', 'hjei', 'hjci', 't0'],
  },
  ibei: {
    id: 'ibei',
    elementId: 'ibei',
    name: 'Internal Base-Emitter Injection Diode I_BEI',
    symbol: 'I_{BEI}',
    category: 'intrinsic',
    calloutTitle: 'Intrinsic Transistor',
    description: 'Ideal and non-ideal minority carrier injection into the emitter and recombination in the intrinsic base space-charge region.',
    manualCitation: 'Ch. 2.3.1, p. 25, ll. 6–10 (Eq. 2.3.1-11); Table 3.2, p. 102, rows 1–4',
    vaCitation: 'hicumL2V2p34.va, ll. 675–676, 1815–1818',
    keyParams: ['ibeis', 'mbei', 'ireis', 'mrei'],
  },
  qjei: {
    id: 'qjei',
    elementId: 'cjei',
    name: 'Intrinsic B-E Depletion Charge Q_JEI',
    symbol: 'Q_{JEI}',
    category: 'intrinsic',
    calloutTitle: 'Intrinsic Transistor',
    description: 'Voltage-dependent depletion charge and junction capacitance of the intrinsic base-emitter metallurgical junction under the emitter stripe.',
    manualCitation: 'Ch. 2.4.1, p. 33, l. 16 (Eq. 2.4.1-1); Table 3.9, p. 105, rows 1–4',
    vaCitation: 'hicumL2V2p34.va, ll. 703–706, 1815–1818',
    keyParams: ['cjei0', 'vdei', 'zei', 'ajei'],
  },
  qde: {
    id: 'qde',
    elementId: 'qf',
    name: 'Forward Diffusion Charge Q_DE (Q_f)',
    symbol: 'Q_{DE}',
    category: 'intrinsic',
    calloutTitle: 'Intrinsic Transistor',
    description: 'Mobile excess minority electron charge stored in the neutral base, neutral emitter (ΔQ_Ef), and collector space-charge layer during forward bias.',
    manualCitation: 'Ch. 2.5, p. 42, l. 15 (Eq. 2.5.0-1); Table 3.3, p. 102, rows 1–4',
    vaCitation: 'hicumL2V2p34.va, ll. 684–685, 1824',
    keyParams: ['t0', 'tef0', 'gtfe', 'thcs', 'ahc'],
  },
  ibci: {
    id: 'ibci',
    elementId: 'ibci',
    name: 'Internal Base-Collector Diode I_BCI',
    symbol: 'I_{BCI}',
    category: 'intrinsic',
    description: 'Base-collector junction current under reverse or forward saturation, modeling minority carrier injection across the internal B\'-C\' junction.',
    manualCitation: 'Ch. 2.3.2, p. 28, ll. 4–12; Table 3.2, p. 102, rows 5–8',
    vaCitation: 'hicumL2V2p34.va, ll. 677–678, 1820',
    keyParams: ['ibcis', 'mbci', 'ircis', 'mrci'],
  },
  qjci: {
    id: 'qjci',
    elementId: 'cjci',
    name: 'Intrinsic B-C Depletion Charge Q_JCI',
    symbol: 'Q_{JCI}',
    category: 'intrinsic',
    description: 'Intrinsic collector space-charge region depletion capacitance, incorporating punch-through limiting at high reverse bias.',
    manualCitation: 'Ch. 2.4.2, p. 37, ll. 3–15 (Eq. 2.4.2-4); Table 3.9, p. 105, rows 9–12',
    vaCitation: 'hicumL2V2p34.va, ll. 707–710, 1825',
    keyParams: ['cjci0', 'vdci', 'zci', 'vptci'],
  },
  qdc: {
    id: 'qdc',
    elementId: 'qr',
    name: 'Reverse Diffusion Charge Q_DC (Q_r)',
    symbol: 'Q_{DC}',
    category: 'intrinsic',
    description: 'Minority carrier charge stored in the base and collector regions during reverse operation (saturation mode).',
    manualCitation: 'Ch. 2.5, p. 43, l. 8 (Eq. 2.5.0-3); Table 3.3, p. 103, rows 1–2',
    vaCitation: 'hicumL2V2p34.va, ll. 684–685, 1824',
    keyParams: ['tr'],
  },
  iavl: {
    id: 'iavl',
    elementId: 'iavl',
    name: 'Avalanche Current Source I_AVL',
    symbol: 'I_{AVL}',
    category: 'intrinsic',
    calloutTitle: 'Avalanche Current',
    description: 'Impact ionization current generated in the high-field base-collector junction space-charge layer, causing collector-emitter breakdown.',
    manualCitation: 'Ch. 2.10.1, p. 60, ll. 11–18 (Eq. 2.10.1-1); Table 3.5, p. 103, rows 1–3',
    vaCitation: 'hicumL2V2p34.va, ll. 697–698, 1824',
    keyParams: ['favl', 'qavl', 'kavl'],
  },
  ibet: {
    id: 'ibet',
    elementId: 'ibet',
    name: 'B-E Tunneling Current Source I_BET',
    symbol: 'I_{BET}',
    category: 'extrinsic',
    calloutTitle: 'Tunneling Current',
    description: 'Band-to-band Zener and trap-assisted tunneling current at the reverse-biased emitter-base peripheral junction.',
    manualCitation: 'Ch. 2.3.2, p. 31, ll. 8–24 (Eq. 2.3.2-12); Table 3.2, p. 102, rows 9–11',
    vaCitation: 'hicumL2V2p34.va, ll. 679, 1819',
    keyParams: ['ibets', 'abet', 'tunode'],
  },
  ibep: {
    id: 'ibep',
    elementId: 'ibep',
    name: 'Peripheral B-E Diode I_BEP',
    symbol: 'I_{BEP}',
    category: 'extrinsic',
    calloutTitle: 'Extrinsic Transistor',
    description: 'Peripheral base-emitter injection diode current along the perimeter of the emitter stripe near the oxide sidewall.',
    manualCitation: 'Ch. 2.3.1, p. 27, ll. 1–15; Table 3.2, p. 102, rows 12–15',
    vaCitation: 'hicumL2V2p34.va, ll. 675–676, 1819',
    keyParams: ['ibeps', 'mbep', 'ireps', 'mrep'],
  },
  qjep: {
    id: 'qjep',
    elementId: 'cjep',
    name: 'Peripheral B-E Depletion Charge Q_JEP',
    symbol: 'Q_{JEP}',
    category: 'extrinsic',
    calloutTitle: 'Extrinsic Transistor',
    description: 'Perimeter depletion capacitance of the lateral B*-E\' junction adjacent to the sidewall spacer.',
    manualCitation: 'Ch. 2.4.1, p. 35, ll. 1–12; Table 3.9, p. 105, rows 5–8',
    vaCitation: 'hicumL2V2p34.va, ll. 703–706, 1819',
    keyParams: ['cjep0', 'vdep', 'zep', 'ajep'],
  },
  ibcx: {
    id: 'ibcx',
    elementId: 'ijbcx',
    name: 'Extrinsic B-C Diode I_BCX',
    symbol: 'I_{BCX}',
    category: 'extrinsic',
    description: 'Extrinsic base-collector diode current across the poly-base to epitaxial collector isolation region.',
    manualCitation: 'Ch. 2.3.2, p. 29, ll. 1–10; Table 3.2, p. 102, rows 16–18',
    vaCitation: 'hicumL2V2p34.va, ll. 677–678, 1821',
    keyParams: ['ibcxs', 'mbcx'],
  },
  qds: {
    id: 'qds',
    elementId: 'qdsu',
    name: 'Extrinsic Diffusion Charge Q_DS',
    symbol: 'Q_{DS}',
    category: 'extrinsic',
    description: 'Diffusion charge storage in the extrinsic base-collector and substrate region under saturation.',
    manualCitation: 'Ch. 2.12, p. 68, ll. 4–18; Table 3.7, p. 104, row 5',
    vaCitation: 'hicumL2V2p34.va, ll. 719, 1826',
    keyParams: ['tsf'],
  },
  qbcx1: {
    id: 'qbcx1',
    elementId: 'cjcx1',
    name: 'Outer Extrinsic B-C Charge Q_BCX1',
    symbol: 'Q_{BCX1}',
    category: 'extrinsic',
    description: 'Partitioned extrinsic base-collector depletion capacitance connected directly to external base terminal B.',
    manualCitation: 'Ch. 2.4.3, p. 40, ll. 5–26; Table 3.9, p. 105, rows 13–16',
    vaCitation: 'hicumL2V2p34.va, ll. 711–714, 1793–1794',
    keyParams: ['cjcx0', 'vdcx', 'zcx', 'fbcpar'],
  },
  qbcx2: {
    id: 'qbcx2',
    elementId: 'cjcx2',
    name: 'Inner Extrinsic B-C Charge Q_BCX2',
    symbol: 'Q_{BCX2}',
    category: 'extrinsic',
    description: 'Partitioned extrinsic base-collector depletion capacitance connected to intermediate perimeter node B*.',
    manualCitation: 'Ch. 2.4.3, p. 40, ll. 5–26; Table 3.9, p. 105, rows 13–16',
    vaCitation: 'hicumL2V2p34.va, ll. 711–714, 1795',
    keyParams: ['cjcx0', 'vdcx', 'zcx', 'fbcpar'],
  },
  rcx: {
    id: 'rcx',
    elementId: 'rcx',
    name: 'Collector Series Resistance R_CX',
    symbol: 'R_{CX}',
    category: 'parasitic',
    description: 'Ohmic resistance through the N+ buried layer subcollector, vertical collector sinker plug, and collector contact metal.',
    manualCitation: 'Ch. 2.8.2, p. 55, ll. 1–12; Table 3.6, p. 104, row 7',
    vaCitation: 'hicumL2V2p34.va, ll. 682, 1831–1835',
    keyParams: ['rcx', 'zetarcx'],
  },
  its: {
    id: 'its',
    elementId: 'its',
    name: 'Parasitic Substrate Transfer Current I_TS',
    symbol: 'I_{TS}',
    category: 'substrate',
    calloutTitle: 'Substrate PNP',
    description: 'Parasitic vertical PNP transistor transfer current from base node B* across the subcollector into substrate node S\'.',
    manualCitation: 'Ch. 2.12, p. 67, l. 22 (Eq. 2.12.0-10); Table 3.7, p. 104, rows 1–2',
    vaCitation: 'hicumL2V2p34.va, ll. 689–691, 1819',
    keyParams: ['itss', 'msf'],
  },
  qjs: {
    id: 'qjs',
    elementId: 'cjs',
    name: 'Collector-Substrate Depletion Charge Q_JS',
    symbol: 'Q_{JS}',
    category: 'substrate',
    calloutTitle: 'Substrate PNP',
    description: 'Junction depletion capacitance between the N+ buried subcollector and P- wafer substrate (nodes S\' and C\').',
    manualCitation: 'Ch. 2.4.4, p. 41, ll. 4–18; Table 3.9, p. 105, rows 17–20',
    vaCitation: 'hicumL2V2p34.va, ll. 715–718, 1827',
    keyParams: ['cjs0', 'vds', 'zs', 'vpts'],
  },
  isc: {
    id: 'isc',
    elementId: 'ijsc',
    name: 'Substrate Junction Diode I_SC',
    symbol: 'I_{SC}',
    category: 'substrate',
    calloutTitle: 'Substrate PNP',
    description: 'Junction injection and recombination current of the collector-substrate PN junction under forward bias.',
    manualCitation: 'Ch. 2.12, p. 67, ll. 10–15; Table 3.7, p. 104, rows 3–4',
    vaCitation: 'hicumL2V2p34.va, ll. 687–688, 1826',
    keyParams: ['iscs', 'msc'],
  },
  rsu: {
    id: 'rsu',
    elementId: 'rsu',
    name: 'Substrate Bulk Resistance R_SU',
    symbol: 'R_{SU}',
    category: 'substrate',
    calloutTitle: 'Substrate Network',
    description: 'Bulk silicon substrate spreading resistance between internal substrate node S\' and external substrate contact terminal S.',
    manualCitation: 'Ch. 2.11, pp. 65–66, ll. 1–16; Table 3.8, p. 104, row 1',
    vaCitation: 'hicumL2V2p34.va, ll. 692, 1841–1846',
    keyParams: ['rsu'],
  },
  csu: {
    id: 'csu',
    elementId: 'csu',
    name: 'Substrate Capacitance C_SU',
    symbol: 'C_{SU}',
    category: 'substrate',
    calloutTitle: 'Substrate Network',
    description: 'Dielectric relaxation capacitance of the lossy silicon wafer substrate in parallel with substrate resistance R_SU.',
    manualCitation: 'Ch. 2.11, pp. 65–66, ll. 1–16; Table 3.8, p. 104, row 2',
    vaCitation: 'hicumL2V2p34.va, ll. 693, 1843',
    keyParams: ['csu'],
  },
  rth: {
    id: 'rth',
    elementId: 'rth',
    name: 'Thermal Resistance R_TH',
    symbol: 'R_{TH}',
    category: 'thermal',
    calloutTitle: 'Self-Heating Network',
    description: 'Self-heating thermal resistance modeling temperature rise ΔT_j in the active transistor region relative to ambient.',
    manualCitation: 'Ch. 2.15, p. 93, ll. 11–18; Table 3.16, p. 110, row 1',
    vaCitation: 'hicumL2V2p34.va, ll. 790, 1864–1868',
    keyParams: ['rth', 'flcomp'],
  },
  cth: {
    id: 'cth',
    elementId: 'cth',
    name: 'Thermal Capacitance C_TH',
    symbol: 'C_{TH}',
    category: 'thermal',
    calloutTitle: 'Self-Heating Network',
    description: 'Thermal heat capacity modeling transient thermal time constants (τ_th = R_TH × C_TH) during electro-thermal operation.',
    manualCitation: 'Ch. 2.15, p. 93, ll. 11–18; Table 3.16, p. 110, row 2',
    vaCitation: 'hicumL2V2p34.va, ll. 791, 1864–1868',
    keyParams: ['cth'],
  },
  pterm: {
    id: 'pterm',
    elementId: 'pterm',
    name: 'Dissipated Power Source P',
    symbol: 'P_{diss}',
    category: 'thermal',
    calloutTitle: 'Self-Heating Network',
    description: 'Current source injecting the instantaneous dissipated electrical power P_diss = I_C·V_CE + I_B·V_BE into the thermal network.',
    manualCitation: 'Ch. 2.15, p. 93, Eq. (2.15.0-2); p. 94, ll. 1–10',
    vaCitation: 'hicumL2V2p34.va, ll. 1864–1868',
    keyParams: ['rth', 'cth'],
  },
};

type ViewMode = 'vector' | 'reference' | 'comparison';

export const CrossSectionDiagrams: React.FC<CrossSectionDiagramsProps> = ({
  parameters,
  elements,
  onSelectParamInLab,
  onSelectElementInLab,
}) => {
  const [activeFigureTab, setActiveFigureTab] = useState<'cross_section' | 'bandgap_grading' | 'resistance_isolation'>('cross_section');
  const [viewMode, setViewMode] = useState<ViewMode>('vector');
  const [selectedCompId, setSelectedCompId] = useState<string>('it');
  const [hoveredCompId, setHoveredCompId] = useState<string | null>(null);

  const activeAnnotation = useMemo(() => {
    return EMBEDDED_ANNOTATIONS[selectedCompId] || EMBEDDED_ANNOTATIONS['it'];
  }, [selectedCompId]);

  const activeCircuitElement = useMemo(() => {
    return elements.find((e) => e.id === activeAnnotation.elementId) || elements[0];
  }, [elements, activeAnnotation]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-[#E7EEF4] dark:bg-slate-800 text-[#2B4C65] dark:text-[#7FA3C7] border border-[#C5D4E2] dark:border-slate-700 text-xs font-mono font-semibold">
                2D Physical Structure & Component Mapping
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#E6F0EE] dark:bg-emerald-950/40 text-[#2A645E] dark:text-emerald-300 border border-[#C0D8D4] dark:border-emerald-800/50 text-xs font-mono font-medium">
                Authoritative Reference · M. Schröter &amp; A. Pawlak
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tracking-tight">
              Physical Embedding of HICUM/L2 Elements into a 2D SiGe HBT
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Every resistance, capacitance, current source, and charge storage element mapped directly into its corresponding semiconductor layer, junction, and contact path—from the N⁺ emitter window down to the P⁻ substrate and self-heating network.
            </p>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center gap-1.5 bg-[#F3F2EE] dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shrink-0">
            <button
              onClick={() => setViewMode('vector')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'vector'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-[#2B4C65] dark:text-[#7FA3C7]" />
              <span>Interactive Vector</span>
            </button>
            <button
              onClick={() => setViewMode('reference')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'reference'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#2A645E] dark:text-[#52B788]" />
              <span>2D Reference</span>
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'comparison'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-[#9A5833] dark:text-amber-400" />
              <span>Split View</span>
            </button>
          </div>
        </div>

        {/* Sub-figure navigation pills */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveFigureTab('cross_section')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFigureTab === 'cross_section'
                ? 'bg-[#2B4C65] text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            1. Embedded HICUM Circuit Cross-Section (2D Reference)
          </button>
          <button
            onClick={() => setActiveFigureTab('bandgap_grading')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFigureTab === 'bandgap_grading'
                ? 'bg-[#2B4C65] text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            2. Bandgap Grading &amp; Doping Profile (Manual Fig. 2.2.0/2)
          </button>
          <button
            onClick={() => setActiveFigureTab('resistance_isolation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFigureTab === 'resistance_isolation'
                ? 'bg-[#2B4C65] text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            3. Resistances &amp; Trench Isolation (Figs. 2.7.0/1, 2.8.1–3, 2.11.0/1)
          </button>
        </div>
      </div>

      {activeFigureTab === 'cross_section' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Display Area (Left 8 Columns) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Top Toolbar: Instructions & Quick Selection Pills */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Selected Component:</span>
                <span className="font-mono font-bold text-[#2B4C65] dark:text-[#7FA3C7] px-2 py-0.5 rounded bg-[#E7EEF4] dark:bg-slate-800 border border-[#C5D4E2] dark:border-slate-700">
                  {activeAnnotation.symbol} ({activeAnnotation.name})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click any element or callout below to inspect
                </span>
              </div>
            </div>

            {/* Split View or Single View Mode */}
            {viewMode === 'comparison' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Original Reference Image */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="flex items-center gap-1.5 text-[#2A645E] dark:text-[#52B788]">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Original 2D Reference Image</span>
                    </span>
                    <span className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400">Authoritative Layout</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white">
                    <img
                      src="./docs/hicum_2d_reference.png"
                      alt="Original 2D Reference: Physical Mapping of the HICUM Model to a 3D SiGe HBT"
                      className="w-full h-auto object-contain block"
                    />
                  </div>
                </div>

                {/* Right: Interactive Vector Schematic */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="flex items-center gap-1.5 text-[#2B4C65] dark:text-[#7FA3C7]">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Interactive Vector Overlay</span>
                    </span>
                    <span className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400">Click to Select</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F7F6F2] dark:bg-slate-950">
                    {renderInteractiveVectorSvg()}
                  </div>
                </div>
              </div>
            ) : viewMode === 'reference' ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-[#2A645E] dark:text-[#52B788]">
                    <ImageIcon className="w-4 h-4" />
                    <span>Original 2D Physical Mapping Reference Image</span>
                  </span>
                  <a
                    href="./docs/hicum_2d_reference.png"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[#2B4C65] dark:text-[#7FA3C7] hover:underline"
                  >
                    <span>Open Full Image</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white shadow-inner flex justify-center p-2">
                  <img
                    src="./docs/hicum_2d_reference.png"
                    alt="Original 2D Reference of the HICUM Model physical mapping to a SiGe HBT"
                    className="max-h-[580px] w-auto object-contain block"
                  />
                </div>
              </div>
            ) : (
              /* Vector Mode: dominant interactive SVG */
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-[#2B4C65] dark:text-[#7FA3C7]">
                    <Cpu className="w-4 h-4" />
                    <span>Interactive 2D SiGe HBT Cross-Section with Embedded HICUM Circuit</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Exact Layout &amp; Callouts Matching 2D Reference
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F7F6F2] dark:bg-slate-950">
                  {renderInteractiveVectorSvg()}
                </div>
              </div>
            )}

            {/* Quick Component Selection Strip */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                Quick Element Selector (Click to Highlight &amp; Inspect):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(EMBEDDED_ANNOTATIONS).map((key) => {
                  const item = EMBEDDED_ANNOTATIONS[key];
                  const isSel = selectedCompId === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCompId(key)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                        isSel
                          ? 'bg-[#2B4C65] text-white border-[#2B4C65] font-bold shadow-2xs'
                          : 'bg-[#F7F6F2] dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-[#EAE8E1] dark:hover:bg-slate-700'
                      }`}
                    >
                      {item.symbol}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Inspector Column (Left 4 Columns) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-4">
            {/* Component Header */}
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="px-2 py-0.5 rounded bg-[#E7EEF4] dark:bg-slate-800 text-[#2B4C65] dark:text-[#7FA3C7] border border-[#C5D4E2] dark:border-slate-700 font-mono text-xs font-semibold">
                  {activeAnnotation.category.toUpperCase()} BRANCH
                </span>
                {activeAnnotation.calloutTitle && (
                  <span className="px-2 py-0.5 rounded bg-[#F4EAE3] dark:bg-amber-950/40 text-[#824726] dark:text-amber-300 border border-[#DFC8B8] dark:border-amber-900/50 font-mono text-[10.5px] font-semibold">
                    {activeAnnotation.calloutTitle}
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex items-center gap-2.5">
                <span className="text-2xl font-mono font-bold text-[#2B4C65] dark:text-[#7FA3C7]">
                  <FormulaView latex={activeAnnotation.symbol} inline />
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeAnnotation.name}
                </span>
              </div>
            </div>

            {/* Authoritative Citations */}
            <div className="space-y-1">
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
                Official Documented Citations:
              </div>
              <CitationBadges
                manualCitation={activeAnnotation.manualCitation}
                vaCitation={activeAnnotation.vaCitation}
              />
            </div>

            {/* Physical Mechanism & Description */}
            <div className="p-3 rounded-lg bg-[#F7F6F2] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#2A645E] dark:text-[#52B788] font-bold">
                Physical Mechanism &amp; Origin
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeAnnotation.description}
              </p>
            </div>

            {/* Governing Parameters */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Governing Parameters ({activeAnnotation.keyParams.length}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeAnnotation.keyParams.map((pId) => (
                  <button
                    key={pId}
                    onClick={() => onSelectParamInLab(pId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-[#E7EEF4] text-[#23435C] border border-[#C5D4E2] hover:bg-[#2B4C65] hover:text-white transition-colors"
                    title={`Inspect and tune parameter ${pId} in the Simulation Lab`}
                  >
                    <span>{pId}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>

            {/* Action Handoff to Circuit Lab */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Interactive Simulation Lab:
              </span>
              <button
                onClick={() => onSelectElementInLab(activeAnnotation.elementId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2B4C65] text-white hover:bg-[#23435C] transition-colors shadow-2xs"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Open Branch in Lab</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFigureTab === 'bandgap_grading' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Bandgap Grading &amp; Doping Profile in the Internal Base-Emitter-Collector Region (Manual Fig. 2.2.0/2, p. 16)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Spatial variation of doping concentration <FormulaView latex="N_E(x), N_B(x), N_C(x)" inline /> and effective bandgap voltage <FormulaView latex="V_{Ge}(x)" inline /> across the 1D intrinsic SiGe HBT coordinate <FormulaView latex="x" inline />.
            </p>
            <svg viewBox="0 0 680 340" className="w-full h-auto bg-[#F7F6F2] dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-2">
              <line x1={80} y1={30} x2={80} y2={295} stroke="#334155" strokeWidth={1.5} />
              <line x1={80} y1={295} x2={640} y2={295} stroke="#334155" strokeWidth={1.5} />
              <line x1={230} y1={30} x2={230} y2={295} stroke="#94A3B8" strokeDasharray="4 4" />
              <line x1={430} y1={30} x2={430} y2={295} stroke="#94A3B8" strokeDasharray="4 4" />

              <text x={155} y={48} textAnchor="middle" className="fill-[#23435C] dark:fill-[#7FA3C7] font-bold text-[12px]">
                n⁺ Emitter (N_E)
              </text>
              <text x={330} y={48} textAnchor="middle" className="fill-[#1C4642] dark:fill-[#52B788] font-bold text-[12px]">
                p-SiGe Graded Base (N_B)
              </text>
              <text x={535} y={48} textAnchor="middle" className="fill-[#6E3B1F] dark:fill-amber-400 font-bold text-[12px]">
                n⁻ Epi Collector (N_C)
              </text>

              <path
                d="M 90 75 L 180 75 Q 215 75 230 140 Q 255 110 310 115 Q 395 125 430 185 Q 465 215 620 215"
                fill="none"
                stroke="#2B4C65"
                strokeWidth={2.5}
              />
              <text x={135} y={68} className="fill-[#23435C] dark:fill-[#7FA3C7] font-mono font-semibold text-[11px]">
                log N(x) Doping
              </text>

              <path
                d="M 90 205 L 195 205 L 245 235 L 415 268 L 445 195 L 620 195"
                fill="none"
                stroke="#8A3B33"
                strokeWidth={2.5}
              />
              <text x={325} y={245} textAnchor="middle" className="fill-[#74312A] dark:fill-rose-400 font-mono font-bold text-[11px]">
                Graded Bandgap V_Ge(x) (Ge Mole Fraction)
              </text>
              <text x={455} y={185} className="fill-[#74312A] dark:fill-rose-300 font-mono text-[10px]">
                BC Barrier (vcbar, icbar)
              </text>

              <text x={230} y={315} textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 font-mono text-[11px]">
                x_jE (BE Junction)
              </text>
              <text x={430} y={315} textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 font-mono text-[11px]">
                x_jC (BC Junction)
              </text>
            </svg>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              How HICUM/L2 Captures Heterojunction Bandgap Grading
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              In a SiGe HBT, the bandgap varies spatially across the base-emitter and base-collector regions, causing the intrinsic carrier density <FormulaView latex="n_i^2(x) \propto \exp(-qV_{Ge}(x)/k_BT)" inline /> to vary with position. HICUM/L2 incorporates this directly into the Generalized Integral Charge-Control Relation (GICCR) via physically derived charge weighting factors:
            </p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <FormulaView
                latex="Q_{p,T} = Q_{p0} + h_{jEi}(v_{B'E'})Q_{jEi} + h_{jCi}Q_{jCi} + h_{f0}Q_{f0} + h_{fE}\Delta Q_{Ef} + h_{fC}\Delta Q_{Cf} + Q_{Bf}"
                displayMode
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['hjei', 'ahjei', 'rhjei', 'hjci', 'hf0', 'hfe', 'hfc', 'vcbar', 'icbar', 'acbar'].map((p) => (
                <button
                  key={p}
                  onClick={() => onSelectParamInLab(p)}
                  className="px-2.5 py-1 rounded bg-[#E7EEF4] dark:bg-slate-800 text-[#23435C] dark:text-[#7FA3C7] border border-[#C5D4E2] dark:border-slate-700 text-xs font-mono hover:bg-[#DCE6EF] dark:hover:bg-slate-700"
                >
                  {p} ↗
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeFigureTab === 'resistance_isolation' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              1. External Base Resistance Breakdown (Manual Fig. 2.7.0/1, p. 48)
            </h3>
            <div className="my-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800">
              <FormulaView latex="R_{Bx} = r_{KB} + r_{po} + r_{pm} + r_{sp}" displayMode={false} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Decomposes the extrinsic base path between terminal <code>B</code> and perimeter node <code>B*</code> into contact resistance (<FormulaView latex="r_{KB}" inline />), poly-on-oxide sheet resistance (<FormulaView latex="r_{po}" inline />), poly-to-monosilicon transition (<FormulaView latex="r_{pm}" inline />), and link-base under the spacer (<FormulaView latex="r_{sp}" inline />).
            </p>
            <div className="mt-3 flex gap-1.5">
              <button
                onClick={() => onSelectElementInLab('rbx')}
                className="px-2.5 py-1 rounded bg-[#E6F0EE] dark:bg-emerald-950/40 text-[#1C4642] dark:text-emerald-300 border border-[#C0D8D4] dark:border-emerald-800/50 text-xs font-mono"
              >
                Element: rbx ↗
              </button>
              <button
                onClick={() => onSelectParamInLab('rbx')}
                className="px-2.5 py-1 rounded bg-[#E7EEF4] dark:bg-slate-800 text-[#23435C] dark:text-[#7FA3C7] border border-[#C5D4E2] dark:border-slate-700 text-xs font-mono"
              >
                Param: rbx ↗
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              2. Collector Buried Layer &amp; Sinker Path (Manual Fig. 2.8.2/1, p. 53)
            </h3>
            <div className="my-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800">
              <FormulaView latex="R_{Cx} = r_{bl} + r_{sink} + r_{KC}" displayMode={false} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Models the ohmic series path from the bottom of the active epitaxial collector (internal node <code>C&apos;</code>) laterally through the <FormulaView latex="n^+" inline /> buried layer (<FormulaView latex="r_{bl}" inline />), vertically up the collector sinker (<FormulaView latex="r_{sink}" inline />), and through the collector contact (<FormulaView latex="r_{KC}" inline />) to terminal <code>C</code>.
            </p>
            <div className="mt-3 flex gap-1.5">
              <button
                onClick={() => onSelectElementInLab('rcx')}
                className="px-2.5 py-1 rounded bg-[#E6F0EE] dark:bg-emerald-950/40 text-[#1C4642] dark:text-emerald-300 border border-[#C0D8D4] dark:border-emerald-800/50 text-xs font-mono"
              >
                Element: rcx ↗
              </button>
              <button
                onClick={() => onSelectParamInLab('rcx')}
                className="px-2.5 py-1 rounded bg-[#E7EEF4] dark:bg-slate-800 text-[#23435C] dark:text-[#7FA3C7] border border-[#C5D4E2] dark:border-slate-700 text-xs font-mono"
              >
                Param: rcx ↗
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              3. Collector-Substrate Trench Variants (Manual Fig. 2.11.0/1, p. 61)
            </h3>
            <div className="my-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800">
              <FormulaView latex="C_{CS} = C_{jS}(v_{S'C'}) + C_{SCp}(v_{SC})" displayMode={false} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Compares junction isolation, Shallow Trench Isolation (STI), and Deep Trench Isolation (DTI). Bottom subcollector-to-substrate capacitance <FormulaView latex="C_{jS}" inline /> connects to internal substrate node <code>S&apos;</code>, while perimeter sidewall capacitance <FormulaView latex="C_{SCp}" inline /> connects between <code>S</code> and <code>C</code>.
            </p>
            <div className="mt-3 flex gap-1.5 flex-wrap">
              <button
                onClick={() => onSelectElementInLab('cjs')}
                className="px-2.5 py-1 rounded bg-[#E6F0EE] dark:bg-emerald-950/40 text-[#1C4642] dark:text-emerald-300 border border-[#C0D8D4] dark:border-emerald-800/50 text-xs font-mono"
              >
                Element: cjs ↗
              </button>
              <button
                onClick={() => onSelectElementInLab('cscp')}
                className="px-2.5 py-1 rounded bg-[#E6F0EE] dark:bg-emerald-950/40 text-[#1C4642] dark:text-emerald-300 border border-[#C0D8D4] dark:border-emerald-800/50 text-xs font-mono"
              >
                Element: cscp ↗
              </button>
              <button
                onClick={() => onSelectElementInLab('rsu')}
                className="px-2.5 py-1 rounded bg-[#E6F0EE] dark:bg-emerald-950/40 text-[#1C4642] dark:text-emerald-300 border border-[#C0D8D4] dark:border-emerald-800/50 text-xs font-mono"
              >
                Element: rsu ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* Helper function to render the interactive SVG */
  function renderInteractiveVectorSvg() {
    return (
      <svg
        viewBox="0 0 940 575"
        className="w-full h-auto select-none font-sans"
      >
        {/* Definitions for arrowheads */}
        <defs>
          <marker
            id="red-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#DC2626" />
          </marker>
        </defs>

        {/* ---------------------------------------------------- 1. Semiconductor Layers & Regions */}
        {/* P- Substrate Background Bulk */}
        <rect x={40} y={370} width={860} height={135} fill="#E2EEEA" stroke="#ADC7C0" strokeWidth={1.2} />

        {/* P+ Isolation Wells on Left & Right */}
        <path d="M 40 145 C 75 160 85 300 85 410 L 40 410 Z" fill="#9FB4EB" fillOpacity={0.65} stroke="#8299D6" strokeWidth={1} />
        <path d="M 690 145 C 690 280 750 410 750 410 L 795 410 C 795 280 750 145 750 145 Z" fill="#9FB4EB" fillOpacity={0.65} stroke="#8299D6" strokeWidth={1} />
        <path d="M 810 145 C 810 280 870 410 870 410 L 900 410 L 900 145 Z" fill="#9FB4EB" fillOpacity={0.65} stroke="#8299D6" strokeWidth={1} />

        {/* N+ Buried Layer & Sinker */}
        <path
          d="M 125 315 L 690 315 L 690 285 L 650 285 L 650 145 L 690 145 L 690 370 L 125 370 Z"
          fill="#FDE6B0"
          stroke="#E5B962"
          strokeWidth={1.2}
        />

        {/* N- Epitaxy Layer */}
        <rect x={125} y={265} width={525} height={50} fill="#C0D7F5" fillOpacity={0.7} stroke="#99BAE5" strokeWidth={1} />

        {/* P Base Layer */}
        <path
          d="M 125 145 L 610 145 C 610 190 590 265 520 265 L 125 265 Z"
          fill="#FCA5A5"
          fillOpacity={0.55}
          stroke="#EF4444"
          strokeWidth={1.1}
        />

        {/* N+ Emitter Layer */}
        <rect x={245} y={145} width={345} height={42} rx={6} fill="#60A5FA" fillOpacity={0.85} stroke="#2563EB" strokeWidth={1.3} />

        {/* Metal Contact Electrodes (Surface Metallization) */}
        <rect x={50} y={135} width={150} height={12} fill="#64748B" rx={1} />
        <rect x={235} y={135} width={365} height={12} fill="#64748B" rx={1} />
        <rect x={630} y={135} width={50} height={12} fill="#64748B" rx={1} />
        <rect x={730} y={135} width={50} height={12} fill="#64748B" rx={1} />
        <rect x={830} y={135} width={70} height={12} fill="#64748B" rx={1} />

        {/* Region Labels with Badges */}
        <g className="font-sans font-medium text-[11px] select-none pointer-events-none">
          {/* P Base badge */}
          <rect x={145} y={160} width={58} height={20} rx={3} fill="#FFFFFF" stroke="#94A3B8" strokeWidth={0.8} />
          <text x={174} y={174} textAnchor="middle" className="fill-slate-800 font-semibold">P Base</text>

          {/* N+ Emitter badge */}
          <rect x={360} y={154} width={78} height={20} rx={3} fill="#FFFFFF" stroke="#94A3B8" strokeWidth={0.8} />
          <text x={399} y={168} textAnchor="middle" className="fill-slate-800 font-semibold">N⁺ Emitter</text>

          {/* N- Epitaxy badge */}
          <rect x={80} y={278} width={92} height={20} rx={3} fill="#FFFFFF" stroke="#94A3B8" strokeWidth={0.8} />
          <text x={126} y={292} textAnchor="middle" className="fill-slate-800 font-semibold">N⁻ Epitaxy</text>

          {/* N+ Buried Layer badge */}
          <rect x={372} y={335} width={124} height={20} rx={3} fill="#FFFFFF" stroke="#94A3B8" strokeWidth={0.8} />
          <text x={434} y={349} textAnchor="middle" className="fill-slate-800 font-semibold">N⁺ Buried Layer</text>

          {/* Sinker text */}
          <text x={668} y={230} textAnchor="middle" transform="rotate(-90, 668, 230)" className="fill-slate-700 font-semibold text-[11px]">Sinker</text>

          {/* P- Substrate badge */}
          <rect x={550} y={438} width={94} height={20} rx={3} fill="#FFFFFF" stroke="#94A3B8" strokeWidth={0.8} />
          <text x={597} y={452} textAnchor="middle" className="fill-slate-800 font-semibold">P⁻ Substrate</text>

          {/* P+ Well text */}
          <text x={765} y={230} textAnchor="middle" transform="rotate(-90, 765, 230)" className="fill-slate-700 font-semibold text-[11px]">P+ Well</text>
        </g>

        {/* ---------------------------------------------------- 2. External Terminals & Leads */}
        <g stroke="#334155" strokeWidth={1.5} fill="none">
          {/* Base Terminal B */}
          <line x1={180} y1={52} x2={180} y2={220} />
          {/* Emitter Terminal E */}
          <line x1={560} y1={52} x2={560} y2={105} />
          <line x1={560} y1={125} x2={560} y2={165} />
          {/* Collector Terminal C */}
          <line x1={665} y1={52} x2={665} y2={365} />
          {/* Substrate Terminal S */}
          <line x1={795} y1={52} x2={795} y2={475} />
        </g>

        {/* Red Terminal Badges */}
        <g className="font-sans font-bold text-[15px] fill-[#DC2626] select-none pointer-events-none">
          <text x={180} y={40} textAnchor="middle">B</text>
          <text x={560} y={40} textAnchor="middle">E</text>
          <text x={665} y={40} textAnchor="middle">C</text>
          <text x={795} y={40} textAnchor="middle">S</text>
          <circle cx={180} cy={52} r={3.5} fill="#FFFFFF" stroke="#334155" strokeWidth={1.5} />
          <circle cx={560} cy={52} r={3.5} fill="#FFFFFF" stroke="#334155" strokeWidth={1.5} />
          <circle cx={665} cy={52} r={3.5} fill="#FFFFFF" stroke="#334155" strokeWidth={1.5} />
          <circle cx={795} cy={52} r={3.5} fill="#FFFFFF" stroke="#334155" strokeWidth={1.5} />
        </g>

        {/* ---------------------------------------------------- 3. Circuit Wiring & Interconnects */}
        <g stroke="#1E293B" strokeWidth={1.3} fill="none">
          {/* CEOX wiring across top between B and E */}
          <line x1={230} y1={120} x2={230} y2={85} />
          <line x1={230} y1={85} x2={530} y2={85} />
          <line x1={530} y1={85} x2={530} y2={120} />

          {/* Emitter rail under E' */}
          <line x1={260} y1={165} x2={560} y2={165} />

          {/* Main Base rail from B through RBX to B* and through RBI to B' */}
          <line x1={180} y1={220} x2={320} y2={220} />
          {/* AC crowding bypass C_RBI */}
          <line x1={320} y1={220} x2={340} y2={195} />
          <line x1={340} y1={195} x2={410} y2={195} />
          <line x1={410} y1={195} x2={430} y2={220} />
          {/* Lower RBI branch */}
          <line x1={320} y1={220} x2={430} y2={220} />
          {/* Intrinsic base rail from B' */}
          <line x1={430} y1={220} x2={540} y2={220} />

          {/* Extrinsic vertical branches from B / B* */}
          <line x1={180} y1={220} x2={180} y2={290} />
          <line x1={235} y1={220} x2={235} y2={290} />
          <line x1={260} y1={165} x2={260} y2={290} />
          <line x1={290} y1={165} x2={290} y2={290} />
          <line x1={320} y1={165} x2={320} y2={430} />

          {/* Extrinsic Epitaxy Collector lower rail */}
          <line x1={180} y1={290} x2={320} y2={290} />

          {/* Intrinsic vertical branches from B' to Emitter and Collector */}
          <line x1={445} y1={165} x2={445} y2={290} />
          <line x1={475} y1={165} x2={475} y2={290} />
          <line x1={505} y1={165} x2={505} y2={290} />
          <line x1={535} y1={220} x2={535} y2={290} />
          <line x1={560} y1={165} x2={560} y2={290} />

          {/* Intrinsic Collector lower rail C' */}
          <line x1={445} y1={290} x2={560} y2={290} />

          {/* Collector path C' -> RCX -> Sinker -> C */}
          <line x1={560} y1={290} x2={560} y2={365} />
          <line x1={560} y1={365} x2={665} y2={365} />

          {/* Substrate path: S' and Q_JS, I_SC */}
          <line x1={235} y1={290} x2={235} y2={350} />
          <line x1={260} y1={290} x2={260} y2={350} />
          <line x1={235} y1={430} x2={455} y2={430} />
          <line x1={235} y1={350} x2={235} y2={430} />
          <line x1={260} y1={350} x2={260} y2={430} />

          {/* Substrate network R_SU || C_SU to Terminal S */}
          <line x1={455} y1={430} x2={470} y2={475} />
          <line x1={470} y1={475} x2={525} y2={475} />
          <line x1={455} y1={430} x2={470} y2={445} />
          <line x1={470} y1={445} x2={525} y2={445} />
          <line x1={525} y1={445} x2={540} y2={475} />
          <line x1={540} y1={475} x2={795} y2={475} />
        </g>

        {/* ---------------------------------------------------- 4. Internal Nodes (E', B*, B', C', S') */}
        <g className="font-mono font-bold text-[12px] fill-[#0F172A] select-none">
          {/* E' node */}
          <circle cx={560} cy={165} r={4.5} fill="#0F172A" />
          <text x={552} y={155}>E&apos;</text>

          {/* B* node */}
          <circle cx={320} cy={220} r={4.5} fill="#0F172A" />
          <text x={328} y={225}>B*</text>

          {/* B' node */}
          <circle cx={430} cy={220} r={4.5} fill="#0F172A" />
          <text x={418} y={235}>B&apos;</text>

          {/* C' node */}
          <circle cx={560} cy={290} r={4.5} fill="#0F172A" />
          <text x={568} y={295}>C&apos;</text>

          {/* S' node */}
          <circle cx={320} cy={430} r={4.5} fill="#0F172A" />
          <text x={328} y={438}>S&apos;</text>
        </g>

        {/* ---------------------------------------------------- 5. Circuit Elements & Components */}
        {/* CEOX Capacitor across top */}
        {renderSvgCapacitor(380, 85, 'horizontal', 'ceox', 'C_{EOX}', 24)}

        {/* RE Emitter Resistor */}
        {renderSvgResistor(560, 115, 'vertical', 're', 'R_E', 20)}

        {/* RBX Extrinsic Base Resistor */}
        {renderSvgResistor(210, 220, 'horizontal', 'rbx', 'R_{BX}', 20)}

        {/* CRBI AC Crowding Capacitor */}
        {renderSvgCapacitor(375, 195, 'horizontal', 'crbi', 'C_{RBI}', 20)}

        {/* RBI Internal Base Resistor */}
        {renderSvgResistor(375, 220, 'horizontal', 'rbi', 'R_{BI}', 20)}

        {/* Q_BCX1 Capacitor */}
        {renderSvgCapacitor(180, 255, 'vertical', 'qbcx1', 'Q_{BCX1}', 18)}

        {/* Q_BCX2 Capacitor */}
        {renderSvgCapacitor(235, 255, 'vertical', 'qbcx2', 'Q_{BCX2}', 18)}

        {/* I_BEP Diode & Q_JEP Capacitor (Peripheral BE) */}
        {renderSvgDiode(260, 190, 'up', 'ibep', 'I_{BEP}')}
        {renderSvgCapacitor(290, 190, 'vertical', 'qjep', 'Q_{JEP}', 18)}

        {/* I_BET Tunneling Current Source */}
        {renderSvgCurrentSource(320, 190, 'down', 'ibet', 'I_{BET}')}

        {/* I_BCX Diode & Q_DS Capacitor (Extrinsic BC) */}
        {renderSvgDiode(260, 255, 'up', 'ibcx', 'I_{BCX}')}
        {renderSvgCapacitor(290, 255, 'vertical', 'qds', 'Q_{DS}', 18)}

        {/* I_BEI Diode, Q_JEI Capacitor, Q_DE Capacitor (Intrinsic BE stack) */}
        {renderSvgDiode(445, 190, 'up', 'ibei', 'I_{BEI}')}
        {renderSvgCapacitor(475, 190, 'vertical', 'qjei', 'Q_{JEI}', 18)}
        {renderSvgCapacitor(505, 190, 'vertical', 'qde', 'Q_{DE}', 18)}

        {/* I_BCI Diode, Q_JCI Capacitor, Q_DC Capacitor, I_AVL (Intrinsic BC stack) */}
        {renderSvgDiode(445, 255, 'up', 'ibci', 'I_{BCI}')}
        {renderSvgCapacitor(475, 255, 'vertical', 'qjci', 'Q_{JCI}', 18)}
        {renderSvgCapacitor(505, 255, 'vertical', 'qdc', 'Q_{DC}', 18)}
        {renderSvgCurrentSource(535, 255, 'down', 'iavl', 'I_{AVL}')}

        {/* I_T Main Transfer Current Source */}
        {renderSvgCurrentSource(560, 227, 'down', 'it', 'I_T')}

        {/* R_CX Collector Series Resistor in Buried Layer */}
        {renderSvgResistor(615, 365, 'horizontal', 'rcx', 'R_{CX}', 22)}

        {/* Q_JS Capacitor & I_SC Diode in Substrate */}
        {renderSvgCapacitor(235, 390, 'vertical', 'qjs', 'Q_{JS}', 18)}
        {renderSvgDiode(260, 390, 'down', 'isc', 'I_{SC}')}

        {/* I_TS Parasitic Substrate Current Source */}
        {renderSvgCurrentSource(320, 350, 'down', 'its', 'I_{TS}')}

        {/* Substrate Network R_SU and C_SU in Parallel */}
        {renderSvgResistor(500, 475, 'horizontal', 'rsu', 'R_{SU}', 22)}
        {renderSvgCapacitor(500, 445, 'horizontal', 'csu', 'C_{SU}', 22)}

        {/* ---------------------------------------------------- 6. Self-Heating Network Inset (Bottom-Left) */}
        <g
          onClick={() => setSelectedCompId('rth')}
          className="cursor-pointer"
        >
          {/* Yellow Inset Box with Red Border */}
          <rect
            x={60}
            y={395}
            width={125}
            height={90}
            fill="#FEF9C3"
            stroke="#DC2626"
            strokeWidth={1.8}
            rx={4}
          />
          {/* Lead wire */}
          <line x1={80} y1={435} x2={165} y2={435} stroke="#1E293B" strokeWidth={1.3} />
          <line x1={100} y1={435} x2={100} y2={472} stroke="#1E293B" strokeWidth={1.3} />
          <line x1={130} y1={435} x2={130} y2={472} stroke="#1E293B" strokeWidth={1.3} />
          <line x1={160} y1={435} x2={160} y2={472} stroke="#1E293B" strokeWidth={1.3} />
          {/* Ground rails */}
          <line x1={95} y1={472} x2={165} y2={472} stroke="#1E293B" strokeWidth={1.3} />
          <line x1={130} y1={472} x2={130} y2={478} stroke="#1E293B" strokeWidth={1.3} />
          <line x1={123} y1={478} x2={137} y2={478} stroke="#1E293B" strokeWidth={1.3} />
          <line x1={126} y1={481} x2={134} y2={481} stroke="#1E293B" strokeWidth={1.3} />

          {/* Node Delta TJ */}
          <circle cx={130} cy={435} r={3.5} fill="#0F172A" />
          <text x={130} y={425} textAnchor="middle" className="font-sans font-bold text-[11px] fill-[#0F172A]">
            ΔT_J
          </text>

          {/* Current Source P */}
          <circle cx={100} cy={453} r={8.5} fill="#FFFFFF" stroke="#1E293B" strokeWidth={1.3} />
          <text x={84} y={456} className="font-sans font-bold text-[9px] fill-[#0F172A]">P</text>

          {/* Capacitor CTH */}
          <line x1={124} y1={451} x2={136} y2={451} stroke="#1E293B" strokeWidth={1.6} />
          <line x1={124} y1={455} x2={136} y2={455} stroke="#1E293B" strokeWidth={1.6} />
          <text x={112} y={446} className="font-sans font-bold text-[8.5px] fill-[#0F172A]">C_TH</text>

          {/* Resistor RTH */}
          <rect x={156} y={446} width={8} height={15} rx={1} fill="#FFFFFF" stroke="#1E293B" strokeWidth={1.3} />
          <text x={168} y={457} className="font-sans font-bold text-[8.5px] fill-[#0F172A]">R_TH</text>
        </g>

        {/* ---------------------------------------------------- 7. Functional Callouts & Leader Arrows */}
        <g className="font-sans font-bold text-[12px] fill-[#1D4ED8] select-none">
          {/* 1. Tunneling Current */}
          <g onClick={() => setSelectedCompId('ibet')} className="cursor-pointer">
            <text x={260} y={42} textAnchor="middle">Tunneling Current</text>
            <path d="M 260 48 L 320 178" stroke="#DC2626" strokeWidth={1.4} markerEnd="url(#red-arrow)" fill="none" />
          </g>

          {/* 2. Extrinsic Transistor */}
          <g onClick={() => setSelectedCompId('ibep')} className="cursor-pointer">
            <text x={115} y={92} textAnchor="middle">Extrinsic</text>
            <text x={115} y={106} textAnchor="middle">Transistor</text>
            <path d="M 155 110 L 250 175" stroke="#DC2626" strokeWidth={1.4} markerEnd="url(#red-arrow)" fill="none" />
          </g>

          {/* 3. AC Crowding */}
          <g onClick={() => setSelectedCompId('crbi')} className="cursor-pointer">
            <text x={440} y={55} textAnchor="middle">AC Crowding</text>
            <path d="M 440 62 L 375 185" stroke="#DC2626" strokeWidth={1.4} markerEnd="url(#red-arrow)" fill="none" />
          </g>

          {/* 4. Intrinsic Transistor */}
          <g onClick={() => setSelectedCompId('it')} className="cursor-pointer">
            <text x={640} y={75} textAnchor="middle">Intrinsic Transistor</text>
            <path d="M 640 82 L 565 160" stroke="#DC2626" strokeWidth={1.4} markerEnd="url(#red-arrow)" fill="none" />
          </g>

          {/* 5. Avalanche Current */}
          <g onClick={() => setSelectedCompId('iavl')} className="cursor-pointer">
            <text x={780} y={360} textAnchor="middle">Avalanche</text>
            <text x={780} y={375} textAnchor="middle">Current</text>
            <path d="M 740 365 L 545 260" stroke="#DC2626" strokeWidth={1.4} markerEnd="url(#red-arrow)" fill="none" />
          </g>

          {/* 6. Substrate PNP */}
          <g onClick={() => setSelectedCompId('qjs')} className="cursor-pointer">
            <text x={95} y={350} textAnchor="middle">Substrate PNP</text>
            <path d="M 145 350 L 225 385" stroke="#DC2626" strokeWidth={1.4} markerEnd="url(#red-arrow)" fill="none" />
          </g>

          {/* 7. Substrate Network */}
          <g onClick={() => setSelectedCompId('rsu')} className="cursor-pointer">
            <text x={530} y={512} textAnchor="middle">Substrate Network</text>
            <path d="M 470 505 L 490 480" stroke="#DC2626" strokeWidth={1.4} markerEnd="url(#red-arrow)" fill="none" />
          </g>

          {/* 8. Self-Heating Network */}
          <g onClick={() => setSelectedCompId('rth')} className="cursor-pointer">
            <text x={260} y={430} textAnchor="middle">Self-Heating</text>
            <text x={260} y={445} textAnchor="middle">Network</text>
            <path d="M 215 435 L 190 435" stroke="#DC2626" strokeWidth={1.4} markerEnd="url(#red-arrow)" fill="none" />
          </g>
        </g>

        {/* ---------------------------------------------------- 8. Publication Material & Element Legend */}
        <g className="font-sans text-[11px] select-none">
          {/* Subtle separator line */}
          <line x1={40} y1={525} x2={900} y2={525} stroke="#E2E8F0" strokeWidth={1} />

          {/* Group Header */}
          <text x={42} y={549} className="fill-slate-600 font-semibold text-[11.5px]">
            Material (SiGe HBT)
          </text>

          {/* N+ Emitter Swatch */}
          <rect x={180} y={537} width={18} height={13} rx={2} fill="#60A5FA" stroke="#2563EB" strokeWidth={1} />
          <text x={204} y={548} className="fill-slate-700 font-medium">N⁺ (Emitter)</text>

          {/* P Base Swatch */}
          <rect x={290} y={537} width={18} height={13} rx={2} fill="#FCA5A5" stroke="#EF4444" strokeWidth={1} />
          <text x={314} y={548} className="fill-slate-700 font-medium">P (Base, SiGe)</text>

          {/* N+ Buried Layer Swatch */}
          <rect x={422} y={537} width={18} height={13} rx={2} fill="#FDE6B0" stroke="#E5B962" strokeWidth={1} />
          <text x={446} y={548} className="fill-slate-700 font-medium">N⁺ (Buried Layer)</text>

          {/* P- Substrate Swatch */}
          <rect x={565} y={537} width={18} height={13} rx={2} fill="#E2EEEA" stroke="#ADC7C0" strokeWidth={1} />
          <text x={589} y={548} className="fill-slate-700 font-medium">P⁻ (Substrate)</text>

          {/* Contact / Metal Swatch */}
          <rect x={692} y={537} width={18} height={13} rx={1} fill="#64748B" />
          <text x={716} y={548} className="fill-slate-700 font-medium">Contact / Metal</text>

          {/* Embedded Element Pill Badge */}
          <rect x={815} y={533} width={85} height={22} rx={11} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={1} />
          <circle cx={827} cy={544} r={2.5} fill="#FFFFFF" stroke="#1E293B" strokeWidth={1.2} />
          <line x1={829.5} y1={544} x2={838.5} y2={544} stroke="#1E293B" strokeWidth={1.2} />
          <circle cx={841} cy={544} r={2.5} fill="#FFFFFF" stroke="#1E293B" strokeWidth={1.2} />
          <text x={847} y={548} className="fill-slate-600 font-mono text-[9px] font-semibold">HICUM</text>
        </g>
      </svg>
    );
  }

  /* Helper to render resistor glyph */
  function renderSvgResistor(cx: number, cy: number, orientation: 'horizontal' | 'vertical', compId: string, label: string, size = 20) {
    const isSel = selectedCompId === compId;
    const isHov = hoveredCompId === compId;
    const isVert = orientation === 'vertical';
    const w = isVert ? 8.5 : size;
    const h = isVert ? size : 8.5;

    return (
      <g
        onClick={(e) => {
          e.stopPropagation();
          setSelectedCompId(compId);
        }}
        onMouseEnter={() => setHoveredCompId(compId)}
        onMouseLeave={() => setHoveredCompId(null)}
        className="cursor-pointer"
      >
        <rect
          x={cx - w / 2}
          y={cy - h / 2}
          width={w}
          height={h}
          rx={1}
          fill={isSel ? '#FEF3EE' : '#FFFFFF'}
          stroke={isSel ? '#DC2626' : isHov ? '#2B4C65' : '#1E293B'}
          strokeWidth={isSel ? 2.2 : 1.4}
        />
        <text
          x={isVert ? cx + 8 : cx}
          y={isVert ? cy + 4 : cy - 8}
          textAnchor={isVert ? 'start' : 'middle'}
          className={`font-mono text-[9px] font-bold ${
            isSel ? 'fill-[#DC2626]' : 'fill-[#0F172A]'
          }`}
        >
          {label}
        </text>
      </g>
    );
  }

  /* Helper to render capacitor glyph */
  function renderSvgCapacitor(cx: number, cy: number, orientation: 'horizontal' | 'vertical', compId: string, label: string, span = 20) {
    const isSel = selectedCompId === compId;
    const isHov = hoveredCompId === compId;
    const isVert = orientation === 'vertical';
    const strokeC = isSel ? '#DC2626' : isHov ? '#2B4C65' : '#1E293B';
    const strokeW = isSel ? 2.4 : 1.6;

    return (
      <g
        onClick={(e) => {
          e.stopPropagation();
          setSelectedCompId(compId);
        }}
        onMouseEnter={() => setHoveredCompId(compId)}
        onMouseLeave={() => setHoveredCompId(null)}
        className="cursor-pointer"
      >
        {isVert ? (
          <g>
            <line x1={cx - 7} y1={cy - 2.5} x2={cx + 7} y2={cy - 2.5} stroke={strokeC} strokeWidth={strokeW} strokeLinecap="round" />
            <line x1={cx - 7} y1={cy + 2.5} x2={cx + 7} y2={cy + 2.5} stroke={strokeC} strokeWidth={strokeW} strokeLinecap="round" />
            <text x={cx + 9} y={cy + 3} className={`font-mono text-[8.5px] font-bold ${isSel ? 'fill-[#DC2626]' : 'fill-[#0F172A]'}`}>
              {label}
            </text>
          </g>
        ) : (
          <g>
            <line x1={cx - 2.5} y1={cy - 7} x2={cx - 2.5} y2={cy + 7} stroke={strokeC} strokeWidth={strokeW} strokeLinecap="round" />
            <line x1={cx + 2.5} y1={cy - 7} x2={cx + 2.5} y2={cy + 7} stroke={strokeC} strokeWidth={strokeW} strokeLinecap="round" />
            <text x={cx} y={cy - 9} textAnchor="middle" className={`font-mono text-[8.5px] font-bold ${isSel ? 'fill-[#DC2626]' : 'fill-[#0F172A]'}`}>
              {label}
            </text>
          </g>
        )}
      </g>
    );
  }

  /* Helper to render diode glyph */
  function renderSvgDiode(cx: number, cy: number, direction: 'up' | 'down', compId: string, label: string) {
    const isSel = selectedCompId === compId;
    const isHov = hoveredCompId === compId;
    const strokeC = isSel ? '#DC2626' : isHov ? '#2B4C65' : '#1E293B';
    const strokeW = isSel ? 2.2 : 1.4;

    const points = direction === 'up'
      ? `${cx - 6.5},${cy + 5} ${cx + 6.5},${cy + 5} ${cx},${cy - 5}`
      : `${cx - 6.5},${cy - 5} ${cx + 6.5},${cy - 5} ${cx},${cy + 5}`;
    const barY = direction === 'up' ? cy - 5 : cy + 5;

    return (
      <g
        onClick={(e) => {
          e.stopPropagation();
          setSelectedCompId(compId);
        }}
        onMouseEnter={() => setHoveredCompId(compId)}
        onMouseLeave={() => setHoveredCompId(null)}
        className="cursor-pointer"
      >
        <polygon points={points} fill="#FFFFFF" stroke={strokeC} strokeWidth={strokeW} />
        <line x1={cx - 6.5} y1={barY} x2={cx + 6.5} y2={barY} stroke={strokeC} strokeWidth={strokeW} />
        <text x={cx - 8} y={cy + 3} textAnchor="end" className={`font-mono text-[8.5px] font-bold ${isSel ? 'fill-[#DC2626]' : 'fill-[#0F172A]'}`}>
          {label}
        </text>
      </g>
    );
  }

  /* Helper to render current source glyph */
  function renderSvgCurrentSource(cx: number, cy: number, direction: 'up' | 'down', compId: string, label: string) {
    const isSel = selectedCompId === compId;
    const isHov = hoveredCompId === compId;
    const strokeC = isSel ? '#DC2626' : isHov ? '#2B4C65' : '#1E293B';
    const strokeW = isSel ? 2.2 : 1.4;

    return (
      <g
        onClick={(e) => {
          e.stopPropagation();
          setSelectedCompId(compId);
        }}
        onMouseEnter={() => setHoveredCompId(compId)}
        onMouseLeave={() => setHoveredCompId(null)}
        className="cursor-pointer"
      >
        <circle cx={cx} cy={cy} r={9} fill="#FFFFFF" stroke={strokeC} strokeWidth={strokeW} />
        {/* Arrow inside */}
        {direction === 'down' ? (
          <path d={`M ${cx} ${cy - 5} L ${cx} ${cy + 5} M ${cx - 3.5} ${cy + 1.5} L ${cx} ${cy + 5} L ${cx + 3.5} ${cy + 1.5}`} stroke={strokeC} strokeWidth={strokeW} fill="none" strokeLinecap="round" />
        ) : (
          <path d={`M ${cx} ${cy + 5} L ${cx} ${cy - 5} M ${cx - 3.5} ${cy - 1.5} L ${cx} ${cy - 5} L ${cx + 3.5} ${cy - 1.5}`} stroke={strokeC} strokeWidth={strokeW} fill="none" strokeLinecap="round" />
        )}
        <text x={cx + 12} y={cy + 3} className={`font-mono text-[9px] font-bold ${isSel ? 'fill-[#DC2626]' : 'fill-[#0F172A]'}`}>
          {label}
        </text>
      </g>
    );
  }
};

export default CrossSectionDiagrams;
