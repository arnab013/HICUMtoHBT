import { SpatialNature } from './hicumTypes';

export type RegionCategory = 'materials' | 'contacts' | 'oxide';

export interface SentaurusPrism2D {
  /**
   * 2D polygon vertices [x_um, y_height_um] in exact Sentaurus SDE micrometers:
   * - x_um: lateral distance from symmetry centerline X = 0 in [0.0, 1.20] um
   * - y_height_um: vertical height -Y_sde in [-0.63, +0.33] um
   *   (where 0.0 is Ybas=0.0 B-C interface, +0.30 is Ymin=-0.30 top contact, -0.60 is Ymax=+0.60 substrate bottom)
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
  /**
   * Meaningful structural explosion vector [dx_um, dy_up_um, dz_front_um] at 100% explode:
   * - dx_um is multiplied by +1 for the right half (X >= 0) and -1 for the mirrored left half (X <= 0)
   *   so lateral regions (base poly, spacers, STI trenches, collector sinkers, base/collector contacts)
   *   separate outward symmetrically while central vertical layers separate along Y (vertical height).
   */
  explodeVectorUm: [number, number, number];
  /** Extrusion bounds along emitter stripe length Z in [-0.55, +0.55] um */
  extrudeZUm: [number, number];
  /** Camera focus target in micrometers [x, y_up, z] when double-clicked */
  focusCenterUm: [number, number, number];
  manualSection: string;
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
  /** Host region ID so the node pin moves with its physical region during Exploded View */
  hostRegionId: string;
  /** Which lateral half ('left' | 'right' | 'center') this node pin is anchored to */
  hostSide: 'left' | 'right' | 'center';
  /** Base 3D coordinates in Sentaurus micrometers [x_um, y_up_um, z_extrude_um] */
  posUm: [number, number, number];
}

export interface Embedded3DComponentSpec {
  id: string; // Matches CircuitElement.id in hicumCircuit.ts
  symbolLabel: string; // e.g., 'R_E', 'R_Bx', 'R_bi*', 'C_jEi', 'i_T', 'i_AVL'
  name: string;
  category: EmbeddedComponentCategory;
  symbolType: CircuitSymbolType;
  spatialNature: SpatialNature;
  hostRegionId: string;
  hostSide: 'left' | 'right' | 'center';
  fromNodePinId: string;
  toNodePinId: string;
  /**
   * 3D position in Sentaurus micrometers [x_um, y_up_um, z_extrude_um] where the symbol is centered.
   * Moves with hostRegionId during exploded view.
   */
  symbolPosUm: [number, number, number];
  /** Orientation of the schematic symbol in 2D screen space ('horizontal' | 'vertical') */
  orientation: 'horizontal' | 'vertical';
  /** Optional intermediate 3D waypoints [x_um, y_up_um, z_extrude_um, hostRegionId, side] for clean orthogonal wire routing */
  wireWaypoints?: {
    posUm: [number, number, number];
    hostRegionId: string;
    hostSide: 'left' | 'right' | 'center';
  }[];
  /** Key equation ID from hicumEquations.ts */
  primaryEquationId: string;
  physicalOriginNote: string;
}

/**
 * Authoritative Sentaurus TCAD (`sde` + `sprocess`) 3D Regions for the SiGe HBT
 * Palette: Restrained scientific solid material colors (Slate-Blue, Dusty Rose, Terracotta, Steel-Blue, Warm Ochre, Soft Sage, Pewter)
 */
