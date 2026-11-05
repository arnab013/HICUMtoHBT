import React, { useState } from 'react';
import {
  CircuitElement,
  CircuitNode,
  OperatingPointResult,
} from '../data/hicumTypes';
import { TOPOLOGY_DESIGN_NOTES } from '../data/hicumCircuit';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Cpu,
  Eye,
  Info,
  Flame,
  Activity,
  Radio,
} from 'lucide-react';

interface EquivalentCircuitDiagramProps {
  nodes: CircuitNode[];
  elements: CircuitElement[];
  selectedElementId: string | null;
  selectedNodeId: string | null;
  highlightedElementIds?: string[];
  opResult: OperatingPointResult;
  onSelectElement: (elementId: string) => void;
  onSelectNode: (nodeId: string) => void;
}

type NetworkFilter = 'all' | 'main_core' | 'extrinsic_sub' | 'adjuncts';

function formatCompactVal(val: number | undefined, unit: string): string {
  if (val === undefined || !Number.isFinite(val)) return '';
  const abs = Math.abs(val);
  if (abs === 0) return `0${unit}`;
  if (unit === 'A') {
    if (abs >= 1e-3) return `${(val * 1e3).toFixed(2)}mA`;
    if (abs >= 1e-6) return `${(val * 1e6).toFixed(1)}μA`;
    if (abs >= 1e-9) return `${(val * 1e9).toFixed(1)}nA`;
    return `${val.toExponential(1)}A`;
  }
  if (unit === 'F') {
    if (abs >= 1e-12) return `${(val * 1e12).toFixed(2)}pF`;
    return `${(val * 1e15).toFixed(2)}fF`;
  }
  if (unit === 'Ω') {
    return `${val.toFixed(1)}Ω`;
  }
  if (unit === 'W') {
    return `${(val * 1e3).toFixed(2)}mW`;
  }
  return `${val.toFixed(2)}${unit}`;
}

interface SchematicComponentCoord {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  subLabel: string;
  categoryColor: string;
  kind: 'resistor' | 'capacitor' | 'diode' | 'source' | 'adjunct';
}

