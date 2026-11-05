export type ParameterSectionId =
  | '3.1'
  | '3.2'
  | '3.3'
  | '3.4'
  | '3.5'
  | '3.6'
  | '3.7'
  | '3.8'
  | '3.9'
  | '3.10'
  | '3.11'
  | '3.12'
  | '3.13'
  | '3.14'
  | '3.15'
  | '3.16'
  | '3.17';

export type PlotCategoryId =
  | 'transfer_gummel'
  | 'critical_current'
  | 'transit_time_ft'
  | 'depletion_cap'
  | 'base_resistance'
  | 'breakdown_tunneling'
  | 'temperature_selfheating'
  | 'noise_nqs_substrate';

export type SpatialNature =
  | 'localized'
  | 'distributed'
  | 'conceptual'
  | 'flag';

export type SubsystemCategory =
  | 'intrinsic_transfer'
  | 'intrinsic_be'
  | 'intrinsic_bc'
  | 'minority_charge'
  | 'depletion_charge'
  | 'base_resistance'
  | 'external_be_bc'
  | 'parasitic_isolation'
  | 'breakdown_tunneling'
  | 'substrate_network'
  | 'thermal_selfheating'
  | 'nqs_effects'
  | 'noise_correlation'
  | 'temperature_scaling'
  | 'simulator_control';

export interface HicumParameter {
  id: string; // e.g., 'c10', 'qp0', 'rbi0'
  tableNo: number; // number within its section table in Chapter 3
  name: string; // canonical lowercase name in VA / manual
  symbolLatex: string; // e.g., 'c_{10}', 'Q_{p0}', 'r_{Bi0}'
  section: ParameterSectionId;
  sectionTitle: string;
  subsystem: SubsystemCategory;
  description: string; // concise manual table description
  defaultValue: number;
  defaultDisplay: string; // e.g. '2E-30 (1E-16)'
  testValue: number; // exact value from "test" column in Manual Tables 3.1-3.17
  testDisplay: string;
  rangeStr: string; // e.g., '[0:1]', '(0:inf)'
  unit: string; // e.g., 'A^2s', 'C', 'Ohm', 'F', 's', 'V', '1/K', '-'
  mFactor: string; // e.g., 'M^2', 'M', '1/M', 'M^(1-AF)', '-'
  vaLine: number; // exact line in hicumL2V2p34.va.txt
  manualPages: number[]; // pages in hicum_L2V2p4p0_manual.pdf
  circuitElements: string[]; // IDs of CircuitElement
  equations: string[]; // IDs of HicumEquation
  plotCategory: PlotCategoryId;
  physicalMeaning: string; // comprehensive physical explanation from manual
  operationEffect: string; // how varying this parameter affects device behavior & curves
  spatialNature: SpatialNature;
  physicalRegion: string; // e.g., 'Intrinsic Base (Neutral Base under Emitter Window)'
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  isLogScale?: boolean;
  isFlag?: boolean;
  flagOptions?: { value: number; label: string }[];
}

export interface EquationVariable {
  symbolLatex: string;
  meaning: string;
  unit?: string;
  linkedParamId?: string;
}

export interface HicumEquation {
  id: string; // e.g., 'eq-2.2.0-1'
  eqNumber: string; // e.g., '(2.2.0-1)'
  title: string;
  section: string; // e.g., '2.2 Quasi-static transfer current'
  sectionId: string; // e.g., '2.2'
  manualPage: number;
  vaReference: string; // e.g., 'Lines 1448–1596 (Model_evaluation / HICCR)'
  latex: string;
  isBoxedImplemented: boolean; // Marked by frame in manual as implemented in VA
  summary: string;
  physicalDerivation: string;
  variables: EquationVariable[];
  parameters: string[]; // parameter IDs
  circuitElements: string[]; // circuit element IDs
  plotCategory: PlotCategoryId;
}

export interface CircuitNode {
  id: string; // 'B', 'B*', 'B\'', 'C', 'C\'', 'E', 'E\'', 'S', 'S\'', 'T'
  vaName: string; // 'b', 'bp', 'bi', 'c', 'ci', 'e', 'ei', 's', 'si', 'tnode'
  label: string;
  isExternal: boolean;
  x: number;
  y: number;
  physicalLocation: string;
  description: string;
}

export interface CircuitElement {
  id: string; // e.g., 'it', 'ibei', 'rbi', 'cjei', 'qf', etc.
  symbol: string; // e.g., 'i_T', 'R_{bi}^*', '\dot{Q}_{jEi}'
  symbolLatex: string;
  name: string;
  type: 'current_source' | 'diode' | 'capacitor' | 'resistor' | 'thermal' | 'nqs' | 'noise';
  network: 'main' | 'thermal' | 'nqs' | 'noise';
  fromNode: string;
  toNode: string;
  vaBranch: string; // e.g., 'br_ciei', 'br_bpbi_i', 'br_biei'
  vaLines: string; // e.g., '1815–1818'
  manualSection: string; // e.g., 'Section 2.2'
  subsystem: SubsystemCategory;
  plotCategory: PlotCategoryId;
  summary: string;
  physicalDescription: string;
  governingEquations: string[]; // equation IDs
  parameters: string[]; // parameter IDs
  physicalRegion: string;
  spatialNature: SpatialNature;
}

