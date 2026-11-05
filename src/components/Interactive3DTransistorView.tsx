import React, { useState, useRef, useMemo } from 'react';
import {
  HicumParameter,
  CircuitElement,
  CircuitNode,
  BiasState,
  OperatingPointResult,
  SpatialNature,
} from '../data/hicumTypes';
import { FormulaView } from './FormulaView';
import {
  Box,
  Layers,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Cpu,
  Flame,
  Zap,
  Compass,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  Sliders,
  Info,
} from 'lucide-react';

interface Interactive3DTransistorViewProps {
  parameters: HicumParameter[];
  elements: CircuitElement[];
  nodes: CircuitNode[];
  bias: BiasState;
  opResult: OperatingPointResult;
  selectedParamId: string | null;
  selectedElementId: string | null;
  onSelectParamInLab: (paramId: string) => void;
  onSelectElementInLab: (elementId: string) => void;
}

type OverlayMode = 'doping' | 'circuit_overlay' | 'carrier_kirk' | 'thermal';
type CutawayMode = 'half_cutaway' | 'full_3d' | 'quarter_cutaway';

export interface Region3DSpec {
  id: string;
  name: string;
  shortLabel: string;
  dopingTag: string;
  spatialNature: 'localized' | 'distributed';
  layerGroup: number; // 0 (bottom substrate) to 6 (top metal) for exploded Z view
  colorFill: string;
  colorStroke: string;
  thermalWeight: number; // 0 to 1 relative temperature peak near intrinsic BC junction
  manualSection: string;
  description: string;
  localizedVsDistributedNote: string;
  nodesInRegion: string[];
  circuitElements: string[];
  keyParameters: string[];
  boxes: {
    // 3D bounding box in normalized device coordinates:
    // X: [-120, +120] (lateral width across emitter, base, collector sinker)
    // Y: [-75, +75] (emitter stripe length direction)
    // Z: [-95, +95] (vertical depth from substrate bottom to top metal)
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    z0: number;
    z1: number;
  }[];
}

