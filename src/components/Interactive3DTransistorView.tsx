import React, { useState, useRef, useMemo } from 'react';
import {
  HicumParameter,
  CircuitElement,
  CircuitNode,
  BiasState,
  OperatingPointResult,
  SpatialNature,
} from '../data/hicumTypes';
import {
  Box,
  Layers,
  ZoomIn,
  ZoomOut,
  Cpu,
  Flame,
  Zap,
  Compass,
  ArrowUpRight,
  Info,
  Download,
  Code2,
  Image as ImageIcon,
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
type CutawayMode = 'step_cutaway' | 'sde_half_cell' | 'full_3d';
type ViewportTab = 'interactive_3d' | 'blender_renders' | 'sentaurus_table';

export interface Prism2DProfile {
  /**
   * 2D polygon vertices in exact Sentaurus SDE micrometers (um):
   * x: lateral coordinate in [0.0, 1.20] um (mirrored to [-1.20, 0.0] um for left half)
   * z: vertical height in [-0.63, +0.33] um where z = -Y_sentaurus (Z=0 is Ybas=0.0 base-collector interface)
   */
  xzPointsUm: [number, number][];
}

export interface Region3DSpec {
  id: string;
  name: string;
  shortLabel: string;
  sentaurusId: string;
  blenderMeshName: string;
  sentaurusCoordsUm: string;
  sentaurusSdeSnippet: string;
  dopingTag: string;
  spatialNature: 'localized' | 'distributed';
  layerGroup: number; // 0 (bottom substrate) to 6 (top metal) for exploded Z view
  colorFill: string;
  colorStroke: string;
  defaultOpacity?: number;
  thermalWeight: number;
  manualSection: string;
  description: string;
  localizedVsDistributedNote: string;
  nodesInRegion: string[];
  circuitElements: string[];
  keyParameters: string[];
  prisms: Prism2DProfile[];
}

/**
 * Exact Sentaurus SDE & sprocess coordinates (in micrometers):
 * Xmin = 0.0, Xer = 0.075, Xbcr = 0.150, Xbr = 0.225, Xcr = 0.325, Xbcm = 0.450,
 * Xsl = 0.700, Xscl = 0.800, Xscr = 1.000, Xsr = 1.100, Xmax = 1.200
 * Vertical Z = -Y_sde:
 * Z_max_top = +0.300 (Ymin = -0.300), Z_bc = +0.150 (Ybc = -0.150),
 * Z_emi = +0.075 (Yemi = -0.075), Z_bas = 0.000 (Ybas = 0.000),
 * Z_sub = -0.300 (Ysub = +0.300), Z_min_bot = -0.600 (Ymax = +0.600)
 */
export const HBT_3D_REGIONS: Region3DSpec[] = [
  {
    id: 'p_substrate_bulk',
    name: 'p⁻ Silicon Wafer Substrate & Substrate Terminal (R.Substrate / S, S\')',
    shortLabel: 'R.Substrate (p⁻ Si)',
    sentaurusId: 'R.Substrate (Const.Sub + Contact: substrate)',
    blenderMeshName: 'R_Substrate_P & Contact_Substrate',
    sentaurusCoordsUm: 'X ∈ [0.00, 1.20] μm, Y_sde ∈ [0.42, 0.60] μm',
    sentaurusSdeSnippet: `(sdepe:doping-constant-placement "Const.Sub" "BoronActiveConcentration" 1e15 "R.Substrate")\ncontact name=substrate bottomSilicon`,
    dopingTag: 'Boron 10¹⁵ cm⁻³ (Const.Sub)',
    spatialNature: 'distributed',
    layerGroup: 0,
    colorFill: '#CBD5E1',
    colorStroke: '#475569',
    thermalWeight: 0.2,
    manualSection: 'Sections 2.11 & 2.12 (Fig. 2.11.0/1)',
    description:
      'Lightly doped p-type silicon wafer beneath the n⁺ buried subcollector (Y_sde > 0.30 μm in Sentaurus SDE, extending to 9.5 μm in sprocess). Hosts internal substrate node S\' and bulk coupling network (R_su, C_su) to bottom substrate contact S.',
    localizedVsDistributedNote:
      'C_jS is localized at the n⁺ buried-layer / p⁻ substrate metallurgical junction around Y_sub = 0.30 μm, whereas R_su and C_su represent distributed 3D spreading impedance through the p⁻ wafer.',
    nodesInRegion: ["S'", 'S'],
    circuitElements: ['cjs', 'cscp', 'ijsc', 'its', 'qdsu', 'rsu', 'csu'],
    keyParameters: ['cjs0', 'vds', 'zs', 'vpts', 'cscp0', 'vdsp', 'zsp', 'rsu', 'csu', 'itss', 'msf', 'tsf', 'iscs'],
    prisms: [
      {
        xzPointsUm: [
          [0.0, -0.60],
          [1.20, -0.60],
          [1.20, -0.42],
          [0.0, -0.42],
        ],
      },
    ],
  },
  {
    id: 'buried_subcollector',
    name: 'n⁺ Buried Subcollector Layer (Impl.SubCol / Node C\' Bottom Plane)',
    shortLabel: 'Impl.SubCol (n⁺ Buried)',
    sentaurusId: 'Impl.SubCol (Def.SubCol / Ref.SubCol)',
    blenderMeshName: 'Impl_SubCol_BuriedNPlus',
    sentaurusCoordsUm: 'X ∈ [0.00, 1.20] μm, Y_sde = 0.30 μm (Peak 2×10¹⁹ cm⁻³)',
    sentaurusSdeSnippet: `(sdegeo:insert-vertex (position Ysub Xmin 0.0))\n(sdepe:doping-analytical-profile-definition "Def.SubCol" "ArsenicActiveConcentration" "PeakPos" 0.0 "PeakVal" 2e19 "ValueAtDepth"DopingSub "Depth" 0.2 "Gauss" "Factor" 0.2)\n; sprocess: implant phosphorus dose=1e14 energy=350`,
    dopingTag: 'As/P Peak 2×10¹⁹ cm⁻³ (Impl.SubCol)',
    spatialNature: 'localized',
    layerGroup: 1,
    colorFill: '#3B82F6',
    colorStroke: '#1D4ED8',
    thermalWeight: 0.42,
    manualSection: 'Section 2.8.2 (Fig. 2.8.2/1)',
    description:
      'Heavily doped n⁺ buried subcollector centered at Y_sub = 0.30 μm across X ∈ [0, 1.20] μm. Collects vertical electron current from the intrinsic collector mesa (X ∈ [0, 0.325] μm) and conducts it laterally beneath the STI oxide trench to the collector sinker mesa (X ∈ [0.70, 1.10] μm).',
    localizedVsDistributedNote:
      'Physically localized low-sheet-resistance buried layer; combines with the n⁺ collector sinker mesa and contact into lumped external collector resistance R_Cx.',
    nodesInRegion: ["C'"],
    circuitElements: ['rcx', 'cjs', 'ijsc'],
    keyParameters: ['rcx', 'zetarcx', 'cjs0', 'vds', 'zs'],
    prisms: [
      {
        xzPointsUm: [
          [0.0, -0.42],
          [1.20, -0.42],
          [1.20, -0.30],
          [0.0, -0.30],
        ],
      },
    ],
  },
  {
    id: 'extrinsic_bc_junction',
    name: 'Shallow Trench Isolation (STI) Oxide & Active Collector Mesa Slope (R.Insulation / R.Substrate)',
    shortLabel: 'R.Insulation (STI Oxide)',
    sentaurusId: 'R.Insulation (Oxide) + R.Substrate Active Mesa',
    blenderMeshName: 'R_Insulation_STI_Inner & R_CollectorMesa_EpiN',
    sentaurusCoordsUm: 'Active Mesa: X ∈ [0, 0.225→0.325] μm; STI Trench: X ∈ [0.225..0.325 → 0.70..0.80] μm, Y_sde ∈ [0, 0.30] μm',
    sentaurusSdeSnippet: `; Sloped mesa wall dWc = 0.10 um (Xbr=0.225 at Ybas=0 -> Xcr=0.325 at Ysub=0.30)\n(position Ybas Xbr 0) (position Ysub Xcr 0) (position Ysub Xsl 0) (position Ybas Xscl 0)`,
    dopingTag: 'n-Collector Mesa & SiO₂ STI (dWc = 0.10 μm)',
    spatialNature: 'distributed',
    layerGroup: 2,
    colorFill: '#7DD3FC',
    colorStroke: '#0369A1',
    defaultOpacity: 0.72,
    thermalWeight: 0.48,
    manualSection: 'Sections 2.4.2, 2.6, 2.8.3 (Fig. 2.7.0/2)',
    description:
      'Trapezoidal active silicon collector mesa (widening from X_br = 0.225 μm at Y_bas = 0 to X_cr = 0.325 μm at Y_sub = 0.30 μm with slope dWc = 0.10 μm) flanked by the Shallow Trench Isolation (STI) oxide trench that isolates the intrinsic mesa from the collector sinker.',
    localizedVsDistributedNote:
      'Distributed B-C capacitance across the extrinsic mesa periphery is partitioned via f_BCpar into C_jCx1 (to B) and C_jCx2 (to B*), while the STI oxide trench governs lateral thermal confinement (R_th) and parasitic capacitance C_BCpar.',
    nodesInRegion: ['B', 'B*', "C'"],
    circuitElements: ['cjcx1', 'cjcx2', 'ijbcx', 'its', 'qdsu', 'rth'],
    keyParameters: ['cjcx0', 'vdcx', 'zcx', 'vptcx', 'cbcpar', 'fbcpar', 'ibcxs', 'mbcx', 'rth', 'cth'],
    prisms: [
      // Active collector mesa outer sloped wing around SIC
      {
        xzPointsUm: [
          [0.0, -0.30],
          [0.325, -0.30],
          [0.285, -0.18],
          [0.0, -0.18],
        ],
      },
      {
        xzPointsUm: [
          [0.150, -0.18],
          [0.285, -0.18],
          [0.225, 0.0],
          [0.150, 0.0],
        ],
      },
      // Inner STI Oxide Trench (between Xbr..Xcr and Xsl..Xscl)
      {
        xzPointsUm: [
          [0.325, -0.30],
          [0.700, -0.30],
          [0.800, 0.0],
          [0.225, 0.0],
        ],
      },
    ],
  },
  {
    id: 'intrinsic_collector_sic',
    name: 'Selectively Implanted Collector Pedestal (Impl.Col / SIC Core B\'–C\')',
    shortLabel: 'Impl.Col (n-SIC Pedestal)',
    sentaurusId: 'Impl.Col (Def.Col / Ref.Col)',
    blenderMeshName: 'Impl_Col_SIC',
    sentaurusCoordsUm: 'X ∈ [0.00, 0.150] μm (Xbcr), Y_sde = 0.075 μm (Peak 10¹⁸ cm⁻³)',
    sentaurusSdeSnippet: `(sdegeo:insert-vertex (position 0.075 Xmin 0.0))\n(sdegeo:insert-vertex (position 0.075 Xbcr 0.0))\n(sdepe:doping-analytical-profile-definition "Def.Col" "PhosphorusActiveConcentration" "PeakPos" 0.0 "PeakVal" PeakCol ...)\n; sprocess: implant phosphorus dose=2e12 energy=150`,
    dopingTag: 'Phosphorus Peak 10¹⁸ cm⁻³ (Impl.Col / SIC)',
    spatialNature: 'distributed',
    layerGroup: 2,
    colorFill: '#0EA5E9',
    colorStroke: '#0369A1',
    thermalWeight: 1.0,
    manualSection: 'Sections 2.2.1, 2.2.2, 2.4.2, 2.10 (Fig. 2.2.0/2)',
    description:
      'Selectively Implanted Collector (SIC) pedestal implanted through the emitter window across X ∈ [0, X_bcr = 0.150 μm] centered at depth Y = 0.075 μm beneath the SiGe base. Sustains the high B\'-C\' electric field, boosts Kirk critical current I_CK(v_C\'E\'), and controls high-current base push-out Δτ_fh and avalanche generation i_AVL.',
    localizedVsDistributedNote:
      'HICUM models the distributed electric-field collapse, velocity saturation (v_lim), and high-injection space-charge widening of this SIC core directly inside I_CK(v_C\'E\') and Q_f(i_Tf).',
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
    ],
    prisms: [
      {
        xzPointsUm: [
          [0.0, -0.18],
          [0.150, -0.18],
          [0.150, 0.0],
          [0.0, 0.0],
        ],
      },
    ],
  },
  {
    id: 'collector_sinker_contact',
    name: 'n⁺ Collector Sinker Mesa & Aluminium Collector Contact (Impl.ColCont + R.CollectorCont)',
    shortLabel: 'Impl.ColCont & R.CollectorCont',
    sentaurusId: 'Impl.ColCont (Def.ColCont) + R.CollectorCont (Aluminium)',
    blenderMeshName: 'Impl_ColCont_SinkerNPlus & R_CollectorCont',
    sentaurusCoordsUm: 'Sinker Mesa: X ∈ [0.80..1.00 top → 0.70..1.10 bottom], Y_sde ∈ [0, 0.30] μm; Al Contact: X ∈ [0.80, 1.00], Y_sde ∈ [-0.30, 0] μm',
    sentaurusSdeSnippet: `(sdegeo:create-rectangle (position Ybas Xscl 0.0) (position Ymin Xscr 0.0) "Aluminium" "R.CollectorCont")\n(sdepe:doping-analytical-profile-definition "Def.ColCont" "PhosphorusActiveConcentration" "PeakPos" 0.0 "PeakVal" 1e20 ...)`,
    dopingTag: 'n⁺ Sinker (10²⁰ cm⁻³) + Al Contact C',
    spatialNature: 'localized',
    layerGroup: 2,
    colorFill: '#2563EB',
    colorStroke: '#1E3A8A',
    thermalWeight: 0.32,
    manualSection: 'Section 2.8.2 (Fig. 2.8.2/1)',
    description:
      'Trapezoidal collector sinker mesa (X ∈ [0.80, 1.00] μm at Y_bas = 0 widening with slope dWc = 0.10 μm to X ∈ [0.70, 1.10] μm at Y_sub = 0.30 μm, doped 10²⁰ cm⁻³) topped by the Aluminium collector contact R.CollectorCont (Y_sde ∈ [-0.30, 0.0] μm).',
    localizedVsDistributedNote:
      'Physically localized vertical ohmic reach-through path connecting the n⁺ buried subcollector to external collector terminal C (modeled by R_Cx).',
    nodesInRegion: ['C', "C'"],
    circuitElements: ['rcx', 'cscp'],
    keyParameters: ['rcx', 'zetarcx'],
    prisms: [
      // Sloped n+ collector sinker mesa (Y_sde in [0, 0.30] -> Z in [-0.30, 0.0])
      {
        xzPointsUm: [
          [0.700, -0.30],
          [1.100, -0.30],
          [1.000, 0.0],
          [0.800, 0.0],
        ],
      },
      // Aluminium R.CollectorCont (Y_sde in [-0.30, 0.0] -> Z in [0.0, +0.30])
      {
        xzPointsUm: [
          [0.800, 0.0],
          [1.000, 0.0],
          [1.000, 0.30],
          [0.800, 0.30],
        ],
      },
    ],
  },
  {
    id: 'intrinsic_sige_base',
    name: 'Epitaxial Graded p-Si₁₋ₓGeₓ Base Layer (R.SiGeBase / Node B\')',
    shortLabel: 'R.SiGeBase (75 nm SiGe)',
    sentaurusId: 'R.SiGeBase (Place.Bas + Prof.Mole)',
    blenderMeshName: 'R_SiGeBase',
    sentaurusCoordsUm: 'X ∈ [0.00, 0.225] μm (Xbr), Y_sde ∈ [-0.075, 0.00] μm (Hbas = 75 nm)',
    sentaurusSdeSnippet: `(sdegeo:create-rectangle (position Ybas Xmin 0.0) (position Yemi Xbr 0.0) "SiliconGermanium" "R.SiGeBase")\n(sdepe:Graded-Strained-Mole-Fraction "Prof.Mole" "R.SiGeBase" "x" 0.0 0.16)`,
    dopingTag: 'Boron 5×10¹⁸ cm⁻³ · Ge x = 0 → 0.16',
    spatialNature: 'distributed',
    layerGroup: 3,
    colorFill: '#10B981',
    colorStroke: '#065F46',
    thermalWeight: 0.94,
    manualSection: 'Sections 2.2, 2.3.1, 2.5, 2.13, 2.14 (Fig. 2.2.0/2)',
    description:
      'Epitaxial SiliconGermanium base layer of thickness H_bas = 75 nm (Y_sde ∈ [-0.075, 0.0] μm, half-width X_br = 0.225 μm). Features a linear Germanium mole fraction ramp from x_Ge = 0 at Y_emi = -0.075 μm to x_Ge = 0.16 at Y_bas = 0.0 μm (compressively strained up to 4.25% in sprocess) and Gaussian Boron doping (PeakBas = 5×10¹⁸ cm⁻³ in SDE, 7.8×10¹⁸ cm⁻³ in sprocess).',
    localizedVsDistributedNote:
      'Vertically bounded between Y_emi = -0.075 μm and Y_bas = 0.0 μm, and laterally distributed from the intrinsic window (X ≤ 0.075 μm) out to the extrinsic poly-base overlap (X ∈ [0.150, 0.225] μm): governs GICCR transfer current i_T and sheet/crowding resistance R_bi*.',
    nodesInRegion: ["B'", 'B*', "E'", "C'"],
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
    ],
    prisms: [
      {
        xzPointsUm: [
          [0.0, 0.0],
          [0.225, 0.0],
          [0.225, 0.052],
          [0.0, 0.052],
        ],
      },
      {
        xzPointsUm: [
          [0.075, 0.052],
          [0.225, 0.052],
          [0.225, 0.075],
          [0.075, 0.075],
        ],
      },
    ],
  },
  {
    id: 'extrinsic_base_poly',
    name: 'Extrinsic p⁺ Poly-Base & Aluminium Base Contact (R.Baseright + R.BaseContR)',
    shortLabel: 'R.Baseright & R.BaseContR',
    sentaurusId: 'R.Baseright (PolySilicon 10²⁰) + R.BaseContR (Aluminium)',
    blenderMeshName: 'R_Baseright_PolyBase & R_BaseContR',
    sentaurusCoordsUm: 'Poly-Base: X ∈ [0.150, 0.450] μm, Y_sde ∈ [-0.150, -0.075] μm; Al Contact: X ∈ [0.225, 0.450] μm, Y_sde ∈ [-0.300, -0.150] μm',
    sentaurusSdeSnippet: `(sdegeo:create-rectangle (position Yemi Xbcr 0.0) (position Ybc Xbcm 0.0) "PolySilicon" "R.Baseright")\n(sdegeo:create-rectangle (position Ybc Xbr 0.0) (position Ymin Xbcm 0.0) "Aluminium" "R.BaseContR")`,
    dopingTag: 'p⁺ Poly Boron 10²⁰ cm⁻³ + Al Base Contact B',
    spatialNature: 'distributed',
    layerGroup: 4,
    colorFill: '#F43F5E',
    colorStroke: '#9F1239',
    thermalWeight: 0.46,
    manualSection: 'Sections 2.5, 2.7 (Figs. 2.7.0/1, 2.7.0/2)',
    description:
      'Heavily doped p⁺ PolySilicon extrinsic base contact layer R.Baseright (X ∈ [0.150, 0.450] μm, Y_sde ∈ [-0.150, -0.075] μm, Boron 10²⁰ cm⁻³) overlapping the top of R.SiGeBase by dWb = 0.075 μm across X ∈ [0.150, 0.225] μm, contacted above by Aluminium terminal R.BaseContR (X ∈ [0.225, 0.450] μm, Y_sde ∈ [-0.300, -0.150] μm).',
    localizedVsDistributedNote:
      'Connects external base terminal B through extrinsic base resistance R_Bx to the perimeter base node B* at the edge of the intrinsic emitter-base window.',
    nodesInRegion: ['B', 'B*'],
    circuitElements: ['rbx', 'cjcx1', 'cjcx2', 'cbepar1'],
    keyParameters: ['rbx', 'zetarbx', 'fgeo', 'cbcpar', 'fbcpar'],
    prisms: [
      // R.Baseright p+ Poly-Base (Y_sde in [-0.150, -0.075] -> Z in [0.075, 0.150])
      {
        xzPointsUm: [
          [0.150, 0.075],
          [0.450, 0.075],
          [0.450, 0.150],
          [0.150, 0.150],
        ],
      },
      // R.BaseContR Aluminium contact (Y_sde in [-0.300, -0.150] -> Z in [0.150, 0.300])
      {
        xzPointsUm: [
          [0.225, 0.150],
          [0.450, 0.150],
          [0.450, 0.300],
          [0.225, 0.300],
        ],
      },
    ],
  },
  {
    id: 'be_oxide_spacer',
    name: 'Nitride Sidewall Spacer & B-E Perimeter Junction (sprocess Spacer / B*–E\')',
    shortLabel: 'Si₃N₄ Sidewall Spacer',
    sentaurusId: 'sprocess Nitride Spacer (X ∈ [0.075, 0.150] μm)',
    blenderMeshName: 'Nitride_Spacer_Sidewall',
    sentaurusCoordsUm: 'X ∈ [0.075, 0.150] μm (Xer → Xbcr), Y_sde ∈ [-0.26, -0.075] μm',
    sentaurusSdeSnippet: `; sprocess nitride spacer inside emitter window:\ndeposit nitride thickness=0.05 isotropic\netch nitride thickness=0.054 anisotropic`,
    dopingTag: 'Si₃N₄ Sidewall Spacer (75 nm gap Xer → Xbcr)',
    spatialNature: 'localized',
    layerGroup: 5,
    colorFill: '#A78BFA',
    colorStroke: '#5B21B6',
    thermalWeight: 0.56,
    manualSection: 'Sections 2.3.2, 2.4.1, 2.8.3, 2.9 (Fig. 2.8.3/1)',
    description:
      'Silicon nitride (Si₃N₄) sidewall spacer occupying the 75 nm lateral separation between the n⁺ poly-emitter edge (X_er = 0.075 μm) and the p⁺ poly-base inner edge (X_bcr = 0.150 μm) on top of R.SiGeBase.',
    localizedVsDistributedNote:
      'Physically localized along the emitter stripe perimeter; governs peripheral injection i_jBEp, perimeter depletion capacitance C_jEp, B-E tunneling i_BEt, and sidewall spacer parasitic capacitance C_BEpar (partitioned via f_BEpar).',
    nodesInRegion: ['B*', "E'", 'B', 'E'],
    circuitElements: ['cjep', 'ibep', 'ibet', 'cbepar1', 'cbepar2'],
    keyParameters: ['cjep0', 'vdep', 'zep', 'ajep', 'ibeps', 'mbep', 'ireps', 'mrep', 'ibets', 'abet', 'tunode', 'cbepar', 'fbepar'],
    prisms: [
      {
        xzPointsUm: [
          [0.075, 0.075],
          [0.150, 0.075],
          [0.150, 0.220],
          [0.075, 0.260],
        ],
      },
    ],
  },
  {
    id: 'emitter_poly_mono',
    name: 'n⁺ Poly-Emitter Pedestal, Mono-Emitter Window & Emitter Contact (R.Emitter + Impl.Emi)',
    shortLabel: 'R.Emitter & Impl.Emi (E → E\')',
    sentaurusId: 'R.Emitter (PolySilicon 10²⁰) + Impl.Emi (Peak 5×10¹⁹) + Contact: emitter',
    blenderMeshName: 'R_Emitter_Poly, Impl_Emi_MonoWindow & Contact_Emitter',
    sentaurusCoordsUm: 'X ∈ [0.00, 0.075] μm (Xer = Wemi/2), Y_sde ∈ [-0.300, -0.075] μm (Hemi = 0.225 μm) + out-diffusion into R.SiGeBase',
    sentaurusSdeSnippet: `(sdegeo:create-rectangle (position Yemi Xmin 0.0) (position Ymin Xer 0.0) "PolySilicon" "R.Emitter")\n(sdepe:doping-constant-placement "Place.Emitter" "ArsenicActiveConcentration" 1e20 "R.Emitter")\n(sdepe:doping-analytical-profile-definition "Def.Emi" "ArsenicActiveConcentration" "PeakPos" 0.0 "PeakVal" 5e19 ...)`,
    dopingTag: 'n⁺ Poly 10²⁰ cm⁻³ + Mono-Emi 5×10¹⁹ cm⁻³',
    spatialNature: 'localized',
    layerGroup: 6,
    colorFill: '#F59E0B',
    colorStroke: '#B45309',
    thermalWeight: 0.62,
    manualSection: 'Sections 2.2.2, 2.8.1 (Fig. 2.8.1/1)',
    description:
      'n⁺ PolySilicon emitter pedestal R.Emitter (half-width X_er = 0.075 μm, full width W_emi = 0.15 μm, height H_emi = 0.225 μm from Y_emi = -0.075 μm to Y_min = -0.300 μm, doped 10²⁰ cm⁻³), shallow n⁺ out-diffusion Impl.Emi (PeakEmi = 5×10¹⁹ cm⁻³) into the top of R.SiGeBase, and top ohmic emitter contact.',
    localizedVsDistributedNote:
      'Physically localized above the intrinsic B\'-E\' window; determines emitter series resistance R_E (between terminal E and internal node E\') and neutral emitter minority hole charge storage ΔQ_Ef (τ_Ef0, g_tfe, h_fe).',
    nodesInRegion: ['E', "E'"],
    circuitElements: ['re', 'qf', 'cjei', 'ibei'],
    keyParameters: ['re', 'zetare', 'tef0', 'gtfe', 'hfe', 'kfre', 'afre'],
    prisms: [
      // Impl.Emi mono-emitter out-diffusion window at top of R.SiGeBase
      {
        xzPointsUm: [
          [0.0, 0.052],
          [0.075, 0.052],
          [0.075, 0.075],
          [0.0, 0.075],
        ],
      },
      // R.Emitter n+ Poly-Emitter pedestal
      {
        xzPointsUm: [
          [0.0, 0.075],
          [0.075, 0.075],
          [0.075, 0.300],
          [0.0, 0.300],
        ],
      },
      // Top Emitter Contact strip at Ymin = -0.300 um
      {
        xzPointsUm: [
          [0.0, 0.300],
          [0.075, 0.300],
          [0.075, 0.330],
          [0.0, 0.330],
        ],
      },
    ],
  },
];