const SCHEMATIC_COORDS: SchematicComponentCoord[] = [
  // Series resistances
  { id: 'rbx', x: 132, y: 242, w: 66, h: 28, label: 'R_Bx', subLabel: 'Ext. Base', categoryColor: '#2B4C65', kind: 'resistor' },
  { id: 'rbi', x: 325, y: 242, w: 72, h: 28, label: 'R_bi*', subLabel: 'Pinch Base', categoryColor: '#2B4C65', kind: 'resistor' },
  { id: 'crbi', x: 325, y: 194, w: 72, h: 26, label: 'C_rBi', subLabel: 'AC Crowding', categoryColor: '#2A645E', kind: 'capacitor' },
  { id: 'rcx', x: 560, y: 52, w: 66, h: 28, label: 'R_Cx', subLabel: 'Ext. Coll.', categoryColor: '#2B4C65', kind: 'resistor' },
  { id: 're', x: 560, y: 444, w: 66, h: 28, label: 'R_E', subLabel: 'Emitter Res.', categoryColor: '#2B4C65', kind: 'resistor' },

  // Parasitic BE isolation capacitances
  { id: 'cbepar1', x: 75, y: 365, w: 68, h: 26, label: 'C_BEpar1', subLabel: 'Outer Spacer', categoryColor: '#64748B', kind: 'capacitor' },
  { id: 'cbepar2', x: 162, y: 365, w: 68, h: 26, label: 'C_BEpar2', subLabel: 'Inner Spacer', categoryColor: '#64748B', kind: 'capacitor' },

  // Perimeter B*-E' branches
  { id: 'cjep', x: 235, y: 335, w: 64, h: 26, label: 'Q_jEp', subLabel: 'Perim. Cap', categoryColor: '#2A645E', kind: 'capacitor' },
  { id: 'ibep', x: 235, y: 372, w: 64, h: 26, label: 'i_jBEp', subLabel: 'Perim. Diode', categoryColor: '#2A645E', kind: 'diode' },
  { id: 'ibet', x: 235, y: 409, w: 64, h: 26, label: 'i_BEt', subLabel: 'Zener Tunnel', categoryColor: '#8A3B33', kind: 'diode' },

  // Extrinsic B-C & B*-C' branches
  { id: 'cjcx1', x: 155, y: 98, w: 72, h: 26, label: "Q'_BCx", subLabel: 'C_jCx1+C_BCp1', categoryColor: '#64748B', kind: 'capacitor' },
  { id: 'cjcx2', x: 235, y: 146, w: 68, h: 26, label: "Q''_BCx", subLabel: 'C_jCx2+C_BCp2', categoryColor: '#2A645E', kind: 'capacitor' },
  { id: 'ijbcx', x: 312, y: 146, w: 64, h: 26, label: 'i_jBCx', subLabel: 'Ext. BC Diode', categoryColor: '#2A645E', kind: 'diode' },
  { id: 'qdsu', x: 386, y: 146, w: 64, h: 26, label: 'Q_dS', subLabel: 'Sub. Storage', categoryColor: '#824726', kind: 'capacitor' },

  // Intrinsic Transistor Core (inside dashed box: B', C', E')
  { id: 'cjei', x: 416, y: 318, w: 62, h: 26, label: 'Q_jEi', subLabel: 'Int. BE Depl', categoryColor: '#2A645E', kind: 'capacitor' },
  { id: 'qf', x: 416, y: 354, w: 62, h: 26, label: 'Q_f', subLabel: 'Fwd Diff Chg', categoryColor: '#2B4C65', kind: 'capacitor' },
  { id: 'ibei', x: 416, y: 390, w: 62, h: 26, label: 'i_jBEi', subLabel: 'Int. BE Diode', categoryColor: '#2B4C65', kind: 'diode' },

  { id: 'cjci', x: 462, y: 175, w: 62, h: 26, label: 'Q_jCi', subLabel: 'Int. BC Depl', categoryColor: '#2A645E', kind: 'capacitor' },
  { id: 'qr', x: 530, y: 175, w: 58, h: 26, label: 'Q_r', subLabel: 'Rev Diff Chg', categoryColor: '#2B4C65', kind: 'capacitor' },
  { id: 'ibci', x: 462, y: 212, w: 62, h: 26, label: 'i_jBCi', subLabel: 'Int. BC Diode', categoryColor: '#2B4C65', kind: 'diode' },
  { id: 'iavl', x: 530, y: 212, w: 58, h: 26, label: 'i_AVL', subLabel: 'Avalanche', categoryColor: '#8A3B33', kind: 'source' },

  { id: 'it', x: 542, y: 312, w: 84, h: 52, label: 'i_T (GICCR)', subLabel: 'i_Tf,NQS - i_Tr', categoryColor: '#2B4C65', kind: 'source' },

  // Substrate PNP & Coupling Network (right column: C', B*, S', S)
  { id: 'its', x: 690, y: 176, w: 68, h: 32, label: 'i_TS', subLabel: 'Sub. PNP i_T', categoryColor: '#824726', kind: 'source' },
  { id: 'ijsc', x: 690, y: 222, w: 68, h: 26, label: 'i_jSC', subLabel: 'S-C Diode', categoryColor: '#824726', kind: 'diode' },
  { id: 'cjs', x: 690, y: 258, w: 68, h: 26, label: 'Q_jS', subLabel: 'Int. S-C Cap', categoryColor: '#824726', kind: 'capacitor' },
  { id: 'cscp', x: 772, y: 222, w: 68, h: 26, label: 'C_SCp', subLabel: 'Perim. S-C', categoryColor: '#824726', kind: 'capacitor' },
  { id: 'rsu', x: 690, y: 342, w: 66, h: 26, label: 'R_su', subLabel: 'Sub. Bulk R', categoryColor: '#824726', kind: 'resistor' },
  { id: 'csu', x: 772, y: 342, w: 66, h: 26, label: 'C_su', subLabel: 'Sub. Bulk C', categoryColor: '#824726', kind: 'capacitor' },

  // Bottom Row: Adjunct Networks (Fig. 2.1.0/1 b, c, d & Fig. 2.13.0/1 Correlated Noise)
  { id: 'pterm', x: 68, y: 538, w: 72, h: 32, label: 'P_diss', subLabel: 'Thermal Src', categoryColor: '#8A3B33', kind: 'adjunct' },
  { id: 'rth', x: 152, y: 538, w: 64, h: 32, label: 'R_th(T)', subLabel: 'Thermal Res', categoryColor: '#8A3B33', kind: 'adjunct' },
  { id: 'cth', x: 226, y: 538, w: 64, h: 32, label: 'C_th', subLabel: 'Thermal Cap', categoryColor: '#8A3B33', kind: 'adjunct' },

  { id: 'nqs_qf', x: 350, y: 538, w: 96, h: 32, label: 'NQS Q_f (xf)', subLabel: 'RC Delay (alqf)', categoryColor: '#2A645E', kind: 'adjunct' },
  { id: 'nqs_it', x: 460, y: 538, w: 110, h: 32, label: 'NQS i_T (xf1,xf2)', subLabel: 'Bessel LCR (alit)', categoryColor: '#2A645E', kind: 'adjunct' },
  { id: 'noise_corr', x: 636, y: 538, w: 138, h: 32, label: 'Correlated Noise (n1,n2)', subLabel: 'HF Shot Cross-Corr', categoryColor: '#2B4C65', kind: 'adjunct' },
];