export const HBT_3D_REGIONS: Region3DSpec[] = [
  {
    id: 'p_substrate_bulk',
    name: 'p⁻ Silicon Wafer Substrate & Substrate Terminal (S, S\')',
    shortLabel: 'p⁻ Wafer Substrate',
    dopingTag: 'p⁻ Si Bulk (10¹⁵ cm⁻³)',
    spatialNature: 'distributed',
    layerGroup: 0,
    colorFill: '#FFE4E6',
    colorStroke: '#9F1239',
    thermalWeight: 0.2,
    manualSection: 'Sections 2.11 & 2.12 (Fig. 2.11.0/1)',
    description:
      'Lightly doped p-type silicon wafer beneath the buried subcollector and trench isolation. Hosts the internal substrate node S\' (beneath the C-S depletion zone) and bulk coupling network (R_su, C_su) to external contact S.',
    localizedVsDistributedNote:
      'C_jS is localized at the bottom n⁺ buried-layer / p⁻ substrate interface, whereas R_su and C_su represent the distributed 3D spreading impedance through the lossy silicon wafer.',
    nodesInRegion: ["S'", 'S'],
    circuitElements: ['cjs', 'cscp', 'ijsc', 'its', 'qdsu', 'rsu', 'csu'],
    keyParameters: ['cjs0', 'vds', 'zs', 'vpts', 'cscp0', 'vdsp', 'zsp', 'rsu', 'csu', 'itss', 'msf', 'tsf', 'iscs'],
    boxes: [{ x0: -115, x1: 115, y0: -70, y1: 70, z0: -92, z1: -58 }],
  },
  {
    id: 'deep_trench_isolation',
    name: 'Deep Trench Isolation (DTI) Oxide Walls',
    shortLabel: 'DTI Oxide Trench',
    dopingTag: 'SiO₂ / Undoped Poly Trench',
    spatialNature: 'localized',
    layerGroup: 1,
    colorFill: '#E2E8F0',
    colorStroke: '#64748B',
    thermalWeight: 0.25,
    manualSection: 'Section 2.11 (Fig. 2.11.0/1c)',
    description:
      'High-aspect-ratio oxide-lined deep trenches enclosing the SiGe HBT collector island laterally, reducing perimeter collector-substrate capacitance C_SCp and lateral substrate crosstalk while increasing thermal resistance R_th.',
    localizedVsDistributedNote:
      'Physically localized dielectric boundary around the device perimeter; directly governs perimeter C_SCp and contributes to thermal confinement (R_th).',
    nodesInRegion: ['S', 'C'],
    circuitElements: ['cscp', 'rth'],
    keyParameters: ['cscp0', 'vdsp', 'zsp', 'vptsp', 'rth', 'cth'],
    boxes: [
      { x0: -115, x1: -98, y0: -70, y1: 70, z0: -62, z1: 18 },
      { x0: 98, x1: 115, y0: -70, y1: 70, z0: -62, z1: 18 },
    ],
  },
  {
    id: 'buried_subcollector',
    name: 'n⁺ Subcollector Buried Layer (Node C\' Bottom Plane)',
    shortLabel: 'n⁺ Buried Layer',
    dopingTag: 'n⁺ As/Sb Buried Layer (10²⁰ cm⁻³)',
    spatialNature: 'localized',
    layerGroup: 1,
    colorFill: '#FDE68A',
    colorStroke: '#B45309',
    thermalWeight: 0.45,
    manualSection: 'Section 2.8.2 (Fig. 2.8.2/1)',
    description:
      'Heavily doped n⁺ buried layer under the epitaxial collector that collects vertical electron current from the intrinsic collector (node C\') and channels it laterally to the n⁺ collector sinker.',
    localizedVsDistributedNote:
      'Physically localized low-sheet-resistance buried layer; combines with the vertical sinker and contact resistance into lumped external collector resistance R_Cx = r_bl + r_sink + r_KC.',
    nodesInRegion: ["C'"],
    circuitElements: ['rcx', 'cjs', 'ijsc'],
    keyParameters: ['rcx', 'zetarcx', 'cjs0', 'vds', 'zs'],
    boxes: [{ x0: -98, x1: 98, y0: -66, y1: 66, z0: -58, z1: -32 }],
  },
  {
    id: 'collector_sinker_contact',
    name: 'n⁺ Collector Sinker Plug & Collector Terminal Metal (C)',
    shortLabel: 'n⁺ Collector Sinker & C',
    dopingTag: 'n⁺ Sinker & W/AlCu Contact C',
    spatialNature: 'localized',
    layerGroup: 2,
    colorFill: '#FCD34D',
    colorStroke: '#92400E',
    thermalWeight: 0.35,
    manualSection: 'Section 2.8.2 (Fig. 2.8.2/1)',
    description:
      'Deep n⁺ phosphorus/arsenic sinker diffusion connecting the buried subcollector up to the surface silicide and metallization pad for external collector terminal C.',
    localizedVsDistributedNote:
      'Physically localized vertical ohmic conduction path between buried subcollector and external terminal C (modeled by R_Cx).',
    nodesInRegion: ['C', "C'"],
    circuitElements: ['rcx', 'cscp'],
    keyParameters: ['rcx', 'zetarcx'],
    boxes: [
      { x0: 58, x1: 96, y0: -60, y1: 60, z0: -32, z1: 18 },
      { x0: 64, x1: 90, y0: -48, y1: 48, z0: 18, z1: 42 },
    ],
  },
  {
    id: 'extrinsic_bc_junction',
    name: 'Extrinsic Collector Epi & Shallow Trench Isolation (STI)',
    shortLabel: 'Extrinsic BC & STI Oxide',
    dopingTag: 'n⁻ Extrinsic Epi & SiO₂ STI',
    spatialNature: 'distributed',
    layerGroup: 2,
    colorFill: '#CBD5E1',
    colorStroke: '#475569',
    thermalWeight: 0.4,
    manualSection: 'Sections 2.4.2, 2.6, 2.8.3 (Fig. 2.7.0/2)',
    description:
      'Extrinsic base-collector depletion region beneath the p⁺ link/poly base and Shallow Trench Isolation (STI) separating the intrinsic emitter-base mesa from the collector sinker.',
    localizedVsDistributedNote:
      'Distributed RC network partitioned via f_BCpar into outer capacitance C_jCx1 + C_BCpar1 (connected to external terminal B) and inner capacitance C_jCx2 + C_BCpar2 (connected to perimeter node B*).',
    nodesInRegion: ['B', 'B*', "C'"],
    circuitElements: ['cjcx1', 'cjcx2', 'ijbcx', 'its', 'qdsu'],
    keyParameters: ['cjcx0', 'vdcx', 'zcx', 'vptcx', 'cbcpar', 'fbcpar', 'ibcxs', 'mbcx'],
    boxes: [
      { x0: -98, x1: -34, y0: -64, y1: 64, z0: -32, z1: -2 },
      { x0: 14, x1: 58, y0: -64, y1: 64, z0: -32, z1: 8 },
    ],
  },
  {
    id: 'intrinsic_collector_sic',
    name: 'Intrinsic Collector Epitaxial Layer & SIC Pedestal (Node B\'–C\')',
    shortLabel: 'n-SIC Intrinsic Collector',
    dopingTag: 'n-SIC Pedestal (10¹⁷–10¹⁸ cm⁻³)',
    spatialNature: 'distributed',
    layerGroup: 2,
    colorFill: '#FDBA74',
    colorStroke: '#C2410C',
    thermalWeight: 1.0,
    manualSection: 'Sections 2.2.1, 2.2.2, 2.4.2, 2.10 (Fig. 2.2.0/2)',
    description:
      'Selectively Implanted Collector (SIC) pedestal directly beneath the intrinsic emitter window. Sustains the high B\'-C\' electric field, governs the Kirk critical current I_CK(v_C\'E\'), high-current base push-out Δτ_fh, SiGe/Si conduction-band barrier (vcbar), and avalanche current i_AVL.',
    localizedVsDistributedNote:
      'HICUM avoids an artificial lumped internal collector resistor node by embedding the distributed electric-field collapse, velocity saturation (vlim), and punch-through (vpt) of this region directly into I_CK(v_C\'E\') and Q_f(i_Tf).',
    nodesInRegion: ["B'", "C'"],
    circuitElements: ['it', 'cjci', 'ibci', 'iavl', 'qr'],
    keyParameters: [
      'rci0',
      'vlim',
      'vces',
      'vpt',
      'aick',
      'delck',
      'thcs',
      'ahc',
      'fthc',
      'vcbar',
      'icbar',
      'acbar',
      'cjci0',
      'vdci',
      'zci',
      'vptci',
      'favl',
      'qavl',
      'latb',
      'latl',
    ],
    boxes: [{ x0: -34, x1: 14, y0: -52, y1: 52, z0: -32, z1: -2 }],
  },
  {
    id: 'intrinsic_sige_base',
    name: 'Intrinsic Graded p-Si₁₋ₓGeₓ Base Layer (Node B\')',
    shortLabel: 'p-SiGe Intrinsic Base (B\')',
    dopingTag: 'p⁺ Si₁₋ₓGeₓ Base (x = 0 → 0.25)',
    spatialNature: 'distributed',
    layerGroup: 3,
    colorFill: '#5EEAD4',
    colorStroke: '#0F766E',
    thermalWeight: 0.92,
    manualSection: 'Sections 2.2, 2.3.1, 2.5, 2.13, 2.14 (Fig. 2.2.0/2)',
    description:
      'Ultra-thin graded p-SiGe base directly under the emitter window (node B\'). Ge compositional grading induces a quasi-electric drift field that accelerates minority electrons (reducing τ_0) while weighting depletion and minority charges (h_jEi, h_jCi, h_f0) in the GICCR transfer current.',
    localizedVsDistributedNote:
      'Vertically localized between x_jE and x_jC, but laterally distributed across the emitter window width b_E: conductivity modulation and 2D emitter current crowding are captured via R_bi*(i_jBEi, Q_p) and AC shunt C_rBi.',
    nodesInRegion: ["B'", "E'", "C'"],
    circuitElements: ['it', 'ibei', 'cjei', 'qf', 'rbi', 'crbi', 'nqs_qf', 'nqs_it', 'noise_corr'],
    keyParameters: [
      'c10',
      'qp0',
      'hjei',
      'ahjei',
      'rhjei',
      'hjci',
      'hf0',
      't0',
      'dt0h',
      'tbvl',
      'rbi0',
      'fdqr0',
      'fgeo',
      'fcrbi',
      'cjei0',
      'vdei',
      'zei',
      'ajei',
      'ibeis',
      'mbei',
      'ireis',
      'mrei',
      'alqf',
      'alit',
      'flnqs',
      'flcono',
    ],
    boxes: [{ x0: -34, x1: 14, y0: -52, y1: 52, z0: -2, z1: 16 }],
  },
  {
    id: 'extrinsic_base_poly',
    name: 'Extrinsic p⁺ Base Poly, CoSi₂ Silicide & Link Base (B → B*)',
    shortLabel: 'p⁺ Extrinsic Base (B → B*)',
    dopingTag: 'p⁺ Poly / CoSi₂ / Link Base',
    spatialNature: 'distributed',
    layerGroup: 4,
    colorFill: '#93C5FD',
    colorStroke: '#1E40AF',
    thermalWeight: 0.45,
    manualSection: 'Sections 2.5, 2.7 (Figs. 2.7.0/1, 2.7.0/2)',
    description:
      'Extrinsic p⁺ polysilicon, silicide strap, and link-base region surrounding the emitter window. Connects external base terminal B through series resistance R_Bx to the crucial intermediate perimeter base node B*.',
    localizedVsDistributedNote:
      'Combines multiple physical sheet/contact sub-regions (r_KB + r_po + r_pm + r_sp) into R_Bx and defines the physical boundary between external node B and perimeter node B*.',
    nodesInRegion: ['B', 'B*'],
    circuitElements: ['rbx', 'cjcx1', 'cjcx2', 'cbepar1'],
    keyParameters: ['rbx', 'zetarbx', 'fgeo'],
    boxes: [
      { x0: -96, x1: -34, y0: -60, y1: 60, z0: -2, z1: 22 },
      { x0: 14, x1: 44, y0: -60, y1: 60, z0: -2, z1: 22 },
      { x0: -92, x1: -64, y0: -48, y1: 48, z0: 22, z1: 44 },
    ],
  },
  {
    id: 'be_oxide_spacer',
    name: 'B-E Sidewall Dielectric Spacer & Perimeter Junction (Node B*–E\')',
    shortLabel: 'BE Sidewall Spacer (B*–E\')',
    dopingTag: 'Si₃N₄ / SiO₂ Spacer & n⁺/p⁺ Sidewall',
    spatialNature: 'localized',
    layerGroup: 5,
    colorFill: '#99F6E4',
    colorStroke: '#0D9488',
    thermalWeight: 0.55,
    manualSection: 'Sections 2.3.2, 2.4.1, 2.8.3, 2.9 (Fig. 2.8.3/1)',
    description:
      'Oxide/nitride sidewall spacers isolating the emitter T-poly from the extrinsic base poly, plus the high-doping peripheral B*-E\' junction along the emitter perimeter.',
    localizedVsDistributedNote:
      'Physically localized along the emitter stripe perimeter; directly governs peripheral injection i_jBEp, perimeter depletion capacitance C_jEp, reverse Zener tunneling i_BEt, and parasitic spacer capacitance C_BEpar.',
    nodesInRegion: ['B*', "E'", 'B', 'E'],
    circuitElements: ['cjep', 'ibep', 'ibet', 'cbepar1', 'cbepar2'],
    keyParameters: ['cjep0', 'vdep', 'zep', 'ajep', 'ibeps', 'mbep', 'ireps', 'mrep', 'ibets', 'abet', 'tunode', 'cbepar', 'fbepar'],
    boxes: [
      { x0: -44, x1: -30, y0: -54, y1: 54, z0: 16, z1: 48 },
      { x0: 10, x1: 24, y0: -54, y1: 54, z0: 16, z1: 48 },
    ],
  },
  {
    id: 'emitter_poly_mono',
    name: 'n⁺ Polysilicon T-Emitter & Mono-Crystalline Emitter Window (E → E\')',
    shortLabel: 'n⁺ Emitter Stack (E → E\')',
    dopingTag: 'n⁺ Poly-Si / n⁺ Mono-Si (10²⁰ cm⁻³)',
    spatialNature: 'localized',
    layerGroup: 6,
    colorFill: '#60A5FA',
    colorStroke: '#1E3A8A',
    thermalWeight: 0.6,
    manualSection: 'Sections 2.2.2, 2.8.1 (Fig. 2.8.1/1)',
    description:
      'T-shaped n⁺ polysilicon emitter cap and shallow out-diffused monocrystalline emitter stripe. Contributes emitter series resistance R_E (between E and E\') and high-current neutral emitter hole charge storage ΔQ_Ef.',
    localizedVsDistributedNote:
      'Physically localized above the intrinsic B\'-E\' junction; governs series resistance R_E, emitter storage delay τ_Ef0 (tef0, gtfe, hfe), and emitter resistance 1/f noise (kfre, afre).',
    nodesInRegion: ['E', "E'"],
    circuitElements: ['re', 'qf', 'cjei', 'ibei'],
    keyParameters: ['re', 'zetare', 'tef0', 'gtfe', 'hfe', 'kfre', 'afre'],
    boxes: [
      { x0: -30, x1: 10, y0: -50, y1: 50, z0: 16, z1: 46 },
      { x0: -48, x1: 28, y0: -54, y1: 54, z0: 46, z1: 68 },
      { x0: -28, x1: 8, y0: -44, y1: 44, z0: 68, z1: 86 },
    ],
  },
];