// Scale factor converting exact Sentaurus micrometers (um) to 3D viewport units
const UM_TO_VIEW = 98;

// 3D Circuit Node Pin Coordinates inside the Sentaurus 3D Transistor (in Sentaurus micrometers)
const NODE_3D_PINS: {
  id: string;
  label: string;
  xUm: number;
  yUm: number;
  zUm: number;
  layerGroup: number;
  ext: boolean;
}[] = [
  { id: 'E', label: 'E (Emitter Contact Y=-0.30)', xUm: 0.0, yUm: -0.05, zUm: 0.325, layerGroup: 6, ext: true },
  { id: "E'", label: "E' (Int. Mono-Emitter Y=-0.075)", xUm: 0.0, yUm: -0.05, zUm: 0.072, layerGroup: 5, ext: false },
  { id: 'B', label: 'B (R.BaseContR Contact)', xUm: 0.34, yUm: -0.05, zUm: 0.285, layerGroup: 4, ext: true },
  { id: 'B*', label: 'B* (Perimeter Base X=0.15)', xUm: 0.16, yUm: -0.05, zUm: 0.068, layerGroup: 4, ext: false },
  { id: "B'", label: "B' (Int. R.SiGeBase)", xUm: 0.0, yUm: -0.05, zUm: 0.032, layerGroup: 3, ext: false },
  { id: "C'", label: "C' (Int. Collector / SubCol)", xUm: 0.0, yUm: -0.05, zUm: -0.18, layerGroup: 2, ext: false },
  { id: 'C', label: 'C (R.CollectorCont X=0.90)', xUm: 0.90, yUm: -0.05, zUm: 0.285, layerGroup: 2, ext: true },
  { id: "S'", label: "S' (Int. Substrate Interface)", xUm: 0.0, yUm: -0.05, zUm: -0.43, layerGroup: 0, ext: false },
  { id: 'S', label: 'S (Bottom Substrate Y=+0.60)', xUm: 0.55, yUm: -0.05, zUm: -0.59, layerGroup: 0, ext: true },
  { id: 'T', label: 'T (ΔTj Peak in SIC)', xUm: 0.11, yUm: -0.05, zUm: -0.08, layerGroup: 2, ext: true },
];

