import { SpatialNature } from './hicumTypes';

export type RegionCategory = 'materials' | 'contacts' | 'oxide';

export interface SentaurusPrism2D {
  /**
   * 2D polygon vertices [x_um, y_height_um] in exact Sentaurus micrometers:
   * - x_um in [-1.10, +1.40] um across the complete B-E-C-S transistor cross-section
   * - y_height_um in [-0.55, +0.18] um (where 0.0 is the Base-Collector metallurgical interface)
   */
  xzPointsUm: [number, number][];
}

export interface Sentaurus3DRegionSpec {
  id: string;
  name: string;
  shortLabel: string;
  sentaurusId: string;
  blenderMeshName: string;
  category: RegionCategory;
  materialName: string;
  dopingSummary: string;
  physicalFunction: string;
  sentaurusCoordsUm: string;
  sentaurusSdeSnippet: string;
  spatialNature: 'localized' | 'distributed';
  colorHex: string;
  edgeHex: string;
  defaultOpacity: number;
  /** Structural explosion vector [dx_um, dy_up_um, dz_front_um] at 100% explode */
  explodeVectorUm: [number, number, number];
  /** Extrusion bounds along Z in [-0.50, +0.50] um */
  extrudeZUm: [number, number];
  /** Camera focus target in micrometers [x, y_up, z] */
  focusCenterUm: [number, number, number];
  manualSection: string;
  manualCitation?: string;
  sentaurusCitation?: string;
  vaCitation?: string;
  description: string;
  localizedVsDistributedNote: string;
  nodesInRegion: string[];
  circuitElements: string[];
  keyParameters: string[];
  prisms: SentaurusPrism2D[];
}

export type EmbeddedComponentCategory =
  | 'resistances'
  | 'capacitances'
  | 'currents'
  | 'charges';

export type CircuitSymbolType =
  | 'resistor'
  | 'capacitor'
  | 'diode'
  | 'tunnel_diode'
  | 'current_source'
  | 'charge_storage'
  | 'thermal_rc';

export interface Embedded3DNodePin {
  id: string;
  label: string;
  fullName: string;
  isExternalTerminal: boolean;
  hostRegionId: string;
  hostSide: 'left' | 'right' | 'center';
  posUm: [number, number, number];
}

export interface Embedded3DComponentSpec {
  id: string;
  symbolLabel: string;
  name: string;
  category: EmbeddedComponentCategory;
  symbolType: CircuitSymbolType;
  spatialNature: SpatialNature;
  hostRegionId: string;
  hostSide: 'left' | 'right' | 'center';
  fromNodePinId: string;
  toNodePinId: string;
  symbolPosUm: [number, number, number];
  orientation: 'horizontal' | 'vertical';
  wireWaypoints?: {
    posUm: [number, number, number];
    hostRegionId: string;
    hostSide: 'left' | 'right' | 'center';
  }[];
  primaryEquationId: string;
  manualCitation?: string;
  vaCitation?: string;
  sentaurusCitation?: string;
  physicalOriginNote: string;
}

/**
 * EXACT 5-COLOR PALETTE FROM USER REFERENCE:
 * 1. #173F5F (Deep Navy) - Substrate foundation block & deep isolation wells
 * 2. #20639B (Ocean Blue) - N+ Emitter tub & N- Epitaxy
 * 3. #3CAEA3 (Muted Teal) - P Base (SiGe Extrinsic & Poly-Base)
 * 4. #F6D55C (Golden Yellow) - N+ Buried Layer & Collector Sinker
 * 5. #ED553B (Coral Red) - Intrinsic Active Transistor Core (Active BE/BC interaction zone)
 * Neutral: #78808A (Pewter) for Contacts, #DDE5ED for STI Passivation Oxide
 */