const NODE_COORDS: { id: string; label: string; va: string; x: number; y: number; ext: boolean }[] = [
  { id: 'B', label: 'B', va: 'b', x: 54, y: 256, ext: true },
  { id: 'B*', label: 'B*', va: 'bp', x: 238, y: 256, ext: false },
  { id: "B'", label: "B'", va: 'bi', x: 446, y: 256, ext: false },
  { id: 'C', label: 'C', va: 'c', x: 592, y: 24, ext: true },
  { id: "C'", label: "C'", va: 'ci', x: 592, y: 120, ext: false },
  { id: "E'", label: "E'", va: 'ei', x: 592, y: 422, ext: false },
  { id: 'E', label: 'E', va: 'e', x: 592, y: 495, ext: true },
  { id: "S'", label: "S'", va: 'si', x: 724, y: 306, ext: false },
  { id: 'S', label: 'S', va: 's', x: 724, y: 412, ext: true },
  { id: 'T', label: 'T (ΔTj)', va: 'tnode', x: 185, y: 515, ext: true },
  { id: 'XF', label: 'xf', va: 'xf', x: 398, y: 515, ext: false },
  { id: 'XF1', label: 'xf1', va: 'xf1', x: 490, y: 515, ext: false },
  { id: 'XF2', label: 'xf2', va: 'xf2', x: 542, y: 515, ext: false },
  { id: 'N1', label: 'n1', va: 'n1', x: 675, y: 515, ext: false },
  { id: 'N2', label: 'n2', va: 'n2', x: 735, y: 515, ext: false },
];