// 3D Branch Links between 3D Node Pins for the Circuit Overlay Mode
const BRANCH_3D_LINKS: {
  elementId: string;
  label: string;
  fromNode: string;
  toNode: string;
  color: string;
}[] = [
  { elementId: 're', label: 'R_E', fromNode: 'E', toNode: "E'", color: '#B45309' },
  { elementId: 'rbx', label: 'R_Bx', fromNode: 'B', toNode: 'B*', color: '#9F1239' },
  { elementId: 'rbi', label: 'R_bi* || C_rBi', fromNode: 'B*', toNode: "B'", color: '#065F46' },
  { elementId: 'it', label: 'i_T (GICCR)', fromNode: "C'", toNode: "E'", color: '#1E40AF' },
  { elementId: 'cjei', label: 'Q_jEi, Q_f, i_jBEi', fromNode: "B'", toNode: "E'", color: '#0F766E' },
  { elementId: 'cjep', label: 'Q_jEp, i_jBEp, C_BEpar', fromNode: 'B*', toNode: "E'", color: '#5B21B6' },
  { elementId: 'cjci', label: 'Q_jCi, i_jBCi, i_AVL', fromNode: "B'", toNode: "C'", color: '#0369A1' },
  { elementId: 'cjcx2', label: 'C_jCx2, C_BCpar', fromNode: 'B*', toNode: "C'", color: '#475569' },
  { elementId: 'rcx', label: 'R_Cx (SubCol+Sinker)', fromNode: "C'", toNode: 'C', color: '#1D4ED8' },
  { elementId: 'cjs', label: 'C_jS, i_jSC, i_TS', fromNode: "C'", toNode: "S'", color: '#334155' },
  { elementId: 'rsu', label: 'R_su || C_su', fromNode: "S'", toNode: 'S', color: '#475569' },
];