// 3D Circuit Node Pin Coordinates inside the 3D Transistor
const NODE_3D_PINS: {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  layerGroup: number;
  ext: boolean;
}[] = [
  { id: 'E', label: 'E (Ext. Emitter)', x: -10, y: 0, z: 88, layerGroup: 6, ext: true },
  { id: "E'", label: "E' (Int. Emitter)", x: -10, y: 0, z: 20, layerGroup: 5, ext: false },
  { id: 'B', label: 'B (Ext. Base)', x: -78, y: 0, z: 46, layerGroup: 4, ext: true },
  { id: 'B*', label: 'B* (Perimeter Base)', x: -38, y: 0, z: 12, layerGroup: 4, ext: false },
  { id: "B'", label: "B' (Int. SiGe Base)", x: -10, y: 0, z: 7, layerGroup: 3, ext: false },
  { id: "C'", label: "C' (Int. Collector)", x: -10, y: 0, z: -26, layerGroup: 2, ext: false },
  { id: 'C', label: 'C (Ext. Collector)', x: 77, y: 0, z: 44, layerGroup: 2, ext: true },
  { id: "S'", label: "S' (Int. Substrate)", x: -10, y: 0, z: -64, layerGroup: 0, ext: false },
  { id: 'S', label: 'S (Substrate Contact)', x: -85, y: 0, z: -88, layerGroup: 0, ext: true },
  { id: 'T', label: 'T (ΔTj Thermal Node)', x: 25, y: 0, z: -12, layerGroup: 2, ext: true },
];