export const SENTAURUS_3D_REGIONS: Sentaurus3DRegionSpec[] = [
  {
    id: 'contact_emitter',
    name: 'Emitter Metallization Terminal (Contact: emitter / Node E)',
    shortLabel: 'Emitter Contact (E)',
    sentaurusId: 'Contact: emitter (Top boundary of R.Emitter)',
    blenderMeshName: 'Contact_Emitter',
    category: 'contacts',
    materialName: 'Aluminium / Silicide Contact',
    dopingSummary: 'Ohmic Metal Terminal (E)',
    physicalFunction: 'External emitter electrode contacting the top of the n⁺ polysilicon emitter pedestal at Y_min = −0.30 μm.',
    sentaurusCoordsUm: 'X ∈ [−0.075, +0.075] μm, Y_sde = −0.300 μm',
    sentaurusSdeSnippet: `(sdegeo:define-contact-set "emitter" 4 (color:rgb 0 1 0) "##")\n(sdegeo:define-2d-contact (find-edge-id (position Ymin (* 0.5 Xer) 0.0)) "emitter")`,
    spatialNature: 'localized',
    colorHex: '#6E7681',
    edgeHex: '#334155',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, 0.52, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [0.0, 0.315, 0.0],
    manualSection: 'Section 2.8.1 (Fig. 2.8.1/1)',
    description:
      'Top metallization contact strip for the emitter terminal (E) at Y_min = −0.300 μm across the full emitter width W_emi = 0.15 μm (X ∈ [−0.075, +0.075] μm).',
    localizedVsDistributedNote:
      'Physically localized boundary interface at the top of R.Emitter; forms the external terminal node E for emitter series resistance R_E and parasitic capacitance C_BEpar.',
    nodesInRegion: ['E'],
    circuitElements: ['re', 'cbepar1', 'cbepar2'],
    keyParameters: ['re', 'zetare', 'cbepar', 'fbepar'],
    prisms: [
      {
        xzPointsUm: [
          [0.0, 0.30],
          [0.075, 0.30],
          [0.075, 0.33],
          [0.0, 0.33],
        ],
      },
    ],
  },
  {
    id: 'emitter_poly_pedestal',
    name: 'n⁺ PolySilicon Emitter Pedestal (R.Emitter / E → E\')',
    shortLabel: 'n⁺ Poly-Emitter (R.Emitter)',
    sentaurusId: 'R.Emitter (Place.Emitter)',
    blenderMeshName: 'R_Emitter_Poly',
    category: 'materials',
    materialName: 'n⁺ PolySilicon',
    dopingSummary: 'Arsenic / Phosphorus 10²⁰ cm⁻³',
    physicalFunction: 'Conducts emitter electron current vertically from terminal E to the mono-crystalline emitter window E\' (series resistance R_E).',
    sentaurusCoordsUm: 'X ∈ [−0.075, +0.075] μm (Wemi = 0.15 μm), Y_sde ∈ [−0.300, −0.075] μm (Hemi = 0.225 μm)',
    sentaurusSdeSnippet: `(sdegeo:create-rectangle (position Yemi Xmin 0.0) (position Ymin Xer 0.0) "PolySilicon" "R.Emitter")\n(sdepe:doping-constant-placement "Place.Emitter" "ArsenicActiveConcentration" 1e20 "R.Emitter")`,
    spatialNature: 'localized',
    colorHex: '#7FA3C7',
    edgeHex: '#2B4C6F',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, 0.38, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [0.0, 0.185, 0.0],
    manualSection: 'Sections 2.2.2 & 2.8.1 (Fig. 2.8.1/1)',
    description:
      'Heavily doped n⁺ PolySilicon emitter pedestal (half-width X_er = 0.075 μm, full width W_emi = 0.15 μm, height H_emi = 0.225 μm from Y_emi = −0.075 μm to Y_min = −0.300 μm, doped 10²⁰ cm⁻³).',
    localizedVsDistributedNote:
      'Physically localized vertical column between external node E and internal emitter node E\'; directly determines lumped emitter series resistance R_E and its 1/f noise (kfre, afre).',
    nodesInRegion: ['E', "E'"],
    circuitElements: ['re', 'cbepar1'],
    keyParameters: ['re', 'zetare', 'kfre', 'afre'],
    prisms: [
      {
        xzPointsUm: [
          [0.0, 0.075],
          [0.075, 0.075],
          [0.075, 0.30],
          [0.0, 0.30],
        ],
      },
    ],
  },
  {
    id: 'mono_emitter_window',
    name: 'n⁺ Mono-Crystalline Emitter Window (Impl.Emi / Node E\')',
    shortLabel: 'n⁺ Mono-Emitter (Impl.Emi)',
    sentaurusId: 'Impl.Emi (Def.Emi / Ref.Emi)',
    blenderMeshName: 'Impl_Emi_MonoWindow',
    category: 'materials',
    materialName: 'n⁺ Mono-Si / SiGe Interface',
    dopingSummary: 'Arsenic Peak 5×10¹⁹ cm⁻³ (Impl.Emi)',
    physicalFunction: 'Injects electrons across the B\'-E\' junction into the graded SiGe base and stores back-injected minority holes ΔQ_Ef.',
    sentaurusCoordsUm: 'X ∈ [−0.075, +0.075] μm, Y_sde ∈ [−0.075, −0.052] μm (SymPosEmi = 0.03 μm)',
    sentaurusSdeSnippet: `(sdepe:doping-analytical-profile-definition "Def.Emi" "ArsenicActiveConcentration" "PeakPos" 0.0 "PeakVal" PeakEmi "ValueAtDepth" DopingBas "Depth" SymPosEmi "Gauss" "Factor" 0.25)`,
    spatialNature: 'localized',
    colorHex: '#5D84B0',
    edgeHex: '#1E3A5F',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, 0.23, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [0.0, 0.063, 0.0],
    manualSection: 'Sections 2.2.2, 2.3.1, 2.4.1',
    description:
      'Shallow n⁺ monocrystalline emitter region formed by dopant out-diffusion (PeakEmi = 5×10¹⁹ cm⁻³) from R.Emitter into the top of R.SiGeBase across X ∈ [−0.075, +0.075] μm.',
    localizedVsDistributedNote:
      'Physically localized at the intrinsic B\'-E\' junction window; hosts internal emitter node E\', neutral emitter storage time τ_Ef0 (tef0, gtfe, hfe), and intrinsic B\'-E\' depletion capacitance C_jEi.',
    nodesInRegion: ["E'", "B'"],
    circuitElements: ['ibei', 'cjei', 'qf', 're'],
    keyParameters: ['ibeis', 'mbei', 'ireis', 'mrei', 'cjei0', 'vdei', 'zei', 'ajei', 'tef0', 'gtfe', 'hfe'],
    prisms: [
      {
        xzPointsUm: [
          [0.0, 0.052],
          [0.075, 0.052],
          [0.075, 0.075],
          [0.0, 0.075],
        ],
      },
    ],
  },
  {
    id: 'be_nitride_spacer',
    name: 'B-E Sidewall Nitride Spacer & Perimeter Junction (sprocess Spacer / B*–E\')',
    shortLabel: 'Si₃N₄ Sidewall Spacer',
    sentaurusId: 'sprocess Nitride Sidewall Spacer',
    blenderMeshName: 'Nitride_Spacer_Sidewall',
    category: 'oxide',
    materialName: 'Silicon Nitride (Si₃N₄)',
    dopingSummary: 'Dielectric Insulator (75 nm gap)',
    physicalFunction: 'Self-aligns the extrinsic p⁺ poly-base to the n⁺ emitter window; governs perimeter junction C_jEp, i_jBEp, tunneling i_BEt, and C_BEpar.',
    sentaurusCoordsUm: '|X| ∈ [0.075, 0.150] μm (Xer → Xbcr), Y_sde ∈ [−0.260, −0.075] μm',
    sentaurusSdeSnippet: `deposit nitride thickness=0.05 isotropic\netch nitride thickness=0.054 anisotropic`,
    spatialNature: 'localized',
    colorHex: '#98A6BD',
    edgeHex: '#475569',
    defaultOpacity: 0.88,
    explodeVectorUm: [0.08, 0.28, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [-0.112, 0.15, 0.0],
    manualSection: 'Sections 2.3.2, 2.4.1, 2.8.3, 2.9 (Fig. 2.8.3/1)',
    description:
      'Silicon nitride (Si₃N₄) sidewall dielectric spacer occupying the 75 nm lateral separation between the n⁺ poly-emitter edge (X_er = 0.075 μm) and the p⁺ poly-base inner edge (X_bcr = 0.150 μm).',
    localizedVsDistributedNote:
      'Physically localized along the emitter stripe perimeter; directly governs peripheral injection i_jBEp, perimeter depletion capacitance C_jEp, B-E Zener tunneling i_BEt, and sidewall spacer capacitance C_BEpar (partitioned via f_BEpar).',
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
    id: 'contact_base',
    name: 'Aluminium Base Contact Terminal (R.BaseContR / Node B)',
    shortLabel: 'Base Contact (R.BaseContR)',
    sentaurusId: 'R.BaseContR (Contact: base)',
    blenderMeshName: 'R_BaseContR',
    category: 'contacts',
    materialName: 'Aluminium Metallization',
    dopingSummary: 'Ohmic Metal Terminal (B)',
    physicalFunction: 'External base terminal contacting the top of the p⁺ extrinsic polysilicon base layer.',
    sentaurusCoordsUm: '|X| ∈ [0.225, 0.450] μm (Xbr → Xbcm), Y_sde ∈ [−0.300, −0.150] μm',
    sentaurusSdeSnippet: `(sdegeo:create-rectangle (position Ybc Xbr 0.0) (position Ymin Xbcm 0.0) "Aluminium" "R.BaseContR")\n(sdegeo:define-contact-set "base" 4 (color:rgb 1 0 0) "##")`,
    spatialNature: 'localized',
    colorHex: '#78808A',
    edgeHex: '#334155',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.16, 0.40, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [-0.337, 0.225, 0.0],
    manualSection: 'Section 2.7 (Fig. 2.7.0/1)',
    description:
      'Aluminium base contact blocks R.BaseContR spanning |X| ∈ [0.225, 0.450] μm and Y_sde ∈ [−0.300, −0.150] μm ontop of R.Baseright.',
    localizedVsDistributedNote:
      'Physically localized external base contact (node B); contact resistance r_KB combines with the p⁺ poly-base sheet resistance into R_Bx.',
    nodesInRegion: ['B'],
    circuitElements: ['rbx', 'cjcx1', 'cbepar1'],
    keyParameters: ['rbx', 'zetarbx', 'cbcpar', 'fbcpar'],
    prisms: [
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
    id: 'extrinsic_base_poly',
    name: 'Extrinsic p⁺ PolySilicon Base Layer (R.Baseright / Node B → B*)',
    shortLabel: 'p⁺ Poly-Base (R.Baseright)',
    sentaurusId: 'R.Baseright (Place.Baseright)',
    blenderMeshName: 'R_Baseright_PolyBase',
    category: 'materials',
    materialName: 'p⁺ PolySilicon',
    dopingSummary: 'Boron Constant 10²⁰ cm⁻³',
    physicalFunction: 'Connects external base contact B laterally to the intrinsic SiGe base perimeter B* across the 75 nm overlap dWb (series resistance R_Bx).',
    sentaurusCoordsUm: '|X| ∈ [0.150, 0.450] μm (Xbcr → Xbcm), Y_sde ∈ [−0.150, −0.075] μm (Hbc = 75 nm)',
    sentaurusSdeSnippet: `(sdegeo:create-rectangle (position Yemi Xbcr 0.0) (position Ybc Xbcm 0.0) "PolySilicon" "R.Baseright")\n(sdepe:doping-constant-placement "Place.Baseright" "BoronActiveConcentration" 1e20 "R.Baseright")`,
    spatialNature: 'distributed',
    colorHex: '#C68B82',
    edgeHex: '#6E3B34',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.12, 0.24, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [-0.30, 0.112, 0.0],
    manualSection: 'Sections 2.5 & 2.7 (Figs. 2.7.0/1, 2.7.0/2)',
    description:
      'Heavily doped p⁺ PolySilicon extrinsic base layer (Boron 10²⁰ cm⁻³, thickness H_bc = 75 nm) extending from |X| = 0.450 μm inward to |X| = 0.150 μm, overlapping R.SiGeBase across |X| ∈ [0.150, 0.225] μm by dWb = 75 nm.',
    localizedVsDistributedNote:
      'Laterally distributed conduction path from external base contact B to the perimeter base node B*; represented by extrinsic base series resistance R_Bx and partitioned extrinsic B-C capacitance (f_BCpar).',
    nodesInRegion: ['B', 'B*'],
    circuitElements: ['rbx', 'cjcx1', 'cjcx2', 'cbepar1'],
    keyParameters: ['rbx', 'zetarbx', 'fgeo', 'cbcpar', 'fbcpar'],
    prisms: [
      {
        xzPointsUm: [
          [0.150, 0.075],
          [0.450, 0.075],
          [0.450, 0.150],
          [0.150, 0.150],
        ],
      },
    ],
  },
  {
    id: 'intrinsic_sige_base',
    name: 'Epitaxial Graded p-Si₁₋ₓGeₓ Base Layer (R.SiGeBase / Node B* → B\')',
    shortLabel: 'p-SiGe Base (R.SiGeBase)',
    sentaurusId: 'R.SiGeBase (Place.Bas + Prof.Mole)',
    blenderMeshName: 'R_SiGeBase',
    category: 'materials',
    materialName: 'Epitaxial SiliconGermanium',
    dopingSummary: 'Boron Peak 5×10¹⁸ cm⁻³ · Ge x = 0.00 → 0.16',
    physicalFunction: 'Graded Ge mole fraction creates a built-in drift field accelerating electrons from E\' to C\' (GICCR i_T, τ_0) while holes flow laterally from B* to B\' (R_bi*, C_rBi).',
    sentaurusCoordsUm: 'X ∈ [−0.225, +0.225] μm (Wbas = 0.45 μm), Y_sde ∈ [−0.075, 0.000] μm (Hbas = 75 nm)',
    sentaurusSdeSnippet: `(sdegeo:create-rectangle (position Ybas Xmin 0.0) (position Yemi Xbr 0.0) "SiliconGermanium" "R.SiGeBase")\n(sdepe:Graded-Strained-Mole-Fraction "Prof.Mole" "R.SiGeBase" "x" 0.0 0.16)`,
    spatialNature: 'distributed',
    colorHex: '#DFAEA6',
    edgeHex: '#7A3E37',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, 0.10, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [0.0, 0.032, 0.0],
    manualSection: 'Sections 2.2, 2.3.1, 2.5, 2.13, 2.14 (Fig. 2.2.0/2)',
    description:
      '75 nm epitaxial SiliconGermanium base mesa (X ∈ [−0.225, +0.225] μm, Y_sde ∈ [−0.075, 0.0] μm) with linear Ge mole fraction grading from 0% at the B-E interface to 16% at the B-C interface and Gaussian Boron doping (PeakBas = 5×10¹⁸ cm⁻³).',
    localizedVsDistributedNote:
      'Vertically localized between Y_emi = −0.075 μm and Y_bas = 0.0 μm, and laterally distributed across the emitter window: conductivity modulation and 2D emitter current crowding are modeled by R_bi*(i_jBEi, Q_p) and AC shunt C_rBi.',
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
      'alqf',
      'alit',
      'flnqs',
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
    id: 'intrinsic_collector_sic',
    name: 'Selectively Implanted Collector Pedestal (Impl.Col / SIC Core B\'–C\')',
    shortLabel: 'n-SIC Collector (Impl.Col)',
    sentaurusId: 'Impl.Col (Def.Col / Ref.Col)',
    blenderMeshName: 'Impl_Col_SIC',
    category: 'materials',
    materialName: 'n-Type Silicon (SIC Pedestal)',
    dopingSummary: 'Phosphorus Peak 10¹⁸ cm⁻³ at Y = 0.075 μm',
    physicalFunction: 'High-field intrinsic collector core beneath the emitter window; sets Kirk critical current I_CK, internal B-C capacitance C_jCi, avalanche i_AVL, and peak self-heating ΔT_j.',
    sentaurusCoordsUm: 'X ∈ [−0.150, +0.150] μm (Xbcr), Y_sde ∈ [0.000, +0.180] μm',
    sentaurusSdeSnippet: `(sdegeo:insert-vertex (position 0.075 Xmin 0.0))\n(sdegeo:insert-vertex (position 0.075 Xbcr 0.0))\n(sdepe:doping-analytical-profile-definition "Def.Col" "PhosphorusActiveConcentration" "PeakPos" 0.0 "PeakVal" PeakCol ...)`,
    spatialNature: 'distributed',
    colorHex: '#6E94B8',
    edgeHex: '#254E70',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, 0.0, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [0.0, -0.09, 0.0],
    manualSection: 'Sections 2.2.1, 2.2.2, 2.4.2, 2.10 (Fig. 2.2.0/2)',
    description:
      'Selectively Implanted Collector (SIC) pedestal implanted through the emitter window across X ∈ [−0.150, +0.150] μm with Phosphorus peak 10¹⁸ cm⁻³ centered at depth Y = 0.075 μm.',
    localizedVsDistributedNote:
      'Instead of an artificial lumped internal collector resistor node, HICUM embeds the distributed electric-field collapse, velocity saturation (v_lim), and Kirk base push-out of this SIC pedestal directly into I_CK(v_C\'E\') and Q_f(i_Tf).',
    nodesInRegion: ["B'", "C'", 'T'],
    circuitElements: ['it', 'cjci', 'ibci', 'iavl', 'qr', 'rth', 'cth'],
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
      'rth',
      'cth',
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
    id: 'collector_epi_mesa',
    name: 'Active Collector Epitaxial Mesa (R.Substrate Upper Mesa / B*–C\')',
    shortLabel: 'n⁻ Collector Mesa',
    sentaurusId: 'R.Substrate Active Trapezoidal Mesa',
    blenderMeshName: 'R_CollectorMesa_EpiN',
    category: 'materials',
    materialName: 'n⁻ Silicon Collector Mesa',
    dopingSummary: 'Collector Tail 10¹⁶–10¹⁷ cm⁻³ (Slope dWc = 0.10 μm)',
    physicalFunction: 'Active silicon collector mesa surrounding the SIC core and supporting the extrinsic base-collector depletion capacitances C_jCx1 and C_jCx2.',
    sentaurusCoordsUm: '|X| ∈ [0.00, 0.225 top → 0.325 bottom] μm, Y_sde ∈ [0.000, +0.300] μm',
    sentaurusSdeSnippet: `; Active collector mesa sloped wall dWc = 0.10 um:\n(position Ybas Xbr 0) -> (position Ysub Xcr 0)`,
    spatialNature: 'distributed',
    colorHex: '#A3B8CC',
    edgeHex: '#475569',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, -0.06, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [0.0, -0.22, 0.0],
    manualSection: 'Sections 2.4.2 & 2.6 (Fig. 2.7.0/2)',
    description:
      'Trapezoidal active silicon collector mesa rising from the buried subcollector at Y_sub = 0.30 μm (|X| ≤ 0.325 μm) to the SiGe base interface at Y_bas = 0.0 μm (|X| ≤ 0.225 μm).',
    localizedVsDistributedNote:
      'Distributed extrinsic B-C depletion region around the SIC core; partitioned via f_BCpar into outer capacitance C_jCx1 (to node B) and inner capacitance C_jCx2 (to node B*).',
    nodesInRegion: ['B*', 'B', "C'"],
    circuitElements: ['cjcx1', 'cjcx2', 'ijbcx', 'its', 'qdsu'],
    keyParameters: ['cjcx0', 'vdcx', 'zcx', 'vptcx', 'cbcpar', 'fbcpar', 'ibcxs', 'mbcx'],
    prisms: [
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
    ],
  },
  {
    id: 'sti_oxide_trench',
    name: 'Shallow Trench Isolation (STI) Oxide (R.Insulation)',
    shortLabel: 'SiO₂ STI Trench (R.Insulation)',
    sentaurusId: 'R.Insulation (Oxide)',
    blenderMeshName: 'R_Insulation_STI_Inner & R_Insulation_STI_Outer',
    category: 'oxide',
    materialName: 'Silicon Dioxide (SiO₂)',
    dopingSummary: 'Dielectric Trench Isolation',
    physicalFunction: 'Isolates the active intrinsic collector mesa from the lateral n⁺ collector sinker mesa and bounds lateral heat dissipation (R_th, C_BCpar).',
    sentaurusCoordsUm: 'Inner STI: |X| ∈ [0.225..0.325 → 0.70..0.80] μm; Outer STI: |X| ∈ [1.00..1.10 → 1.20] μm, Y_sde ∈ [0.0, 0.30] μm',
    sentaurusSdeSnippet: `(sdegeo:set-default-boolean "BAB")\n(sdegeo:create-rectangle (position Ymin Xmin 0.0) (position Ysub Xmax 0.0) "Oxide" "R.Insulation")`,
    spatialNature: 'localized',
    colorHex: '#DCE4EC',
    edgeHex: '#64748B',
    defaultOpacity: 0.42,
    explodeVectorUm: [0.10, -0.02, 0.0],
    extrudeZUm: [-0.54, 0.54],
    focusCenterUm: [0.51, -0.15, 0.0],
    manualSection: 'Sections 2.4.2, 2.8.3, 2.12',
    description:
      'Sloped SiO₂ Shallow Trench Isolation (STI) regions etched to depth Y_sub = 0.30 μm between the active collector mesa and the collector sinker mesa (and along the outer device perimeter).',
    localizedVsDistributedNote:
      'Physically localized dielectric isolation volume; reduces extrinsic collector capacitance while increasing thermal confinement (R_th).',
    nodesInRegion: ['B', 'B*', 'C', 'S'],
    circuitElements: ['cjcx1', 'cscp', 'rth'],
    keyParameters: ['cbcpar', 'fbcpar', 'cscp0', 'rth', 'cth'],
    prisms: [
      {
        xzPointsUm: [
          [0.325, -0.30],
          [0.700, -0.30],
          [0.800, 0.0],
          [0.225, 0.0],
        ],
      },
      {
        xzPointsUm: [
          [1.100, -0.30],
          [1.200, -0.30],
          [1.200, 0.0],
          [1.000, 0.0],
        ],
      },
    ],
  },
  {
    id: 'collector_sinker',
    name: 'n⁺ Collector Sinker Mesa (Impl.ColCont / Node C\' → C)',
    shortLabel: 'n⁺ Collector Sinker (Impl.ColCont)',
    sentaurusId: 'Impl.ColCont (Def.ColCont Sinker Mesa)',
    blenderMeshName: 'Impl_ColCont_SinkerNPlus',
    category: 'materials',
    materialName: 'n⁺ Silicon Sinker Plug',
    dopingSummary: 'Phosphorus Peak 10²⁰ cm⁻³',
    physicalFunction: 'Vertical low-resistance n⁺ reach-through plug bringing collector current from the buried subcollector up to the surface collector contact C (part of R_Cx).',
    sentaurusCoordsUm: '|X| ∈ [0.80..1.00 top → 0.70..1.10 bottom] μm, Y_sde ∈ [0.000, +0.300] μm',
    sentaurusSdeSnippet: `(sdepe:doping-analytical-profile-definition "Def.ColCont" "PhosphorusActiveConcentration" "PeakPos" 0.0 "PeakVal" 1e20 "ValueAtDepth" DopingSub "Depth" 0.4 "Gauss" "Factor" 0.25)`,
    spatialNature: 'localized',
    colorHex: '#DCB372',
    edgeHex: '#784F18',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.20, -0.03, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [0.90, -0.15, 0.0],
    manualSection: 'Section 2.8.2 (Fig. 2.8.2/1)',
    description:
      'Heavily doped trapezoidal n⁺ collector sinker mesa (Phosphorus 10²⁰ cm⁻³) rising from Y_sub = 0.30 μm (|X| ∈ [0.70, 1.10] μm) to Y_bas = 0.0 μm (|X| ∈ [0.80, 1.00] μm).',
    localizedVsDistributedNote:
      'Physically localized vertical conduction path in series with the buried subcollector; combined into external collector series resistance R_Cx.',
    nodesInRegion: ["C'", 'C'],
    circuitElements: ['rcx'],
    keyParameters: ['rcx', 'zetarcx'],
    prisms: [
      {
        xzPointsUm: [
          [0.700, -0.30],
          [1.100, -0.30],
          [1.000, 0.0],
          [0.800, 0.0],
        ],
      },
    ],
  },
  {
    id: 'contact_collector',
    name: 'Aluminium Collector Contact Terminal (R.CollectorCont / Node C)',
    shortLabel: 'Collector Contact (R.CollectorCont)',
    sentaurusId: 'R.CollectorCont (Contact: collector)',
    blenderMeshName: 'R_CollectorCont',
    category: 'contacts',
    materialName: 'Aluminium Metallization',
    dopingSummary: 'Ohmic Metal Terminal (C)',
    physicalFunction: 'External collector electrode contacting the top surface of the n⁺ collector sinker mesa.',
    sentaurusCoordsUm: '|X| ∈ [0.800, 1.000] μm (Xcol = 0.90, Wcol = 0.20 μm), Y_sde ∈ [−0.300, 0.000] μm',
    sentaurusSdeSnippet: `(sdegeo:create-rectangle (position Ybas Xscl 0.0) (position Ymin Xscr 0.0) "Aluminium" "R.CollectorCont")\n(sdegeo:define-contact-set "collector" 4 (color:rgb 0 0 1) "##")`,
    spatialNature: 'localized',
    colorHex: '#707882',
    edgeHex: '#334155',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.24, 0.26, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [0.90, 0.15, 0.0],
    manualSection: 'Section 2.8.2 (Fig. 2.8.2/1)',
    description:
      'Aluminium collector contact column R.CollectorCont spanning |X| ∈ [0.800, 1.000] μm and Y_sde ∈ [−0.300, 0.000] μm.',
    localizedVsDistributedNote:
      'Physically localized external collector terminal (node C) at the end of the R_Cx collector conduction path.',
    nodesInRegion: ['C'],
    circuitElements: ['rcx', 'cscp'],
    keyParameters: ['rcx', 'zetarcx'],
    prisms: [
      {
        xzPointsUm: [
          [0.800, 0.0],
          [1.000, 0.0],
          [1.000, 0.300],
          [0.800, 0.300],
        ],
      },
    ],
  },
  {
    id: 'buried_subcollector',
    name: 'n⁺ Buried Subcollector Layer (Impl.SubCol / Node C\' Bottom Plane)',
    shortLabel: 'n⁺ Buried Layer (Impl.SubCol)',
    sentaurusId: 'Impl.SubCol (Def.SubCol / Ref.SubCol)',
    blenderMeshName: 'Impl_SubCol_BuriedNPlus',
    category: 'materials',
    materialName: 'n⁺ Buried Silicon Layer',
    dopingSummary: 'Arsenic / Phosphorus Peak 2×10¹⁹ cm⁻³',
    physicalFunction: 'Channels vertical electron current from the intrinsic collector C\' laterally beneath the STI trench to the collector sinker (R_Cx) and forms the C-S junction (C_jS, i_jSC).',
    sentaurusCoordsUm: 'X ∈ [−1.20, +1.20] μm, Y_sde ∈ [+0.300, +0.420] μm (Peak at Y_sub = 0.30 μm)',
    sentaurusSdeSnippet: `(sdegeo:insert-vertex (position Ysub Xmin 0.0))\n(sdepe:doping-analytical-profile-definition "Def.SubCol" "ArsenicActiveConcentration" "PeakPos" 0.0 "PeakVal" 2e19 ...)`,
    spatialNature: 'localized',
    colorHex: '#E5C48A',
    edgeHex: '#855B1E',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, -0.18, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [0.0, -0.36, 0.0],
    manualSection: 'Sections 2.8.2 & 2.11 (Fig. 2.8.2/1)',
    description:
      'Heavily doped n⁺ buried subcollector sheet (Peak 2×10¹⁹ cm⁻³ at Y_sub = 0.30 μm) bridging the active collector mesa under the emitter to the lateral collector sinker mesa.',
    localizedVsDistributedNote:
      'Physically localized buried conduction sheet; contributes the horizontal buried-layer resistance r_bl to R_Cx and forms the n⁺ side of the collector-substrate junction C_jS.',
    nodesInRegion: ["C'", "S'"],
    circuitElements: ['rcx', 'cjs', 'ijsc', 'its', 'qdsu'],
    keyParameters: ['rcx', 'zetarcx', 'cjs0', 'vds', 'zs', 'vpts'],
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
    id: 'p_substrate_bulk',
    name: 'p⁻ Silicon Wafer Substrate (R.Substrate / Node S\' → S)',
    shortLabel: 'p⁻ Substrate (R.Substrate)',
    sentaurusId: 'R.Substrate (Const.Sub)',
    blenderMeshName: 'R_Substrate_P',
    category: 'materials',
    materialName: 'p⁻ Silicon Wafer Bulk',
    dopingSummary: 'Boron Constant 10¹⁵ cm⁻³',
    physicalFunction: 'Lightly doped p-type silicon wafer beneath the buried subcollector; hosts internal substrate node S\' and RC substrate coupling network (R_su, C_su).',
    sentaurusCoordsUm: 'X ∈ [−1.20, +1.20] μm, Y_sde ∈ [+0.420, +0.600] μm',
    sentaurusSdeSnippet: `(sdepe:doping-constant-placement "Const.Sub" "BoronActiveConcentration" 1e15 "R.Substrate")`,
    spatialNature: 'distributed',
    colorHex: '#BDD2C5',
    edgeHex: '#436854',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, -0.34, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [0.0, -0.51, 0.0],
    manualSection: 'Sections 2.11 & 2.12 (Fig. 2.11.0/1)',
    description:
      'Lightly doped p⁻ silicon substrate wafer (Boron 10¹⁵ cm⁻³) below the n⁺ buried subcollector.',
    localizedVsDistributedNote:
      'C_jS is localized at the n⁺ buried-layer / p⁻ substrate interface, whereas R_su and C_su represent distributed 3D spreading resistance and dielectric relaxation across the silicon wafer.',
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
    id: 'contact_substrate',
    name: 'Bottom Substrate Contact Metallization (Contact: substrate / Node S)',
    shortLabel: 'Substrate Contact (S)',
    sentaurusId: 'Contact: substrate (bottomSilicon)',
    blenderMeshName: 'Contact_Substrate',
    category: 'contacts',
    materialName: 'Substrate Backplate Metallization',
    dopingSummary: 'Ohmic Metal Terminal (S)',
    physicalFunction: 'External substrate reference terminal (S) at the bottom of the p⁻ silicon wafer.',
    sentaurusCoordsUm: 'X ∈ [−1.20, +1.20] μm, Y_sde = +0.600 μm',
    sentaurusSdeSnippet: `contact name=substrate bottomSilicon`,
    spatialNature: 'localized',
    colorHex: '#666E78',
    edgeHex: '#334155',
    defaultOpacity: 1.0,
    explodeVectorUm: [0.0, -0.46, 0.0],
    extrudeZUm: [-0.55, 0.55],
    focusCenterUm: [0.0, -0.615, 0.0],
    manualSection: 'Section 2.12 (Fig. 2.11.0/1)',
    description:
      'Bottom substrate contact metallization plane at Y_max = +0.600 μm (extending to back-side wafer contact in sprocess).',
    localizedVsDistributedNote:
      'Physically localized external reference terminal S for the substrate network (R_su, C_su, C_SCp).',
    nodesInRegion: ['S'],
    circuitElements: ['rsu', 'csu', 'cscp'],
    keyParameters: ['rsu', 'csu', 'cscp0'],
    prisms: [
      {
        xzPointsUm: [
          [0.0, -0.63],
          [1.20, -0.63],
          [1.20, -0.60],
          [0.0, -0.60],
        ],
      },
    ],
  },
];

/**
 * 3D Circuit Node Pins anchored to the front cross-section plane (z_extrude = +0.56 um in Full 3D, or +0.02 um in Cross-Section)
 * Every pin is attached to its hostRegionId + hostSide so it translates accurately during Exploded View!
 */
export const EMBEDDED_3D_NODE_PINS: Embedded3DNodePin[] = [
  {
    id: 'E',
    label: 'E',
    fullName: 'External Emitter Terminal (Node E)',
    isExternalTerminal: true,
    hostRegionId: 'contact_emitter',
    hostSide: 'center',
    posUm: [0.0, 0.36, 0.0],
  },
  {
    id: "E'",
    label: "E'",
    fullName: "Internal Emitter Node (Node E')",
    isExternalTerminal: false,
    hostRegionId: 'mono_emitter_window',
    hostSide: 'center',
    posUm: [0.0, 0.064, 0.0],
  },
  {
    id: 'B',
    label: 'B',
    fullName: 'External Base Terminal (Node B)',
    isExternalTerminal: true,
    hostRegionId: 'contact_base',
    hostSide: 'left',
    posUm: [-0.34, 0.34, 0.0],
  },
  {
    id: 'B_poly',
    label: '',
    fullName: 'Extrinsic Poly-Base Entry',
    isExternalTerminal: false,
    hostRegionId: 'extrinsic_base_poly',
    hostSide: 'left',
    posUm: [-0.34, 0.11, 0.0],
  },
  {
    id: 'B*',
    label: 'B*',
    fullName: 'Perimeter Base Node (Node B*)',
    isExternalTerminal: false,
    hostRegionId: 'extrinsic_base_poly',
    hostSide: 'left',
    posUm: [-0.175, 0.062, 0.0],
  },
  {
    id: "B'",
    label: "B'",
    fullName: "Intrinsic SiGe Base Node (Node B')",
    isExternalTerminal: false,
    hostRegionId: 'intrinsic_sige_base',
    hostSide: 'center',
    posUm: [-0.045, 0.032, 0.0],
  },
  {
    id: "C'",
    label: "C'",
    fullName: "Internal Collector Node (Node C')",
    isExternalTerminal: false,
    hostRegionId: 'intrinsic_collector_sic',
    hostSide: 'center',
    posUm: [0.0, -0.155, 0.0],
  },
  {
    id: 'C_bl',
    label: '',
    fullName: 'Buried Subcollector Lateral Channel',
    isExternalTerminal: false,
    hostRegionId: 'buried_subcollector',
    hostSide: 'right',
    posUm: [0.48, -0.36, 0.0],
  },
  {
    id: 'C',
    label: 'C',
    fullName: 'External Collector Terminal (Node C)',
    isExternalTerminal: true,
    hostRegionId: 'contact_collector',
    hostSide: 'right',
    posUm: [0.90, 0.34, 0.0],
  },
  {
    id: "S'",
    label: "S'",
    fullName: "Internal Substrate Node (Node S')",
    isExternalTerminal: false,
    hostRegionId: 'p_substrate_bulk',
    hostSide: 'center',
    posUm: [-0.20, -0.49, 0.0],
  },
  {
    id: 'S',
    label: 'S',
    fullName: 'External Substrate Terminal (Node S)',
    isExternalTerminal: true,
    hostRegionId: 'contact_substrate',
    hostSide: 'center',
    posUm: [0.35, -0.615, 0.0],
  },
  {
    id: 'T',
    label: 'T (ΔTj)',
    fullName: 'Thermal Self-Heating Node (ΔTj)',
    isExternalTerminal: true,
    hostRegionId: 'intrinsic_collector_sic',
    hostSide: 'right',
    posUm: [0.22, -0.09, 0.0],
  },
];

/**
 * Embedded HICUM Circuit Components Positioned at Their Authoritative Sentaurus 3D Locations
 */
export const EMBEDDED_3D_COMPONENTS: Embedded3DComponentSpec[] = [
  {
    id: 're',
    symbolLabel: 'R_E',
    name: 'Emitter Series Resistance (R_E)',
    category: 'resistances',
    symbolType: 'resistor',
    spatialNature: 'localized',
    hostRegionId: 'emitter_poly_pedestal',
    hostSide: 'center',
    fromNodePinId: 'E',
    toNodePinId: "E'",
    symbolPosUm: [0.0, 0.19, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.8.1-1',
    physicalOriginNote:
      'Located vertically inside the n⁺ PolySilicon emitter pedestal (R.Emitter, X ∈ [−0.075, +0.075] μm, Y_sde ∈ [−0.30, −0.075] μm) between external contact E and mono-emitter window E\'.',
  },
  {
    id: 'rbx',
    symbolLabel: 'R_Bx',
    name: 'Extrinsic Base Series Resistance (R_Bx)',
    category: 'resistances',
    symbolType: 'resistor',
    spatialNature: 'distributed',
    hostRegionId: 'extrinsic_base_poly',
    hostSide: 'left',
    fromNodePinId: 'B',
    toNodePinId: 'B*',
    symbolPosUm: [-0.26, 0.11, 0.0],
    orientation: 'horizontal',
    wireWaypoints: [
      { posUm: [-0.34, 0.11, 0.0], hostRegionId: 'extrinsic_base_poly', hostSide: 'left' },
    ],
    primaryEquationId: 'eq-2.5.0-1',
    physicalOriginNote:
      'Located in the p⁺ extrinsic polysilicon base layer (R.Baseright, |X| ∈ [0.150, 0.450] μm) and link overlap dWb = 75 nm connecting base contact B to perimeter base node B*.',
  },
  {
    id: 'rbi',
    symbolLabel: 'R_bi*',
    name: 'Internal Base Sheet & Crowding Resistance (R_bi*)',
    category: 'resistances',
    symbolType: 'resistor',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_sige_base',
    hostSide: 'center',
    fromNodePinId: 'B*',
    toNodePinId: "B'",
    symbolPosUm: [-0.11, 0.024, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.5.1-1',
    physicalOriginNote:
      'Laterally distributed across the 75 nm p-SiGe base layer (R.SiGeBase) from the emitter window perimeter (B*) to the intrinsic base center (B\'); modulated by conductivity and emitter crowding.',
  },
  {
    id: 'crbi',
    symbolLabel: 'C_rBi',
    name: 'AC Base Crowding Shunt Capacitance (C_rBi)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_sige_base',
    hostSide: 'center',
    fromNodePinId: 'B*',
    toNodePinId: "B'",
    symbolPosUm: [-0.11, 0.056, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.5.3-1',
    physicalOriginNote:
      'Shunts R_bi* between B* and B\' inside R.SiGeBase to model high-frequency lateral AC current crowding (C_rBi = f_CrBi · C_i · Q_p0).',
  },
  {
    id: 'cbepar1',
    symbolLabel: 'C_BEpar',
    name: 'B-E Sidewall Spacer Parasitic Capacitance (C_BEpar)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'localized',
    hostRegionId: 'be_nitride_spacer',
    hostSide: 'left',
    fromNodePinId: 'B',
    toNodePinId: 'E',
    symbolPosUm: [-0.115, 0.22, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.8.3-1',
    physicalOriginNote:
      'Originates across the 75 nm Si₃N₄ nitride sidewall spacer separating the n⁺ poly-emitter pedestal (X = 0.075 μm) from the p⁺ extrinsic poly-base (X = 0.150 μm).',
  },
  {
    id: 'cjep',
    symbolLabel: 'Q_jEp',
    name: 'Perimeter B-E Depletion Charge & Capacitance (C_jEp)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'localized',
    hostRegionId: 'be_nitride_spacer',
    hostSide: 'left',
    fromNodePinId: 'B*',
    toNodePinId: "E'",
    symbolPosUm: [-0.135, 0.092, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.3.2-1',
    physicalOriginNote:
      'Localized at the peripheral B*-E\' junction corner beneath the nitride sidewall spacer at |X| ≈ 0.075–0.150 μm.',
  },
  {
    id: 'ibep',
    symbolLabel: 'i_jBEp',
    name: 'Perimeter B-E Junction Diode Current (i_jBEp)',
    category: 'currents',
    symbolType: 'diode',
    spatialNature: 'localized',
    hostRegionId: 'be_nitride_spacer',
    hostSide: 'left',
    fromNodePinId: 'B*',
    toNodePinId: "E'",
    symbolPosUm: [-0.088, 0.092, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.4.1-2',
    physicalOriginNote:
      'Hole injection and recombination diode along the emitter perimeter interface between B* and E\'.',
  },
  {
    id: 'ibet',
    symbolLabel: 'i_BEt',
    name: 'B-E Reverse Band-to-Band Tunneling Current (i_BEt)',
    category: 'currents',
    symbolType: 'tunnel_diode',
    spatialNature: 'localized',
    hostRegionId: 'be_nitride_spacer',
    hostSide: 'left',
    fromNodePinId: 'B*',
    toNodePinId: "E'",
    symbolPosUm: [-0.175, 0.095, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.9.0-1',
    physicalOriginNote:
      'Occurs at the heavily doped peripheral n⁺/p⁺ B-E junction (tunode=1 at B*-E\') under reverse B-E bias.',
  },
  {
    id: 'ibei',
    symbolLabel: 'i_jBEi',
    name: 'Internal B-E Diode Current (i_jBEi)',
    category: 'currents',
    symbolType: 'diode',
    spatialNature: 'distributed',
    hostRegionId: 'mono_emitter_window',
    hostSide: 'center',
    fromNodePinId: "B'",
    toNodePinId: "E'",
    symbolPosUm: [-0.042, 0.052, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.4.1-1',
    physicalOriginNote:
      'Intrinsic B\'-E\' junction injection and space-charge recombination across the mono-emitter window X ∈ [−0.075, +0.075] μm at Y_emi = −0.075 μm.',
  },
  {
    id: 'cjei',
    symbolLabel: 'Q_jEi',
    name: 'Internal B-E Depletion Charge & Capacitance (C_jEi)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'mono_emitter_window',
    hostSide: 'center',
    fromNodePinId: "B'",
    toNodePinId: "E'",
    symbolPosUm: [0.032, 0.052, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.3.1-1',
    physicalOriginNote:
      'Depletion charge stored in the intrinsic B\'-E\' space-charge layer between Impl.Emi and R.SiGeBase.',
  },
  {
    id: 'qf',
    symbolLabel: 'Q_f (τ_f)',
    name: 'Forward Minority Storage Charge & Transit Time (Q_f, τ_f)',
    category: 'charges',
    symbolType: 'charge_storage',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_sige_base',
    hostSide: 'center',
    fromNodePinId: "B'",
    toNodePinId: "E'",
    symbolPosUm: [0.068, 0.038, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.2.2-1',
    physicalOriginNote:
      'Total mobile minority charge stored across the neutral emitter (ΔQ_Ef), graded p-SiGe base (Q_Bf), and high-current Kirk collector push-out zone (ΔQ_fh).',
  },
  {
    id: 'it',
    symbolLabel: 'i_T (GICCR)',
    name: 'Transfer Current Source (i_T — Generalized Integral Charge-Control Relation)',
    category: 'currents',
    symbolType: 'current_source',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_collector_sic',
    hostSide: 'center',
    fromNodePinId: "E'",
    toNodePinId: "C'",
    symbolPosUm: [0.088, -0.055, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.2.0-1',
    physicalOriginNote:
      'Primary vertical electron transport stream injected at E\', accelerated by the 0→16% Ge drift field across the 75 nm R.SiGeBase, and swept through the n-SIC collector (C\').',
  },
  {
    id: 'cjci',
    symbolLabel: 'Q_jCi',
    name: 'Internal B-C Depletion Charge & Capacitance (C_jCi)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_collector_sic',
    hostSide: 'center',
    fromNodePinId: "B'",
    toNodePinId: "C'",
    symbolPosUm: [-0.072, -0.075, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.3.1-3',
    physicalOriginNote:
      'Intrinsic B\'-C\' depletion capacitance across the metallurgical interface Y_bas = 0.0 μm between R.SiGeBase and the n-SIC pedestal (Impl.Col).',
  },
  {
    id: 'ibci',
    symbolLabel: 'i_jBCi',
    name: 'Internal B-C Diode Current (i_jBCi)',
    category: 'currents',
    symbolType: 'diode',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_collector_sic',
    hostSide: 'center',
    fromNodePinId: "B'",
    toNodePinId: "C'",
    symbolPosUm: [-0.015, -0.075, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.4.2-1',
    physicalOriginNote:
      'Intrinsic base-collector junction diode across Y_bas = 0.0 μm (active in saturation and inverse operation).',
  },
  {
    id: 'iavl',
    symbolLabel: 'i_AVL',
    name: 'Collector-Base Impact Ionization Avalanche Current (i_AVL)',
    category: 'currents',
    symbolType: 'current_source',
    spatialNature: 'localized',
    hostRegionId: 'intrinsic_collector_sic',
    hostSide: 'center',
    fromNodePinId: "C'",
    toNodePinId: "B'",
    symbolPosUm: [0.038, -0.075, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.10.0-1',
    physicalOriginNote:
      'Generated in the high electric-field zone of the n-SIC collector pedestal (Impl.Col, Peak 10¹⁸ cm⁻³) near the B\'-C\' junction under high V_CB.',
  },
  {
    id: 'cjcx1',
    symbolLabel: 'Q_BCx1',
    name: 'Outer Extrinsic B-C Depletion Capacitance (C_jCx1)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'collector_epi_mesa',
    hostSide: 'left',
    fromNodePinId: 'B',
    toNodePinId: "C'",
    symbolPosUm: [-0.275, -0.085, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.6.0-1',
    physicalOriginNote:
      'Outer fraction (1 − f_BCpar) of the extrinsic base-collector and STI capacitance connected between external base node B and internal collector C\'.',
  },
  {
    id: 'cjcx2',
    symbolLabel: 'Q_BCx2',
    name: 'Inner Extrinsic B-C Depletion Capacitance (C_jCx2)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'collector_epi_mesa',
    hostSide: 'left',
    fromNodePinId: 'B*',
    toNodePinId: "C'",
    symbolPosUm: [-0.205, -0.085, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.6.0-2',
    physicalOriginNote:
      'Inner fraction (f_BCpar) of the extrinsic B-C depletion capacitance across the collector mesa periphery beneath B*.',
  },
  {
    id: 'ijbcx',
    symbolLabel: 'i_jBCx',
    name: 'Extrinsic Base-Collector Diode Current (i_jBCx)',
    category: 'currents',
    symbolType: 'diode',
    spatialNature: 'distributed',
    hostRegionId: 'collector_epi_mesa',
    hostSide: 'left',
    fromNodePinId: 'B*',
    toNodePinId: "C'",
    symbolPosUm: [-0.142, -0.085, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.4.2-2',
    physicalOriginNote:
      'Extrinsic B*-C\' junction diode across the outer active collector mesa periphery (|X| ∈ [0.150, 0.225] μm).',
  },
  {
    id: 'rcx',
    symbolLabel: 'R_Cx',
    name: 'External Collector Series Resistance (R_Cx — Buried Layer + Sinker)',
    category: 'resistances',
    symbolType: 'resistor',
    spatialNature: 'localized',
    hostRegionId: 'buried_subcollector',
    hostSide: 'right',
    fromNodePinId: "C'",
    toNodePinId: 'C',
    symbolPosUm: [0.52, -0.36, 0.0],
    orientation: 'horizontal',
    wireWaypoints: [
      { posUm: [0.0, -0.36, 0.0], hostRegionId: 'buried_subcollector', hostSide: 'center' },
      { posUm: [0.90, -0.36, 0.0], hostRegionId: 'buried_subcollector', hostSide: 'right' },
      { posUm: [0.90, -0.15, 0.0], hostRegionId: 'collector_sinker', hostSide: 'right' },
    ],
    primaryEquationId: 'eq-2.8.2-1',
    physicalOriginNote:
      'Lumped resistance combining the horizontal n⁺ buried subcollector sheet (Impl.SubCol at Y_sub = 0.30 μm), vertical n⁺ collector sinker plug (Impl.ColCont at X ∈ [0.70, 1.10] μm), and Al contact R.CollectorCont.',
  },
  {
    id: 'its',
    symbolLabel: 'i_TS',
    name: 'Parasitic Substrate PNP Transfer Current (i_TS)',
    category: 'currents',
    symbolType: 'current_source',
    spatialNature: 'distributed',
    hostRegionId: 'buried_subcollector',
    hostSide: 'left',
    fromNodePinId: 'B*',
    toNodePinId: "S'",
    symbolPosUm: [-0.175, -0.32, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.11.0-1',
    physicalOriginNote:
      'Parasitic p-n-p transistor transfer current from the p⁺ extrinsic base (B*), across the n-collector/buried layer (C\'), into the p⁻ silicon substrate (S\') when B-C is forward biased.',
  },
  {
    id: 'cjs',
    symbolLabel: 'Q_jS',
    name: 'Collector-Substrate Depletion Capacitance (C_jS)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'localized',
    hostRegionId: 'p_substrate_bulk',
    hostSide: 'left',
    fromNodePinId: "C'",
    toNodePinId: "S'",
    symbolPosUm: [-0.34, -0.43, 0.0],
    orientation: 'vertical',
    wireWaypoints: [
      { posUm: [-0.34, -0.36, 0.0], hostRegionId: 'buried_subcollector', hostSide: 'left' },
    ],
    primaryEquationId: 'eq-2.11.0-2',
    physicalOriginNote:
      'Depletion capacitance at the bottom metallurgical junction between the n⁺ buried subcollector (Impl.SubCol) and the p⁻ silicon substrate (R.Substrate).',
  },
  {
    id: 'ijsc',
    symbolLabel: 'i_jSC',
    name: 'Substrate-Collector Junction Diode (i_jSC)',
    category: 'currents',
    symbolType: 'diode',
    spatialNature: 'localized',
    hostRegionId: 'p_substrate_bulk',
    hostSide: 'left',
    fromNodePinId: "S'",
    toNodePinId: "C'",
    symbolPosUm: [-0.26, -0.43, 0.0],
    orientation: 'vertical',
    primaryEquationId: 'eq-2.11.0-3',
    physicalOriginNote:
      'p⁻ substrate to n⁺ buried subcollector p-n junction diode between S\' and C\'.',
  },
  {
    id: 'rsu',
    symbolLabel: 'R_su',
    name: 'Substrate Bulk Spreading Resistance (R_su)',
    category: 'resistances',
    symbolType: 'resistor',
    spatialNature: 'distributed',
    hostRegionId: 'p_substrate_bulk',
    hostSide: 'center',
    fromNodePinId: "S'",
    toNodePinId: 'S',
    symbolPosUm: [0.08, -0.55, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.12.0-1',
    physicalOriginNote:
      'Distributed 3D ohmic spreading resistance through the lightly doped p⁻ silicon wafer (10¹⁵ cm⁻³) between internal substrate node S\' and bottom contact S.',
  },
  {
    id: 'csu',
    symbolLabel: 'C_su',
    name: 'Substrate Dielectric Permittivity Capacitance (C_su)',
    category: 'capacitances',
    symbolType: 'capacitor',
    spatialNature: 'distributed',
    hostRegionId: 'p_substrate_bulk',
    hostSide: 'center',
    fromNodePinId: "S'",
    toNodePinId: 'S',
    symbolPosUm: [0.08, -0.48, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.12.0-1',
    physicalOriginNote:
      'Silicon permittivity capacitance shunting R_su across the p⁻ substrate wafer between S\' and S.',
  },
  {
    id: 'rth',
    symbolLabel: 'R_th || C_th',
    name: 'Thermal Self-Heating Impedance Network (R_th, C_th → ΔT_j)',
    category: 'charges',
    symbolType: 'thermal_rc',
    spatialNature: 'distributed',
    hostRegionId: 'intrinsic_collector_sic',
    hostSide: 'right',
    fromNodePinId: "C'",
    toNodePinId: 'T',
    symbolPosUm: [0.22, -0.09, 0.0],
    orientation: 'horizontal',
    primaryEquationId: 'eq-2.13.0-1',
    physicalOriginNote:
      'Joule heat dissipation P_diss = i_T·v_C\'E\' + ... peaks in the high-field n-SIC collector and spreads outward through the silicon mesa and STI trenches (modeled by R_th and C_th at node T).',
  },
];

/**
 * Helper to compute the displaced 3D position [x_um, y_up_um, z_extrude_um] of any point
 * anchored to (regionId, side) at a given explodeFactor in [0, 1].
 */
export function getExplodedPointUm(
  basePosUm: [number, number, number],
  regionId: string,
  side: 'left' | 'right' | 'center',
  explodeFactor: number
): [number, number, number] {
  const reg = SENTAURUS_3D_REGIONS.find((r) => r.id === regionId);
  if (!reg || explodeFactor <= 0) return basePosUm;
  const [ex, ey, ez] = reg.explodeVectorUm;
  const sideSign = side === 'left' ? -1 : side === 'right' ? 1 : 0;
  return [
    basePosUm[0] + ex * sideSign * explodeFactor,
    basePosUm[1] + ey * explodeFactor,
    basePosUm[2] + ez * explodeFactor,
  ];
}