// Summary table of exact Sentaurus SDE parameters for the Sentaurus Specification tab
const SENTAURUS_SDE_SPEC_ROWS = [
  { param: 'Xmin, Xmax', value: '0.00 μm, 1.20 μm', role: 'Half-device symmetry axis (X=0) to outer STI boundary (X=1.20 μm)' },
  { param: 'Wemi / Xer', value: '0.15 μm / 0.075 μm', role: 'Full emitter window width Wemi = 150 nm; half-width Xer = 75 nm' },
  { param: 'Wbas / Xbr', value: '0.45 μm / 0.225 μm', role: 'Full SiGe base mesa width Wbas = 450 nm; half-width Xbr = 225 nm' },
  { param: 'dWb / Xbcr', value: '0.075 μm / 0.150 μm', role: 'Extrinsic p⁺ poly-base overlap on SiGe base (Xbcr = Xbr − dWb = 150 nm)' },
  { param: 'dWc / Xcr', value: '0.10 μm / 0.325 μm', role: 'Sloped STI trench wall offset (Xcr = Xbr + dWc = 325 nm at Ysub = 0.30 μm)' },
  { param: 'Xcol, Wcol (Xscl..Xscr)', value: '0.90 μm, 0.20 μm (0.80..1.00 μm)', role: 'Collector sinker contact top window; widens to Xsl=0.70..Xsr=1.10 μm at Ysub' },
  { param: 'Ymin, Ybc, Yemi, Ybas, Ysub, Ymax', value: '−0.30, −0.15, −0.075, 0.0, +0.30, +0.60 μm', role: 'Vertical depth levels in Sentaurus SDE (Hbas = 75 nm, Hbc = 75 nm, Hemi = 225 nm)' },
  { param: 'Prof.Mole (R.SiGeBase)', value: 'x_Ge = 0.00 → 0.16', role: 'Linear Ge mole fraction ramp across 75 nm SiGe base (compressive strain up to 4.25%)' },
  { param: 'PeakEmi, PeakBas, PeakCol', value: '5×10¹⁹, 5×10¹⁸ (7.8×10¹⁸), 1×10¹⁸ cm⁻³', role: 'Gaussian analytical peak concentrations for Mono-Emitter, SiGe Base, and SIC Collector' },
  { param: 'SubCol, ColCont, Poly Doping', value: '2×10¹⁹, 1×10²⁰, 1×10²⁰ cm⁻³', role: 'Buried subcollector (Ysub=0.30 μm), collector sinker plug, and n⁺/p⁺ polysilicon regions' },
];

