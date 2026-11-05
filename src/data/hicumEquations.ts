import { HicumEquation, PlotCategoryId } from './hicumTypes';

export interface EquationSectionMeta {
  id: string;
  title: string;
  label: string;
  manualPages: string;
  description: string;
  plotCategory: PlotCategoryId;
}

export const EQUATION_SECTIONS: EquationSectionMeta[] = [
  {
    id: '2.1',
    title: '2.1 Equivalent Circuit & Physical Partitioning',
    label: '2.1 Equivalent Circuit',
    manualPages: 'pp. 7–9 (Fig. 2.1.0/1 on p. 8)',
    description:
      'Lumped large-signal topology separating the 1D intrinsic transistor under the emitter window from peripheral/extrinsic regions, lateral base distribution (B, B*, B\'), substrate coupling, and self-heating.',
    plotCategory: 'transfer_gummel',
  },
  {
    id: '2.2',
    title: '2.2 Quasi-Static Transfer Current (GICCR)',
    label: '2.2 Transfer Current (GICCR)',
    manualPages: 'pp. 9–17',
    description:
      'Generalized Integral Charge-Control Relation (GICCR) linking collector transfer current to the bias- and bandgap-weighted total hole charge Qp,T, with HBT weighting factors and 2D/3D high-current spreading.',
    plotCategory: 'transfer_gummel',
  },
  {
    id: '2.3',
    title: '2.3 Minority Charge, Transit Times & Diffusion Capacitances',
    label: '2.3 Minority Charge & Transit Time',
    manualPages: 'pp. 18–31',
    description:
      'Bias- and current-dependent forward transit time τf and minority charge Qf across low, medium, and high current densities (Kirk effect ICK, neutral emitter storage, BC heterojunction barrier, and inverse charge Qr).',
    plotCategory: 'transit_time_ft',
  },
  {
    id: '2.4',
    title: '2.4 Depletion Charges & Capacitances',
    label: '2.4 Depletion Capacitances',
    manualPages: 'pp. 32–41',
    description:
      'Internal, peripheral, and external junction depletion charges and capacitances with smooth forward-bias peak limiting (QJMODF) and reverse-bias epitaxial collector/substrate punch-through (QJMOD).',
    plotCategory: 'depletion_cap',
  },
  {
    id: '2.5',
    title: '2.5 Static Base Current Components',
    label: '2.5 Junction Diode Currents',
    manualPages: 'pp. 42–44',
    description:
      'Internal and peripheral B-E injection and space-charge recombination currents, internal/external B-C diode currents, and excess recombination at the B-C heterojunction barrier.',
    plotCategory: 'transfer_gummel',
  },
  {
    id: '2.6',
    title: '2.6 Internal Base Resistance',
    label: '2.6 Internal Base Resistance',
    manualPages: 'pp. 45–49',
    description:
      'Conductivity modulation by depletion and minority charges, DC/low-frequency emitter current crowding ψ(η), and dynamic reduction by peripheral forward minority charge.',
    plotCategory: 'base_resistance',
  },
  {
    id: '2.7',
    title: '2.7 External (Parasitic) Bias-Independent Capacitances',
    label: '2.7 Parasitic Capacitances',
    manualPages: 'pp. 50–53',
    description:
      'Oxide overlap and contact metallization parasitic capacitances CBEpar and CBCpar and their physical splitting across the external base resistance rBx.',
    plotCategory: 'depletion_cap',
  },
  {
    id: '2.8',
    title: '2.8 External Series Resistances',
    label: '2.8 External Resistances',
    manualPages: 'pp. 54–56',
    description:
      'Physical composition of bias-independent extrinsic base resistance rBx, external collector resistance rCx (buried layer, sinker, contact), and emitter series resistance rE.',
    plotCategory: 'base_resistance',
  },
  {
    id: '2.9',
    title: '2.9 Non-Quasi-Static (NQS) Effects',
    label: '2.9 NQS Effects',
    manualPages: 'pp. 57–59',
    description:
      'Vertical NQS excess delay in transfer current iTf (2nd-order Bessel LCR network) and minority charge Qf (1st-order RC network), plus lateral NQS AC current crowding shunt capacitance CrBi.',
    plotCategory: 'noise_nqs_substrate',
  },
  {
    id: '2.10',
    title: '2.10 Breakdown & Band-to-Band Tunneling',
    label: '2.10 Breakdown & Tunneling',
    manualPages: 'pp. 60–64',
    description:
      'Weak collector-base avalanche impact ionization iAVL driven by CjCi-dependent electric field, and reverse B-E band-to-band tunneling current iBEt in heavily doped junctions.',
    plotCategory: 'breakdown_tunneling',
  },
  {
    id: '2.12',
    title: '2.11–2.12 Substrate Network & Parasitic Substrate Transistor',
    label: '2.11–2.12 Substrate Network',
    manualPages: 'pp. 65–68',
    description:
      'Simplified GICCR transfer current iTS of the parasitic p-n-p (or n-p-n) substrate transistor (B*-C\'-S\'), C-S junction diode and depletion capacitances, and intra-device substrate RC coupling.',
    plotCategory: 'noise_nqs_substrate',
  },
  {
    id: '2.13',
    title: '2.13 Noise Model & HF Shot Noise Correlation',
    label: '2.13 Noise & Correlation',
    manualPages: 'pp. 69–72',
    description:
      'Resistor thermal noise, junction shot noise, 1/f flicker noise at B-E junctions and emitter polysilicon resistance, and correlated high-frequency base/collector shot noise via base transit delay.',
    plotCategory: 'noise_nqs_substrate',
  },
  {
    id: '2.14',
    title: '2.14 Temperature Dependence',
    label: '2.14 Temperature Scaling',
    manualPages: 'pp. 73–92',
    description:
      'Nonlinear temperature-dependent bandgap Vg(T), intrinsic carrier concentration nie(T), GICCR and HBT charge weights, saturation currents, collector transport, depletion capacitances (TMPHICJ), and resistances.',
    plotCategory: 'temperature_selfheating',
  },
  {
    id: '2.15',
    title: '2.15 Self-Heating & Electro-Thermal Network',
    label: '2.15 Self-Heating',
    manualPages: 'p. 93 (ll. 1–24)',
    description:
      'Dissipated electrical power P (flsh=1 intrinsic vs flsh=2 full device) injected into the thermal RC network (Rth(T), Cth) at node T to compute local junction temperature Tdev.',
    plotCategory: 'temperature_selfheating',
  },
  {
    id: '2.16',
    title: '2.16 Lateral Scaling & 2D/3D Collector Current Spreading',
    label: '2.16 Lateral Scaling',
    manualPages: 'pp. 94–99',
    description:
      'Multi-dimensional lateral widening of the collector current tube at high injection (Kirk regime) parameterized by emitter width/length scaling slopes ζb (latb) and ζl (latl), plus emitter current crowding.',
    plotCategory: 'critical_current',
  },
  {
    id: '4.0',
    title: '4.0 Operating Point Information from Circuit Simulators',
    label: '4.0 Operating Point & fT',
    manualPages: 'pp. 113–115',
    description:
      'Linearized small-signal hybrid-π conductances, capacitances, current gains (βDC, βAC), total base resistance RB, and cutoff frequency fT calculated in the OPERATING_POINT block.',
    plotCategory: 'transit_time_ft',
  },
];