export const SENTAURUS_3D_REGIONS: Sentaurus3DRegionSpec[] = [
  {
    id: 'n_plus_emitter',
    name: 'N⁺ PolySilicon Emitter Tub (Region: n_plus_emitter)',
    shortLabel: 'N⁺ Emitter',
    sentaurusId: 'R.Emitter / Mono.Emitter',
    blenderMeshName: 'N_Plus_Emitter',
    category: 'materials',
    materialName: 'n⁺ PolySilicon & Mono Emitter Plug',
    dopingSummary: 'Arsenic Active 2×10²⁰ cm⁻³',
    physicalFunction: 'Heavily doped n⁺ emitter tub injecting electrons through internal node E\' into the intrinsic base.',
    sentaurusCoordsUm: 'X ∈ [−0.02, +0.28] μm, Y ∈ [+0.03, +0.10] μm',
    sentaurusSdeSnippet: '(sdegeo:create-rectangle (position -0.02 0.03 0.0) (position 0.28 0.10 0.0) "PolySilicon" "R.Emitter")',
    spatialNature: 'localized',
    colorHex: '#20639B',
    edgeHex: '#0D3A63',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, 0.22, 0.0],
    extrudeZUm: [-0.45, 0.45],
    focusCenterUm: [0.13, 0.065, 0.0],
    manualSection: 'Section 2.8.3, p. 56',
    manualCitation: 'Ch. 2.8.3, p. 56, ll. 1–15; Table 3.6, p. 104, row 8',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 86–87, 131–134',
    vaCitation: 'hicumL2V2p34.va, ll. 683, 1176, 1836–1840',
    description: 'N⁺ emitter tub located directly under the emitter contact lead E, housing internal node E\'.',
    localizedVsDistributedNote: 'Physically localized mono-crystalline emitter plug and poly pedestal setting R_E and internal emitter node E\'.',
    nodesInRegion: ["E'", 'E'],
    circuitElements: ['re'],
    keyParameters: ['re', 'tef0'],
    prisms: [
      {
        xzPointsUm: [
          [-0.02, 0.03],
          [0.28, 0.03],
          [0.28, 0.10],
          [-0.02, 0.10],
        ],
      },
    ],
  },
  {
    id: 'intrinsic_active_transistor_core',
    name: 'Active Intrinsic Transistor Core (Region: active_core)',
    shortLabel: 'Intrinsic Transistor (Core)',
    sentaurusId: 'R.SiGeBase.Intrinsic / SIC.Core',
    blenderMeshName: 'Intrinsic_Active_Transistor_Core',
    category: 'materials',
    materialName: 'SiGe Intrinsic Base & Active BC Junction',
    dopingSummary: 'Boron Peak 4×10¹⁹ cm⁻³ + Ge 25% Grade',
    physicalFunction: 'Central active interaction zone where GICCR transfer current I_T, internal diodes (I_BEi, I_BCi), and transit charges (Q_jEi, Q_jCi, Q_DE, Q_DC, i_AVL) originate.',
    sentaurusCoordsUm: 'X ∈ [−0.08, +0.38] μm, Y ∈ [−0.08, +0.03] μm',
    sentaurusSdeSnippet: '(sdegeo:create-rectangle (position -0.08 -0.08 0.0) (position 0.38 0.03 0.0) "SiliconGermanium" "R.ActiveCore")',
    spatialNature: 'localized',
    colorHex: '#ED553B',
    edgeHex: '#9E2413',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, 0.10, 0.12],
    extrudeZUm: [-0.45, 0.45],
    focusCenterUm: [0.15, -0.025, 0.0],
    manualSection: 'Sections 2.1–2.4, pp. 8–44',
    manualCitation: 'Ch. 2.1, p. 8, Fig. 2.1.0/1; Ch. 2.2, pp. 9–18 (GICCR)',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 79–81, 150–159',
    vaCitation: 'hicumL2V2p34.va, ll. 675–678, 1471–1522',
    description: 'The core intrinsic SiGe transistor volume beneath the emitter window containing internal nodes B\', E\', C\'.',
    localizedVsDistributedNote: 'High-field intrinsic vertical core governing forward transport I_T, non-quasi-static delay, and avalanche generation i_AVL.',
    nodesInRegion: ["B'", "E'", "C'"],
    circuitElements: ['it', 'ibei', 'ibci', 'qjei', 'qjci', 'qde', 'qdc', 'iavl'],
    keyParameters: ['c10', 'qp0', 'hfe', 'hfc', 't0', 'dt0h', 'tbvl', 'cjei0', 'vdei', 'zei', 'cjci0', 'vdci', 'zci', 'favl', 'qavl'],
    prisms: [
      {
        xzPointsUm: [
          [-0.08, -0.08],
          [0.38, -0.08],
          [0.38, 0.03],
          [-0.08, 0.03],
        ],
      },
    ],
  },
  {
    id: 'p_base_sige_extrinsic',
    name: 'P Base (SiGe Extrinsic Base & Poly-Base)',
    shortLabel: 'P Base (Extrinsic)',
    sentaurusId: 'R.Base.Extrinsic',
    blenderMeshName: 'P_Base_SiGe_Extrinsic',
    category: 'materials',
    materialName: 'p⁺ PolySilicon & Extrinsic SiGe Base',
    dopingSummary: 'Boron 5×10¹⁹ cm⁻³',
    physicalFunction: 'Extrinsic base contact connection linking base terminal B to perimeter node B* and intrinsic node B\'. Houses R_Bx, R_bi*, C_rBi, Q_jEp, and I_BEp.',
    sentaurusCoordsUm: 'X ∈ [−0.75, −0.08] μm, Y ∈ [−0.02, +0.10] μm',
    sentaurusSdeSnippet: '(sdegeo:create-rectangle (position -0.75 -0.02 0.0) (position -0.08 0.10 0.0) "PolySilicon" "R.ExtBase")',
    spatialNature: 'distributed',
    colorHex: '#3CAEA3',
    edgeHex: '#1D6B63',
    defaultOpacity: 1.0,
    explodeVectorUm: [-0.22, 0.08, 0.0],
    extrudeZUm: [-0.46, 0.46],
    focusCenterUm: [-0.41, 0.04, 0.0],
    manualSection: 'Sections 2.6, 2.8.1, pp. 45–55',
    manualCitation: 'Ch. 2.6, p. 45, l. 12 (Eq. 2.6.0-7); Ch. 2.8.1, p. 54, ll. 1–15',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 82–84, 124–129',
    vaCitation: 'hicumL2V2p34.va, ll. 676–681, 1637–1661',
    description: 'Extrinsic p-base region on the left side of the device connecting base contact B into the intrinsic perimeter node B*.',
    localizedVsDistributedNote: 'Distributed lateral sheet resistance R_Bx and perimeter emitter coupling R_bi*, C_rBi, Q_jEp, I_BEp.',
    nodesInRegion: ['B', 'B*', "B'"],
    circuitElements: ['rbx', 'rbi', 'crbi', 'qjep', 'ibep', 'ibet'],
    keyParameters: ['rbx', 'rbi0', 'fdqr0', 'fgeo', 'fcrbi', 'cjep0', 'vdep', 'zep', 'ibeps', 'mbep', 'ibets', 'abet'],
    prisms: [
      {
        xzPointsUm: [
          [-0.75, -0.02],
          [-0.08, -0.02],
          [-0.08, 0.10],
          [-0.75, 0.10],
        ],
      },
    ],
  },
  {
    id: 'n_minus_epitaxy',
    name: 'N⁻ Epitaxy Collector Layer (Region: n_minus_epi)',
    shortLabel: 'N⁻ Epitaxy',
    sentaurusId: 'R.Epitaxy',
    blenderMeshName: 'N_Minus_Epitaxy',
    category: 'materials',
    materialName: 'n⁻ Low-Doped Epitaxial Silicon',
    dopingSummary: 'Phosphorus 1.5×10¹⁶ cm⁻³',
    physicalFunction: 'Low-doped collector epitaxial layer between P-Base and Buried Layer; sets extrinsic B-C capacitances Q_BCx1, Q_BCx2, and peripheral diode I_BCx.',
    sentaurusCoordsUm: 'X ∈ [−0.80, +0.55] μm, Y ∈ [−0.10, −0.02] μm',
    sentaurusSdeSnippet: '(sdegeo:create-rectangle (position -0.80 -0.10 0.0) (position 0.55 -0.02 0.0) "Silicon" "R.Epitaxy")',
    spatialNature: 'distributed',
    colorHex: '#20639B',
    edgeHex: '#0D3A63',
    defaultOpacity: 0.95,
    explodeVectorUm: [0.0, -0.05, 0.0],
    extrudeZUm: [-0.46, 0.46],
    focusCenterUm: [-0.12, -0.06, 0.0],
    manualSection: 'Section 2.4.3, pp. 39–41',
    manualCitation: 'Ch. 2.4.3, p. 39, ll. 10–24 (Eq. 2.4.3-1); Table 3.9, p. 105',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 72–75, 142–148',
    vaCitation: 'hicumL2V2p34.va, ll. 710–715, 1530–1545',
    description: 'Extrinsic collector epitaxial layer beneath the extrinsic base hosting Q_BCx1, Q_BCx2, I_BCx, and Q_DS.',
    localizedVsDistributedNote: 'Models distributed lateral depletion and diffusion charges between extrinsic base and buried subcollector.',
    nodesInRegion: ['B*', "C'"],
    circuitElements: ['qbcx1', 'qbcx2', 'ibcx', 'qds'],
    keyParameters: ['cjcx0', 'vdcx', 'zcx', 'vptcx', 'fbc', 'ibcxs', 'mbcx'],
    prisms: [
      {
        xzPointsUm: [
          [-0.80, -0.10],
          [0.55, -0.10],
          [0.55, -0.02],
          [-0.80, -0.02],
        ],
      },
    ],
  },
  {
    id: 'n_plus_buried_layer',
    name: 'N⁺ Buried Layer Subcollector (Region: n_plus_buried)',
    shortLabel: 'N⁺ Buried Layer',
    sentaurusId: 'R.BuriedLayer',
    blenderMeshName: 'N_Plus_Buried_Layer',
    category: 'materials',
    materialName: 'n⁺ Heavily Doped Subcollector Sheet',
    dopingSummary: 'Antimony Active 5×10¹⁹ cm⁻³',
    physicalFunction: 'Low-resistance horizontal buried layer conducting collector current from active core into the vertical collector sinker.',
    sentaurusCoordsUm: 'X ∈ [−0.80, +0.80] μm, Y ∈ [−0.26, −0.10] μm',
    sentaurusSdeSnippet: '(sdegeo:create-rectangle (position -0.80 -0.26 0.0) (position 0.80 -0.10 0.0) "Silicon" "R.BuriedLayer")',
    spatialNature: 'distributed',
    colorHex: '#F6D55C',
    edgeHex: '#9E821B',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, -0.15, 0.0],
    extrudeZUm: [-0.48, 0.48],
    focusCenterUm: [0.0, -0.18, 0.0],
    manualSection: 'Section 2.8.2, p. 55',
    manualCitation: 'Ch. 2.8.2, p. 55, ll. 1–20 (Eq. 2.8.2-1); Table 3.6, p. 104, row 7',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 68–71, 138–141',
    vaCitation: 'hicumL2V2p34.va, ll. 682, 1177, 1830–1835',
    description: 'Heavily doped n⁺ buried subcollector layer spanning horizontally under the entire active and extrinsic base.',
    localizedVsDistributedNote: 'Sets the horizontal collector series resistance R_Cx and houses substrate junction diode I_SC and charge Q_jS.',
    nodesInRegion: ["C'", "S'"],
    circuitElements: ['rcx', 'qjs', 'isc'],
    keyParameters: ['rcx', 'cjs0', 'vds', 'zs', 'vpts', 'iscs', 'msc'],
    prisms: [
      {
        xzPointsUm: [
          [-0.80, -0.26],
          [0.80, -0.26],
          [0.80, -0.10],
          [-0.80, -0.10],
        ],
      },
    ],
  },
  {
    id: 'collector_sinker',
    name: 'Collector Sinker Plug (Region: collector_sinker)',
    shortLabel: 'Collector Sinker',
    sentaurusId: 'R.Sinker',
    blenderMeshName: 'Collector_Sinker',
    category: 'materials',
    materialName: 'n⁺ Collector Sinker Plug',
    dopingSummary: 'Phosphorus Active 2×10¹⁹ cm⁻³',
    physicalFunction: 'Vertical low-resistance sinker plug routing collector current from the buried layer up to contact C.',
    sentaurusCoordsUm: 'X ∈ [+0.55, +0.80] μm, Y ∈ [−0.10, +0.10] μm',
    sentaurusSdeSnippet: '(sdegeo:create-rectangle (position 0.55 -0.10 0.0) (position 0.80 0.10 0.0) "Silicon" "R.Sinker")',
    spatialNature: 'localized',
    colorHex: '#F6D55C',
    edgeHex: '#9E821B',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.24, 0.0, 0.0],
    extrudeZUm: [-0.46, 0.46],
    focusCenterUm: [0.675, 0.0, 0.0],
    manualSection: 'Section 2.8.2, p. 55',
    manualCitation: 'Ch. 2.8.2, p. 55, ll. 1–20',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 91–94, 162–168',
    vaCitation: 'hicumL2V2p34.va, ll. 682, 1830–1835',
    description: 'Vertical n⁺ sinker column providing a low-ohmic path from buried layer to collector terminal C.',
    localizedVsDistributedNote: 'Part of the collector series resistance network R_Cx.',
    nodesInRegion: ['C', "C'"],
    circuitElements: ['rcx'],
    keyParameters: ['rcx'],
    prisms: [
      {
        xzPointsUm: [
          [0.55, -0.10],
          [0.80, -0.10],
          [0.80, 0.10],
          [0.55, 0.10],
        ],
      },
    ],
  },
  {
    id: 'p_substrate_bulk',
    name: 'P⁻ Silicon Substrate (Region: p_substrate_bulk)',
    shortLabel: 'P⁻ Substrate',
    sentaurusId: 'R.Substrate',
    blenderMeshName: 'P_Substrate_Bulk',
    category: 'materials',
    materialName: 'p⁻ Bulk Silicon Wafer',
    dopingSummary: 'Boron Active 1×10¹⁵ cm⁻³',
    physicalFunction: 'Wafer substrate bulk supporting the transistor layers; houses substrate network R_su || C_su and parasitic PNP current I_TS.',
    sentaurusCoordsUm: 'X ∈ [−1.05, +1.35] μm, Y ∈ [−0.55, −0.10] μm',
    sentaurusSdeSnippet: '(sdegeo:create-rectangle (position -1.05 -0.55 0.0) (position 1.35 -0.26 0.0) "Silicon" "R.Substrate")',
    spatialNature: 'distributed',
    colorHex: '#173F5F',
    edgeHex: '#081724',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, -0.24, 0.0],
    extrudeZUm: [-0.50, 0.50],
    focusCenterUm: [0.15, -0.40, 0.0],
    manualSection: 'Section 2.11, pp. 65–66',
    manualCitation: 'Ch. 2.11, pp. 65–66, ll. 1–16; Table 3.8, p. 104, rows 1–2',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 55, 63–75',
    vaCitation: 'hicumL2V2p34.va, ll. 690–693, 1841–1846',
    description: 'Bulk silicon substrate beneath the buried layer, contacting external substrate terminal S.',
    localizedVsDistributedNote: 'Distributed substrate network modeled by substrate resistance R_su and permittivity capacitance C_su.',
    nodesInRegion: ["S'", 'S'],
    circuitElements: ['rsu', 'csu', 'its'],
    keyParameters: ['rsu', 'csu', 'itss', 'msf'],
    prisms: [
      {
        xzPointsUm: [
          [-1.05, -0.55],
          [1.35, -0.55],
          [1.35, -0.10],
          [0.80, -0.10],
          [0.80, -0.26],
          [-1.05, -0.26],
        ],
      },
    ],
  },
  {
    id: 'p_plus_isolation_well',
    name: 'P⁺ Isolation Wells & Deep Trenches (Region: p_plus_well)',
    shortLabel: 'P⁺ Well (Isolation)',
    sentaurusId: 'R.PWell / DeepTrench',
    blenderMeshName: 'P_Plus_Isolation_Well',
    category: 'materials',
    materialName: 'p⁺ Isolation Wells & Junction Trenches',
    dopingSummary: 'Boron Active 3×10¹⁷ cm⁻³',
    physicalFunction: 'Deep isolation wells separating collector from substrate contact and providing electrical isolation between adjacent transistors.',
    sentaurusCoordsUm: 'X ∈ [+0.80, +1.35] μm, Y ∈ [−0.45, +0.10] μm',
    sentaurusSdeSnippet: '(sdegeo:create-rectangle (position 0.80 -0.45 0.0) (position 0.98 0.10 0.0) "Silicon" "R.PWell")',
    spatialNature: 'localized',
    colorHex: '#173F5F',
    edgeHex: '#081724',
    defaultOpacity: 0.96,
    explodeVectorUm: [0.20, -0.10, 0.0],
    extrudeZUm: [-0.48, 0.48],
    focusCenterUm: [0.89, -0.175, 0.0],
    manualSection: 'Section 2.11, p. 65',
    manualCitation: 'Ch. 2.11, p. 65; Fig. 2.1.0/1',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 60–65',
    vaCitation: 'hicumL2V2p34.va, ll. 690–693',
    description: 'Deep junction isolation well on the right separating the collector sinker from substrate terminal S.',
    localizedVsDistributedNote: 'Provides dielectric/junction boundary isolating internal collector node C\' from substrate S.',
    nodesInRegion: ['S'],
    circuitElements: ['csu'],
    keyParameters: ['csu', 'cscp0'],
    prisms: [
      {
        xzPointsUm: [
          [0.80, -0.45],
          [0.98, -0.45],
          [0.98, 0.10],
          [0.80, 0.10],
        ],
      },
      {
        xzPointsUm: [
          [1.22, -0.45],
          [1.35, -0.45],
          [1.35, 0.10],
          [1.22, 0.10],
        ],
      },
    ],
  },
  {
    id: 'contact_metal_terminals',
    name: 'Top Contact Metallization (Terminals: B, E, C, S)',
    shortLabel: 'Contacts (B, E, C, S)',
    sentaurusId: 'Contacts: base, emitter, collector, substrate',
    blenderMeshName: 'Contact_Terminals',
    category: 'contacts',
    materialName: 'Al-Cu / Tungsten Contact Metallization',
    dopingSummary: 'Ohmic Metal Contacts',
    physicalFunction: 'External metal contact pads providing low-resistance electrical connections for B, E, C, S.',
    sentaurusCoordsUm: 'X ∈ [−0.75, +1.20] μm, Y ∈ [+0.10, +0.14] μm',
    sentaurusSdeSnippet: 'contact name=base ...; contact name=emitter ...; contact name=collector ...; contact name=substrate ...',
    spatialNature: 'localized',
    colorHex: '#78808A',
    edgeHex: '#475569',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, 0.30, 0.0],
    extrudeZUm: [-0.45, 0.45],
    focusCenterUm: [0.22, 0.12, 0.0],
    manualSection: 'Section 2.1, p. 8',
    manualCitation: 'Ch. 2.1, p. 8, Fig. 2.1.0/1',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 110–120',
    vaCitation: 'hicumL2V2p34.va, ll. 628, 650–655',
    description: 'Top metallic contacts providing external pins for Base (B), Emitter (E), Collector (C), and Substrate (S).',
    localizedVsDistributedNote: 'External interface terminals defining nodes B, E, C, S.',
    nodesInRegion: ['B', 'E', 'C', 'S'],
    circuitElements: ['ceox', 're', 'rbx', 'rcx'],
    keyParameters: ['re', 'rbx', 'rcx', 'cbepar'],
    prisms: [
      {
        xzPointsUm: [
          [-0.75, 0.10],
          [-0.55, 0.10],
          [-0.55, 0.14],
          [-0.75, 0.14],
        ],
      },
      {
        xzPointsUm: [
          [0.02, 0.10],
          [0.24, 0.10],
          [0.24, 0.14],
          [0.02, 0.14],
        ],
      },
      {
        xzPointsUm: [
          [0.58, 0.10],
          [0.78, 0.10],
          [0.78, 0.14],
          [0.58, 0.14],
        ],
      },
      {
        xzPointsUm: [
          [1.00, 0.10],
          [1.20, 0.10],
          [1.20, 0.14],
          [1.00, 0.14],
        ],
      },
    ],
  },
  {
    id: 'oxide_isolation_sti',
    name: 'Shallow Trench Isolation & Passivation Oxide (STI)',
    shortLabel: 'STI / Field Oxide',
    sentaurusId: 'R.Oxide / R.STI',
    blenderMeshName: 'Oxide_Passivation',
    category: 'oxide',
    materialName: 'SiO₂ Thermal & TEOS Oxide',
    dopingSummary: 'Dielectric Isolator (SiO₂)',
    physicalFunction: 'Passivation oxide and isolation trenches separating the contacts on the top surface.',
    sentaurusCoordsUm: 'X ∈ [−1.05, +1.35] μm, Y ∈ [+0.10, +0.14] μm',
    sentaurusSdeSnippet: '(sdegeo:create-rectangle ... "SiO2" "R.Oxide")',
    spatialNature: 'localized',
    colorHex: '#DDE5ED',
    edgeHex: '#94A3B8',
    defaultOpacity: 0.90,
    explodeVectorUm: [0.0, 0.18, 0.0],
    extrudeZUm: [-0.48, 0.48],
    focusCenterUm: [0.15, 0.12, 0.0],
    manualSection: 'Section 2.9, p. 58',
    manualCitation: 'Ch. 2.9, p. 58, ll. 10–22 (C_EOX)',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 95–98',
    vaCitation: 'hicumL2V2p34.va, ll. 720, 1828',
    description: 'Surface passivation oxide separating Base, Emitter, Collector, and Substrate contact apertures.',
    localizedVsDistributedNote: 'Hosts metal-to-metal overlap capacitance C_EOX.',
    nodesInRegion: ['B', 'E'],
    circuitElements: ['ceox'],
    keyParameters: ['cbepar', 'fbepar'],
    prisms: [
      {
        xzPointsUm: [
          [-1.05, 0.10],
          [-0.75, 0.10],
          [-0.75, 0.14],
          [-1.05, 0.14],
        ],
      },
      {
        xzPointsUm: [
          [-0.55, 0.10],
          [0.02, 0.10],
          [0.02, 0.14],
          [-0.55, 0.14],
        ],
      },
      {
        xzPointsUm: [
          [0.24, 0.10],
          [0.58, 0.10],
          [0.58, 0.14],
          [0.24, 0.14],
        ],
      },
      {
        xzPointsUm: [
          [0.78, 0.10],
          [1.00, 0.10],
          [1.00, 0.14],
          [0.78, 0.14],
        ],
      },
      {
        xzPointsUm: [
          [1.20, 0.10],
          [1.35, 0.10],
          [1.35, 0.14],
          [1.20, 0.14],
        ],
      },
    ],
  },
];