export const EquivalentCircuitDiagram: React.FC<EquivalentCircuitDiagramProps> = ({
  elements,
  selectedElementId,
  selectedNodeId,
  highlightedElementIds = [],
  opResult,
  onSelectElement,
  onSelectNode,
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [showLiveValues, setShowLiveValues] = useState<boolean>(true);
  const [networkFilter, setNetworkFilter] = useState<NetworkFilter>('all');
  const [showTopologyNotes, setShowTopologyNotes] = useState<boolean>(false);

  const getElementLiveBadge = (id: string): string => {
    if (opResult.branchCurrents[id] !== undefined) {
      if (id === 'pterm') return formatCompactVal(opResult.branchCurrents[id], 'W');
      return formatCompactVal(opResult.branchCurrents[id], 'A');
    }
    if (opResult.branchCharges[id] !== undefined) {
      if (id === 'qf' || id === 'qr') return '';
      return formatCompactVal(opResult.branchCharges[id], 'F');
    }
    if (id === 'rbi') return formatCompactVal(opResult.Rbi, 'Ω');
    if (id === 'rbx') return formatCompactVal((opResult.opMap.RB ?? 0) - opResult.Rbi, 'Ω');
    if (id === 'rcx') return formatCompactVal(opResult.opMap.RCX, 'Ω');
    if (id === 're') return formatCompactVal(opResult.opMap.RE, 'Ω');
    if (id === 'rth') return `ΔT=${opResult.Dtsh.toFixed(1)}K`;
    if (id === 'nqs_it' || id === 'nqs_qf') return `τf=${(opResult.Tf * 1e12).toFixed(2)}ps`;
    return '';
  };

  const isDimmedByFilter = (id: string): boolean => {
    if (networkFilter === 'all') return false;
    const coreIds = ['it', 'ibei', 'ibci', 'iavl', 'cjei', 'cjci', 'qf', 'qr', 'rbi', 'crbi'];
    const adjIds = ['pterm', 'rth', 'cth', 'nqs_qf', 'nqs_it', 'noise_corr'];
    if (networkFilter === 'main_core') return !coreIds.includes(id);
    if (networkFilter === 'adjuncts') return !adjIds.includes(id);
    if (networkFilter === 'extrinsic_sub') return coreIds.includes(id) || adjIds.includes(id);
    return false;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Top Header & Filter Controls */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#2B4C65] shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Complete HICUM/L2 Equivalent Circuit (Manual Fig. 2.1.0/1 & Fig. 2.13.0/1)
            </h3>
            <p className="text-[11px] text-slate-500">
              Click any circuit element (34 branches) or node (15 nodes) to inspect equations, physical meaning & sliders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Sub-network focus pills */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setNetworkFilter('all')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                networkFilter === 'all' ? 'bg-[#2B4C65] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All (34)
            </button>
            <button
              onClick={() => setNetworkFilter('main_core')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                networkFilter === 'main_core' ? 'bg-[#2B4C65] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Intrinsic Core
            </button>
            <button
              onClick={() => setNetworkFilter('extrinsic_sub')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                networkFilter === 'extrinsic_sub' ? 'bg-[#2B4C65] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Perimeter & Substrate
            </button>
            <button
              onClick={() => setNetworkFilter('adjuncts')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                networkFilter === 'adjuncts' ? 'bg-[#2B4C65] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thermal / NQS / Noise
            </button>
          </div>

          <button
            onClick={() => setShowLiveValues((v) => !v)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
              showLiveValues
                ? 'bg-[#E6F0EE] border-[#A1C4BE] text-[#22544F]'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
            title="Show live operating point currents, capacitances, and resistances on schematic components"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>OP Badges</span>
          </button>

          <button
            onClick={() => setShowTopologyNotes((v) => !v)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
              showTopologyNotes
                ? 'bg-[#E7EEF4] border-[#A9BFD3] text-[#2B4C65]'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Why B* & No R_Ci?</span>
          </button>

          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.12).toFixed(2)))}
              className="p-1.5 text-slate-600 hover:bg-slate-100"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="px-1.5 text-[11px] font-mono text-slate-600 hover:bg-slate-100"
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(1.45, +(z + 0.12).toFixed(2)))}
              className="p-1.5 text-slate-600 hover:bg-slate-100"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible HICUM Topology Notes Banner */}
      {showTopologyNotes && (
        <div className="bg-[#E7EEF4]/60 border-b border-[#C5D4E2] px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-[#DCE6EF]">
            <div className="font-semibold text-[#23435C] mb-1">
              1. Why Intermediate Perimeter Node B* (`bp`)?
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {TOPOLOGY_DESIGN_NOTES.whyBStarNode}
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-[#DCE6EF]">
            <div className="font-semibold text-[#1C4642] mb-1">
              2. Why No Explicit Internal Collector Node / Resistor?
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {TOPOLOGY_DESIGN_NOTES.whyOmitInternalCollectorNode}
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-[#DCE6EF]">
            <div className="font-semibold text-[#6E3B1F] mb-1">
              3. Why Internal Substrate Node S&apos; (`si`)?
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {TOPOLOGY_DESIGN_NOTES.whySPrimeNode}
            </p>
          </div>
        </div>
      )}

      {/* Interactive SVG Schematic Canvas */}
      <div className="relative overflow-auto bg-[#F7F6F2] p-2">
        <div
          style={{
            width: `${Math.round(860 * zoom)}px`,
            minWidth: '100%',
          }}
          className="mx-auto transition-all duration-150"
        >
          <svg
            viewBox="0 0 860 590"
            className="w-full h-auto select-none bg-white rounded-lg border border-slate-200/80 shadow-2xs"
          >
            {/* Background Sub-region Boxes */}
            {/* Effective Internal Transistor Dashed Box (Manual Fig. 2.1.0/1a) */}
            <rect
              x={404}
              y={162}
              width={236}
              height={266}
              rx={8}
              fill="#EFF6FF"
              fillOpacity={0.45}
              stroke="#2B4C65"
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
            <text
              x={414}
              y={155}
              className="fill-[#23435C] font-semibold text-[10.5px] uppercase tracking-wider"
            >
              Effective Internal Transistor (1D Intrinsic Core: B&apos;, C&apos;, E&apos;)
            </text>

            {/* Substrate Network Box */}
            <rect
              x={676}
              y={162}
              width={172}
              height={266}
              rx={8}
              fill="#FFFBEB"
              fillOpacity={0.5}
              stroke="#D97706"
              strokeWidth={1.2}
              strokeDasharray="4 4"
            />
            <text
              x={682}
              y={155}
              className="fill-[#6E3B1F] font-semibold text-[10.5px] uppercase tracking-wider"
            >
              Substrate PNP & Coupling (S&apos;, S)
            </text>

            {/* Bottom Adjunct Networks Bar (Fig. 2.1.0/1 b, c, d & Fig. 2.13.0/1) */}
            <rect
              x={46}
              y={502}
              width={756}
              height={76}
              rx={8}
              fill="#F7F6F2"
              stroke="#D8D4CA"
              strokeWidth={1.2}
            />
            <text
              x={58}
              y={518}
              className="fill-slate-600 font-semibold text-[10px] uppercase tracking-wider"
            >
              (b) Self-Heating Network (tnode)
            </text>
            <text
              x={350}
              y={518}
              className="fill-[#22544F] font-semibold text-[10px] uppercase tracking-wider"
            >
              (c,d) Vertical NQS Delay Networks (xf, xf1, xf2)
            </text>
            <text
              x={636}
              y={518}
              className="fill-[#23435C] font-semibold text-[10px] uppercase tracking-wider"
            >
              (e) Correlated HF Shot Noise (n1, n2)
            </text>

            {/* Schematic Orthogonal Interconnect Wires */}
            <g stroke="#64748B" strokeWidth={1.6} fill="none">
              {/* Base horizontal spine: B -> RBx -> B* -> Rbi* -> B' */}
              <line x1={54} y1={256} x2={132} y2={256} />
              <line x1={198} y1={256} x2={325} y2={256} />
              <line x1={397} y1={256} x2={446} y2={256} />

              {/* CrBi parallel shunt across Rbi* */}
              <path d="M 295 256 L 295 207 L 325 207 M 397 207 L 420 207 L 420 256" />

              {/* Collector vertical spine: C -> RCx -> C' -> iT -> E' -> RE -> E */}
              <line x1={592} y1={24} x2={592} y2={52} />
              <line x1={592} y1={80} x2={592} y2={312} />
              <line x1={592} y1={364} x2={592} y2={444} />
              <line x1={592} y1={472} x2={592} y2={495} />

              {/* Outer B to C' branch (Q'BCx) */}
              <path d="M 92 256 L 92 111 L 155 111 M 227 111 L 592 111" />

              {/* B* to C' branches (Q''BCx, ijBCx, QdS) */}
              <path d="M 238 256 L 238 159 M 303 159 L 312 159 M 376 159 L 386 159 M 450 159 L 592 159" />

              {/* B' to C' intrinsic branches (QjCi, Qr, ijBCi, iAVL) */}
              <path d="M 446 256 L 446 188 L 462 188 M 524 188 L 530 188 M 588 188 L 592 188" />
              <path d="M 446 225 L 462 225 M 524 225 L 530 225 M 588 225 L 592 225" />

              {/* B' to E' intrinsic branches (QjEi, Qf, ijBEi) */}
              <path d="M 446 256 L 446 422 L 592 422" />

              {/* B* to E' perimeter branches (QjEp, ijBEp, iBEt) */}
              <path d="M 267 256 L 267 422 L 446 422" />

              {/* CBEpar1 (B to E) and CBEpar2 (B* to E') */}
              <path d="M 92 256 L 92 485 L 592 485" />
              <path d="M 196 256 L 196 422 L 267 422" />

              {/* C' to Substrate Network (iTS, ijSC, QjS -> S' -> Rsu/Csu -> S) */}
              <path d="M 592 120 L 724 120 L 724 412" />
              <path d="M 592 24 L 806 24 L 806 412 L 724 412" />
            </g>

            {/* Render All 34 Clickable Circuit Elements */}
            {SCHEMATIC_COORDS.map((comp) => {
              const isSelected = selectedElementId === comp.id;
              const isHighlighted = highlightedElementIds.includes(comp.id);
              const isDimmed = isDimmedByFilter(comp.id);
              const liveBadge = showLiveValues ? getElementLiveBadge(comp.id) : '';
              const elMeta = elements.find((e) => e.id === comp.id);

              return (
                <g
                  key={comp.id}
                  onClick={() => onSelectElement(comp.id)}
                  className="cursor-pointer transition-opacity"
                  opacity={isDimmed ? 0.25 : 1}
                >
                  <title>
                    {elMeta
                      ? `${elMeta.name} (${elMeta.symbol}) — ${elMeta.summary}`
                      : comp.label}
                  </title>

                  {/* Selection Halo */}
                  {(isSelected || isHighlighted) && (
                    <rect
                      x={comp.x - 3}
                      y={comp.y - 3}
                      width={comp.w + 6}
                      height={comp.h + 6}
                      rx={7}
                      fill="none"
                      stroke={isSelected ? '#2B4C65' : '#2A645E'}
                      strokeWidth={2.2}
                    />
                  )}

                  {/* Component Card Box */}
                  <rect
                    x={comp.x}
                    y={comp.y}
                    width={comp.w}
                    height={comp.h}
                    rx={5}
                    fill={isSelected ? '#E7EEF4' : '#FFFFFF'}
                    stroke={isSelected ? '#2B4C65' : comp.categoryColor}
                    strokeWidth={isSelected ? 2 : 1.3}
                  />

                  {/* Left Color Accent Strip */}
                  <rect
                    x={comp.x}
                    y={comp.y}
                    width={4}
                    height={comp.h}
                    rx={2}
                    fill={comp.categoryColor}
                  />

                  {/* Primary Symbol Label */}
                  <text
                    x={comp.x + comp.w / 2 + 2}
                    y={comp.y + (comp.h > 36 ? 19 : 12)}
                    textAnchor="middle"
                    className="fill-slate-900 font-mono font-bold text-[10px]"
                  >
                    {comp.label}
                  </text>

                  {/* Sub-label or Live Operating Point Value */}
                  <text
                    x={comp.x + comp.w / 2 + 2}
                    y={comp.y + (comp.h > 36 ? 34 : 22)}
                    textAnchor="middle"
                    className={`font-mono text-[8.5px] ${
                      liveBadge ? 'fill-[#22544F] font-semibold' : 'fill-slate-500'
                    }`}
                  >
                    {liveBadge || comp.subLabel}
                  </text>
                </g>
              );
            })}

            {/* Render All 15 Clickable Circuit Nodes */}
            {NODE_COORDS.map((nd) => {
              const isSelected = selectedNodeId === nd.id;
              const nodeV = opResult.nodeVoltages[nd.id];
              return (
                <g
                  key={nd.id}
                  onClick={() => onSelectNode(nd.id)}
                  className="cursor-pointer"
                >
                  <title>
                    Node {nd.label} (Verilog-A `{nd.va}`)
                    {nodeV !== undefined ? ` — Potential: ${nodeV.toFixed(3)} V` : ''}
                  </title>
                  <circle
                    cx={nd.x}
                    cy={nd.y}
                    r={nd.ext ? 8.5 : 6.5}
                    fill={
                      isSelected
                        ? '#2B4C65'
                        : nd.ext
                        ? '#0F172A'
                        : '#FFFFFF'
                    }
                    stroke={isSelected ? '#E7EEF4' : nd.ext ? '#0F172A' : '#2B4C65'}
                    strokeWidth={2}
                  />
                  <text
                    x={nd.x}
                    y={nd.y - 11}
                    textAnchor="middle"
                    className={`font-mono font-bold text-[10.5px] ${
                      isSelected ? 'fill-[#2B4C65]' : 'fill-slate-900'
                    }`}
                  >
                    {nd.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Legend Bar */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-600">
        <div className="flex items-center flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2B4C65]" />
            <span>Intrinsic Core & Series R</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2A645E]" />
            <span>Depletion Q_j & NQS Delay</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#824726]" />
            <span>Substrate PNP & Coupling</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#8A3B33]" />
            <span>Breakdown (i_AVL, i_BEt) & Thermal (R_th)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
            <span>External Terminal (B, C, E, S, T)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-[#2B4C65]" />
            <span>Internal Node (B*, B&apos;, C&apos;, E&apos;, S&apos;)</span>
          </span>
        </div>
        <div className="font-mono text-[10.5px] text-slate-500">
          Verilog-A: module hic2_full(c, b, e, s, tnode)
        </div>
      </div>
    </div>
  );
};

export default EquivalentCircuitDiagram;