export interface OperatingPointSpec {
  id: string; // e.g., 'IB', 'IC', 'BETADC', 'GMi', 'FT'
  symbolLatex: string;
  unit: string;
  description: string;
  definitionLatex: string;
  vaLine: number;
  manualPage: number;
  category: 'terminal_dc' | 'small_signal_conductance' | 'small_signal_capacitance' | 'resistance' | 'figure_of_merit' | 'thermal';
}

export interface PhysicalMechanismGuide {
  id: string;
  title: string;
  manualSections: string[];
  manualPages: string;
  plotCategory: PlotCategoryId;
  keyParameters: string[];
  keyEquations: string[];
  circuitElements: string[];
  overview: string;
  physicalInsight: string;
  sgpmComparison: string; // How HICUM/L2 improves over SPICE Gummel-Poon (SGPM)
  spatialLocalization: string;
}

export interface BiasState {
  Vbe: number;
  Vce: number;
  Vsc: number;
  Tamb: number;
}

export interface OperatingPointResult {
  Ib: number;
  Ic: number;
  Is: number;
  Iavl: number;
  Betadc: number;
  Gmi: number;
  Rbi: number;
  Tf: number;
  Ft: number;
  Fmax: number;
  Tk: number;
  Dtsh: number;
  Ick: number;
  QpT: number;
  Qf: number;
  Cjei: number;
  Cjci: number;
  opMap: Record<string, number>;
  branchCurrents: Record<string, number>;
  branchCharges: Record<string, number>;
  nodeVoltages: Record<string, number>;
}

export interface PlotPoint {
  x: number;
  y: number;
  yBaseline?: number;
}

export interface PlotSeries {
  id: string;
  label: string;
  unit?: string;
  color: string;
  dashed?: boolean;
  description?: string;
  points: PlotPoint[];
}

export interface PlotDataset {
  category: PlotCategoryId;
  title: string;
  subtitle: string;
  xLabel: string;
  xUnit: string;
  yLabel: string;
  yUnit: string;
  xLogDefault?: boolean;
  yLogDefault?: boolean;
  series: PlotSeries[];
}

export interface PlotCategoryDefinition {
  id: PlotCategoryId;
  shortTitle: string;
  title: string;
  subtitle: string;
}

export const PLOT_CATEGORY_DEFINITIONS: PlotCategoryDefinition[] = [
  {
    id: 'transfer_gummel',
    shortTitle: 'Gummel & Gain (iT, iB, β)',
    title: 'Forward Gummel Characteristics & Current Gain (GICCR)',
    subtitle: 'Collector transfer current iT, base components iBEi/iBEp, and DC current gain βDC vs. VBE',
  },
  {
    id: 'critical_current',
    shortTitle: 'Output & Critical Current ICK',
    title: 'Collector Output Family & Kirk Critical Current ICK(VC\'E\')',
    subtitle: 'Quasi-saturation knee, Early slope via hjci·QjCi, and Kirk critical current onset ICK',
  },
  {
    id: 'transit_time_ft',
    shortTitle: 'Transit Time τf & fT / fmax',
    title: 'Transit Time Components τf(IC) & Cutoff Frequencies fT / fmax',
    subtitle: 'Low-current τf0, high-current Kirk base widening Δτfh, emitter storage ΔτEf, and RF fT/fmax roll-off',
  },
  {
    id: 'depletion_cap',
    shortTitle: 'Depletion Capacitances Cj(V)',
    title: 'Junction Depletion Capacitances CjEi, CjEp, CjCi, CjCx, CjS vs. Voltage',
    subtitle: 'Forward-bias hyperbolic peak limiting (aj·Cj0) and reverse collector epitaxial punch-through (vptci)',
  },
  {
    id: 'base_resistance',
    shortTitle: 'Base Resistance rBi* & CrBi',
    title: 'Internal Base Resistance Conductivity Modulation & Emitter Crowding',
    subtitle: 'Pinch-base resistance rBi*(VBE), total RB = rBi* + rBx, crowding factor ψ(η), and AC shunt CrBi',
  },
  {
    id: 'breakdown_tunneling',
    shortTitle: 'Avalanche iAVL & Tunneling iBEt',
    title: 'Base-Collector Impact Ionization (iAVL) & B-E Band-to-Band Tunneling (iBEt)',
    subtitle: 'High-field BC multiplication factor iAVL/iTf vs. VCB and reverse emitter-base Zener tunneling current',
  },
  {
    id: 'temperature_selfheating',
    shortTitle: 'Temperature & Self-Heating ΔTj',
    title: 'Temperature Scaling (200 K – 500 K) & Electrothermal Self-Heating',
    subtitle: 'Bandgap Vg(T), zero-bias hole charge Qp0(T), transit time τ0(T), series resistances, and ΔTj = Rth·Pdiss',
  },
  {
    id: 'noise_nqs_substrate',
    shortTitle: 'NQS, Correlated Noise & Substrate',
    title: 'Vertical NQS Phase Delay, Correlated HF Noise & Substrate Coupling',
    subtitle: 'Bessel NQS excess phase |Y21|, correlated vs. uncorrelated NFmin(f), and substrate network loss',
  },
];