export const HICUM_EQUATIONS: HicumEquation[] = [
  {
    id: 'eq-2.2.0-1',
    eqNumber: '(2.2.0-1)',
    title: '1D Generalized Integral Charge-Control Relation (GICCR)',
    section: '2.2 Quasi-Static Transfer Current (GICCR)',
    sectionId: '2.2',
    manualPage: 9,
    manualLines: 'p. 9, l. 20 (Ch. 2.2, ll. 15–26)',
    vaReference: 'Lines 1448–1596 (Model_evaluation / HICCR)',
    latex:
      'i_T = \\frac{c_{10}}{Q_{p,T}} \\left[ \\exp\\left(\\frac{v_{B\'E\'}}{m_{Cf} V_T}\\right) - \\exp\\left(\\frac{v_{B\'C\'}}{V_T}\\right) \\right] = i_{Tf1} - i_{Tr}',
    isBoxedImplemented: true,
    summary:
      'Fundamental 1D transfer current equation relating collector-emitter electron transport to the reciprocal of the modified weighted hole charge Qp,T.',
    physicalDerivation:
      'Derived by integrating the 1D drift-diffusion electron current density across the base and collector space-charge regions assuming quasi-Fermi potential splitting at the intrinsic B\'E\' and B\'C\' terminals. Unlike the SPICE Gummel-Poon Model (SGPM), HICUM incorporates spatial variations in bandgap (heterojunctions), effective density of states, and mobility via discrete physical weighting factors on each charge component.',
    variables: [
      { symbolLatex: 'i_T', meaning: 'Total internal collector-emitter transfer current', unit: 'A' },
      { symbolLatex: 'c_{10}', meaning: 'Temperature-scaled GICCR prefactor constant', unit: 'A^2s', linkedParamId: 'c10' },
      { symbolLatex: 'Q_{p,T}', meaning: 'Total modified weighted hole charge driving GICCR', unit: 'C' },
      { symbolLatex: 'v_{B\'E\'}', meaning: 'Intrinsic base-emitter junction voltage V(bi,ei)', unit: 'V' },
      { symbolLatex: 'v_{B\'C\'}', meaning: 'Intrinsic base-collector junction voltage V(bi,ci)', unit: 'V' },
      { symbolLatex: 'm_{Cf}', meaning: 'Non-ideality factor for III-V HBTs (1.0 for Si/SiGe)', unit: '-', linkedParamId: 'mcf' },
      { symbolLatex: 'V_T', meaning: 'Thermal voltage k_B T / q', unit: 'V' },
    ],
    parameters: ['c10', 'qp0', 'mcf'],
    circuitElements: ['it'],
    plotCategory: 'transfer_gummel',
  },
  {
    id: 'eq-2.2.0-2',
    eqNumber: '(2.2.0-2)',
    title: 'Physical Definition of the GICCR Constant c10',
    section: '2.2 Quasi-Static Transfer Current (GICCR)',
    sectionId: '2.2',
    manualPage: 9,
    manualLines: 'p. 9, l. 22 (Ch. 2.2, ll. 18–26)',
    vaReference: 'Line 663, 1105, 1324 (c10_t initialization)',
    latex:
      'c_{10} = (q A_{E0})^2 V_T \\overline{\\mu_{nB} n_{iB}^2}',
    isBoxedImplemented: false,
    summary:
      'Links the macroscopic GICCR model parameter c10 to the effective emitter window area AE0, electron mobility μnB, and intrinsic carrier density niB in the neutral base.',
    physicalDerivation:
      'Obtained by normalizing the spatial integral of reciprocal electron conductivity (1 / (q μn ni^2)) over the neutral base width wB0 by the zero-bias hole charge Qp0 = q AE0 integral(p0 dx). Because c10 scales quadratically with emitter window area AE0 (M^2) while Qp0 scales linearly (M), their ratio c10/Qp0 scales linearly with device area AE0.',
    variables: [
      { symbolLatex: 'c_{10}', meaning: 'GICCR constant at nominal temperature', unit: 'A^2s', linkedParamId: 'c10' },
      { symbolLatex: 'q', meaning: 'Elementary charge (1.602e-19 C)', unit: 'C' },
      { symbolLatex: 'A_{E0}', meaning: 'Effective intrinsic emitter window area', unit: 'm^2' },
      { symbolLatex: '\\overline{\\mu_{nB} n_{iB}^2}', meaning: 'Spatially averaged product of base electron mobility and squared intrinsic density', unit: 'm^{-4}V^{-1}s^{-1}' },
    ],
    parameters: ['c10', 'vgb', 'zetact'],
    circuitElements: ['it'],
    plotCategory: 'transfer_gummel',
  },
  {
    id: 'eq-2.2.0-3',
    eqNumber: '(2.2.0-3)',
    title: 'Modified Weighted Total Hole Charge Qp,T',
    section: '2.2 Quasi-Static Transfer Current (GICCR)',
    sectionId: '2.2',
    manualPage: 10,
    manualLines: 'p. 10, l. 4 (Ch. 2.2, ll. 1–13)',
    vaReference: 'Lines 1475–1566 (Q_0, Q_pT in HICCR)',
    latex:
      'Q_{p,T} = Q_{p0} + h_{jEi}(v_{B\'E\'}) Q_{jEi} + h_{jCi} Q_{jCi} + Q_{f,T} + Q_{r,T}',
    isBoxedImplemented: true,
    summary:
      'Total weighted hole charge in the GICCR denominator combining zero-bias base charge, weighted B-E and B-C depletion charges, and weighted forward/reverse minority charges.',
    physicalDerivation:
      'Charge neutrality in the intrinsic transistor requires that changes in depletion charges QjEi and QjCi and mobile electron minority charges Qf and Qr are balanced by majority holes entering through the base contact. In hetero-bipolar transistors (SiGe or III-V HBTs), grading of Ge/Al mole fraction across the junctions alters the local weight of each region in the GICCR integral, captured by hjEi, hjCi, and Qf,T.',
    variables: [
      { symbolLatex: 'Q_{p,T}', meaning: 'Modified total weighted hole charge', unit: 'C' },
      { symbolLatex: 'Q_{p0}', meaning: 'Zero-bias hole charge in the neutral base', unit: 'C', linkedParamId: 'qp0' },
      { symbolLatex: 'h_{jEi}', meaning: 'Bias-dependent B-E depletion charge weight factor', unit: '-', linkedParamId: 'hjei' },
      { symbolLatex: 'Q_{jEi}', meaning: 'Internal B-E depletion charge', unit: 'C' },
      { symbolLatex: 'h_{jCi}', meaning: 'Internal B-C depletion charge weight factor', unit: '-', linkedParamId: 'hjci' },
      { symbolLatex: 'Q_{jCi}', meaning: 'Internal B-C depletion charge', unit: 'C' },
      { symbolLatex: 'Q_{f,T}', meaning: 'Weighted forward minority charge for GICCR', unit: 'C' },
      { symbolLatex: 'Q_{r,T}', meaning: 'Reverse minority diffusion charge (Qr,T = Qr = τr iTr)', unit: 'C' },
    ],
    parameters: ['qp0', 'hjei', 'ahjei', 'rhjei', 'hjci'],
    circuitElements: ['it', 'cjei', 'cjci', 'qf', 'qr'],
    plotCategory: 'transfer_gummel',
  },
  {
    id: 'eq-2.2.0-8',
    eqNumber: '(2.2.0-8)',
    title: 'Weighted Forward Minority Charge in HBTs (Qf,T)',
    section: '2.2 Quasi-Static Transfer Current (GICCR)',
    sectionId: '2.2',
    manualPage: 12,
    manualLines: 'p. 12, l. 1 (Ch. 2.2, ll. 1–7)',
    vaReference: 'Lines 528–532 (Macro HICQFF)',
    latex:
      'Q_{f,T} = h_{f0} Q_{f0} + h_{fE} \\Delta Q_{Ef} + \\Delta Q_{Bf} + h_{fC} \\Delta Q_{Cf,T}',
    isBoxedImplemented: true,
    summary:
      'Partitions the forward minority charge entering the GICCR denominator into separately weighted low-current base, neutral emitter, high-current base, and collector components.',
    physicalDerivation:
      'While the terminal dynamic capacitor Qdei integrates the unweighted physical charge Qf = Qf0 + ΔQEf + ΔQBf + ΔQCf (required for charge conservation), the GICCR integral weights each spatial sub-region by the ratio of its local intrinsic carrier density and mobility to the neutral base reference. This decouples the high-current roll-off of DC collector current (gm, βDC) from the transit time roll-off (fT).',
    variables: [
      { symbolLatex: 'Q_{f,T}', meaning: 'GICCR-weighted forward minority charge', unit: 'C' },
      { symbolLatex: 'h_{f0}', meaning: 'Weight factor for low-current minority charge Qf0', unit: '-', linkedParamId: 'hf0' },
      { symbolLatex: 'Q_{f0}', meaning: 'Low-current forward minority charge τf0 iTf', unit: 'C' },
      { symbolLatex: 'h_{fE}', meaning: 'Emitter minority charge weighting factor in HBTs', unit: '-', linkedParamId: 'hfe' },
      { symbolLatex: '\\Delta Q_{Ef}', meaning: 'Neutral emitter minority storage charge', unit: 'C' },
      { symbolLatex: '\\Delta Q_{Bf}', meaning: 'High-current excess base minority charge (barrier + Kirk)', unit: 'C' },
      { symbolLatex: 'h_{fC}', meaning: 'Collector minority charge weighting factor in HBTs', unit: '-', linkedParamId: 'hfc' },
      { symbolLatex: '\\Delta Q_{Cf,T}', meaning: 'High-current collector minority charge (including 2D/3D spreading)', unit: 'C' },
    ],
    parameters: ['hf0', 'hfe', 'hfc', 'fthc'],
    circuitElements: ['it', 'qf'],
    plotCategory: 'transfer_gummel',
  },
  {
    id: 'eq-2.2.0-10',
    eqNumber: '(2.2.0-10)',
    title: 'Bias-Dependent B-E Depletion Charge Weight Factor hjEi(vB\'E\')',
    section: '2.2 Quasi-Static Transfer Current (GICCR)',
    sectionId: '2.2',
    manualPage: 12,
    manualLines: 'p. 12, ll. 12–17 (Eqs. 2.2.0-10 & 2.2.0-11)',
    vaReference: 'Lines 1455–1465 (hjei_vbe in HICCR)',
    latex:
      'h_{jEi}(v_{B\'E\'}) = h_{jEi0} \\frac{\\exp(u) - 1}{u}, \\quad u = a_{hjEi}\\left[1 - \\left(1 - \\frac{v_j}{V_{DEi}}\\right)^{z_{Ei}}\\right]',
    isBoxedImplemented: true,
    summary:
      'Models the spatial variation of the Ge/bandgap profile near the B-E space-charge region boundary as the depletion width modulates with forward bias vB\'E\'.',
    physicalDerivation:
      'In SiGe HBTs with a graded Ge profile ramping up inside the B-E depletion region, the effective GICCR weight of the B-E depletion charge QjEi is not constant from reverse to medium forward bias. Using the normalized depletion width (1 - vj/VDEi)^zEi and an exponential bandgap ramp factor ahjEi accurately reproduces the transconductance gm(VBE) and output conductance in the low-to-medium current regime.',
    variables: [
      { symbolLatex: 'h_{jEi}(v_{B\'E\'})', meaning: 'Bias-dependent B-E depletion charge weight factor', unit: '-' },
      { symbolLatex: 'h_{jEi0}', meaning: 'Zero-bias B-E depletion charge weight factor', unit: '-', linkedParamId: 'hjei' },
      { symbolLatex: 'a_{hjEi}', meaning: 'Slope parameter for bias dependence of hjEi', unit: '-', linkedParamId: 'ahjei' },
      { symbolLatex: 'v_j', meaning: 'Smoothed junction voltage limited below VDEi via rhjei', unit: 'V', linkedParamId: 'rhjei' },
      { symbolLatex: 'V_{DEi}', meaning: 'Internal B-E built-in potential', unit: 'V', linkedParamId: 'vdei' },
      { symbolLatex: 'z_{Ei}', meaning: 'Internal B-E grading coefficient', unit: '-', linkedParamId: 'zei' },
    ],
    parameters: ['hjei', 'ahjei', 'rhjei', 'vdei', 'zei'],
    circuitElements: ['it', 'cjei'],
    plotCategory: 'transfer_gummel',
  },
  {
    id: 'eq-2.2.0-21',
    eqNumber: '(2.2.0-21)',
    title: 'Final Transfer Current with 2D/3D High-Current Collector Spreading',
    section: '2.2 Quasi-Static Transfer Current (GICCR)',
    sectionId: '2.2',
    manualPage: 15,
    manualLines: 'p. 15, l. 14 (Ch. 2.2, ll. 11–18)',
    vaReference: 'Lines 1530–1533, 1580–1583, 1596',
    latex:
      'i_{Tf} = i_{Tf1}\\left(1 + \\frac{i_{Tf1}}{I_{Ch}}\\right), \\quad i_{Tf1} = \\frac{c_{10}}{Q_{p,T}}\\exp\\left(\\frac{v_{B\'E\'}}{m_{Cf}V_T}\\right), \\quad i_T = i_{Tf} - i_{Tr}',
    isBoxedImplemented: true,
    summary:
      'Applies a high-current correction factor ICh to the 1D forward transfer current iTf1 to account for multi-dimensional collector current spreading.',
    physicalDerivation:
      'At high collector current densities in narrow-emitter devices, lateral expansion of the electron current tube in the collector reduces the effective current density relative to a purely 1D model. The parameter ICh (where 0 denotes infinity/disabled in Verilog-A) provides a compact second-order correction to the forward transfer current iTf.',
    variables: [
      { symbolLatex: 'i_{Tf}', meaning: 'Corrected forward transfer current', unit: 'A' },
      { symbolLatex: 'i_{Tf1}', meaning: '1D GICCR forward transfer current', unit: 'A' },
      { symbolLatex: 'I_{Ch}', meaning: 'High-current correction parameter for 2D/3D effects', unit: 'A', linkedParamId: 'ich' },
      { symbolLatex: 'i_{Tr}', meaning: 'Reverse transfer current c10 exp(vB\'C\'/VT) / Qp,T', unit: 'A' },
    ],
    parameters: ['ich', 'c10', 'qp0', 'mcf'],
    circuitElements: ['it'],
    plotCategory: 'transfer_gummel',
  },
  {
    id: 'eq-2.2.0-24',
    eqNumber: '(2.2.0-24)',
    title: 'Hyperbolic Reach-Through Protection for Low-Current Hole Charge',
    section: '2.2 Quasi-Static Transfer Current (GICCR)',
    sectionId: '2.2',
    manualPage: 16,
    manualLines: 'p. 16, l. 11 (Ch. 2.2, ll. 9–14)',
    vaReference: 'Lines 1474–1478 (Q_0 smoothing in HICCR)',
    latex:
      'Q_{pT,\\text{low}} = Q_{B,rt}\\left(1 + \\frac{b_q + \\sqrt{b_q^2 + 1.921812}}{2}\\right), \\quad b_q = \\frac{Q_{p0} + h_{jEi}Q_{jEi} + h_{jCi}Q_{jCi}}{Q_{B,rt}} - 1',
    isBoxedImplemented: true,
    summary:
      'Prevents the low-current hole charge Q0 from becoming zero or negative under strong reverse bias (base punch-through / reach-through).',
    physicalDerivation:
      'Under large reverse B-E and B-C voltages, the depletion charges QjEi and QjCi become negative and could numerically exhaust Qp0, causing a division-by-zero singularity in GICCR. HICUM clamps Q0 smoothly to a minimum floor QB,rt = 0.05 Qp0 using a C-infinity hyperbolic smoothing function.',
    variables: [
      { symbolLatex: 'Q_{pT,\\text{low}}', meaning: 'Smoothed low-current weighted hole charge (Q_0 in VA)', unit: 'C' },
      { symbolLatex: 'Q_{B,rt}', meaning: 'Reach-through floor charge 0.05 Qp0', unit: 'C' },
      { symbolLatex: 'b_q', meaning: 'Normalized low-bias charge variable', unit: '-' },
    ],
    parameters: ['qp0', 'hjei', 'hjci'],
    circuitElements: ['it'],
    plotCategory: 'transfer_gummel',
  },
  {
    id: 'eq-2.2.0-25',
    eqNumber: '(2.2.0-25)',
    title: 'Explicit Quadratic Low-Current GICCR Solution & Newton-Raphson Loop',
    section: '2.2 Quasi-Static Transfer Current (GICCR)',
    sectionId: '2.2',
    manualPage: 16,
    manualLines: 'p. 16, ll. 22–26; p. 17, ll. 1–3 (Eqs. 2.2.0-25 & 2.2.0-26)',
    vaReference: 'Lines 1525–1578 (Initial Q_p & while loop in HICCR)',
    latex:
      'Q_p = \\frac{Q_0}{2} + \\sqrt{\\left(\\frac{Q_0}{2}\\right)^2 + \\tau_{f0} i_{0f} + \\tau_r i_{0r}}, \\quad Q_{p,T}^{(k+1)} = Q_{p,T}^{(k)} - \\frac{Q_{p,T} - (Q_0 + Q_{f,T} + Q_r)}{1 + (\\tau_{f,T} i_{Tf1}(1 + 2 i_{Tf1}/I_{Ch}) + Q_r)/Q_{p,T}}',
    isBoxedImplemented: true,
    summary:
      'Closed-form quadratic solution for Qp at low currents where τf = τf0 is constant, followed by an internal damped Newton-Raphson iteration when high-current charges ΔQf are active.',
    physicalDerivation:
      'At low injection (Qf = τf0 iTf), substituting iTf = i0f / Qp into Qp = Q0 + Qf + Qr yields a quadratic equation with an exact analytical root. When Qf exceeds 10^-5 Qp, the strongly nonlinear Kirk and barrier charges require an internal Newton-Raphson solver with 30% per-step damping (|d_Q| <= 0.3 Qp,T) to converge to relative tolerance RTOLC = 10^-5.',
    variables: [
      { symbolLatex: 'Q_p', meaning: 'Analytical low-current total hole charge', unit: 'C' },
      { symbolLatex: 'i_{0f}', meaning: 'Forward exponential excitation c10 exp(vB\'E\'/(mCf VT))', unit: 'A\\cdot C' },
      { symbolLatex: 'i_{0r}', meaning: 'Reverse exponential excitation c10 exp(vB\'C\'/VT)', unit: 'A\\cdot C' },
      { symbolLatex: '\\tau_{f,T}', meaning: 'Differential GICCR-weighted forward transit time dQf,T/diTf', unit: 's' },
    ],
    parameters: ['c10', 'qp0', 't0', 'tr', 'ich'],
    circuitElements: ['it', 'qf', 'qr'],
    plotCategory: 'transfer_gummel',
  },
  {
    id: 'eq-2.3.1-1',
    eqNumber: '(2.3.1-1)',
    title: 'Forward Minority Charge Integration & Transit Time Partitioning',
    section: '2.3 Minority Charge, Transit Times & Diffusion Capacitances',
    sectionId: '2.3',
    manualPage: 18,
    manualLines: 'p. 18, ll. 6–11 (Eqs. 2.3.0-27 & 2.3.1-1)',
    vaReference: 'Lines 490–533 (Macro HICQFF)',
    latex:
      'Q_f = \\int_0^{i_{Tf}} \\tau_f(v_{C\'E\'}, i) \\, di = Q_{f0} + \\Delta Q_{Ef} + \\Delta Q_{Bf} + \\Delta Q_{Cf}, \\quad \\tau_f = \\tau_{f0}(v_{B\'C\'}) + \\Delta\\tau_{Ef} + \\Delta\\tau_{Bf} + \\Delta\\tau_{Cf}',
    isBoxedImplemented: true,
    summary:
      'Defines the total forward minority charge Qf as the current integral of the differential transit time τf, partitioned into low-current and high-current regional contributions.',
    physicalDerivation:
      'In a bipolar transistor, small-signal delay is governed by the differential transit time τf = ∂Qf/∂iTf at constant collector voltage, whereas large-signal charge storage is governed by the integral Qf. HICUM maintains strict mathematical consistency between Qf and τf across all bias regimes by integrating each regional transit time component analytically with respect to iTf.',
    variables: [
      { symbolLatex: 'Q_f', meaning: 'Total unweighted forward minority charge (Qdei)', unit: 'C' },
      { symbolLatex: '\\tau_f', meaning: 'Total differential forward transit time (TF)', unit: 's' },
      { symbolLatex: '\\tau_{f0}', meaning: 'Low-current forward transit time', unit: 's' },
      { symbolLatex: '\\Delta\\tau_{Ef}', meaning: 'High-current neutral emitter delay component', unit: 's' },
      { symbolLatex: '\\Delta\\tau_{Bf}', meaning: 'High-current excess base delay component', unit: 's' },
      { symbolLatex: '\\Delta\\tau_{Cf}', meaning: 'High-current collector delay component', unit: 's' },
    ],
    parameters: ['t0', 'dt0h', 'tbvl', 'tef0', 'thcs', 'fthc'],
    circuitElements: ['qf', 'it'],
    plotCategory: 'transit_time_ft',
  },
  {
    id: 'eq-2.3.1-3',
    eqNumber: '(2.3.1-3)',
    title: 'Effective Collector Voltage Smoothing vceff',
    section: '2.3 Minority Charge, Transit Times & Diffusion Capacitances',
    sectionId: '2.3',
    manualPage: 19,
    manualLines: 'p. 19, l. 14 (Ch. 2.3.1, ll. 4–16)',
    vaReference: 'Lines 1501–1508 (vc and vceff in HICICK)',
    latex:
      'v_{ceff} = V_T \\left[ 1 + \\frac{d_1 + \\sqrt{d_1^2 + 1.921812}}{2} \\right], \\quad d_1 = \\frac{v_{C\'E\'} - V_{CEs}}{V_T} - 1',
    isBoxedImplemented: true,
    summary:
      'Smoothly clamps the effective internal collector-emitter voltage vceff to VT as vC\'E\' drops below the internal saturation voltage VCEs.',
    physicalDerivation:
      'The voltage drop across the lightly doped epitaxial collector driving drift transport is vC\'E\' - VCEs, where VCEs accounts for the built-in potential difference and quasi-saturation offset. When the transistor enters hard saturation (vC\'E\' < VCEs), hyperbolic smoothing ensures vceff remains strictly positive (>= VT) with continuous derivatives for calculating the Kirk critical current ICK.',
    variables: [
      { symbolLatex: 'v_{ceff}', meaning: 'Smoothed effective internal collector voltage', unit: 'V' },
      { symbolLatex: 'v_{C\'E\'}', meaning: 'Intrinsic collector-emitter branch voltage V(ci,ei)', unit: 'V' },
      { symbolLatex: 'V_{CEs}', meaning: 'Internal C-E saturation voltage', unit: 'V', linkedParamId: 'vces' },
      { symbolLatex: 'd_1', meaning: 'Normalized overdrive above saturation', unit: '-' },
    ],
    parameters: ['vces', 'alces'],
    circuitElements: ['qf', 'it'],
    plotCategory: 'critical_current',
  },
  {
    id: 'eq-2.3.1-5',
    eqNumber: '(2.3.1-5)',
    title: 'Low-Current Forward Transit Time τf0(vB\'C\')',
    section: '2.3 Minority Charge, Transit Times & Diffusion Capacitances',
    sectionId: '2.3',
    manualPage: 21,
    manualLines: 'p. 21, ll. 1–3, 23 (Eqs. 2.3.1-5 & 2.3.1-6)',
    vaReference: 'Lines 1481–1498, 1538 (CJMODF and T_f0)',
    latex:
      '\\tau_{f0}(v_{B\'C\'}) = \\tau_0 + \\Delta\\tau_{0h}(c - 1) + \\tau_{Bvl}\\left(\\frac{1}{c} - 1\\right), \\quad \\frac{1}{c} = \\frac{C_{jCi,t}(V_{B\'C\'})}{C_{jCi0}}, \\quad Q_{f0} = \\tau_{f0} i_{Tf}',
    isBoxedImplemented: true,
    summary:
      'Captures the voltage dependence of the low-current transit time τf0 via the normalized B-C depletion width ratio c = CjCi0 / CjCi.',
    physicalDerivation:
      'As reverse B-C voltage increases, the B-C space-charge layer widens (c > 1): this simultaneously narrows the neutral base width (Early effect, reducing base transit time) while widening the high-field collector depletion transit zone (increasing SCL transit time), combined in Δτ0h. Conversely, at low vC\'E\' (forward B-C bias, c < 1), the electric field in the B-C junction collapses, causing velocity drop and carrier jam modeled by τBvl(1/c - 1).',
    variables: [
      { symbolLatex: '\\tau_{f0}', meaning: 'Low-current forward transit time', unit: 's' },
      { symbolLatex: '\\tau_0', meaning: 'Base and collector transit time at V_B\'C\' = 0V', unit: 's', linkedParamId: 't0' },
      { symbolLatex: '\\Delta\\tau_{0h}', meaning: 'Time constant for base & B-C SCL width modulation', unit: 's', linkedParamId: 'dt0h' },
      { symbolLatex: '\\tau_{Bvl}', meaning: 'Time constant for low-VCE carrier jam', unit: 's', linkedParamId: 'tbvl' },
      { symbolLatex: 'c', meaning: 'Normalized B-C depletion thickness CjCi0 / CjCi', unit: '-' },
    ],
    parameters: ['t0', 'dt0h', 'tbvl', 'cjci0', 'vdci', 'zci'],
    circuitElements: ['qf', 'cjci'],
    plotCategory: 'transit_time_ft',
  },
  {
    id: 'eq-2.3.1-7',
    eqNumber: '(2.3.1-7)',
    title: 'Critical Current for Onset of Kirk Effect (ICK)',
    section: '2.3 Minority Charge, Transit Times & Diffusion Capacitances',
    sectionId: '2.3',
    manualPage: 23,
    manualLines: 'p. 23, ll. 4–12 (Eqs. 2.3.1-7 to 2.3.1-10)',
    vaReference: 'Lines 1504–1522 (Block HICICK)',
    latex:
      'I_{CK} = \\frac{v_{ceff}}{r_{Ci0}} \\frac{1}{\\left[1 + \\left(\\frac{v_{ceff}}{V_{lim}}\\right)^{\\delta_{ck}}\\right]^{1/\\delta_{ck}}} \\left[1 + \\frac{x + \\sqrt{x^2 + a_{ick}}}{2}\\right], \\quad x = \\frac{v_{ceff} - V_{lim}}{V_{PT}}',
    isBoxedImplemented: true,
    summary:
      'Defines the bias-dependent critical collector current ICK(vceff) marking the onset of base push-out (Kirk effect) and quasi-saturation in the epitaxial collector.',
    physicalDerivation:
      'At low collector voltages (vceff < Vlim), electrons drift ohmically with mobility μnC0, giving ICK ≈ vceff / rCi0 (quasi-saturation regime). Above Vlim, electron velocity saturates at vsn, so the space charge of mobile electrons compensates the collector doping N_C and pushes the electric field maximum to the buried layer at ICK ≈ q A_E N_C vsn = Vlim / rCi0. At higher voltages (vceff > Vlim), the last bracket models further linear increase of ICK after full collector punch-through governed by VPT.',
    variables: [
      { symbolLatex: 'I_{CK}', meaning: 'Critical collector current for Kirk effect onset', unit: 'A' },
      { symbolLatex: 'r_{Ci0}', meaning: 'Low-field internal epitaxial collector resistance', unit: '\\Omega', linkedParamId: 'rci0' },
      { symbolLatex: 'V_{lim}', meaning: 'Voltage separating ohmic and velocity-saturation regimes', unit: 'V', linkedParamId: 'vlim' },
      { symbolLatex: '\\delta_{ck}', meaning: 'Transition exponent between ohmic and saturation regimes', unit: '-', linkedParamId: 'delck' },
      { symbolLatex: 'V_{PT}', meaning: 'Collector punch-through voltage for high-field ICK slope', unit: 'V', linkedParamId: 'vpt' },
      { symbolLatex: 'a_{ick}', meaning: 'Hyperbolic smoothing parameter for punch-through transition', unit: '-', linkedParamId: 'aick' },
    ],
    parameters: ['rci0', 'vlim', 'vces', 'vpt', 'delck', 'aick'],
    circuitElements: ['qf', 'it'],
    plotCategory: 'critical_current',
  },
  {
    id: 'eq-2.3.1-11',
    eqNumber: '(2.3.1-11)',
    title: 'Neutral Emitter Minority Storage Time & Charge (ΔτEf, ΔQEf)',
    section: '2.3 Minority Charge, Transit Times & Diffusion Capacitances',
    sectionId: '2.3',
    manualPage: 25,
    manualLines: 'p. 25, ll. 6–10 (Eqs. 2.3.1-11 & 2.3.1-12)',
    vaReference: 'Lines 496–498 (FFdTef and FFdQef in HICQFF)',
    latex:
      '\\Delta\\tau_{Ef} = \\tau_{Ef0} \\left(\\frac{i_{Tf}}{I_{CK}}\\right)^{g_{\\tau E}}, \\quad \\Delta Q_{Ef} = \\int_0^{i_{Tf}} \\Delta\\tau_{Ef} \\, di = \\Delta\\tau_{Ef} \\frac{i_{Tf}}{1 + g_{\\tau E}}',
    isBoxedImplemented: true,
    summary:
      'Models minority hole storage in the neutral emitter at medium-to-high current densities normalized to ICK.',
    physicalDerivation:
      'In advanced silicon BJTs with heavily doped emitters (bandgap narrowing) or poly-emitter interfaces, hole back-injection into the emitter becomes significant at high current densities where base conductivity modulation alters the B-E injection ratio. Integrating the power-law delay ΔτEf yields ΔQEf with the exact factor 1/(1 + gτE).',
    variables: [
      { symbolLatex: '\\Delta\\tau_{Ef}', meaning: 'Additional neutral emitter transit delay', unit: 's' },
      { symbolLatex: '\\Delta Q_{Ef}', meaning: 'Neutral emitter stored minority hole charge', unit: 'C' },
      { symbolLatex: '\\tau_{Ef0}', meaning: 'Neutral emitter storage time constant at iTf = ICK', unit: 's', linkedParamId: 'tef0' },
      { symbolLatex: 'g_{\\tau E}', meaning: 'Current exponent for emitter storage time', unit: '-', linkedParamId: 'gtfe' },
    ],
    parameters: ['tef0', 'gtfe', 'hfe'],
    circuitElements: ['qf', 'it'],
    plotCategory: 'transit_time_ft',
  },
  {
    id: 'eq-2.3.1-16',
    eqNumber: '(2.3.1-16)',
    title: 'Normalized Collector Injection Zone Width w(iTf / ICK)',
    section: '2.3 Minority Charge, Transit Times & Diffusion Capacitances',
    sectionId: '2.3',
    manualPage: 26,
    manualLines: 'p. 26, ll. 2–4 (Eqs. 2.3.1-16 & 2.3.1-17)',
    vaReference: 'Lines 514–515 (FFic and FFw in HICQFF)',
    latex:
      'w = \\frac{w_i}{w_C} = \\frac{i + \\sqrt{i^2 + a_{hc}}}{1 + \\sqrt{1 + a_{hc}}}, \\quad i = 1 - \\frac{I_{CK}}{i_{Tf}}',
    isBoxedImplemented: true,
    summary:
      'Gives the normalized thickness w = wi / wC of the current-induced neutral injection zone (base push-out / Kirk zone) in the epitaxial collector.',
    physicalDerivation:
      'Once iTf exceeds the critical current ICK, the electric field at the metallurgical B-C junction collapses to zero and a neutral electron-hole plasma region of width wi = wC (1 - ICK/iTf) forms from the B-C junction toward the buried layer. The smoothing parameter ahc provides a physical transition around iTf ≈ ICK accounting for finite thermal diffusion length.',
    variables: [
      { symbolLatex: 'w', meaning: 'Normalized collector injection zone width wi / wC in (0, 1)', unit: '-' },
      { symbolLatex: 'w_i', meaning: 'Physical width of the neutral collector injection zone', unit: 'm' },
      { symbolLatex: 'w_C', meaning: 'Total epitaxial collector width', unit: 'm' },
      { symbolLatex: 'i', meaning: 'Normalized excess current variable 1 - ICK/iTf', unit: '-' },
      { symbolLatex: 'a_{hc}', meaning: 'Smoothing parameter for onset of high-current base/collector charge', unit: '-', linkedParamId: 'ahc' },
    ],
    parameters: ['ahc', 'thcs', 'fthc'],
    circuitElements: ['qf'],
    plotCategory: 'transit_time_ft',
  },
  {
    id: 'eq-2.3.1-24',
    eqNumber: '(2.3.1-24)',
    title: '1D High-Current Base-Collector Minority Charge & Transit Time',
    section: '2.3 Minority Charge, Transit Times & Diffusion Capacitances',
    sectionId: '2.3',
    manualPage: 27,
    manualLines: 'p. 27, l. 18; p. 28, ll. 1–11 (Eqs. 2.3.1-24 to 2.3.1-27)',
    vaReference: 'Lines 516–527 (FFdQfhc, FFdTfhc, fthc partitioning in HICQFF)',
    latex:
      '\\Delta Q_{fh} = \\tau_{hcs} i_{Tf} w^2, \\quad \\Delta\\tau_{fh} = \\frac{\\partial \\Delta Q_{fh}}{\\partial i_{Tf}} = \\tau_{hcs} w^2 \\left[ 1 + \\frac{2}{(i_{Tf}/I_{CK})\\sqrt{i^2 + a_{hc}}} \\right]',
    isBoxedImplemented: true,
    summary:
      '1D formulation of high-current minority charge storage ΔQfh and differential transit time Δτfh in the pushed-out base-collector region, partitioned by fthc.',
    physicalDerivation:
      'By solving the ambipolar diffusion equation across the current-induced injection zone of width wi = w * wC, the stored charge scales with the square of the injection zone width (w^2) and the saturation time constant τhcs = wC^2 / (4 μnC VT). The parameter fthc partitions ΔQfh into the collector portion ΔQCf = fthc ΔQfh and the base portion ΔQBf,c = (1 - fthc) ΔQfh.',
    variables: [
      { symbolLatex: '\\Delta Q_{fh}', meaning: 'Total high-current base-collector charge before barrier scaling', unit: 'C' },
      { symbolLatex: '\\Delta\\tau_{fh}', meaning: 'High-current differential base-collector transit time', unit: 's' },
      { symbolLatex: '\\tau_{hcs}', meaning: 'Saturation time constant at high current densities', unit: 's', linkedParamId: 'thcs' },
      { symbolLatex: 'f_{thc}', meaning: 'Partitioning factor between collector and base high-current charge', unit: '-', linkedParamId: 'fthc' },
    ],
    parameters: ['thcs', 'ahc', 'fthc', 'hfc'],
    circuitElements: ['qf', 'it'],
    plotCategory: 'transit_time_ft',
  },
  {
    id: 'eq-2.3.1-28',
    eqNumber: '(2.3.1-28)',
    title: 'B-C Heterojunction Barrier Voltage ΔVcB & Barrier Charges',
    section: '2.3 Minority Charge, Transit Times & Diffusion Capacitances',
    sectionId: '2.3',
    manualPage: 29,
    manualLines: 'p. 29, ll. 6–15; p. 30, ll. 2–14 (Eqs. 2.3.1-28 to 2.3.1-34)',
    vaReference: 'Lines 499–517 (FFdVc, FFdQbfb, FFdQfhc in HICQFF)',
    latex:
      '\\Delta V_{cB} = V_{cBar} \\exp\\left(-\\frac{2}{i_{Bar} + \\sqrt{i_{Bar}^2 + a_{cBar}}}\\right), \\quad \\Delta Q_{Bf,b} = (1 - f_{thc})\\tau_{hcs} i_{Tf} \\left[\\exp\\left(\\frac{\\Delta V_{cB}}{V_T}\\right) - 1\\right]',
    isBoxedImplemented: true,
    summary:
      'Models the conduction-band potential barrier ΔVcB at the SiGe/Si B-C heterojunction when high electron injection collapses the reverse B-C electric field.',
    physicalDerivation:
      'In SiGe HBTs, the abrupt Ge drop at the B-C junction creates a valence-band step that is normally masked by the strong reverse collector electric field. When iTf approaches ICK, mobile electrons screen the positive donor charge, exposing a conduction-band barrier ΔVcB of maximum height VcBar. Electrons pile up behind this barrier in the base (ΔQBf,b) and the collector charge is scaled by exp((ΔVcB - VcBar)/VT).',
    variables: [
      { symbolLatex: '\\Delta V_{cB}', meaning: 'Current-induced effective B-C barrier height (FFdVc)', unit: 'V' },
      { symbolLatex: 'V_{cBar}', meaning: 'Maximum B-C heterojunction barrier voltage', unit: 'V', linkedParamId: 'vcbar' },
      { symbolLatex: 'i_{Bar}', meaning: 'Normalized barrier current (iTf - ICK) / IcBar', unit: '-', linkedParamId: 'icbar' },
      { symbolLatex: 'a_{cBar}', meaning: 'Smoothing parameter for barrier onset', unit: '-', linkedParamId: 'acbar' },
      { symbolLatex: '\\Delta Q_{Bf,b}', meaning: 'Excess base minority charge piled up at B-C barrier', unit: 'C' },
    ],
    parameters: ['vcbar', 'icbar', 'acbar', 'thcs', 'fthc'],
    circuitElements: ['qf', 'it', 'ibci'],
    plotCategory: 'transit_time_ft',
  },
  {
    id: 'eq-2.3.2-1',
    eqNumber: '(2.3.2-1)',
    title: 'Inverse Minority Diffusion Charge Qr',
    section: '2.3 Minority Charge, Transit Times & Diffusion Capacitances',
    sectionId: '2.3',
    manualPage: 31,
    manualLines: 'p. 31, l. 16 (Ch. 2.3.2, ll. 13–19)',
    vaReference: 'Lines 1542, 1560, 1589, 1600 (Qr and Qdci)',
    latex:
      'Q_r = \\tau_r i_{Tr} = \\tau_r \\frac{c_{10}}{Q_{p,T}} \\exp\\left(\\frac{v_{B\'C\'}}{V_T}\\right)',
    isBoxedImplemented: true,
    summary:
      'Models the stored minority diffusion charge Qr (Qdci) across the internal B-C junction during inverse or saturated operation.',
    physicalDerivation:
      'When the intrinsic B-C junction becomes forward biased (saturation or inverse mode), electrons are injected from collector to emitter and holes are injected into the epitaxial collector. Their combined charge storage is parameterized by the inverse storage time constant τr.',
    variables: [
      { symbolLatex: 'Q_r', meaning: 'Inverse minority diffusion charge (Qdci)', unit: 'C' },
      { symbolLatex: '\\tau_r', meaning: 'Storage time constant for inverse operation', unit: 's', linkedParamId: 'tr' },
      { symbolLatex: 'i_{Tr}', meaning: 'Reverse GICCR transfer current component', unit: 'A' },
    ],
    parameters: ['tr', 'c10', 'qp0'],
    circuitElements: ['qr', 'it'],
    plotCategory: 'transit_time_ft',
  },
  {
    id: 'eq-2.4.1-1',
    eqNumber: '(2.4.1-1)',
    title: 'B-E Depletion Charge & Capacitance with Forward-Bias Peak Limiting (QJMODF)',
    section: '2.4 Depletion Charges & Capacitances',
    sectionId: '2.4',
    manualPage: 33,
    manualLines: 'p. 33, l. 16; p. 34, ll. 2–18 (Eqs. 2.4.1-1 to 2.4.1-7)',
    vaReference: 'Lines 240–256 (Macro QJMODF), 1454, 1668',
    latex:
      'C_{jE} = C_{jE0}\\left(1 - \\frac{v_j}{V_{DE}}\\right)^{-z_E}\\frac{dv_j}{dv} + a_{jE}C_{jE0}\\left(1 - \\frac{dv_j}{dv}\\right), \\quad V_f = V_{DE}\\left(1 - a_{jE}^{-1/z_E}\\right)',
    isBoxedImplemented: true,
    summary:
      'Non-singular depletion capacitance and charge formulation for the internal (CjEi, QjEi) and peripheral (CjEp, QjEp) B-E junctions.',
    physicalDerivation:
      'The classical depletion capacitance formula diverges at v = VDE. Physically, at high forward bias the space-charge region does not vanish completely due to mobile carrier screening, so the depletion capacitance saturates at a finite maximum value CjE,max = ajE * CjE0 around voltage Vf. Macro QJMODF uses hyperbolic smoothing of the auxiliary voltage vj(v) to transition smoothly to ajE * CjE0 without poles.',
    variables: [
      { symbolLatex: 'C_{jE}', meaning: 'Depletion capacitance (CjEi or CjEp)', unit: 'F' },
      { symbolLatex: 'C_{jE0}', meaning: 'Zero-bias B-E depletion capacitance', unit: 'F', linkedParamId: 'cjei0' },
      { symbolLatex: 'V_{DE}', meaning: 'B-E built-in potential', unit: 'V', linkedParamId: 'vdei' },
      { symbolLatex: 'z_E', meaning: 'B-E grading coefficient', unit: '-', linkedParamId: 'zei' },
      { symbolLatex: 'a_{jE}', meaning: 'Ratio of maximum forward capacitance to zero-bias capacitance', unit: '-', linkedParamId: 'ajei' },
      { symbolLatex: 'V_f', meaning: 'Inflection voltage where classical Cj reaches ajE * CjE0', unit: 'V' },
    ],
    parameters: ['cjei0', 'vdei', 'zei', 'ajei', 'cjep0', 'vdep', 'zep', 'ajep'],
    circuitElements: ['cjei', 'cjep'],
    plotCategory: 'depletion_cap',
  },
  {
    id: 'eq-2.4.2-4',
    eqNumber: '(2.4.2-4)',
    title: 'B-C & C-S Depletion Capacitance with Collector Punch-Through (QJMOD)',
    section: '2.4 Depletion Charges & Capacitances',
    sectionId: '2.4',
    manualPage: 37,
    manualLines: 'p. 37, ll. 3–15; p. 38, ll. 1–15 (Eqs. 2.4.2-4 to 2.4.2-13)',
    vaReference: 'Lines 280–333 (Macros QJMOD & HICJQ), 1471, 1690, 1696, 1699',
    latex:
      'C_j = C_{j,\\text{cl}}(v_{j2}) e_1 e_2 + C_{j,\\text{PT}}(v_{j1}) (1 - e_2) + C_{j,\\max}(1 - e_1), \\quad C_{j,\\text{PT}} \\propto (V_D - v_{j1})^{-z/4}',
    isBoxedImplemented: true,
    summary:
      'Three-region depletion capacitance and charge model covering reverse punch-through (v < -Vp), medium classical bias, and forward peak limiting (2.4 Cj0).',
    physicalDerivation:
      'In lightly doped epitaxial collectors (or substrate junctions), increasing reverse voltage expands the depletion zone until it reaches the heavily doped buried layer at voltage -Vp = VD - VPT. Beyond punch-through, the depletion width increases much more slowly with exponent zr = z/4. Macro QJMOD blends all three bias regimes continuously in both charge Qz and capacitance C.',
    variables: [
      { symbolLatex: 'C_j', meaning: 'Total junction depletion capacitance (CjCi, CjCx, CjS, CjSCp)', unit: 'F' },
      { symbolLatex: 'V_{PT}', meaning: 'Junction punch-through voltage q N_C w_C^2 / (2 ε)', unit: 'V', linkedParamId: 'vptci' },
      { symbolLatex: 'z_r', meaning: 'Reduced grading coefficient in punch-through regime (z/4)', unit: '-' },
      { symbolLatex: 'C_{j,\\max}', meaning: 'Maximum forward capacitance fixed at 2.4 Cj0', unit: 'F' },
    ],
    parameters: ['cjci0', 'vdci', 'zci', 'vptci', 'cjcx0', 'vdcx', 'zcx', 'vptcx', 'cjs0', 'vds', 'zs', 'vpts'],
    circuitElements: ['cjci', 'cjcx1', 'cjcx2', 'cjs', 'cscp'],
    plotCategory: 'depletion_cap',
  },
  {
    id: 'eq-2.4.3-2',
    eqNumber: '(2.4.3-2)',
    title: 'External B-C Capacitance Partitioning Across Base Resistance (fBCpar)',
    section: '2.4 Depletion Charges & Capacitances',
    sectionId: '2.4',
    manualPage: 40,
    manualLines: 'p. 40, ll. 5–26 (Eqs. 2.4.3-1 & 2.4.3-2)',
    vaReference: 'Lines 969–982 (cbcpar1, cbcpar2, cjcx01, cjcx02 in Model_initialization)',
    latex:
      'C_1 = (1 - f_{BCpar})(C_{jCx0} + C_{BCpar}), \\quad C_{jCx01} + C_{BCpar1} = C_1, \\quad C_{jCx02} + C_{BCpar2} = f_{BCpar}(C_{jCx0} + C_{BCpar})',
    isBoxedImplemented: true,
    summary:
      'Splits the combined extrinsic B-C junction capacitance CjCx0 and oxide isolation capacitance CBCpar between outer base node B and middle base node B*.',
    physicalDerivation:
      'The distributed extrinsic base-collector network consists of metallization/oxide overlap (CBCpar) near the outer contact B and semiconductor p+ extrinsic base junction (CjCx0) extending toward the emitter perimeter B*. Parameter fBCpar specifies the fraction of the total extrinsic B-C capacitance connected to the inner perimeter node B* (after assigning as much of C1 as possible to the voltage-independent oxide cap CBCpar1 at node B).',
    variables: [
      { symbolLatex: 'f_{BCpar}', meaning: 'Partitioning factor of total extrinsic B-C capacitance', unit: '-', linkedParamId: 'fbcpar' },
      { symbolLatex: 'C_{jCx01}, C_{BCpar1}', meaning: 'Depletion and parasitic B-C capacitances connected to node B (br_bci)', unit: 'F' },
      { symbolLatex: 'C_{jCx02}, C_{BCpar2}', meaning: 'Depletion and parasitic B-C capacitances connected to node B* (br_bpci)', unit: 'F' },
    ],
    parameters: ['cjcx0', 'cbcpar', 'fbcpar'],
    circuitElements: ['cjcx1', 'cjcx2', 'rbx'],
    plotCategory: 'depletion_cap',
  },
  {
    id: 'eq-2.5.0-1',
    eqNumber: '(2.5.0-1)',
    title: 'Quasi-Static Internal Base-Emitter Diode Current ijBEi',
    section: '2.5 Static Base Current Components',
    sectionId: '2.5',
    manualPage: 42,
    manualLines: 'p. 42, l. 15 (Ch. 2.5, ll. 12–21)',
    vaReference: 'Lines 548–564 (Macro HICDIO), 1435–1436, 1815–1816',
    latex:
      'i_{jBEi} = I_{BEiS}\\left[\\exp\\left(\\frac{v_{B\'E\'}}{m_{BEi}V_T}\\right) - 1\\right] + I_{REiS}\\left[\\exp\\left(\\frac{v_{B\'E\'}}{m_{REi}V_T}\\right) - 1\\right]',
    isBoxedImplemented: true,
    summary:
      'Internal base-emitter current across the emitter window combining ideal back-injection into the emitter (ibei) and Shockley-Read-Hall space-charge recombination (irei).',
    physicalDerivation:
      'Holes injected from the intrinsic base B\' into the emitter recombine in the neutral emitter and at the emitter contact with ideality factor mBEi ≈ 1.0. At low forward bias, Shockley-Read-Hall recombination via deep traps in the B-E space-charge region adds a second diode component with ideality factor mREi ≈ 2.0.',
    variables: [
      { symbolLatex: 'i_{jBEi}', meaning: 'Total internal B-E junction current (ibei + irei)', unit: 'A' },
      { symbolLatex: 'I_{BEiS}', meaning: 'Internal B-E injection saturation current', unit: 'A', linkedParamId: 'ibeis' },
      { symbolLatex: 'm_{BEi}', meaning: 'Internal B-E injection ideality factor', unit: '-', linkedParamId: 'mbei' },
      { symbolLatex: 'I_{REiS}', meaning: 'Internal B-E recombination saturation current', unit: 'A', linkedParamId: 'ireis' },
      { symbolLatex: 'm_{REi}', meaning: 'Internal B-E recombination ideality factor', unit: '-', linkedParamId: 'mrei' },
    ],
    parameters: ['ibeis', 'mbei', 'ireis', 'mrei'],
    circuitElements: ['ibei'],
    plotCategory: 'transfer_gummel',
  },
  {
    id: 'eq-2.5.0-2',
    eqNumber: '(2.5.0-2)',
    title: 'Quasi-Static Peripheral Base-Emitter Diode Current ijBEp',
    section: '2.5 Static Base Current Components',
    sectionId: '2.5',
    manualPage: 43,
    manualLines: 'p. 43, l. 1 (Ch. 2.5, ll. 1–5)',
    vaReference: 'Lines 1664–1665, 1812–1813 (ibep and irep on br_bpei)',
    latex:
      'i_{jBEp} = I_{BEpS}\\left[\\exp\\left(\\frac{v_{B^*E\'}}{m_{BEp}V_T}\\right) - 1\\right] + I_{REpS}\\left[\\exp\\left(\\frac{v_{B^*E\'}}{m_{REp}V_T}\\right) - 1\\right]',
    isBoxedImplemented: true,
    summary:
      'Peripheral base-emitter current connected to the perimeter base node B*, bypassing the internal base sheet resistance rBi.',
    physicalDerivation:
      'Hole injection along the emitter sidewall perimeter and recombination at the surrounding spacer oxide interface occur outside the intrinsic emitter window. Because this current flows directly from the perimeter base node B* to E\', separating ijBEp from ijBEi is essential for accurate modeling of geometry scaling and emitter current crowding at high currents.',
    variables: [
      { symbolLatex: 'i_{jBEp}', meaning: 'Total peripheral B-E diode current (ibep + irep)', unit: 'A' },
      { symbolLatex: 'v_{B^*E\'}', meaning: 'Perimeter base-emitter branch voltage V(bp,ei)', unit: 'V' },
      { symbolLatex: 'I_{BEpS}', meaning: 'Peripheral B-E injection saturation current', unit: 'A', linkedParamId: 'ibeps' },
      { symbolLatex: 'm_{BEp}', meaning: 'Peripheral B-E injection ideality factor', unit: '-', linkedParamId: 'mbep' },
      { symbolLatex: 'I_{REpS}', meaning: 'Peripheral B-E recombination saturation current', unit: 'A', linkedParamId: 'ireps' },
      { symbolLatex: 'm_{REp}', meaning: 'Peripheral B-E recombination ideality factor', unit: '-', linkedParamId: 'mrep' },
    ],
    parameters: ['ibeps', 'mbep', 'ireps', 'mrep'],
    circuitElements: ['ibep'],
    plotCategory: 'transfer_gummel',
  },
  {
    id: 'eq-2.5.0-3',
    eqNumber: '(2.5.0-3)',
    title: 'Internal & External Base-Collector Diode Currents (ijBCi, ijBCx)',
    section: '2.5 Static Base Current Components',
    sectionId: '2.5',
    manualPage: 43,
    manualLines: 'p. 43, ll. 8–10 (Eqs. 2.5.0-3 & 2.5.0-4)',
    vaReference: 'Lines 1614, 1693, 1820, 1824',
    latex:
      'i_{jBCi} = I_{BCiS}\\left[\\exp\\left(\\frac{v_{B\'C\'}}{m_{BCi}V_T}\\right) - 1\\right], \\quad i_{jBCx} = I_{BCxS}\\left[\\exp\\left(\\frac{v_{B^*C\'}}{m_{BCx}V_T}\\right) - 1\\right]',
    isBoxedImplemented: true,
    summary:
      'Models hole injection into the collector across the intrinsic B\'-C\' junction and extrinsic B*-C\' junction during saturation or inverse operation.',
    physicalDerivation:
      'When the base-collector junction is forward biased (low VCE or inverse mode), holes are injected from both the intrinsic base under the emitter window (ijBCi) and the much larger extrinsic base region (ijBCx) into the epitaxial collector.',
    variables: [
      { symbolLatex: 'i_{jBCi}', meaning: 'Internal B-C diode current (ibci)', unit: 'A' },
      { symbolLatex: 'i_{jBCx}', meaning: 'Extrinsic B-C diode current (ijbcx)', unit: 'A' },
      { symbolLatex: 'I_{BCiS}', meaning: 'Internal B-C saturation current', unit: 'A', linkedParamId: 'ibcis' },
      { symbolLatex: 'm_{BCi}', meaning: 'Internal B-C ideality factor', unit: '-', linkedParamId: 'mbci' },
      { symbolLatex: 'I_{BCxS}', meaning: 'External B-C saturation current', unit: 'A', linkedParamId: 'ibcxs' },
      { symbolLatex: 'm_{BCx}', meaning: 'External B-C ideality factor', unit: '-', linkedParamId: 'mbcx' },
    ],
    parameters: ['ibcis', 'mbci', 'ibcxs', 'mbcx'],
    circuitElements: ['ibci', 'ijbcx'],
    plotCategory: 'transfer_gummel',
  },
  {
    id: 'eq-2.5.0-5',
    eqNumber: '(2.5.0-5)',
    title: 'Excess Base Recombination Current at B-C Barrier (iBh,rec)',
    section: '2.5 Static Base Current Components',
    sectionId: '2.5',
    manualPage: 44,
    manualLines: 'p. 44, l. 1 (Ch. 2.5, ll. 1–9)',
    vaReference: 'Lines 997–1001, 1634, 1817 (ibh_rec on br_biei)',
    latex:
      'i_{Bh,rec} = \\frac{\\Delta Q_{Bf}}{\\tau_{Bhrec}}, \\quad \\Delta Q_{Bf} = \\Delta Q_{Bf,b} + (1 - f_{thc})\\Delta Q_{fh,c}',
    isBoxedImplemented: true,
    summary:
      'Accounts for excess neutral-base recombination of electrons piled up behind the B-C heterojunction barrier at high forward current densities.',
    physicalDerivation:
      'At high collector currents (iTf > ICK), the large excess electron charge ΔQBf accumulated in the base due to Kirk base push-out and the B-C conduction-band barrier increases neutral-base recombination, causing a steeper rise in base current IB and a sharper drop in DC current gain βDC.',
    variables: [
      { symbolLatex: 'i_{Bh,rec}', meaning: 'Excess high-current base recombination current (ibh_rec)', unit: 'A' },
      { symbolLatex: '\\Delta Q_{Bf}', meaning: 'High-current excess base minority charge (Q_bf)', unit: 'C' },
      { symbolLatex: '\\tau_{Bhrec}', meaning: 'Recombination lifetime for excess base barrier charge', unit: 's', linkedParamId: 'tbhrec' },
    ],
    parameters: ['tbhrec', 'thcs', 'fthc', 'vcbar', 'icbar'],
    circuitElements: ['ibei', 'qf'],
    plotCategory: 'transfer_gummel',
  },
  {
    id: 'eq-2.6.0-7',
    eqNumber: '(2.6.0-7)',
    title: 'Internal Base Resistance Conductivity Modulation ri(Qp)',
    section: '2.6 Internal Base Resistance',
    sectionId: '2.6',
    manualPage: 45,
    manualLines: 'p. 45, ll. 12–15; p. 47, ll. 10–13 (Eqs. 2.6.0-7 & 2.6.0-15)',
    vaReference: 'Lines 1637–1645 (Block HICRBI)',
    latex:
      'r_i = \\frac{r_{Bi0}}{f(q_r)}, \\quad q_r = 1 + \\frac{Q_{jEi} + Q_{jCi} + Q_f}{(1 + f_{dQr0}) Q_{p0}}, \\quad f(q_r) = \\frac{q_r + \\sqrt{q_r^2 + 0.01}}{2}',
    isBoxedImplemented: true,
    summary:
      'Models the reduction of the intrinsic base sheet resistance ri from its zero-bias value rBi0 due to majority hole accumulation.',
    physicalDerivation:
      'The sheet resistance of the thin intrinsic base pinch layer under the emitter window is inversely proportional to the total mobile hole sheet concentration. As forward bias increases QjEi and high-injection minority charge Qf, charge neutrality draws additional holes into the base, lowering ri. Parameter fdQr0 corrects for spatial differences between the depletion edge modulation and the GICCR hole charge Qp0.',
    variables: [
      { symbolLatex: 'r_i', meaning: 'Conductivity-modulated low-crowding internal base resistance', unit: '\\Omega' },
      { symbolLatex: 'r_{Bi0}', meaning: 'Zero-bias internal base sheet resistance', unit: '\\Omega', linkedParamId: 'rbi0' },
      { symbolLatex: 'f_{dQr0}', meaning: 'Correction factor for SCL modulation of base resistance', unit: '-', linkedParamId: 'fdqr0' },
      { symbolLatex: 'q_r', meaning: 'Normalized modulated hole charge ratio (Qz_nom)', unit: '-' },
    ],
    parameters: ['rbi0', 'fdqr0', 'qp0'],
    circuitElements: ['rbi'],
    plotCategory: 'base_resistance',
  },
  {
    id: 'eq-2.6.0-14',
    eqNumber: '(2.6.0-14)',
    title: 'DC Emitter Current Crowding Function ψ(η)',
    section: '2.6 Internal Base Resistance',
    sectionId: '2.6',
    manualPage: 47,
    manualLines: 'p. 47, ll. 1–17 (Eqs. 2.6.0-12 to 2.6.0-17)',
    vaReference: 'Lines 1647–1654 (ETA and rbi in HICRBI)',
    latex:
      'r_{Bi} = r_i \\psi(\\eta), \\quad \\psi(\\eta) = \\frac{\\ln(1 + \\eta)}{\\eta}, \\quad \\eta = f_{geo} \\frac{r_i i_{BEi}}{V_T}',
    isBoxedImplemented: true,
    summary:
      'Describes the DC and low-frequency reduction of internal base resistance caused by lateral voltage drop and emitter current crowding toward the emitter perimeter.',
    physicalDerivation:
      'Lateral base current iBEi flowing through the resistive pinch base creates a lateral voltage drop from the emitter edge B* toward the center of the emitter stripe. Because local injection depends exponentially on vB\'E\'/VT, current crowds toward the emitter edges, shortening the effective lateral path length and reducing rBi by ψ(η) = ln(1+η)/η. The layout factor fgeo (0.6557 for a long stripe) accounts for rectangular geometry.',
    variables: [
      { symbolLatex: 'r_{Bi}', meaning: 'Crowding-corrected internal base resistance', unit: '\\Omega' },
      { symbolLatex: '\\psi(\\eta)', meaning: 'Emitter current crowding reduction function', unit: '-' },
      { symbolLatex: '\\eta', meaning: 'Normalized lateral base voltage drop parameter (ETA)', unit: '-' },
      { symbolLatex: 'f_{geo}', meaning: 'Geometry factor for current crowding', unit: '-', linkedParamId: 'fgeo' },
    ],
    parameters: ['rbi0', 'fgeo', 'ibeis'],
    circuitElements: ['rbi', 'ibei'],
    plotCategory: 'base_resistance',
  },
  {
    id: 'eq-2.6.0-20',
    eqNumber: '(2.6.0-20)',
    title: 'Dynamic Peripheral Charge Reduction of Internal Base Resistance',
    section: '2.6 Internal Base Resistance',
    sectionId: '2.6',
    manualPage: 48,
    manualLines: 'p. 48, l. 12 (Ch. 2.6, ll. 7–16)',
    vaReference: 'Lines 1656–1658 (fqi in HICRBI)',
    latex:
      'r_{Bi}^* = r_{Bi} \\frac{Q_{jEi} + f_{Qi} Q_f}{Q_{jEi} + Q_f}',
    isBoxedImplemented: true,
    summary:
      'Reduces the effective high-frequency internal base resistance rBi* when a fraction (1 - fQi) of the forward minority charge Qf is stored at the emitter periphery.',
    physicalDerivation:
      'In HICUM, the total forward diffusion charge Qf is connected for simplicity to the internal base node B\'. However, a peripheral fraction (1 - fQi)Qf physically resides near the emitter sidewall node B* and does not flow through rBi. Scaling rBi by (QjEi + fQi Qf)/(QjEi + Qf) preserves the exact high-frequency input impedance and maximum oscillation frequency fmax.',
    variables: [
      { symbolLatex: 'r_{Bi}^*', meaning: 'Final effective internal base resistance (rbi in VA)', unit: '\\Omega' },
      { symbolLatex: 'f_{Qi}', meaning: 'Ratio of internal to total minority diffusion charge', unit: '-', linkedParamId: 'fqi' },
      { symbolLatex: 'Q_{jEi}', meaning: 'Internal B-E depletion charge', unit: 'C' },
      { symbolLatex: 'Q_f', meaning: 'Total forward minority charge', unit: 'C' },
    ],
    parameters: ['rbi0', 'fqi', 'fdqr0', 'fgeo'],
    circuitElements: ['rbi'],
    plotCategory: 'base_resistance',
  },
  {
    id: 'eq-2.7.0-25',
    eqNumber: '(2.7.0-25)',
    title: 'Parasitic B-E Isolation Capacitance Partitioning (CBEpar)',
    section: '2.7 External (Parasitic) Bias-Independent Capacitances',
    sectionId: '2.7',
    manualPage: 51,
    manualLines: 'p. 51, ll. 12–15 (Eqs. 2.7.0-24 & 2.7.0-25; Fig. 2.7.0/3, p. 53)',
    vaReference: 'Lines 985–986, 1822–1823 (cbepar1 on br_be, cbepar2 on br_bpe)',
    latex:
      'C_{BEpar2} = f_{BEpar} C_{BEpar}, \\quad C_{BEpar1} = (1 - f_{BEpar}) C_{BEpar}',
    isBoxedImplemented: true,
    summary:
      'Partitions the bias- and temperature-independent oxide overlap capacitance CBEpar between the external base terminal B and perimeter base node B*.',
    physicalDerivation:
      'In double-polysilicon and self-aligned HBT structures, the thin spacer oxide between theemitter polysilicon overhang and the extrinsic base polysilicon creates a significant linear parasitic capacitance CBEpar. Depending on where the poly-base contact sits relative to the spacer, fBEpar splits CBEpar between (B*, E) and (B, E).',
    variables: [
      { symbolLatex: 'C_{BEpar}', meaning: 'Total parasitic B-E isolation capacitance', unit: 'F', linkedParamId: 'cbepar' },
      { symbolLatex: 'f_{BEpar}', meaning: 'Partitioning factor toward perimeter node B*', unit: '-', linkedParamId: 'fbepar' },
      { symbolLatex: 'C_{BEpar1}', meaning: 'Outer B-E parasitic capacitance between B and E', unit: 'F' },
      { symbolLatex: 'C_{BEpar2}', meaning: 'Inner B-E parasitic capacitance between B* and E', unit: 'F' },
    ],
    parameters: ['cbepar', 'fbepar'],
    circuitElements: ['cbepar1', 'cbepar2'],
    plotCategory: 'depletion_cap',
  },
  {
    id: 'eq-2.8.1-1',
    eqNumber: '(2.8.1-1)',
    title: 'Physical Composition of External Series Resistances (rBx, rCx, rE)',
    section: '2.8 External Series Resistances',
    sectionId: '2.8',
    manualPage: 54,
    manualLines: 'p. 54, l. 13; p. 55, l. 9; p. 56, ll. 1–15 (Eqs. 2.8.1-1 & 2.8.2-1)',
    vaReference: 'Lines 1796–1800, 1831–1840 (rbx_t, rcx_t, re_t)',
    latex:
      'r_{Bx} = r_{KB} + r_{po} + r_{pm} + r_{sp}, \\quad r_{Cx} = r_{KC} + r_{sink} + r_{bl}',
    isBoxedImplemented: false,
    summary:
      'Decomposes the lumped extrinsic base resistance rBx and collector series resistance rCx into physical layout sub-regions for geometry scaling (TRADICA).',
    physicalDerivation:
      'Extrinsic base resistance rBx comprises the base contact transition resistance rKB, poly/silicide resistance outside the contact rpo, metal-silicide transition rpm, and link-base spacer region resistance rsp under the emitter sidewall spacer. Similarly, external collector resistance rCx sums the collector contact resistance rKC, deep n+ sinker resistance rsink, and buried-layer sheet resistance rbl.',
    variables: [
      { symbolLatex: 'r_{Bx}', meaning: 'Total external base series resistance', unit: '\\Omega', linkedParamId: 'rbx' },
      { symbolLatex: 'r_{Cx}', meaning: 'Total external collector series resistance', unit: '\\Omega', linkedParamId: 'rcx' },
      { symbolLatex: 'r_E', meaning: 'Emitter contact and polysilicon series resistance', unit: '\\Omega', linkedParamId: 're' },
      { symbolLatex: 'r_{sp}, r_{bl}', meaning: 'Spacer link-base and buried-layer sheet resistances', unit: '\\Omega' },
    ],
    parameters: ['rbx', 'rcx', 're'],
    circuitElements: ['rbx', 'rcx', 're'],
    plotCategory: 'base_resistance',
  },
  {
    id: 'eq-2.9.1-1',
    eqNumber: '(2.9.1-1)',
    title: 'Vertical Non-Quasi-Static (NQS) Delay Times & Bessel/RC Networks',
    section: '2.9 Non-Quasi-Static (NQS) Effects',
    sectionId: '2.9',
    manualPage: 57,
    manualLines: 'p. 57, l. 9 (Ch. 2.9.1, pp. 57–58, ll. 1–26)',
    vaReference: 'Lines 1760–1783, 1873–1880 (xf1, xf2, xf adjunct networks)',
    latex:
      '\\tau_2 = \\alpha_{Qf} \\tau_f, \\quad \\tau_m = \\alpha_{iT} \\tau_f, \\quad \\frac{d^2 i_{Tf,\\text{NQS}}}{dt^2} + \\frac{3}{\\tau_m}\\frac{d i_{Tf,\\text{NQS}}}{dt} + \\frac{3}{\\tau_m^2} i_{Tf,\\text{NQS}} = \\frac{3}{\\tau_m^2} i_{Tf}',
    isBoxedImplemented: true,
    summary:
      'Models high-frequency excess phase in the transfer current iTf via a 2nd-order Bessel LCR network (xf1, xf2) and in the forward minority charge Qf via a 1st-order RC network (xf).',
    physicalDerivation:
      'At frequencies approaching fT, minority carriers in the base cannot follow rapid voltage changes instantaneously. Expanding the small-signal continuity equation in frequency yields an excess delay τ2 = αQf τf (≈ τf/6) for the base charge Qf and a 2nd-order Bessel filter with delay τm = αiT τf (≈ τf/3) for the collector transfer current iTf. In Verilog-A, these are realized continuously in time and frequency without access to past simulator time steps using internal adjunct nodes xf, xf1, and xf2 scaled by t0/Tf.',
    variables: [
      { symbolLatex: '\\tau_2', meaning: 'Vertical NQS delay time for minority charge Qf', unit: 's' },
      { symbolLatex: '\\tau_m', meaning: 'Vertical NQS excess phase delay time for transfer current iTf', unit: 's' },
      { symbolLatex: '\\alpha_{Qf}', meaning: 'Factor for additional NQS delay of minority charge (~1/6)', unit: '-', linkedParamId: 'alqf' },
      { symbolLatex: '\\alpha_{iT}', meaning: 'Factor for additional NQS delay of transfer current (~1/3)', unit: '-', linkedParamId: 'alit' },
    ],
    parameters: ['flnqs', 'alqf', 'alit', 't0'],
    circuitElements: ['nqs_it', 'nqs_qf', 'it', 'qf'],
    plotCategory: 'noise_nqs_substrate',
  },
  {
    id: 'eq-2.9.2-1',
    eqNumber: '(2.9.2-1)',
    title: 'Lateral NQS AC Crowding Shunt Capacitance CrBi',
    section: '2.9 Non-Quasi-Static (NQS) Effects',
    sectionId: '2.9',
    manualPage: 58,
    manualLines: 'p. 58, ll. 19–21; p. 59, ll. 6, 18 (Eqs. 2.9.2-1 to 2.9.2-4)',
    vaReference: 'Lines 1603–1608, 1803 (Cdei, Cdci, Crbi, qrbi)',
    latex:
      'C_{rBi} = f_{CrBi}\\left(C_{jEi} + C_{jCi} + C_{dEi} + C_{dCi}\\right), \\quad Q_{rBi} = C_{rBi} v_{B^*B\'}',
    isBoxedImplemented: true,
    summary:
      'Models high-frequency (AC) emitter current crowding across the distributed RC base network via a bias-dependent shunt capacitor CrBi parallel to rBi*.',
    physicalDerivation:
      'The intrinsic base under the emitter window is physically a distributed RC transmission line. At high frequencies, capacitive displacement currents through CjEi, CjCi, and the diffusion capacitances CdEi = τf0 iTf/VT and CdCi = τr iTr/VT bypass the lateral resistance rBi*. A first-order analytical reduction of the distributed transmission line yields a parallel capacitance CrBi = fCrBi * C_total with theoretical value fCrBi ≈ 0.2.',
    variables: [
      { symbolLatex: 'C_{rBi}', meaning: 'Shunt capacitance across internal base resistance rBi*', unit: 'F' },
      { symbolLatex: 'f_{CrBi}', meaning: 'Ratio of HF shunt capacitance to total internal capacitance', unit: '-', linkedParamId: 'fcrbi' },
      { symbolLatex: 'C_{dEi}, C_{dCi}', meaning: 'Low-current forward and reverse diffusion capacitances', unit: 'F' },
      { symbolLatex: 'Q_{rBi}', meaning: 'Dynamic charge stored on CrBi (qrbi)', unit: 'C' },
    ],
    parameters: ['fcrbi', 'rbi0'],
    circuitElements: ['crbi', 'rbi'],
    plotCategory: 'noise_nqs_substrate',
  },
  {
    id: 'eq-2.10.1-2',
    eqNumber: '(2.10.1-2)',
    title: 'Collector-Base Avalanche Breakdown Current iAVL',
    section: '2.10 Breakdown & Band-to-Band Tunneling',
    sectionId: '2.10',
    manualPage: 60,
    manualLines: 'p. 60, ll. 11–18; p. 61, l. 1 (Eqs. 2.10.1-1 to 2.10.1-5)',
    vaReference: 'Lines 1617–1631, 1824 (Block HICAVL)',
    latex:
      'i_{AVL} = \\frac{i_{Tf} g_{AVL}}{1 - k_{AVL} g_{AVL}}, \\quad g_{AVL} = f_{AVL}(V_{DCi} - v_{B\'C\'}) \\exp\\left(-\\frac{q_{AVL}}{C_{jCi}(V_{DCi} - v_{B\'C\')}}\\right)',
    isBoxedImplemented: true,
    summary:
      'Models weak impact ionization (avalanche multiplication) in the high-field B-C space-charge region as a function of the depletion capacitance CjCi.',
    physicalDerivation:
      'Derived from Chynoweth\'s impact ionization law integrated across the B-C depletion layer. Because the maximum electric field Em at the B-C junction is directly proportional to the depletion charge density and thus to CjCi * (VDCi - vB\'C\'), expressing the ionization exponent in terms of qAVL / (CjCi * v_bord) makes the model valid across arbitrarycollector doping profiles. For high reverse bias (v_bord > U0 = qAVL/CjCi0), HICUM linearizes the exponential to guarantee unconditional numerical convergence.',
    variables: [
      { symbolLatex: 'i_{AVL}', meaning: 'Avalanche multiplication current flowing from C\' to B\'', unit: 'A' },
      { symbolLatex: 'f_{AVL}', meaning: 'Avalanche current prefactor', unit: 'V^{-1}', linkedParamId: 'favl' },
      { symbolLatex: 'q_{AVL}', meaning: 'Exponent factor for avalanche current', unit: 'C', linkedParamId: 'qavl' },
      { symbolLatex: 'C_{jCi}', meaning: 'Internal B-C depletion capacitance', unit: 'F' },
      { symbolLatex: 'V_{DCi}', meaning: 'Internal B-C built-in potential', unit: 'V', linkedParamId: 'vdci' },
    ],
    parameters: ['favl', 'qavl', 'alfav', 'alqav', 'vdci', 'cjci0'],
    circuitElements: ['iavl', 'cjci'],
    plotCategory: 'breakdown_tunneling',
  },
  {
    id: 'eq-2.10.2-7',
    eqNumber: '(2.10.2-7)',
    title: 'Emitter-Base Band-to-Band Tunneling Current iBEt',
    section: '2.10 Breakdown & Band-to-Band Tunneling',
    sectionId: '2.10',
    manualPage: 63,
    manualLines: 'p. 63, l. 9 (Ch. 2.10.2, pp. 62–64, Eqs. 2.10.2-1 to 2.10.2-9)',
    vaReference: 'Lines 1671–1686, 1807–1811 (Block HICTUN)',
    latex:
      'i_{BEt} = I_{BEtS} \\left(-\\frac{v_{BE}}{V_{DE}}\\right) \\left(\\frac{C_{jE}}{C_{jE0}}\\right)^{1 - 1/z_E} \\exp\\left[-a_{BEt}\\left(\\frac{C_{jE}}{C_{jE0}}\\right)^{1/z_E - 1}\\right]',
    isBoxedImplemented: true,
    summary:
      'Describes Zener band-to-band tunneling current across the heavily doped B-E junction under reverse bias, selectable at either the perimeter (B*E\') or internal (B\'E\') node via tunode.',
    physicalDerivation:
      'In high-speed HBTs with high base and emitter doping concentrations, reverse B-E bias creates a strong electric field (> 10^6 V/cm) that enables direct quantum-mechanical band-to-band tunneling of electrons from the valence band of the p+ base to the conduction band of the n+ emitter. Expressing the local electric field via the normalized depletion capacitance CjE/CjE0 avoids separate electric-field parameters.',
    variables: [
      { symbolLatex: 'i_{BEt}', meaning: 'Reverse B-E band-to-band tunneling current (ibet)', unit: 'A' },
      { symbolLatex: 'I_{BEtS}', meaning: 'B-E tunneling saturation current prefactor', unit: 'A', linkedParamId: 'ibets' },
      { symbolLatex: 'a_{BEt}', meaning: 'Tunneling exponent factor', unit: '-', linkedParamId: 'abet' },
      { symbolLatex: 'C_{jE}/C_{jE0}', meaning: 'Normalized B-E depletion capacitance (perimeter if tunode=1, internal if tunode=0)', unit: '-' },
    ],
    parameters: ['ibets', 'abet', 'tunode', 'cjep0', 'vdep', 'zep'],
    circuitElements: ['ibet'],
    plotCategory: 'breakdown_tunneling',
  },
  {
    id: 'eq-2.12.0-10',
    eqNumber: '(2.12.0-10)',
    title: 'Parasitic Substrate Transistor Transfer Current iTS & Charge QdS',
    section: '2.11–2.12 Substrate Network & Parasitic Substrate Transistor',
    sectionId: '2.12',
    manualPage: 67,
    manualLines: 'p. 67, l. 22; p. 68, ll. 4–8 (Eqs. 2.12.0-10 to 2.12.0-12)',
    vaReference: 'Lines 1712–1735, 1819, 1821, 1826 (Sub_Transfer)',
    latex:
      'i_{TS} = I_{TSS}\\left[\\exp\\left(\\frac{v_{B^*C\'}}{m_{Sf}V_T}\\right) - \\exp\\left(\\frac{v_{S\'C\'}}{m_{Sf}V_T}\\right)\\right], \\quad Q_{dS} = \\tau_{Sf} I_{TSS} \\exp\\left(\\frac{v_{B^*C\'}}{m_{Sf}V_T}\\right)',
    isBoxedImplemented: true,
    summary:
      'Models the parasitic vertical p-n-p substrate transistor formed by the extrinsic base B*, epitaxial collector C\', and p-type substrate S\'.',
    physicalDerivation:
      'When the npn transistor enters deep saturation (forward B*-C\' bias), holes injected from the extrinsic base into the collector can reach the reverse-biased collector-substrate junction S\'-C\', turning on the parasitic p-n-p substrate transistor. HICUM models this with a simplified GICCR transfer current source iTS (HSI_Tsu) between B* and S\' and diffusion charge QdS (Qdsu) across B*-C\'.',
    variables: [
      { symbolLatex: 'i_{TS}', meaning: 'Substrate transistor transfer current (HSI_Tsu)', unit: 'A' },
      { symbolLatex: 'I_{TSS}', meaning: 'Substrate transistor transfer saturation current', unit: 'A', linkedParamId: 'itss' },
      { symbolLatex: 'm_{Sf}', meaning: 'Forward ideality factor of substrate transfer current', unit: '-', linkedParamId: 'msf' },
      { symbolLatex: 'Q_{dS}', meaning: 'Substrate minority diffusion charge (Qdsu)', unit: 'C' },
      { symbolLatex: '\\tau_{Sf}', meaning: 'Forward transit time of substrate transistor', unit: 's', linkedParamId: 'tsf' },
    ],
    parameters: ['itss', 'msf', 'tsf', 'iscs', 'msc', 'rsu', 'csu'],
    circuitElements: ['its', 'qdsu', 'ijsc', 'rsu', 'csu'],
    plotCategory: 'noise_nqs_substrate',
  },
  {
    id: 'eq-2.13.1-1',
    eqNumber: '(2.13.1-1)',
    title: 'Thermal Noise of Series Resistances & Junction Shot Noise',
    section: '2.13 Noise Model & HF Shot Noise Correlation',
    sectionId: '2.13',
    manualPage: 70,
    manualLines: 'p. 70, ll. 3–10 (Eqs. 2.13.1-1 to 2.13.1-3; Fig. 2.13.0/1, p. 69)',
    vaReference: 'Lines 1886–1902, 1918–1930 (Noise_sources)',
    latex:
      '\\overline{i_{n,r}^2} = \\frac{4 k_B T_{\\text{dev}} \\Delta f}{r}, \\quad \\overline{i_{n,d}^2} = 2 q |I| \\Delta f',
    isBoxedImplemented: true,
    summary:
      'Nyquist thermal white noise generated by resistive elements (rBi*, rBx, rCx, rE, rSu) and Poisson shot noise across p-n junctions and avalanche current.',
    physicalDerivation:
      'Every physical series resistance in the equivalent circuit generates thermal velocity-fluctuation noise proportional to the local Kelvin temperature Tdev (including self-heating). Independently, discrete carrier crossings across potential barriers (iBEi, iBEp, iBCi, ijBCx, ijSC, iAVL, iT) produce white shot noise with spectral density 2q|I|.',
    variables: [
      { symbolLatex: '\\overline{i_{n,r}^2}', meaning: 'Mean-square thermal noise current in bandwidth Δf', unit: 'A^2' },
      { symbolLatex: '\\overline{i_{n,d}^2}', meaning: 'Mean-square shot noise current in bandwidth Δf', unit: 'A^2' },
      { symbolLatex: 'T_{\\text{dev}}', meaning: 'Actual local device temperature in Kelvin', unit: 'K' },
    ],
    parameters: ['rbi0', 'rbx', 'rcx', 're', 'rsu'],
    circuitElements: ['rbi', 'rbx', 'rcx', 're', 'rsu', 'ibei', 'ibep', 'it'],
    plotCategory: 'noise_nqs_substrate',
  },
  {
    id: 'eq-2.13.2-1',
    eqNumber: '(2.13.2-1)',
    title: 'Correlated Base-Emitter & Emitter-Resistance Flicker (1/f) Noise',
    section: '2.13 Noise Model & HF Shot Noise Correlation',
    sectionId: '2.13',
    manualPage: 70,
    manualLines: 'p. 70, l. 16; p. 71, l. 4 (Eqs. 2.13.2-1 & 2.13.2-2)',
    vaReference: 'Lines 1904–1916 (flicker and flicker_re in Noise_sources)',
    latex:
      'S_{i,BE}(f) = k_F (|i_{BEi} + i_{BEp}|)^{a_F} \\frac{1}{f}, \\quad S_{i,rE}(f) = k_{FrE} |i_{rE}|^{a_{FrE}} \\frac{1}{f}',
    isBoxedImplemented: true,
    summary:
      'Low-frequency 1/f flicker noise from carrier trapping at the B-E interface (tagged to B\'E\' or B*E\' via cfbe) and grain-boundary fluctuations in polysilicon emitter resistance rE.',
    physicalDerivation:
      'Flicker noise in polysilicon-emitter bipolar transistors arises from two main sources: (1) interfacial oxide/trap fluctuations at the emitter-base junction driven by the total injection current |iBEi + iBEp| (which can be placed at the intrinsic node B\'E\' for cfbe = -1 or perimeter node B*E\' for cfbe = -2), and (2) resistance fluctuations across the interfacial oxide in the emitter series resistance rE.',
    variables: [
      { symbolLatex: 'S_{i,BE}(f)', meaning: 'B-E flicker noise power spectral density', unit: 'A^2/Hz' },
      { symbolLatex: 'k_F, a_F', meaning: 'B-E flicker noise coefficient and current exponent', unit: '-', linkedParamId: 'kf' },
      { symbolLatex: 'k_{FrE}, a_{FrE}', meaning: 'Emitter resistance flicker noise coefficient and exponent', unit: '-', linkedParamId: 'kfre' },
    ],
    parameters: ['kf', 'af', 'cfbe', 'kfre', 'afre'],
    circuitElements: ['ibei', 'ibep', 're'],
    plotCategory: 'noise_nqs_substrate',
  },
  {
    id: 'eq-2.13.3-2',
    eqNumber: '(2.13.3-2)',
    title: 'Correlated High-Frequency Base & Collector Shot Noise (flcono=1)',
    section: '2.13 Noise Model & HF Shot Noise Correlation',
    sectionId: '2.13',
    manualPage: 71,
    manualLines: 'p. 71, ll. 9–15 (Eqs. 2.13.3-1 to 2.13.3-4)',
    vaReference: 'Lines 1933–1964 (b_n1 and b_n2 in Noise_sources)',
    latex:
      'S_{i_{nb}i_{nc}^*} = 2 q I_T (j\\omega \\alpha_{iT} \\tau_f), \\quad S_{i_{nb}} = 2 q I_{BEi}\\left[1 + \\omega^2 \\tau_f^2 \\beta_{DC}(2\\alpha_{Qf} - \\alpha_{iT}^2)\\right] + 2 q I_T \\omega^2 (\\alpha_{iT}\\tau_f)^2',
    isBoxedImplemented: true,
    summary:
      'Models the physical transport correlation between base and collector HF shot noise currents caused by finite transit delay τf through the base.',
    physicalDerivation:
      'Because the same electrons injected across the B-E junction arrive at the collector after the NQS transit delay τf, the high-frequency capacitive base noise current inb and collector shot noise current inc are partially correlated. Using adjunct noise branches b_n1 and b_n2 with time-derivative coupling ddt(), HICUM reproduces the exact cross-spectral density and minimum noise figure NFmin(f) in the GHz/mm-wave regime.',
    variables: [
      { symbolLatex: 'S_{i_{nb}i_{nc}^*}', meaning: 'Cross-power spectral density between base and collector noise', unit: 'A^2/Hz' },
      { symbolLatex: 'S_{i_{nb}}', meaning: 'Total high-frequency base noise current spectral density', unit: 'A^2/Hz' },
      { symbolLatex: 'n_1, n_2', meaning: 'First-order delay coupling time constants τf αiT and τf sqrt(βDC(2αQf - αiT^2))', unit: 's' },
    ],
    parameters: ['flcono', 'alit', 'alqf'],
    circuitElements: ['noise_corr', 'ibei', 'it'],
    plotCategory: 'noise_nqs_substrate',
  },
  {
    id: 'eq-2.14.1-1',
    eqNumber: '(2.14.1-1)',
    title: 'Nonlinear Temperature-Dependent Bandgap Voltage Vg(T) & Intrinsic Density nie(T)',
    section: '2.14 Temperature Dependence',
    sectionId: '2.14',
    manualPage: 73,
    manualLines: 'p. 73, l. 20; p. 74, ll. 4–13 (Eqs. 2.14.1-1 to 2.14.1-5)',
    vaReference: 'Lines 955–964, 1017–1021 (vgb_t, vge_t, mg)',
    latex:
      'V_g(T) = V_g(0) + K_1 T \\ln(T) + K_2 T, \\quad n_{ie}^2(T) = n_{ie}^2(T_0) \\left(\\frac{T}{T_0}\\right)^{m_g} \\exp\\left[\\frac{V_g(0)}{V_T}\\left(\\frac{T}{T_0} - 1\\right)\\right]',
    isBoxedImplemented: true,
    summary:
      'Physics-based temperature dependence of the effective semiconductor bandgap Vg(T) and squared effective intrinsic carrier density nie^2(T) across emitter, base, collector, and substrate.',
    physicalDerivation:
      'A log-linear expansion Vg(T) = Vg(0) + K1 T ln(T) + K2 T accurately matches experimental silicon/SiGe bandgap narrowing from cryogenic to high temperatures and yields a clean analytical power-exponential expression for nie^2(T) with effective exponent mg = 3 - q K1 / kB.',
    variables: [
      { symbolLatex: 'V_g(0)', meaning: 'Zero-Kelvin extrapolated bandgap voltage (vgb, vge, vgc, vgs)', unit: 'V', linkedParamId: 'vgb' },
      { symbolLatex: 'K_1', meaning: 'Logarithmic bandgap temperature coefficient (f1vg)', unit: 'V/K', linkedParamId: 'f1vg' },
      { symbolLatex: 'K_2', meaning: 'Linear bandgap temperature coefficient (f2vg)', unit: 'V/K', linkedParamId: 'f2vg' },
      { symbolLatex: 'm_g', meaning: 'Effective density-of-states temperature exponent 3 - q K1 / kB', unit: '-' },
    ],
    parameters: ['vgb', 'vge', 'vgc', 'vgs', 'f1vg', 'f2vg'],
    circuitElements: ['it', 'ibei', 'ibep', 'ibci'],
    plotCategory: 'temperature_selfheating',
  },
  {
    id: 'eq-2.14.2-1',
    eqNumber: '(2.14.2-1)',
    title: 'Temperature Scaling of GICCR Constant c10(T) & Zero-Bias Hole Charge Qp0(T)',
    section: '2.14 Temperature Dependence',
    sectionId: '2.14',
    manualPage: 76,
    manualLines: 'p. 76, ll. 5–7; p. 77, l. 8 (Eqs. 2.14.2-1, 2.14.2-2 & 2.14.3-1)',
    vaReference: 'Lines 1090–1091, 1105, 1309–1310, 1324 (c10_t and qp0_t)',
    latex:
      'c_{10}(T) = c_{10}(T_0)\\left(\\frac{T}{T_0}\\right)^{\\zeta_{CT}}\\exp\\left[\\frac{V_{gB}}{V_T}\\left(\\frac{T}{T_0}-1\\right)\\right], \\quad Q_{p0}(T) = Q_{p0}(T_0)\\left[2 - \\left(\\frac{V_{DEi}(T)}{V_{DEi}(T_0)}\\right)^{z_{Ei}}\\right]',
    isBoxedImplemented: true,
    summary:
      'Describes the strong exponential temperature scaling of the GICCR prefactor c10(T) and the depletion-modulated scaling of the zero-bias base hole charge Qp0(T).',
    physicalDerivation:
      'The GICCR constant c10 is proportional to VT μnB(T) niB^2(T), leading to the power exponent ζCT = mg + 1 - ζμnB and exponential activation by the base bandgap VgB. Meanwhile, as temperature rises, the B-E built-in potential VDEi(T) decreases, narrowing the zero-bias B-E depletion zone and slightly increasing the neutral base hole charge Qp0(T).',
    variables: [
      { symbolLatex: 'c_{10}(T)', meaning: 'Temperature-updated GICCR constant (c10_t)', unit: 'A^2s', linkedParamId: 'c10' },
      { symbolLatex: '\\zeta_{CT}', meaning: 'Temperature exponent for transfer current', unit: '-', linkedParamId: 'zetact' },
      { symbolLatex: 'V_{gB}', meaning: 'Base bandgap voltage extrapolated to 0 K', unit: 'V', linkedParamId: 'vgb' },
      { symbolLatex: 'Q_{p0}(T)', meaning: 'Temperature-updated zero-bias hole charge (qp0_t)', unit: 'C', linkedParamId: 'qp0' },
    ],
    parameters: ['c10', 'zetact', 'vgb', 'qp0', 'vdei', 'zei'],
    circuitElements: ['it'],
    plotCategory: 'temperature_selfheating',
  },
  {
    id: 'eq-2.14.4-1',
    eqNumber: '(2.14.4-1)',
    title: 'Temperature Dependence of HBT Charge Weighting Factors',
    section: '2.14 Temperature Dependence',
    sectionId: '2.14',
    manualPage: 78,
    manualLines: 'p. 78, l. 9; p. 79, ll. 1–14 (Eqs. 2.14.4-1 to 2.14.4-3 & Table 2.14.4/1)',
    vaReference: 'Lines 1196–1205, 1415–1424 (hf0_t, hfe_t, hfc_t, hjei0_t, ahjei_t)',
    latex:
      'h_{f0}(T) = h_{f0}(T_0)\\exp\\left[\\frac{\\Delta V_{gBE}}{V_T}\\left(\\frac{T}{T_0}-1\\right)\\right], \\quad h_{fE}(T) = h_{fE}(T_0)\\exp\\left[\\frac{V_{gB}-V_{gE}}{V_T}\\left(\\frac{T}{T_0}-1\\right)\\right]',
    isBoxedImplemented: true,
    summary:
      'Models the thermally activated variation of HBT charge weights (hf0, hfE, hfC, hjEi0, ahjEi) caused by heterojunction bandgap differences ΔVg.',
    physicalDerivation:
      'In a heterojunction bipolar transistor, the GICCR weighting factors are proportional to the ratio of intrinsic carrier densities ni^2(region)/niB^2(base), which depends exponentially on the local bandgap difference ΔVg / VT. Including this temperature scaling accurately predicts the negative temperature coefficient of current gain and fT in SiGe HBTs.',
    variables: [
      { symbolLatex: '\\Delta V_{gBE}', meaning: 'Bandgap difference between base and B-E junction (dvgbe)', unit: 'V', linkedParamId: 'dvgbe' },
      { symbolLatex: 'h_{f0}(T), h_{fE}(T), h_{fC}(T)', meaning: 'Temperature-scaled minority charge weights', unit: '-' },
      { symbolLatex: 'h_{jEi0}(T), a_{hjEi}(T)', meaning: 'Temperature-scaled B-E depletion weight parameters', unit: '-' },
    ],
    parameters: ['hf0', 'hfe', 'hfc', 'hjei', 'ahjei', 'dvgbe', 'zetavgbe', 'zetahjei'],
    circuitElements: ['it', 'qf', 'cjei'],
    plotCategory: 'temperature_selfheating',
  },
  {
    id: 'eq-2.14.5-4',
    eqNumber: '(2.14.5-4)',
    title: 'Temperature Scaling of Junction Injection & Recombination Saturation Currents',
    section: '2.14 Temperature Dependence',
    sectionId: '2.14',
    manualPage: 80,
    manualLines: 'p. 80, ll. 1–18; p. 81, ll. 1–18 (Eqs. 2.14.5-1 to 2.14.5-6 & Table 2.14.5/1)',
    vaReference: 'Lines 1068–1088, 1287–1307 (ibeis_t, ireis_t, ibeps_t, ibcis_t)',
    latex:
      'I_{BEiS}(T) = I_{BEiS}(T_0)\\left(\\frac{T}{T_0}\\right)^{\\zeta_{BET}}\\exp\\left[\\frac{V_{gE}}{V_T}\\left(\\frac{T}{T_0}-1\\right)\\right], \\quad I_{REiS}(T) = I_{REiS}(T_0)\\left(\\frac{T}{T_0}\\right)^{m_g/m_{REi}}\\exp\\left[\\frac{V_{gBE0}}{m_{REi}V_T}\\left(\\frac{T}{T_0}-1\\right)\\right]',
    isBoxedImplemented: true,
    summary:
      'Scales ideal injection saturation currents with the emitter/collector bandgap VgE/VgC and space-charge recombination currents with VgBE0 / mRE.',
    physicalDerivation:
      'Ideal hole injection into the emitter is governed by the emitter intrinsic density niE^2(T) (bandgap VgE and mobility exponent ζBET), whereas Shockley-Read-Hall space-charge recombination is proportional to ni(T)^(2/mRE) evaluated at the average junction bandgap VgBE0 = (VgB + VgE)/2.',
    variables: [
      { symbolLatex: 'I_{BEiS}(T), I_{BEpS}(T)', meaning: 'Temperature-scaled B-E injection saturation currents', unit: 'A' },
      { symbolLatex: 'I_{REiS}(T), I_{REpS}(T)', meaning: 'Temperature-scaled B-E recombination saturation currents', unit: 'A' },
      { symbolLatex: '\\zeta_{BET}', meaning: 'Temperature exponent for B-E junction injection current', unit: '-', linkedParamId: 'zetabet' },
      { symbolLatex: 'V_{gE}', meaning: 'Effective emitter bandgap voltage at 0 K', unit: 'V', linkedParamId: 'vge' },
    ],
    parameters: ['ibeis', 'ireis', 'ibeps', 'ireps', 'ibcis', 'ibcxs', 'zetabet', 'vge', 'vgc'],
    circuitElements: ['ibei', 'ibep', 'ibci', 'ijbcx'],
    plotCategory: 'temperature_selfheating',
  },
  {
    id: 'eq-2.14.6-1',
    eqNumber: '(2.14.6-1)',
    title: 'Temperature Scaling of Collector Transport & Transit Time Parameters',
    section: '2.14 Temperature Dependence',
    sectionId: '2.14',
    manualPage: 83,
    manualLines: 'p. 83, ll. 1–16; p. 84, ll. 5–9 (Eqs. 2.14.6-1 to 2.14.6-8)',
    vaReference: 'Lines 1093, 1108, 1114, 1124, 1127 (rci0_t, vlim_t, vces_t, t0_t, thcs_t)',
    latex:
      'r_{Ci0}(T) = r_{Ci0}(T_0)\\left(\\frac{T}{T_0}\\right)^{\\zeta_{Ci}}, \\quad V_{lim}(T) = V_{lim}(T_0)\\left(\\frac{T}{T_0}\\right)^{\\zeta_{Ci} - a_{vs}}, \\quad \\tau_0(T) = \\tau_0(T_0)\\left(1 + \\alpha_{\\tau 0}\\Delta T + k_{\\tau 0}\\Delta T^2\\right)',
    isBoxedImplemented: true,
    summary:
      'Updates low-field collector resistance rCi0, velocity-saturation voltage Vlim, high-current time constant τhcs, saturation voltage VCEs, and low-current transit time τ0 with temperature.',
    physicalDerivation:
      'Phonon scattering in the lightly doped collector reduces low-field electron mobility as (T/T0)^(-ζCi), increasing rCi0(T) and high-current storage time τhcs(T) = τhcs(T0)(T/T0)^(ζCi - 1). Because saturation drift velocity vsn also decreases with temperature (parameter alvs, avs = alvs*T0), Vlim = wC vsn / μnC0 scales as (T/T0)^(ζCi - avs).',
    variables: [
      { symbolLatex: '\\zeta_{Ci}', meaning: 'Temperature exponent for collector mobility / rCi0', unit: '-', linkedParamId: 'zetaci' },
      { symbolLatex: 'a_{vs}', meaning: 'Normalized saturation velocity TC (alvs * Tnom)', unit: '-', linkedParamId: 'alvs' },
      { symbolLatex: '\\alpha_{\\tau 0}, k_{\\tau 0}', meaning: 'First- and second-order relative TCs of τ0', unit: 'K^{-1}, K^{-2}', linkedParamId: 'alt0' },
      { symbolLatex: '\\alpha_{CEs}', meaning: 'Relative linear temperature coefficient of VCEs', unit: 'K^{-1}', linkedParamId: 'alces' },
    ],
    parameters: ['rci0', 'zetaci', 'vlim', 'alvs', 'vces', 'alces', 't0', 'alt0', 'kt0', 'thcs'],
    circuitElements: ['qf', 'it'],
    plotCategory: 'temperature_selfheating',
  },
  {
    id: 'eq-2.14.7-4',
    eqNumber: '(2.14.7-4)',
    title: 'Temperature Scaling of Depletion Built-In Potential & Capacitance (Macro TMPHICJ)',
    section: '2.14 Temperature Dependence',
    sectionId: '2.14',
    manualPage: 85,
    manualLines: 'p. 85, ll. 4–13; p. 86, ll. 9–12; p. 87, ll. 6–11 (Eqs. 2.14.7-2 to 2.14.8-2)',
    vaReference: 'Lines 584–600 (Macro TMPHICJ), 1024, 1121, 1139, 1164, 1182',
    latex:
      'V_{Dj}(T) = V_{Dj}(T_0)\\frac{T}{T_0} + V_{g,\\text{eff}}\\left(1 - \\frac{T}{T_0}\\right) - m_g V_T \\ln\\left(\\frac{T}{T_0}\\right), \\quad C_{j0}(T) = C_{j0}(T_0)\\left(\\frac{V_D(T_0)}{V_D(T)}\\right)^z',
    isBoxedImplemented: true,
    summary:
      'Non-singular temperature update of junction built-in potential VD(T), zero-bias depletion capacitance Cj0(T), and peak factor aj(T) across all junctions.',
    physicalDerivation:
      'As temperature increases, the intrinsic carrier concentration nie(T) rises exponentially, reducing the built-in potential VDj(T) of a p-n junction. To prevent VDj(T) from ever becoming negative at extreme temperatures, Macro TMPHICJ applies a hyperbolic transformation vdt = vdjt + 2 VT ln(0.5(1 + sqrt(1 + 4 exp(-vdjt/VT)))) and updates Cj0(T) via the depletion width relation (VD(T0)/VD(T))^z.',
    variables: [
      { symbolLatex: 'V_D(T)', meaning: 'Temperature-updated built-in potential (vdei_t, vdci_t, vdep_t, vdcx_t, vds_t)', unit: 'V' },
      { symbolLatex: 'C_{j0}(T)', meaning: 'Temperature-updated zero-bias capacitance', unit: 'F' },
      { symbolLatex: 'V_{g,\\text{eff}}', meaning: 'Average junction bandgap voltage (vgbe0, vgbc0, vgsc0)', unit: 'V' },
    ],
    parameters: ['cjei0', 'vdei', 'zei', 'cjci0', 'vdci', 'zci', 'cjep0', 'vdep', 'zep'],
    circuitElements: ['cjei', 'cjep', 'cjci', 'cjcx1', 'cjcx2', 'cjs', 'cscp'],
    plotCategory: 'temperature_selfheating',
  },
  {
    id: 'eq-2.14.9-1',
    eqNumber: '(2.14.9-1)',
    title: 'Temperature Scaling of Series Resistances & Thermal Resistance Rth(T)',
    section: '2.14 Temperature Dependence',
    sectionId: '2.14',
    manualPage: 88,
    manualLines: 'p. 88, l. 10; p. 92, l. 13 (Eqs. 2.14.9-1 & 2.14.14-1)',
    vaReference: 'Lines 1135, 1174–1176, 1207, 1354, 1393–1395, 1426',
    latex:
      'r_n(T) = r_n(T_0)\\left(\\frac{T}{T_0}\\right)^{\\zeta_{rn}}, \\quad R_{th}(T) = R_{th}(T_0)\\left(1 + \\alpha_{Rth}\\Delta T\\right)\\left(\\frac{T}{T_0}\\right)^{\\zeta_{Rth}}',
    isBoxedImplemented: true,
    summary:
      'Power-law temperature scaling for internal/external series resistances (rBi0, rBx, rCx, rE) and combined power-linear scaling for thermal resistance Rth(T).',
    physicalDerivation:
      'Doped semiconductor regions exhibit mobility degradation with rising temperature governed by impurity and lattice scattering exponents ζrn. Similarly, the thermal conductivity κ(T) of silicon decreases with temperature, increasing the thermal resistance Rth(T) at high power dissipation.',
    variables: [
      { symbolLatex: 'r_n(T)', meaning: 'Temperature-scaled resistance (rbi0_t, rbx_t, rcx_t, re_t)', unit: '\\Omega' },
      { symbolLatex: '\\zeta_{rn}', meaning: 'Temperature exponent (zetarbi, zetarbx, zetarcx, zetare)', unit: '-', linkedParamId: 'zetarbi' },
      { symbolLatex: 'R_{th}(T)', meaning: 'Temperature-scaled thermal resistance (rth_t)', unit: 'K/W', linkedParamId: 'rth' },
      { symbolLatex: '\\zeta_{Rth}, \\alpha_{Rth}', meaning: 'Power-law and linear temperature coefficients for Rth', unit: '-, K^{-1}', linkedParamId: 'zetarth' },
    ],
    parameters: ['zetarbi', 'zetarbx', 'zetarcx', 'zetare', 'rth', 'zetarth', 'alrth'],
    circuitElements: ['rbi', 'rbx', 'rcx', 're', 'rth'],
    plotCategory: 'temperature_selfheating',
  },
  {
    id: 'eq-2.15.0-2',
    eqNumber: '(2.15.0-2)',
    title: 'Electro-Thermal Power Dissipation P & Self-Heating Network',
    section: '2.15 Self-Heating & Electro-Thermal Network',
    sectionId: '2.15',
    manualPage: 93,
    manualLines: 'p. 93, ll. 11, 18 (Eqs. 2.15.0-2 & 2.15.0-3)',
    vaReference: 'Lines 1222–1232, 1738–1754, 1864–1869 (pterm and br_sht)',
    latex:
      'P_{\\text{flsh=1}} = v_{C\'E\'} i_T + (V_{DCi}(T) - v_{B\'C\'}) i_{AVL}, \\quad \\Delta T_j = V(\\text{tnode}) = P \\cdot R_{th}(T) - R_{th}(T) C_{th} \\frac{d\\Delta T_j}{dt}',
    isBoxedImplemented: true,
    summary:
      'Calculates the electrical power P dissipated inside the device (intrinsic-only for flsh=1, all junctions and series resistors for flsh=2) and drives the thermal node T.',
    physicalDerivation:
      'Self-heating is solved self-consistently by injecting the dissipated power P (pterm) as a current source into the thermal node tnode connected to parallel thermal resistance Rth(T) and thermal capacitance Cth. The resulting node voltage V(br_sht) represents the local temperature rise ΔTj above Tnom + ΔT, dynamically updating all temperature-dependent parameters at every Newton iteration.',
    variables: [
      { symbolLatex: 'P', meaning: 'Total dissipated electrical power (pterm)', unit: 'W' },
      { symbolLatex: '\\Delta T_j', meaning: 'Dynamic junction temperature rise V(br_sht) = DTSH', unit: 'K' },
      { symbolLatex: 'R_{th}', meaning: 'Thermal resistance to ambient/heat sink', unit: 'K/W', linkedParamId: 'rth' },
      { symbolLatex: 'C_{th}', meaning: 'Thermal capacitance of the device volume', unit: 'J/K', linkedParamId: 'cth' },
    ],
    parameters: ['flsh', 'rth', 'cth', 'zetarth', 'alrth', 'dt'],
    circuitElements: ['pterm', 'rth', 'cth'],
    plotCategory: 'temperature_selfheating',
  },
  {
    id: 'eq-2.16.1-1',
    eqNumber: '(2.16.1-1)',
    title: '2D/3D Lateral Collector Current Spreading Charge Q_Cf (Macro HICQFC)',
    section: '2.16 Lateral Scaling & 2D/3D Collector Current Spreading',
    sectionId: '2.16',
    manualPage: 94,
    manualLines: 'p. 94, ll. 12–16; p. 96, ll. 1–13 (Eqs. 2.16.1-1 to 2.16.1-9)',
    vaReference: 'Lines 342–474 (Macros HICFCI, HICFCT, HICQFC), 524',
    latex:
      '1 - \\frac{I_{CK}}{i_{Tf}} = \\frac{1 - w}{1 + \\zeta_b w} \\frac{\\ln\\left(\\frac{1 + \\zeta_b w}{1 + \\zeta_l w}\\right)}{\\ln\\left(\\frac{1 + \\zeta_b}{1 + \\zeta_l}\\right)}, \\quad \\Delta Q_{Cf} = f_{thc}\\tau_{hcs} i_{Tf} f_{Ci}(\\zeta_b, \\zeta_l, w) \\exp\\left(\\frac{\\Delta V_{cB}-V_{cBar}}{V_T}\\right)',
    isBoxedImplemented: true,
    summary:
      'Analytical 2D/3D formulation of the collector injection zone width w and stored collector minority charge ΔQCf accounting for lateral current spreading along emitter width (ζb = latb) and length (ζl = latl).',
    physicalDerivation:
      'In modern narrow-stripe HBTs, as the electron current tube travels from the emitter window through the epitaxial collector of thickness wC, it spreads laterally at an angle θ (with ζb = 2 wC tan(θ) / bE0 along the width and ζl = 2 wC tan(θ) / lE0 along the length). This trapezoidal expansion increases the cross-sectional area toward the buried layer, delaying the advance of the injection zone w(iTf/ICK) and modifying the integrated collector charge via function fCi(ζb, ζl, w).',
    variables: [
      { symbolLatex: '\\zeta_b', meaning: 'Collector current spreading factor in emitter width direction (latb)', unit: '-', linkedParamId: 'latb' },
      { symbolLatex: '\\zeta_l', meaning: 'Collector current spreading factor in emitter length direction (latl)', unit: '-', linkedParamId: 'latl' },
      { symbolLatex: 'w', meaning: '3D-corrected normalized injection zone width (FCw)', unit: '-' },
      { symbolLatex: 'f_{Ci}(\\zeta_b, \\zeta_l, w)', meaning: '3D spatial integration factor for collector charge (FCf_ci)', unit: '-' },
    ],
    parameters: ['latb', 'latl', 'thcs', 'fthc', 'ahc'],
    circuitElements: ['qf', 'it'],
    plotCategory: 'critical_current',
  },
  {
    id: 'eq-4.0-ft',
    eqNumber: '(Ch. 4 OP)',
    title: 'Small-Signal Hybrid-π Parameters & Transit Frequency fT',
    section: '4.0 Operating Point Information from Circuit Simulators',
    sectionId: '4.0',
    manualPage: 115,
    manualLines: 'p. 115, Table row 1 (l. 4); pp. 113–115 (Ch. 4 Operating Point Table)',
    vaReference: 'Lines 1980–2062 (Block OPERATING_POINT)',
    latex:
      'f_T = \\frac{g_{mi}}{2\\pi \\left[ C_{\\pi i} + C_{\\pi x} + C_{\\mu i} + C_{\\mu x} + \\left(R_{Cx} + R_E + \\frac{R_E + R_B}{\\beta_{AC}}\\right) g_{mi} (C_{\\mu i} + C_{\\mu x}) \\right]}',
    isBoxedImplemented: true,
    summary:
      'Closed-form small-signal cutoff frequency fT calculated in the Verilog-A OPERATING_POINT block from symbolic ddx() derivatives of charges and currents.',
    physicalDerivation:
      'Using Verilog-A symbolic partial derivatives ddx(), HICUM extracts the exact operating-point transconductance gmi = ∂iT/∂V(bi), input conductances gπi and gπx, diffusion capacitances CdEi = -∂Qdei/∂V(ei) and CdCi = -∂Qdci/∂V(ci), total capacitances Cπ = Cπi + Cπx and Cμ = Cμi + Cμx, and series resistances RB = rBi* + rBx, RCx, and RE to evaluate the regional and extrinsic delay terms in 1/(2π fT).',
    variables: [
      { symbolLatex: 'f_T', meaning: 'Small-signal unity current gain transit frequency (FT)', unit: 'Hz' },
      { symbolLatex: 'g_{mi}', meaning: 'Intrinsic transconductance ∂iT/∂vB\'E\' (GMi)', unit: 'A/V' },
      { symbolLatex: 'C_{\\pi i}, C_{\\pi x}', meaning: 'Total internal (CjEi + CdEi) and external (CjEp + CBEpar) B-E capacitances', unit: 'F' },
      { symbolLatex: 'C_{\\mu i}, C_{\\mu x}', meaning: 'Total internal (CjCi + CdCi) and external (CjCx + CBCpar + CdS) B-C capacitances', unit: 'F' },
      { symbolLatex: '\\beta_{AC}', meaning: 'Small-signal AC current gain gmi / (gπi + gπx)', unit: '-' },
    ],
    parameters: ['t0', 'thcs', 'rci0', 'cjei0', 'cjci0', 'rcx', 're', 'rbx', 'rbi0'],
    circuitElements: ['it', 'qf', 'cjei', 'cjci', 'rbi', 'rbx', 'rcx', 're'],
    plotCategory: 'transit_time_ft',
  },
];