/**
 * 3D Node Pins positioned with generous, clear spacing across the full device width:
 * Following the layout of Image 1!
 */
export const EMBEDDED_3D_NODE_PINS: Embedded3DNodePin[] = [
  {
    id: 'B',
    label: 'B',
    fullName: 'External Base Terminal (Node B)',
    isExternalTerminal: true,
    hostRegionId: 'contact_metal_terminals',
    hostSide: 'left',
    posUm: [-0.65, 0.34, 0.0],
  },
  {
    id: 'B_poly',
    label: '',
    fullName: 'Extrinsic Poly-Base Feed',
    isExternalTerminal: false,
    hostRegionId: 'p_base_sige_extrinsic',
    hostSide: 'left',
    posUm: [-0.65, 0.10, 0.0],
  },
  {
    id: 'B*',
    label: 'B*',
    fullName: 'Perimeter Base Node (Node B*)',
    isExternalTerminal: false,
    hostRegionId: 'p_base_sige_extrinsic',
    hostSide: 'center',
    posUm: [-0.10, 0.00, 0.0],
  },
  {
    id: "B'",
    label: "B'",
    fullName: "Intrinsic SiGe Base Node (Node B')",
    isExternalTerminal: false,
    hostRegionId: 'intrinsic_active_transistor_core',
    hostSide: 'center',
    posUm: [0.12, 0.00, 0.0],
  },
  {
    id: 'E',
    label: 'E',
    fullName: 'External Emitter Terminal (Node E)',
    isExternalTerminal: true,
    hostRegionId: 'contact_metal_terminals',
    hostSide: 'center',
    posUm: [0.13, 0.34, 0.0],
  },
  {
    id: "E'",
    label: "E'",
    fullName: "Internal Emitter Node (Node E')",
    isExternalTerminal: false,
    hostRegionId: 'n_plus_emitter',
    hostSide: 'center',
    posUm: [0.38, 0.07, 0.0],
  },
  {
    id: "C'",
    label: "C'",
    fullName: "Internal Collector Node (Node C')",
    isExternalTerminal: false,
    hostRegionId: 'intrinsic_active_transistor_core',
    hostSide: 'center',
    posUm: [0.38, -0.09, 0.0],
  },
  {
    id: 'C_sinker',
    label: '',
    fullName: 'Collector Sinker Entry',
    isExternalTerminal: false,
    hostRegionId: 'collector_sinker',
    hostSide: 'right',
    posUm: [0.68, -0.16, 0.0],
  },
  {
    id: 'C',
    label: 'C',
    fullName: 'External Collector Terminal (Node C)',
    isExternalTerminal: true,
    hostRegionId: 'contact_metal_terminals',
    hostSide: 'right',
    posUm: [0.68, 0.34, 0.0],
  },
  {
    id: "S'",
    label: "S'",
    fullName: "Internal Substrate Node (Node S')",
    isExternalTerminal: false,
    hostRegionId: 'p_substrate_bulk',
    hostSide: 'center',
    posUm: [-0.10, -0.26, 0.0],
  },
  {
    id: 'S',
    label: 'S',
    fullName: 'External Substrate Terminal (Node S)',
    isExternalTerminal: true,
    hostRegionId: 'contact_metal_terminals',
    hostSide: 'right',
    posUm: [1.10, 0.34, 0.0],
  },
  {
    id: 'T',
    label: 'ΔTj',
    fullName: 'Thermal Self-Heating Node (ΔTj)',
    isExternalTerminal: false,
    hostRegionId: 'p_substrate_bulk',
    hostSide: 'left',
    posUm: [-0.80, -0.38, 0.0],
  },
];