// 3D Branch Links between 3D Node Pins for the Circuit Overlay Mode
const BRANCH_3D_LINKS: {
  elementId: string;
  label: string;
  fromNode: string;
  toNode: string;
  color: string;
}[] = [
  { elementId: 're', label: 'R_E', fromNode: 'E', toNode: "E'", color: '#1E40AF' },
  { elementId: 'rbx', label: 'R_Bx', fromNode: 'B', toNode: 'B*', color: '#1E40AF' },
  { elementId: 'rbi', label: 'R_bi* || C_rBi', fromNode: 'B*', toNode: "B'", color: '#0F766E' },
  { elementId: 'it', label: 'i_T (GICCR)', fromNode: "C'", toNode: "E'", color: '#1E40AF' },
  { elementId: 'cjei', label: 'Q_jEi, Q_f, i_jBEi', fromNode: "B'", toNode: "E'", color: '#0F766E' },
  { elementId: 'cjep', label: 'Q_jEp, i_jBEp, i_BEt', fromNode: 'B*', toNode: "E'", color: '#0D9488' },
  { elementId: 'cjci', label: 'Q_jCi, i_jBCi, i_AVL', fromNode: "B'", toNode: "C'", color: '#B45309' },
  { elementId: 'cjcx2', label: 'C_jCx2, i_jBCx', fromNode: 'B*', toNode: "C'", color: '#64748B' },
  { elementId: 'rcx', label: 'R_Cx (Buried+Sinker)', fromNode: "C'", toNode: 'C', color: '#92400E' },
  { elementId: 'cjs', label: 'C_jS, i_jSC, i_TS', fromNode: "C'", toNode: "S'", color: '#9F1239' },
  { elementId: 'rsu', label: 'R_su || C_su', fromNode: "S'", toNode: 'S', color: '#9F1239' },
];

interface ProjectedFace {
  regionId: string;
  points: { x: number; y: number }[];
  depth: number;
  fill: string;
  stroke: string;
  opacity: number;
  shadeFactor: number;
}