interface ProjectedFace {
  regionId: string;
  points: { x: number; y: number }[];
  depth: number;
  fill: string;
  stroke: string;
  opacity: number;
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
  opResult,
  selectedParamId,
  selectedElementId,
  onSelectParamInLab,
  onSelectElementInLab,
}) => {
  const [viewportTab, setViewportTab] = useState<ViewportTab>('interactive_3d');
  const [yawDeg, setYawDeg] = useState<number>(-28);
  const [pitchDeg, setPitchDeg] = useState<number>(22);
  const [zoom, setZoom] = useState<number>(1.38);
  const [explodeFactor, setExplodeFactor] = useState<number>(0.08);
  const [cutawayMode, setCutawayMode] = useState<CutawayMode>('step_cutaway');
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('doping');
  const [spatialFilter] = useState<'all' | SpatialNature>('all');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('intrinsic_sige_base');

  const dragRef = useRef<{ active: boolean; startX: number; startY: number; startYaw: number; startPitch: number }>({
    active: false,
    startX: 0,
    startY: 0,
    startYaw: -28,
    startPitch: 22,
  });

  const activeRegion = useMemo(() => {
    if (selectedElementId) {
      const match = HBT_3D_REGIONS.find((r) => r.circuitElements.includes(selectedElementId));
      if (match && match.id === selectedRegionId) return match;
    }
    return HBT_3D_REGIONS.find((r) => r.id === selectedRegionId) || HBT_3D_REGIONS[5];
  }, [selectedRegionId, selectedElementId]);

  const project3D = (xUm: number, yUm: number, zUm: number) => {
    const x = xUm * UM_TO_VIEW;
    const y = yUm * UM_TO_VIEW;
    const z = (zUm + 0.14) * UM_TO_VIEW;

    const yaw = (yawDeg * Math.PI) / 180;
    const pitch = (pitchDeg * Math.PI) / 180;

    const x1 = x * Math.cos(yaw) - y * Math.sin(yaw);
    const y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
    const z1 = z;

    const x2 = x1;
    const y2 = y1 * Math.sin(pitch) - z1 * Math.cos(pitch);
    const z2 = y1 * Math.cos(pitch) + z1 * Math.sin(pitch);

    const fov = 680;
    const persp = fov / Math.max(fov - z2 * 0.55, 220);
    const cx = 370;
    const cy = 248;

    return {
      x: cx + x2 * zoom * persp,
      y: cy + y2 * zoom * persp,
      depth: z2,
    };
  };

  // Build Painter's Algorithm Depth-Sorted 3D Polygonal Prism Faces from exact Sentaurus coordinates
  const sortedFaces = useMemo(() => {
    const faces: ProjectedFace[] = [];

    const addExtrudedPolygon = (
      regId: string,
      ptsXZ: [number, number][],
      y0Um: number,
      y1Um: number,
      zOffsetUm: number,
      baseFill: string,
      strokeColor: string,
      opacity: number,
      isSelected: boolean
    ) => {
      const n = ptsXZ.length;
      if (n < 3 || y1Um <= y0Um) return;

      const frontVerts = ptsXZ.map(([x, z]) => project3D(x, y1Um, z + zOffsetUm));
      const backVerts = ptsXZ.map(([x, z]) => project3D(x, y0Um, z + zOffsetUm));

      // Front face (at y1Um — cutaway plane facing viewer)
      faces.push({
        regionId: regId,
        points: frontVerts.map((v) => ({ x: v.x, y: v.y })),
        depth: frontVerts.reduce((acc, v) => acc + v.depth, 0) / n,
        fill: shadeHexColor(baseFill, isSelected ? 1.06 : 1.0),
        stroke: strokeColor,
        opacity,
      });

      // Back face (at y0Um)
      faces.push({
        regionId: regId,
        points: backVerts.map((v) => ({ x: v.x, y: v.y })),
        depth: backVerts.reduce((acc, v) => acc + v.depth, 0) / n,
        fill: shadeHexColor(baseFill, 0.82),
        stroke: strokeColor,
        opacity,
      });

      // Side quads around the 2D polygon perimeter
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const dx = ptsXZ[j][0] - ptsXZ[i][0];
        const dz = ptsXZ[j][1] - ptsXZ[i][1];
        // Shade top edges brighter than bottom/side edges
        const isTopLike = Math.abs(dx) > Math.abs(dz) && ptsXZ[i][1] >= 0;
        const shade = isTopLike ? 1.08 : Math.abs(dx) > Math.abs(dz) ? 0.78 : 0.91;
        const quad = [backVerts[i], backVerts[j], frontVerts[j], frontVerts[i]];
        faces.push({
          regionId: regId,
          points: quad.map((v) => ({ x: v.x, y: v.y })),
          depth: quad.reduce((acc, v) => acc + v.depth, 0) / 4,
          fill: shadeHexColor(baseFill, isSelected ? shade * 1.04 : shade),
          stroke: strokeColor,
          opacity,
        });
      }
    };

    for (const reg of HBT_3D_REGIONS) {
      const zOffsetUm = (reg.layerGroup - 2.5) * explodeFactor * 0.16;
      const isSelected = reg.id === activeRegion.id;
      const isParamLinked = selectedParamId !== null && reg.keyParameters.includes(selectedParamId);
      const isElementLinked = selectedElementId !== null && reg.circuitElements.includes(selectedElementId);

      let baseOpacity = reg.defaultOpacity ?? 0.92;
      if (overlayMode === 'circuit_overlay') {
        baseOpacity = isSelected ? 0.58 : 0.24;
      } else if (overlayMode === 'carrier_kirk') {
        baseOpacity =
          reg.id === 'intrinsic_sige_base' ||
          reg.id === 'intrinsic_collector_sic' ||
          reg.id === 'emitter_poly_mono'
            ? 0.68
            : 0.25;
      } else if (spatialFilter !== 'all' && reg.spatialNature !== spatialFilter) {
        baseOpacity = 0.22;
      }

      const baseFill =
        overlayMode === 'thermal'
          ? getThermalHexColor(reg.thermalWeight, opResult.Dtsh)
          : reg.colorFill;

      const strokeColor =
        isSelected || isParamLinked || isElementLinked ? '#1E3A8A' : reg.colorStroke;

      for (const prism of reg.prisms) {
        // Right half-cell (Exact Sentaurus SDE coordinates X >= 0)
        const yRight: [number, number] =
          cutawayMode === 'step_cutaway'
            ? [-0.55, 0.20]
            : cutawayMode === 'sde_half_cell'
            ? [-0.45, 0.45]
            : [-0.55, 0.55];

        addExtrudedPolygon(
          reg.id,
          prism.xzPointsUm,
          yRight[0],
          yRight[1],
          zOffsetUm,
          baseFill,
          strokeColor,
          baseOpacity,
          isSelected
        );

        // Left mirrored symmetric half-cell (X <= 0), omitted in pure SDE half-cell mode
        if (cutawayMode !== 'sde_half_cell') {
          const yLeft: [number, number] =
            cutawayMode === 'step_cutaway' ? [-0.55, -0.12] : [-0.55, 0.55];
          const mirroredXZ: [number, number][] = [...prism.xzPointsUm]
            .reverse()
            .map(([x, z]) => [-x, z]);

          addExtrudedPolygon(
            reg.id,
            mirroredXZ,
            yLeft[0],
            yLeft[1],
            zOffsetUm,
            baseFill,
            strokeColor,
            baseOpacity,
            isSelected
          );
        }
      }
    }

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

  const baseUrl = './';

  return (
    <div className="space-y-5">
      {/* Top Control & Mode Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono font-semibold">
                <Box className="w-3.5 h-3.5" />
                Sentaurus TCAD → Blender 3D SiGe HBT Reconstruction
              </span>
              <span className="px-2.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-xs font-mono font-medium">
                Exact SDE & sprocess Geometry (X ∈ [0, 1.20] μm, Y ∈ [−0.30, +0.60] μm) · 16 Blender Meshes
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 font-scientific">
              Sentaurus 3D SiGe HBT Architecture, Blender Reconstruction & HICUM/L2 Mapping
            </h2>
          </div>

          {/* Primary Sub-View Switcher: Interactive 3D vs Blender Renders vs Sentaurus Spec */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setViewportTab('interactive_3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                viewportTab === 'interactive_3d'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Interactive 3D Sentaurus Model</span>
            </button>
            <button
              onClick={() => setViewportTab('blender_renders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                viewportTab === 'blender_renders'
                  ? 'bg-blue-800 text-white border-blue-800 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Blender 5.2 Renders & GLB</span>
            </button>
            <button
              onClick={() => setViewportTab('sentaurus_table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                viewportTab === 'sentaurus_table'
                  ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Sentaurus SDE / sprocess Spec</span>
            </button>
            <a
              href={`${baseUrl}models/sige_hbt_sentaurus.glb`}
              download="sige_hbt_sentaurus.glb"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-all"
              title="Download the 16-mesh Blender 3D GLB model reconstructed from Sentaurus TCAD"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Blender .GLB</span>
            </a>
          </div>
        </div>

        {/* 4 Physics Overlay Mode Buttons + Camera & Cutaway Controls */}
        {viewportTab === 'interactive_3d' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setOverlayMode('doping')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border transition-all ${
                  overlayMode === 'doping'
                    ? 'bg-blue-800 text-white border-blue-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Sentaurus Regions & Doping</span>
              </button>

              <button
                onClick={() => setOverlayMode('circuit_overlay')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border transition-all ${
                  overlayMode === 'circuit_overlay'
                    ? 'bg-teal-800 text-white border-teal-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>3D HICUM Circuit Overlay</span>
              </button>

              <button
                onClick={() => setOverlayMode('carrier_kirk')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border transition-all ${
                  overlayMode === 'carrier_kirk'
                    ? 'bg-indigo-800 text-white border-indigo-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Electron Flux & Kirk Push-Out</span>
              </button>

              <button
                onClick={() => setOverlayMode('thermal')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border transition-all ${
                  overlayMode === 'thermal'
                    ? 'bg-rose-800 text-white border-rose-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>3D Self-Heating (ΔTj)</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Cutaway Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setCutawayMode('step_cutaway')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium ${
                    cutawayMode === 'step_cutaway' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Blender Step-Cutaway
                </button>
                <button
                  onClick={() => setCutawayMode('sde_half_cell')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium ${
                    cutawayMode === 'sde_half_cell' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  SDE Half-Cell (X ≥ 0)
                </button>
                <button
                  onClick={() => setCutawayMode('full_3d')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium ${
                    cutawayMode === 'full_3d' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Full Symmetric 3D
                </button>
              </div>

              {/* Camera Presets */}
              <button
                onClick={() => {
                  setYawDeg(0);
                  setPitchDeg(3);
                  setZoom(1.48);
                }}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px]"
              >
                2D Cross-Section
              </button>

              {/* Exploded Stack Slider */}
              <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-600">Explode Z:</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={explodeFactor}
                  onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                  className="w-16 accent-blue-800 cursor-pointer"
                />
                <span className="font-mono text-[11px] w-7 text-right font-semibold">
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
                    setYawDeg(-28);
                    setPitchDeg(22);
                    setZoom(1.38);
                    setExplodeFactor(0.08);
                  }}
                  className="px-2 text-[11px] font-mono text-slate-600 hover:bg-slate-100"
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
        )}
      </div>

      {/* Main 12-Column Interactive 3D Viewport + Sentaurus & HICUM Region Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left 7 Columns: Active Viewport Tab */}
        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {viewportTab === 'interactive_3d' && (
            <>
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">
                  Drag to rotate ({Math.round(yawDeg)}° yaw, {Math.round(pitchDeg)}° pitch) · Exact Sentaurus Trapezoidal Mesas (dWc = 0.10 μm)
                </span>
                <span className="font-mono text-[11px] text-blue-800 font-semibold">
                  Selected: {activeRegion.shortLabel}
                </span>
              </div>

              <div className="relative bg-gradient-to-b from-[#F8FAFC] to-[#EFF6FF] select-none">
                <svg
                  viewBox="0 0 740 490"
                  className="w-full h-auto max-h-[510px] cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* 3D Coordinate Axes Triad in Bottom-Left Corner */}
                  {(() => {
                    const orig = { x: 64, y: 438 };
                    const axX = project3D(0.28, 0, 0);
                    const axY = project3D(0, 0.28, 0);
                    const axZ = project3D(0, 0, 0.28);
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
                          X_sde (0→1.2 μm)
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
                          Z_extrude (l_E)
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
                          x={orig.x + (axZ.x - c0.x) - 14}
                          y={orig.y + (axZ.y - c0.y) - 6}
                          className="fill-rose-900 font-mono text-[10px] font-bold"
                        >
                          −Y_sde (Depth)
                        </text>
                      </g>
                    );
                  })()}

                  {/* Depth-Sorted 3D Polygonal Prism Faces */}
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
                        strokeWidth={isSelected ? 1.65 : 0.8}
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
                      const zOffBase = (3 - 2.5) * explodeFactor * 0.16;
                      const zOffColl = (2 - 2.5) * explodeFactor * 0.16;
                      const zOffBuried = (1 - 2.5) * explodeFactor * 0.16;
                      const zOffEmit = (6 - 2.5) * explodeFactor * 0.16;

                      const pushDepthUm = Math.min(0.24, 0.04 + kirkRatio * 0.11);
                      const kTopLeft = project3D(-0.15, 0.2, 0.0 + zOffColl);
                      const kTopRight = project3D(0.15, 0.2, 0.0 + zOffColl);
                      const kBotRight = project3D(0.15 + kirkRatio * 0.05, 0.2, -pushDepthUm + zOffColl);
                      const kBotLeft = project3D(-0.15 - kirkRatio * 0.05, 0.2, -pushDepthUm + zOffColl);

                      // Electron flow stream in Sentaurus coordinates: E' (X=0) -> B' -> SubCol (Y=0.30) -> Sinker (X=0.90) -> C
                      const pE = project3D(0.0, 0.2, 0.28 + zOffEmit);
                      const pB = project3D(0.0, 0.2, 0.035 + zOffBase);
                      const pCprime = project3D(0.0, 0.2, -0.35 + zOffBuried);
                      const pSinkerBot = project3D(0.90, 0.2, -0.35 + zOffBuried);
                      const pC = project3D(0.90, 0.2, 0.26 + zOffColl);

                      // Lateral hole injection path: R.BaseContR (X=0.34) -> R.Baseright (X=0.18) -> R.SiGeBase (X=0)
                      const pBaseExt = project3D(0.34, 0.2, 0.22 + zOffBase);
                      const pBasePerim = project3D(0.18, 0.2, 0.06 + zOffBase);

                      return (
                        <g className="pointer-events-none">
                          <polygon
                            points={`${kTopLeft.x},${kTopLeft.y} ${kTopRight.x},${kTopRight.y} ${kBotRight.x},${kBotRight.y} ${kBotLeft.x},${kBotLeft.y}`}
                            fill="#F43F5E"
                            fillOpacity={0.44}
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
                            Kirk Push-Out into SIC (I_C/I_CK = {kirkRatio.toFixed(2)})
                          </text>

                          <path
                            d={`M ${pE.x} ${pE.y} L ${pB.x} ${pB.y} L ${pCprime.x} ${pCprime.y} L ${pSinkerBot.x} ${pSinkerBot.y} L ${pC.x} ${pC.y}`}
                            fill="none"
                            stroke="#1E40AF"
                            strokeWidth={3.5}
                            strokeDasharray="6 4"
                          />

                          <path
                            d={`M ${pBaseExt.x} ${pBaseExt.y} L ${pBasePerim.x} ${pBasePerim.y} L ${pB.x} ${pB.y}`}
                            fill="none"
                            stroke="#0F766E"
                            strokeWidth={2.8}
                          />
                        </g>
                      );
                    })()}

                  {/* 3D Equivalent-Circuit Overlay (Nodes & Branches Mapped in Sentaurus 3D Space) */}
                  {(overlayMode === 'circuit_overlay' || overlayMode === 'doping') &&
                    (() => {
                      const pinScreenMap: Record<string, { x: number; y: number }> = {};
                      for (const pin of NODE_3D_PINS) {
                        const zOffUm = (pin.layerGroup - 2.5) * explodeFactor * 0.16;
                        const pt = project3D(pin.xUm, pin.yUm, pin.zUm + zOffUm);
                        pinScreenMap[pin.id] = { x: pt.x, y: pt.y };
                      }

                      return (
                        <g>
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
                                    x={mx - 36}
                                    y={my - 9}
                                    width={72}
                                    height={16}
                                    rx={4}
                                    fill="#FFFFFF"
                                    fillOpacity={0.94}
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

                {/* Floating Live Physics Status Pill */}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg px-3 py-2 shadow-xs text-[11px] font-mono space-y-0.5">
                  <div className="text-slate-500 font-sans font-semibold text-[10px] uppercase">
                    Sentaurus SiGe HBT · Live Bias State
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
            </>
          )}

          {viewportTab === 'blender_renders' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Blender 5.2 LTS Reconstruction from Sentaurus TCAD (`sige_hbt_sentaurus.blend`)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Generated directly in Blender via MCP from the 16 exact Sentaurus `sde` & `sprocess` regions (`S = 10 BU/μm`).
                  </p>
                </div>
                <a
                  href={`${baseUrl}models/sige_hbt_sentaurus.glb`}
                  download="sige_hbt_sentaurus.glb"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-800 text-white text-xs font-semibold hover:bg-blue-900"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download 3D Model (.glb)</span>
                </a>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                  <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      1. Blender 3D Isometric Step-Cutaway Render (Sentaurus SDE Half-Cell + Symmetric Full HBT)
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">1600×1000 Workbench Studio Cavity</span>
                  </div>
                  <img
                    src={`${baseUrl}models/sige_hbt_sentaurus_preview.png`}
                    alt="Blender 3D Isometric Render of Sentaurus SiGe HBT"
                    className="w-full h-auto object-contain max-h-[380px]"
                  />
                </div>

                <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                  <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      2. Blender Front Orthographic Cross-Section (Exact Sentaurus Trapezoidal Mesas & STI Oxide)
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">X ∈ [−1.20, +1.20] μm, Y_sde ∈ [−0.30, +0.60] μm</span>
                  </div>
                  <img
                    src={`${baseUrl}models/sige_hbt_sentaurus_front.png`}
                    alt="Blender Front Orthographic Cross-Section of Sentaurus SiGe HBT"
                    className="w-full h-auto object-contain max-h-[380px]"
                  />
                </div>
              </div>
            </div>
          )}

          {viewportTab === 'sentaurus_table' && (
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Extracted Sentaurus TCAD (`sde` + `sprocess`) Geometry & Doping Specification
                </h3>
                <p className="text-xs text-slate-600">
                  Every coordinate and doping concentration extracted from the Sentaurus command file used to generate the Blender 3D meshes.
                </p>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <th className="py-2 px-3 font-semibold">Sentaurus Variable / Profile</th>
                      <th className="py-2 px-3 font-semibold">Extracted Value</th>
                      <th className="py-2 px-3 font-semibold">Physical & 3D Geometric Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SENTAURUS_SDE_SPEC_ROWS.map((row) => (
                      <tr key={row.param} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-mono font-semibold text-blue-900 whitespace-nowrap">
                          {row.param}
                        </td>
                        <td className="py-2 px-3 font-mono text-teal-900 whitespace-nowrap">
                          {row.value}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{row.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3D Region Quick-Select Strip */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Sentaurus 3D Regions:
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

        {/* Right 5 Columns: Synchronized Sentaurus TCAD + Blender + HICUM Inspector */}
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
                HICUM/L2 Manual: {activeRegion.manualSection} · Blender Mesh: <span className="text-slate-800 font-semibold">{activeRegion.blenderMeshName}</span>
              </p>
            </div>

            {/* Sentaurus TCAD Exact Coordinates & Command Snippet */}
            <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-teal-300 font-semibold">
                <span>Sentaurus SDE: {activeRegion.sentaurusId}</span>
                <span>{activeRegion.sentaurusCoordsUm}</span>
              </div>
              <pre className="text-[10.5px] text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed pt-1 border-t border-slate-800">
                {activeRegion.sentaurusSdeSnippet}
              </pre>
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
                HICUM/L2 Circuit Nodes & Branches in This Sentaurus Region
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
              Unlike localized Sentaurus regions or junction capacitances, mathematical smoothing constants (<code>ajei</code>, <code>aick</code>, <code>ahc</code>, <code>acbar</code>), global temperature exponents (<code>zetact</code>, <code>zetabet</code>, <code>f1vg</code>, <code>f2vg</code>), and simulator control flags (<code>flnqs</code>, <code>flcono</code>, <code>flsh</code>, <code>type</code>) act across equations or the entire die rather than a single 3D coordinate:
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