/**
 * EMBEDDED HICUM CIRCUIT COMPONENTS - SPACIOUS, UNCONGESTED LAYOUT
 * Following the exact topological flow of Image 1:
 * - Left: Extrinsic base branch (RBX, QBCX1, QBCX2, IBCX, QDS, IBEP, QJEP, IBET)
 * - Middle-Left: B* and AC crowding (RBI, CRBI) leading to B'
 * - Center: Intrinsic active core (IBEI, QJEI, QDE, IBCI, QJCI, QDC, IAVL, IT)
 * - Center-Right: RE lead to E, RCX horizontal lead into sinker and C
 * - Bottom: Substrate branch (ITS, QJS, ISC, RSU, CSU) leading to S
 * - Top: CEOX bridging between B and E
 * - Inset: Thermal network (RTH, CTH)
 */
export const EMBEDDED_3D_COMPONENTS: Embedded3DComponentSpec[] = [
  // --- TOP OXIDE OVERLAP ---
  {
    id: 'ceox',
    symbolLabel: 'C_EOX',
    name: 'Oxide Overlap Capacitance (C_EOX)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'localized',
    hostRegionId: 'oxide_isolation_sti',
    hostSide: 'center',
    fromNodePinId: 'B',
    toNodePinId: 'E',
    symbolPosUm: [-0.26, 0.22, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.9.1-1',
    manualCitation: 'Ch. 2.9, p. 58, ll. 10–22; Table 3.10, p. 106, row 1',
    vaCitation: 'hicumL2V2p34.va, ll. 720, 1828',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 95–98',
    physicalOriginNote: 'Parasitic overlap capacitance through oxide passivation between base and emitter contact metallization.',
  },

  // --- EXTRINSIC TRANSISTOR (LEFT REGION) ---
  {
    id: 'rbx',
    symbolLabel: 'R_BX',
    name: 'Extrinsic Base Resistance (R_BX)',
    category: 'resistances',
    symbolType: 'resistor',
    spatialNature: 'distributed',
    hostRegionId: 'p_base_sige_extrinsic',
    hostSide: 'left',
    fromNodePinId: 'B_poly',
    toNodePinId: 'B*',
    symbolPosUm: [-0.52, 0.02, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.8.1-1',
    manualCitation: 'Ch. 2.8.1, p. 54, ll. 1–15; Table 3.6, p. 104, row 6',
    vaCitation: 'hicumL2V2p34.va, ll. 681, 1175, 1796–1800',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 82–84, 124–129',
    physicalOriginNote: 'Horizontal series resistance of extrinsic p⁺ poly-base between contact B and perimeter node B*.',
  },
  {
    id: 'qbcx1',
    symbolLabel: 'Q_BCX1',
    name: 'Outer Extrinsic B-C Capacitance (Q_BCX1)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'n_minus_epitaxy',
    hostSide: 'left',
    fromNodePinId: 'B_poly',
    toNodePinId: "C'",
    symbolPosUm: [-0.65, -0.09, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.4.3-1',
    manualCitation: 'Ch. 2.4.3, p. 39, l. 12; Table 3.9, p. 105',
    vaCitation: 'hicumL2V2p34.va, ll. 710–712, 1530–1545',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 72–75',
    physicalOriginNote: 'Outer depletion capacitance between extrinsic p-base poly and n-epitaxy/buried layer.',
  },
  {
    id: 'qbcx2',
    symbolLabel: 'Q_BCX2',
    name: 'Middle Extrinsic B-C Capacitance (Q_BCX2)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'n_minus_epitaxy',
    hostSide: 'left',
    fromNodePinId: 'B*',
    toNodePinId: "C'",
    symbolPosUm: [-0.42, -0.09, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.4.3-1',
    manualCitation: 'Ch. 2.4.3, p. 39, l. 18; Table 3.9, p. 105',
    vaCitation: 'hicumL2V2p34.va, ll. 712–715, 1530–1545',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 72–75',
    physicalOriginNote: 'Inner extrinsic depletion capacitance between B* and the buried layer.',
  },
  {
    id: 'ibcx',
    symbolLabel: 'I_BCX',
    name: 'Extrinsic B-C Diode Current (I_BCX)',
    category: 'currents',
    symbolType: 'diode',
    spatialNature: 'distributed',
    hostRegionId: 'n_minus_epitaxy',
    hostSide: 'left',
    fromNodePinId: 'B*',
    toNodePinId: "C'",
    symbolPosUm: [-0.32, -0.09, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.5.0-3',
    manualCitation: 'Ch. 2.5, p. 43, ll. 10–18; Table 3.2, p. 102',
    vaCitation: 'hicumL2V2p34.va, ll. 673, 1666',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 72–75',
    physicalOriginNote: 'Extrinsic base-collector junction diode current outside the active window.',
  },
  {
    id: 'qds',
    symbolLabel: 'Q_DS',
    name: 'Extrinsic B-C Diffusion Charge (Q_DS)',
    category: 'charges',
    symbolType: 'charge_storage',
    spatialNature: 'distributed',
    hostRegionId: 'n_minus_epitaxy',
    hostSide: 'left',
    fromNodePinId: 'B*',
    toNodePinId: "C'",
    symbolPosUm: [-0.22, -0.09, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.3.4-1',
    manualCitation: 'Ch. 2.3.4, p. 32, ll. 1–15; Table 3.5, p. 103',
    vaCitation: 'hicumL2V2p34.va, ll. 728, 1555–1560',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 72–75',
    physicalOriginNote: 'Minority carrier diffusion charge stored in the extrinsic collector epitaxy under saturation.',
  },
  {
    id: 'ibep',
    symbolLabel: 'I_BEP',
    name: 'Perimeter B-E Diode Current (I_BEP)',
    category: 'currents',
    symbolType: 'diode',
    spatialNature: 'localized',
    hostRegionId: 'p_base_sige_extrinsic',
    hostSide: 'left',
    fromNodePinId: 'B*',
    toNodePinId: "E'",
    symbolPosUm: [-0.32, 0.07, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.5.0-2',
    manualCitation: 'Ch. 2.5, p. 43, ll. 1–5; Table 3.2, p. 102',
    vaCitation: 'hicumL2V2p34.va, ll. 671, 1664',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 183–192',
    physicalOriginNote: 'Peripheral hole injection and recombination diode at the perimeter of the emitter.',
  },
  {
    id: 'qjep',
    symbolLabel: 'Q_JEP',
    name: 'Perimeter B-E Depletion Charge (Q_JEP)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'localized',
    hostRegionId: 'p_base_sige_extrinsic',
    hostSide: 'left',
    fromNodePinId: 'B*',
    toNodePinId: "E'",
    symbolPosUm: [-0.22, 0.07, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.4.1-1',
    manualCitation: 'Ch. 2.4.1, p. 33, l. 16; Table 3.9, p. 105',
    vaCitation: 'hicumL2V2p34.va, ll. 703, 1668',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 183–192',
    physicalOriginNote: 'Depletion charge along the peripheral sidewall corner of the emitter window.',
  },
  {
    id: 'ibet',
    symbolLabel: 'I_BET',
    name: 'B-E Reverse Tunneling Current (I_BET)',
    category: 'currents',
    symbolType: 'tunnel_diode',
    spatialNature: 'localized',
    hostRegionId: 'p_base_sige_extrinsic',
    hostSide: 'center',
    fromNodePinId: 'B*',
    toNodePinId: "E'",
    symbolPosUm: [-0.10, 0.07, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.10.2-7',
    manualCitation: 'Ch. 2.10.2, p. 63, l. 9; Table 3.4, p. 103',
    vaCitation: 'hicumL2V2p34.va, ll. 694, 1671–1686',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 124–134',
    physicalOriginNote: 'Band-to-band tunneling current across the heavily doped peripheral B*-E\' junction.',
  },

  // --- AC CROWDING & INTRINSIC BASE TRANSITION ---
  {
    id: 'rbi',
    symbolLabel: 'R_BI',
    name: 'Intrinsic Base Sheet Resistance (R_BI)',
    category: 'resistances',
    symbolType: 'resistor',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_active_transistor_core',
    hostSide: 'center',
    fromNodePinId: 'B*',
    toNodePinId: "B'",
    symbolPosUm: [0.01, -0.01, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.6.0-7',
    manualCitation: 'Ch. 2.6, p. 45, l. 12; Table 3.6, p. 103, row 4',
    vaCitation: 'hicumL2V2p34.va, ll. 676–680, 1637–1661',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 79–81',
    physicalOriginNote: 'Internal base sheet resistance under the emitter, modulated by conductivity and DC crowding.',
  },
  {
    id: 'crbi',
    symbolLabel: 'C_RBI',
    name: 'AC Crowding Shunt Capacitance (C_RBI)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_active_transistor_core',
    hostSide: 'center',
    fromNodePinId: 'B*',
    toNodePinId: "B'",
    symbolPosUm: [0.01, 0.03, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.9.2-1',
    manualCitation: 'Ch. 2.9.2, p. 58, l. 19; Table 3.6, p. 103, row 5',
    vaCitation: 'hicumL2V2p34.va, ll. 680, 1603–1608',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 79–81',
    physicalOriginNote: 'Shunt capacitance modeling high-frequency AC base current crowding between B* and B\'.',
  },

  // --- INTRINSIC TRANSISTOR CORE (UNDER EMITTER) ---
  {
    id: 'ibei',
    symbolLabel: 'I_BEI',
    name: 'Intrinsic B-E Diode Current (I_BEI)',
    category: 'currents',
    symbolType: 'diode',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_active_transistor_core',
    hostSide: 'center',
    fromNodePinId: "B'",
    toNodePinId: "E'",
    symbolPosUm: [0.16, 0.05, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.5.0-1',
    manualCitation: 'Ch. 2.5, p. 42, l. 14; Table 3.2, p. 102',
    vaCitation: 'hicumL2V2p34.va, ll. 670, 1662',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 150–159',
    physicalOriginNote: 'Main internal base-emitter hole injection current into the emitter.',
  },
  {
    id: 'qjei',
    symbolLabel: 'Q_JEI',
    name: 'Intrinsic B-E Junction Charge (Q_JEI)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_active_transistor_core',
    hostSide: 'center',
    fromNodePinId: "B'",
    toNodePinId: "E'",
    symbolPosUm: [0.23, 0.05, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.4.1-1',
    manualCitation: 'Ch. 2.4.1, p. 33, l. 16; Table 3.9, p. 105',
    vaCitation: 'hicumL2V2p34.va, ll. 702, 1667',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 150–159',
    physicalOriginNote: 'Main intrinsic base-emitter depletion charge and capacitance.',
  },
  {
    id: 'qde',
    symbolLabel: 'Q_DE',
    name: 'Emitter Diffusion Transit Charge (Q_DE)',
    category: 'charges',
    symbolType: 'charge_storage',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_active_transistor_core',
    hostSide: 'center',
    fromNodePinId: "B'",
    toNodePinId: "E'",
    symbolPosUm: [0.30, 0.05, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.3.2-1',
    manualCitation: 'Ch. 2.3.2, p. 28, l. 5; Table 3.5, p. 103',
    vaCitation: 'hicumL2V2p34.va, ll. 725, 1550',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 150–159',
    physicalOriginNote: 'Hole storage diffusion charge in the neutral emitter region.',
  },
  {
    id: 'ibci',
    symbolLabel: 'I_BCI',
    name: 'Intrinsic B-C Diode Current (I_BCI)',
    category: 'currents',
    symbolType: 'diode',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_active_transistor_core',
    hostSide: 'center',
    fromNodePinId: "B'",
    toNodePinId: "C'",
    symbolPosUm: [0.16, -0.06, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.5.0-3',
    manualCitation: 'Ch. 2.5, p. 43, l. 8; Table 3.2, p. 102',
    vaCitation: 'hicumL2V2p34.va, ll. 672, 1663',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 150–159',
    physicalOriginNote: 'Internal base-collector diode current under forward or inverse B-C operation.',
  },
  {
    id: 'qjci',
    symbolLabel: 'Q_JCI',
    name: 'Intrinsic B-C Junction Charge (Q_JCI)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_active_transistor_core',
    hostSide: 'center',
    fromNodePinId: "B'",
    toNodePinId: "C'",
    symbolPosUm: [0.23, -0.06, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.4.2-1',
    manualCitation: 'Ch. 2.4.2, p. 35, l. 20; Table 3.9, p. 105',
    vaCitation: 'hicumL2V2p34.va, ll. 707, 1500–1522',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 172–181',
    physicalOriginNote: 'Voltage-dependent depletion charge of the intrinsic B-C junction with field punch-through.',
  },
  {
    id: 'qdc',
    symbolLabel: 'Q_DC',
    name: 'Collector Diffusion Transit Charge (Q_DC)',
    category: 'charges',
    symbolType: 'charge_storage',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_active_transistor_core',
    hostSide: 'center',
    fromNodePinId: "B'",
    toNodePinId: "C'",
    symbolPosUm: [0.30, -0.06, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.3.1-1',
    manualCitation: 'Ch. 2.3.1, p. 19, l. 20; Table 3.5, p. 103',
    vaCitation: 'hicumL2V2p34.va, ll. 726, 1471–1500',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 172–181',
    physicalOriginNote: 'Base and collector transit charge under high injection and Kirk effect push-out.',
  },
  {
    id: 'iavl',
    symbolLabel: 'I_AVL',
    name: 'Weak Avalanche Current Generation (I_AVL)',
    category: 'currents',
    symbolType: 'current_source',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_active_transistor_core',
    hostSide: 'center',
    fromNodePinId: "C'",
    toNodePinId: "B'",
    symbolPosUm: [0.35, -0.06, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.10.1-2',
    manualCitation: 'Ch. 2.10.1, p. 60, l. 14; Table 3.3, p. 102',
    vaCitation: 'hicumL2V2p34.va, ll. 685, 1617–1631',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 172–181',
    physicalOriginNote: 'Impact ionization multiplication current generated in the peak electric field of the SIC collector.',
  },
  {
    id: 'it',
    symbolLabel: 'I_T',
    name: 'GICCR Forward Transfer Current (I_T)',
    category: 'currents',
    symbolType: 'current_source',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_active_transistor_core',
    hostSide: 'center',
    fromNodePinId: "C'",
    toNodePinId: "E'",
    symbolPosUm: [0.40, -0.01, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.2.0-1',
    manualCitation: 'Ch. 2.2, p. 9, l. 1 (Eq. 2.2.0-1, GICCR); Table 3.1, p. 101',
    vaCitation: 'hicumL2V2p34.va, ll. 660–668, 1410–1470',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 150–159',
    physicalOriginNote: 'Main forward collector transport current determined by the Generalized Integral Charge Control Relation.',
  },

  // --- SERIES RESISTORS (EMITTER & COLLECTOR) ---
  {
    id: 're',
    symbolLabel: 'R_E',
    name: 'Emitter Series Resistance (R_E)',
    category: 'resistances',
    symbolType: 'resistor',
    spatialNature: 'localized',
    hostRegionId: 'n_plus_emitter',
    hostSide: 'center',
    fromNodePinId: 'E',
    toNodePinId: "E'",
    symbolPosUm: [0.38, 0.15, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.8.3-1',
    manualCitation: 'Ch. 2.8.3, p. 56, ll. 1–15; Table 3.6, p. 104, row 8',
    vaCitation: 'hicumL2V2p34.va, ll. 683, 1176, 1836–1840',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 86–87, 131–134',
    physicalOriginNote: 'Ohmic series resistance of the emitter poly, contact interface, and mono-crystalline plug leading to internal node E\'.',
  },
  {
    id: 'rcx',
    symbolLabel: 'R_CX',
    name: 'Collector Series Resistance (R_CX)',
    category: 'resistances',
    symbolType: 'resistor',
    spatialNature: 'distributed',
    hostRegionId: 'n_plus_buried_layer',
    hostSide: 'right',
    fromNodePinId: "C'",
    toNodePinId: 'C',
    symbolPosUm: [0.55, -0.16, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.8.2-1',
    manualCitation: 'Ch. 2.8.2, p. 55, ll. 1–20; Table 3.6, p. 104, row 7',
    vaCitation: 'hicumL2V2p34.va, ll. 682, 1177, 1830–1835',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 68–71, 91–94',
    physicalOriginNote: 'Ohmic resistance of the buried layer subcollector and vertical sinker plug leading to collector terminal C.',
  },

  // --- SUBSTRATE & PARASITIC PNP BRANCH ---
  {
    id: 'its',
    symbolLabel: 'I_TS',
    name: 'Substrate Transfer Current (I_TS)',
    category: 'currents',
    symbolType: 'current_source',
    spatialNature: 'distributed',
    hostRegionId: 'p_substrate_bulk',
    hostSide: 'center',
    fromNodePinId: 'B*',
    toNodePinId: "S'",
    symbolPosUm: [-0.10, -0.16, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.11.0-4',
    manualCitation: 'Ch. 2.11, p. 65, ll. 20–30; Table 3.7, p. 104',
    vaCitation: 'hicumL2V2p34.va, ll. 688, 1690–1710',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 63–75',
    physicalOriginNote: 'Parasitic vertical substrate PNP transfer current between base B* and substrate S\'.',
  },
  {
    id: 'qjs',
    symbolLabel: 'Q_JS',
    name: 'Substrate Junction Depletion Charge (Q_JS)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'n_plus_buried_layer',
    hostSide: 'left',
    fromNodePinId: "C'",
    toNodePinId: "S'",
    symbolPosUm: [-0.32, -0.20, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.4.4-1',
    manualCitation: 'Ch. 2.4.4, p. 41, ll. 1–18; Table 3.9, p. 105',
    vaCitation: 'hicumL2V2p34.va, ll. 718, 1570–1585',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 68–75',
    physicalOriginNote: 'Depletion capacitance of the n⁺ buried layer to p⁻ substrate pn junction.',
  },
  {
    id: 'isc',
    symbolLabel: 'I_SC',
    name: 'Substrate Junction Diode Current (I_SC)',
    category: 'currents',
    symbolType: 'diode',
    spatialNature: 'distributed',
    hostRegionId: 'n_plus_buried_layer',
    hostSide: 'left',
    fromNodePinId: "S'",
    toNodePinId: "C'",
    symbolPosUm: [-0.22, -0.20, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.5.0-4',
    manualCitation: 'Ch. 2.5, p. 43, ll. 25–30; Table 3.2, p. 102',
    vaCitation: 'hicumL2V2p34.va, ll. 674, 1668',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 68–75',
    physicalOriginNote: 'Substrate-to-collector pn junction diode current.',
  },
  {
    id: 'rsu',
    symbolLabel: 'R_SU',
    name: 'Substrate Series Resistance (R_SU)',
    category: 'resistances',
    symbolType: 'resistor',
    spatialNature: 'distributed',
    hostRegionId: 'p_substrate_bulk',
    hostSide: 'right',
    fromNodePinId: "S'",
    toNodePinId: 'S',
    symbolPosUm: [0.30, -0.34, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.11.0-1',
    manualCitation: 'Ch. 2.11, p. 65, ll. 1–15; Table 3.8, p. 104, row 1',
    vaCitation: 'hicumL2V2p34.va, ll. 690, 1841',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 55, 63–75',
    physicalOriginNote: 'Bulk silicon substrate spreading resistance between S\' and substrate contact S.',
  },
  {
    id: 'csu',
    symbolLabel: 'C_SU',
    name: 'Substrate Permittivity Capacitance (C_SU)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'p_substrate_bulk',
    hostSide: 'right',
    fromNodePinId: "S'",
    toNodePinId: 'S',
    symbolPosUm: [0.30, -0.30, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.11.0-2',
    manualCitation: 'Ch. 2.11, p. 65, ll. 15–20; Table 3.8, p. 104, row 2',
    vaCitation: 'hicumL2V2p34.va, ll. 693, 1843',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 55, 63–75',
    physicalOriginNote: 'Dielectric capacitance shunting R_su across the bulk silicon substrate.',
  },

  // --- SELF-HEATING THERMAL NETWORK (INSET BOX) ---
  {
    id: 'rth',
    symbolLabel: 'R_TH || C_TH',
    name: 'Thermal Self-Heating Network (R_TH, C_TH → ΔT_J)',
    category: 'charges',
    symbolType: 'thermal_rc',
    spatialNature: 'distributed',
    hostRegionId: 'p_substrate_bulk',
    hostSide: 'left',
    fromNodePinId: 'T',
    toNodePinId: 'T',
    symbolPosUm: [-0.80, -0.38, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.15.0-2',
    manualCitation: 'Ch. 2.15, p. 93, ll. 11–18 (Eqs. 2.15.0-2 & 2.15.0-3); Table 3.16, p. 110',
    vaCitation: 'hicumL2V2p34.va, ll. 790–791, 1738–1754, 1864–1868',
    sentaurusCitation: 'sentaurus_sige_hbt.cmd, ll. 95–98',
    physicalOriginNote: 'Dynamic self-heating impedance: Joule dissipation P_diss drives R_th || C_th to generate junction temperature rise ΔT_j.',
  },
];

/**
 * Helper to compute the displaced 3D position [x_um, y_up_um, z_extrude_um]
 * during Exploded View transitions.
 */
export function getExplodedPointUm(
  basePosUm: [number, number, number],
  regionId: string,
  _side: 'left' | 'right' | 'center',
  explodeFactor: number
): [number, number, number] {
  const reg = SENTAURUS_3D_REGIONS.find((r) => r.id === regionId);
  if (!reg || explodeFactor <= 0) return basePosUm;
  const [ex, ey, ez] = reg.explodeVectorUm;
  return [
    basePosUm[0] + ex * explodeFactor,
    basePosUm[1] + ey * explodeFactor,
    basePosUm[2] + ez * explodeFactor,
  ];
}