function shadeHexColor(hex: string, factor: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = Math.min(255, Math.max(0, Math.round(parseInt(clean.slice(0, 2), 16) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(parseInt(clean.slice(2, 4), 16) * factor)));
  const b = Math.min(255, Math.max(0, Math.round(parseInt(clean.slice(4, 6), 16) * factor)));
  return `rgb(${r}, ${g}, ${b})`;
}

function getThermalHexColor(weight: number, dtsh: number): string {
  const norm = Math.min(1, Math.max(0, weight * (0.35 + Math.min(dtsh / 60, 0.65))));
  // Interpolate from cool slate-blue (#DBEAFE) -> warm amber (#FDE68A) -> hot crimson (#F43F5E)
  if (norm < 0.5) {
    const t = norm * 2;
    const r = Math.round(219 + t * (253 - 219));
    const g = Math.round(234 + t * (230 - 234));
    const b = Math.round(254 + t * (138 - 254));
    return `rgb(${r}, ${g}, ${b})`;
  }
  const t = (norm - 0.5) * 2;
  const r = Math.round(253 + t * (225 - 253));
  const g = Math.round(230 + t * (29 - 230));
  const b = Math.round(138 + t * (72 - 138));
  return `rgb(${r}, ${g}, ${b})`;
}

export const Interactive3DTransistorView: React.FC<Interactive3DTransistorViewProps> = ({
  parameters,
  bias,
  opResult,
  selectedParamId,
  selectedElementId,
  onSelectParamInLab,
  onSelectElementInLab,
}) => {
  // Camera & 3D Transform State
  const [yawDeg, setYawDeg] = useState<number>(-34);
  const [pitchDeg, setPitchDeg] = useState<number>(24);
  const [zoom, setZoom] = useState<number>(1.42);
  const [explodeFactor, setExplodeFactor] = useState<number>(0.18); // 0 to 1
  const [cutawayMode, setCutawayMode] = useState<CutawayMode>('half_cutaway');
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('doping');
  const [spatialFilter, setSpatialFilter] = useState<'all' | SpatialNature>('all');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('intrinsic_sige_base');

  // Mouse drag rotation state
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; startYaw: number; startPitch: number }>({
    active: false,
    startX: 0,
    startY: 0,
    startYaw: -34,
    startPitch: 24,
  });

  // Automatically sync selected 3D region when selectedElementId or selectedParamId changes
  const activeRegion = useMemo(() => {
    if (selectedElementId) {
      const match = HBT_3D_REGIONS.find((r) => r.circuitElements.includes(selectedElementId));
      if (match && match.id === selectedRegionId) return match;
    }
    return HBT_3D_REGIONS.find((r) => r.id === selectedRegionId) || HBT_3D_REGIONS[6];
  }, [selectedRegionId, selectedElementId]);

  // 3D Projection function: (x, y, z) -> (screenX, screenY, depth)
  const project3D = (x: number, y: number, z: number) => {
    const yaw = (yawDeg * Math.PI) / 180;
    const pitch = (pitchDeg * Math.PI) / 180;

    // Rotate around Z axis (yaw)
    const x1 = x * Math.cos(yaw) - y * Math.sin(yaw);
    const y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
    const z1 = z;

    // Tilt around X axis (pitch)
    const x2 = x1;
    const y2 = y1 * Math.sin(pitch) - z1 * Math.cos(pitch);
    const z2 = y1 * Math.cos(pitch) + z1 * Math.sin(pitch);

    // Subtle perspective foreshortening
    const fov = 680;
    const persp = fov / Math.max(fov - z2 * 0.55, 220);
    const cx = 370;
    const cy = 240;

    return {
      x: cx + x2 * zoom * persp,
      y: cy + y2 * zoom * persp,
      depth: z2,
    };
  };

  // Build Painter's Algorithm Depth-Sorted 3D Hexahedral Faces
  const sortedFaces = useMemo(() => {
    const faces: ProjectedFace[] = [];

    for (const reg of HBT_3D_REGIONS) {
      const zOffset = (reg.layerGroup - 2.5) * explodeFactor * 26;
      const isSelected = reg.id === activeRegion.id;
      const isParamLinked =
        selectedParamId !== null && reg.keyParameters.includes(selectedParamId);
      const isElementLinked =
        selectedElementId !== null && reg.circuitElements.includes(selectedElementId);

      let baseOpacity = 0.9;
      if (overlayMode === 'circuit_overlay') {
        baseOpacity = isSelected ? 0.58 : 0.25;
      } else if (overlayMode === 'carrier_kirk') {
        baseOpacity =
          reg.id === 'intrinsic_sige_base' ||
          reg.id === 'intrinsic_collector_sic' ||
          reg.id === 'emitter_poly_mono'
            ? 0.65
            : 0.28;
      } else if (spatialFilter !== 'all' && reg.spatialNature !== spatialFilter) {
        baseOpacity = 0.22;
      }

      const baseFill =
        overlayMode === 'thermal'
          ? getThermalHexColor(reg.thermalWeight, opResult.Dtsh)
          : reg.colorFill;

      for (const rawBox of reg.boxes) {
        // Apply cutaway slicing along Y (front half Y > 0 removed in half_cutaway)
        let y0 = rawBox.y0;
        let y1 = rawBox.y1;
        if (cutawayMode === 'half_cutaway') {
          y1 = Math.min(y1, 0);
        } else if (cutawayMode === 'quarter_cutaway') {
          if (rawBox.x1 > -10) {
            y1 = Math.min(y1, 12);
          }
        }
        if (y1 <= y0) continue;

        const z0 = rawBox.z0 + zOffset;
        const z1 = rawBox.z1 + zOffset;
        const { x0, x1 } = rawBox;

        // 8 vertices of the 3D hexahedron
        const v = [
          project3D(x0, y0, z0), // 0: back-left-bottom
          project3D(x1, y0, z0), // 1: back-right-bottom
          project3D(x1, y1, z0), // 2: front-right-bottom
          project3D(x0, y1, z0), // 3: front-left-bottom
          project3D(x0, y0, z1), // 4: back-left-top
          project3D(x1, y0, z1), // 5: back-right-top
          project3D(x1, y1, z1), // 6: front-right-top
          project3D(x0, y1, z1), // 7: front-left-top
        ];

        const sixFaces: { idx: number[]; shade: number }[] = [
          { idx: [0, 1, 2, 3], shade: 0.78 }, // bottom (-Z)
          { idx: [4, 5, 6, 7], shade: 1.06 }, // top (+Z)
          { idx: [0, 1, 5, 4], shade: 0.86 }, // back (-Y)
          { idx: [3, 2, 6, 7], shade: 1.0 }, // front cutaway face (+Y)
          { idx: [0, 3, 7, 4], shade: 0.88 }, // left (-X)
          { idx: [1, 2, 6, 5], shade: 0.94 }, // right (+X)
        ];

        for (const f of sixFaces) {
          const pts = f.idx.map((i) => ({ x: v[i].x, y: v[i].y }));
          const avgDepth =
            f.idx.reduce((acc, i) => acc + v[i].depth, 0) / f.idx.length;
          faces.push({
            regionId: reg.id,
            points: pts,
            depth: avgDepth,
            fill: shadeHexColor(baseFill, isSelected ? f.shade * 1.04 : f.shade),
            stroke:
              isSelected || isParamLinked || isElementLinked
                ? '#1E40AF'
                : reg.colorStroke,
            opacity: baseOpacity,
            shadeFactor: f.shade,
          });
        }
      }
    }

    // Sort back-to-front (smaller depth drawn first)
    faces.sort((a, b) => a.depth - b.depth);
    return faces;
  }, [
    yawDeg,
    pitchDeg,
    zoom,
    explodeFactor,
    cutawayMode,
    overlayMode,
    spatialFilter,
    activeRegion.id,
    selectedParamId,
    selectedElementId,
    opResult.Dtsh,
  ]);

  // Compute Kirk Effect Base Push-Out 3D Zone when I_C / I_CK is significant
  const kirkRatio = useMemo(() => {
    if (opResult.Ick <= 0) return 0;
    return Math.min(2.5, Math.max(0, opResult.Ic / opResult.Ick));
  }, [opResult.Ic, opResult.Ick]);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startYaw: yawDeg,
      startPitch: pitchDeg,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setYawDeg(dragRef.current.startYaw + dx * 0.45);
    setPitchDeg(Math.max(-5, Math.min(78, dragRef.current.startPitch + dy * 0.35)));
  };

  const handleMouseUp = () => {
    dragRef.current.active = false;
  };

  const conceptualParams = useMemo(
    () => parameters.filter((p) => p.spatialNature === 'conceptual' || p.spatialNature === 'flag'),
    [parameters]
  );

  return (
    <div className="space-y-5">
      {/* Top Control & Mode Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono font-semibold">
                <Box className="w-3.5 h-3.5" />
                Interactive 3D SiGe HBT Structure Explorer
              </span>
              <span className="px-2.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-xs font-mono font-medium">
                11 Selectable 3D Volumes · 10 3D Circuit Nodes · Live Bias & Kirk Push-Out
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 font-scientific">
              3D Semiconductor Architecture & HICUM/L2 Compact Model Mapping
            </h2>
          </div>

          {/* 4 Physics Overlay Mode Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setOverlayMode('doping')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                overlayMode === 'doping'
                  ? 'bg-blue-800 text-white border-blue-800 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D Doping & Regions</span>
            </button>

            <button
              onClick={() => setOverlayMode('circuit_overlay')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                overlayMode === 'circuit_overlay'
                  ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>3D Equivalent-Circuit Overlay</span>
            </button>

            <button
              onClick={() => setOverlayMode('carrier_kirk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                overlayMode === 'carrier_kirk'
                  ? 'bg-indigo-800 text-white border-indigo-800 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Carrier Flux & Kirk Push-Out</span>
            </button>

            <button
              onClick={() => setOverlayMode('thermal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                overlayMode === 'thermal'
                  ? 'bg-rose-800 text-white border-rose-800 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>3D Self-Heating Field (ΔTj)</span>
            </button>
          </div>
        </div>

        {/* Camera Presets, Cutaway Mode & Exploded Z-Stack Slider */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-500">Camera View:</span>
            <button
              onClick={() => {
                setYawDeg(-34);
                setPitchDeg(24);
                setZoom(1.42);
              }}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              Isometric 3D
            </button>
            <button
              onClick={() => {
                setYawDeg(0);
                setPitchDeg(6);
                setZoom(1.55);
              }}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              Front Cross-Section (X–Z)
            </button>
            <button
              onClick={() => {
                setYawDeg(-90);
                setPitchDeg(10);
                setZoom(1.45);
              }}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              Stripe Profile (Y–Z)
            </button>
            <button
              onClick={() => {
                setYawDeg(0);
                setPitchDeg(75);
                setZoom(1.4);
              }}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              Top Layout (X–Y)
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Cutaway Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => setCutawayMode('half_cutaway')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium ${
                  cutawayMode === 'half_cutaway' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Half Cutaway
              </button>
              <button
                onClick={() => setCutawayMode('quarter_cutaway')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium ${
                  cutawayMode === 'quarter_cutaway' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Quarter Wedge
              </button>
              <button
                onClick={() => setCutawayMode('full_3d')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium ${
                  cutawayMode === 'full_3d' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Full 3D Mesa
              </button>
            </div>

            {/* Exploded Stack Slider */}
            <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="font-medium text-slate-600">Explode Layers:</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={explodeFactor}
                onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                className="w-20 accent-blue-800 cursor-pointer"
              />
              <span className="font-mono text-[11px] w-8 text-right font-semibold">
                {Math.round(explodeFactor * 100)}%
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
              <button
                onClick={() => setZoom((z) => Math.max(0.85, +(z - 0.15).toFixed(2)))}
                className="p-1.5 text-slate-600 hover:bg-slate-100"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setYawDeg(-34);
                  setPitchDeg(24);
                  setZoom(1.42);
                  setExplodeFactor(0.18);
                }}
                className="px-2 text-[11px] font-mono text-slate-600 hover:bg-slate-100"
                title="Reset 3D View"
              >
                Reset
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.15).toFixed(2)))}
                className="p-1.5 text-slate-600 hover:bg-slate-100"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main 12-Column Interactive 3D Viewport + Region & Localization Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left 7 Columns: Interactive 3D Viewport */}
        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">
              Drag anywhere to rotate in 3D ({Math.round(yawDeg)}° yaw, {Math.round(pitchDeg)}° pitch) · Click any 3D volume or node pin to inspect
            </span>
            <span className="font-mono text-[11px] text-blue-800 font-semibold">
              Active: {activeRegion.shortLabel}
            </span>
          </div>

          <div className="relative bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] select-none">
            <svg
              viewBox="0 0 740 480"
              className="w-full h-auto max-h-[500px] cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* 3D Coordinate Axes Triad in Bottom-Left Corner */}
              {(() => {
                const orig = { x: 58, y: 425 };
                const axX = project3D(28, 0, 0);
                const axY = project3D(0, 28, 0);
                const axZ = project3D(0, 0, 28);
                const c0 = project3D(0, 0, 0);
                return (
                  <g>
                    <line
                      x1={orig.x}
                      y1={orig.y}
                      x2={orig.x + (axX.x - c0.x)}
                      y2={orig.y + (axX.y - c0.y)}
                      stroke="#1E40AF"
                      strokeWidth={2}
                    />
                    <text
                      x={orig.x + (axX.x - c0.x) + 4}
                      y={orig.y + (axX.y - c0.y)}
                      className="fill-blue-900 font-mono text-[10px] font-bold"
                    >
                      X (Width b_E)
                    </text>
                    <line
                      x1={orig.x}
                      y1={orig.y}
                      x2={orig.x + (axY.x - c0.x)}
                      y2={orig.y + (axY.y - c0.y)}
                      stroke="#0F766E"
                      strokeWidth={2}
                    />
                    <text
                      x={orig.x + (axY.x - c0.x) + 4}
                      y={orig.y + (axY.y - c0.y)}
                      className="fill-teal-900 font-mono text-[10px] font-bold"
                    >
                      Y (Length l_E)
                    </text>
                    <line
                      x1={orig.x}
                      y1={orig.y}
                      x2={orig.x + (axZ.x - c0.x)}
                      y2={orig.y + (axZ.y - c0.y)}
                      stroke="#9F1239"
                      strokeWidth={2}
                    />
                    <text
                      x={orig.x + (axZ.x - c0.x) - 10}
                      y={orig.y + (axZ.y - c0.y) - 6}
                      className="fill-rose-900 font-mono text-[10px] font-bold"
                    >
                      Z (Vertical)
                    </text>
                  </g>
                );
              })()}

              {/* Depth-Sorted 3D Hexahedral Faces */}
              {sortedFaces.map((f, idx) => {
                const ptsStr = f.points
                  .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                  .join(' ');
                const isSelected = f.regionId === activeRegion.id;
                return (
                  <polygon
                    key={idx}
                    points={ptsStr}
                    fill={f.fill}
                    fillOpacity={f.opacity}
                    stroke={f.stroke}
                    strokeWidth={isSelected ? 1.6 : 0.85}
                    strokeLinejoin="round"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRegionId(f.regionId);
                    }}
                    className="cursor-pointer transition-opacity"
                  />
                );
              })}

              {/* Carrier Flux & Kirk Effect Base Push-Out Overlay */}
              {overlayMode === 'carrier_kirk' &&
                (() => {
                  const zOffBase = (3 - 2.5) * explodeFactor * 26;
                  const zOffColl = (2 - 2.5) * explodeFactor * 26;
                  const zOffBuried = (1 - 2.5) * explodeFactor * 26;
                  const zOffEmit = (6 - 2.5) * explodeFactor * 26;

                  // Kirk push-out depth into collector epi (proportional to kirkRatio)
                  const pushDepth = Math.min(26, 4 + kirkRatio * 14);
                  const kTopLeft = project3D(-32, 0, -2 + zOffColl);
                  const kTopRight = project3D(12, 0, -2 + zOffColl);
                  const kBotRight = project3D(12 + kirkRatio * 6, 0, -2 - pushDepth + zOffColl);
                  const kBotLeft = project3D(-32 - kirkRatio * 6, 0, -2 - pushDepth + zOffColl);

                  // Electron flow stream points: E' -> B' -> C' -> Buried Layer -> Sinker -> C
                  const pE = project3D(-10, 0, 50 + zOffEmit);
                  const pB = project3D(-10, 0, 6 + zOffBase);
                  const pCprime = project3D(-10, 0, -44 + zOffBuried);
                  const pSinkerBot = project3D(76, 0, -44 + zOffBuried);
                  const pC = project3D(76, 0, 35 + zOffColl);

                  // Lateral hole injection path: B -> B* -> B'
                  const pBaseExt = project3D(-78, 0, 12 + zOffBase);
                  const pBasePerim = project3D(-36, 0, 10 + zOffBase);

                  return (
                    <g className="pointer-events-none">
                      {/* Kirk Push-Out Induced Space-Charge Expansion Zone */}
                      <polygon
                        points={`${kTopLeft.x},${kTopLeft.y} ${kTopRight.x},${kTopRight.y} ${kBotRight.x},${kBotRight.y} ${kBotLeft.x},${kBotLeft.y}`}
                        fill="#F43F5E"
                        fillOpacity={0.42}
                        stroke="#9F1239"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />
                      <text
                        x={(kTopLeft.x + kBotRight.x) / 2}
                        y={(kTopLeft.y + kBotRight.y) / 2 + 4}
                        textAnchor="middle"
                        className="fill-rose-950 font-mono font-bold text-[10px]"
                      >
                        Kirk Base Push-Out (I_C/I_CK = {kirkRatio.toFixed(2)})
                      </text>

                      {/* Primary Electron Transfer Current Stream i_T */}
                      <path
                        d={`M ${pE.x} ${pE.y} L ${pB.x} ${pB.y} L ${pCprime.x} ${pCprime.y} L ${pSinkerBot.x} ${pSinkerBot.y} L ${pC.x} ${pC.y}`}
                        fill="none"
                        stroke="#1E40AF"
                        strokeWidth={3.5}
                        strokeDasharray="6 4"
                      />

                      {/* Lateral Base Hole Current Crowding Stream i_B */}
                      <path
                        d={`M ${pBaseExt.x} ${pBaseExt.y} L ${pBasePerim.x} ${pBasePerim.y} L ${pB.x} ${pB.y}`}
                        fill="none"
                        stroke="#0F766E"
                        strokeWidth={2.8}
                      />
                    </g>
                  );
                })()}

              {/* 3D Equivalent-Circuit Overlay (Nodes & Branches Mapped in 3D Space) */}
              {(overlayMode === 'circuit_overlay' || overlayMode === 'doping') &&
                (() => {
                  const pinScreenMap: Record<string, { x: number; y: number }> = {};
                  for (const pin of NODE_3D_PINS) {
                    const zOff = (pin.layerGroup - 2.5) * explodeFactor * 26;
                    const pt = project3D(pin.x, pin.y, pin.z + zOff);
                    pinScreenMap[pin.id] = { x: pt.x, y: pt.y };
                  }

                  return (
                    <g>
                      {/* 3D Branch Vectors when in circuit_overlay mode */}
                      {overlayMode === 'circuit_overlay' &&
                        BRANCH_3D_LINKS.map((br) => {
                          const p1 = pinScreenMap[br.fromNode];
                          const p2 = pinScreenMap[br.toNode];
                          if (!p1 || !p2) return null;
                          const mx = (p1.x + p2.x) / 2;
                          const my = (p1.y + p2.y) / 2;
                          return (
                            <g
                              key={br.elementId}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectElementInLab(br.elementId);
                              }}
                              className="cursor-pointer"
                            >
                              <line
                                x1={p1.x}
                                y1={p1.y}
                                x2={p2.x}
                                y2={p2.y}
                                stroke={br.color}
                                strokeWidth={2.4}
                              />
                              <rect
                                x={mx - 34}
                                y={my - 9}
                                width={68}
                                height={16}
                                rx={4}
                                fill="#FFFFFF"
                                fillOpacity={0.92}
                                stroke={br.color}
                                strokeWidth={1.2}
                              />
                              <text
                                x={mx}
                                y={my + 3}
                                textAnchor="middle"
                                className="fill-slate-900 font-mono font-bold text-[8.5px]"
                              >
                                {br.label}
                              </text>
                            </g>
                          );
                        })}

                      {/* 3D Circuit Node Pins */}
                      {NODE_3D_PINS.map((pin) => {
                        const pt = pinScreenMap[pin.id];
                        if (!pt) return null;
                        return (
                          <g key={pin.id} className="pointer-events-none">
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={pin.ext ? 6.5 : 5}
                              fill={pin.ext ? '#0F172A' : '#FFFFFF'}
                              stroke="#1E40AF"
                              strokeWidth={2}
                            />
                            <text
                              x={pt.x + 8}
                              y={pt.y + 3}
                              className="fill-slate-900 font-mono font-bold text-[10px]"
                              style={{
                                paintOrder: 'stroke',
                                stroke: '#FFFFFF',
                                strokeWidth: 3,
                              }}
                            >
                              {pin.id}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
            </svg>

            {/* Floating Live Physics Status Pill inside 3D Viewport */}
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg px-3 py-2 shadow-xs text-[11px] font-mono space-y-0.5">
              <div className="text-slate-500 font-sans font-semibold text-[10px] uppercase">
                Live 3D Device State
              </div>
              <div className="flex items-center gap-3">
                <span className="text-blue-900 font-semibold">
                  I_C = {(opResult.Ic * 1e3).toFixed(2)} mA
                </span>
                <span className="text-rose-900 font-semibold">
                  I_C/I_CK = {kirkRatio.toFixed(2)}
                </span>
                <span className="text-amber-900 font-semibold">
                  ΔT_j = +{opResult.Dtsh.toFixed(1)} K
                </span>
              </div>
            </div>
          </div>

          {/* 3D Region Quick-Select Strip */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              3D Volumes:
            </span>
            {HBT_3D_REGIONS.map((r) => {
              const active = r.id === activeRegion.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRegionId(r.id)}
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-blue-800 text-white border-blue-800 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: r.colorStroke }}
                  />
                  <span>{r.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Synchronized 3D Region & Localization Inspector */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono text-xs font-semibold">
                {activeRegion.dopingTag}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
                  activeRegion.spatialNature === 'localized'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {activeRegion.spatialNature === 'localized'
                  ? 'Physically Localized 3D Volume'
                  : 'Distributed 2D/3D Physical Region'}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 font-scientific">
                {activeRegion.name}
              </h3>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                HICUM/L2 Manual Reference: {activeRegion.manualSection}
              </p>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {activeRegion.description}
            </p>

            {/* Localized vs Distributed Physical Distinction Box */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/90">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-1">
                <Compass className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span>Physical Localization vs. Distributed Modeling Note</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {activeRegion.localizedVsDistributedNote}
              </p>
            </div>

            {/* Equivalent-Circuit Nodes & Branches inside this 3D Region */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                HICUM/L2 Circuit Nodes & Branches in This 3D Volume
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeRegion.nodesInRegion.map((nId) => (
                  <span
                    key={nId}
                    className="px-2 py-1 rounded bg-slate-900 text-white font-mono text-xs font-bold"
                  >
                    Node {nId}
                  </span>
                ))}
                {activeRegion.circuitElements.map((elId) => (
                  <button
                    key={elId}
                    onClick={() => onSelectElementInLab(elId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100 font-mono text-xs font-semibold transition-colors"
                  >
                    <Cpu className="w-3 h-3" />
                    <span>{elId}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>

            {/* Associated HICUM Parameters */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Mapped HICUM/L2 Parameters (Click to Inspect & Adjust in Lab)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeRegion.keyParameters.map((pId) => {
                  const isCurrent = pId === selectedParamId;
                  return (
                    <button
                      key={pId}
                      onClick={() => onSelectParamInLab(pId)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-mono text-xs font-medium border transition-colors ${
                        isCurrent
                          ? 'bg-blue-800 text-white border-blue-800'
                          : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      <span>{pId}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Non-Localized / Conceptual / Global Thermal Parameters Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Non-Localized, Smoothing & Global Parameters ({conceptualParams.length})</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-900 border border-amber-200">
                Conceptual / Global
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
              Unlike junction capacitances or contact resistances, mathematical smoothing constants (<code>ajei</code>, <code>aick</code>, <code>ahc</code>, <code>acbar</code>), global temperature exponents (<code>zetact</code>, <code>zetabet</code>, <code>f1vg</code>, <code>f2vg</code>), and simulator control flags (<code>flnqs</code>, <code>flcono</code>, <code>flsh</code>, <code>type</code>) act across equations or the entire die rather than a single localized 3D coordinate:
            </p>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
              {conceptualParams.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectParamInLab(p.id)}
                  className="px-2 py-0.5 rounded bg-amber-50/80 hover:bg-amber-100 text-amber-950 border border-amber-200 font-mono text-[11px]"
                  title={p.description}
                >
                  {p.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interactive3DTransistorView;
