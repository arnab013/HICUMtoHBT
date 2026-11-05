import {
  BiasState,
  OperatingPointResult,
  PlotCategoryId,
  PlotDataset,
  PlotPoint,
} from '../data/hicumTypes';
import { getDefaultParameterValues } from '../data/hicumParameters';

export type HicumParamMap = Record<string, number>;

export interface ModelCardPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  params: HicumParamMap;
}

export const TEST_MODEL_CARD: HicumParamMap = getDefaultParameterValues(true);

export const DEFAULT_MODEL_CARD: HicumParamMap = getDefaultParameterValues(false);

export const SIGE_HBT_CARD: HicumParamMap = {
  ...TEST_MODEL_CARD,
  hjei: 1.8,
  ahjei: 2.2,
  rhjei: 1.0,
  hjci: 0.45,
  hfe: 2.4,
  hfc: 2.8,
  hf0: 1.15,
  vcbar: 0.032,
  icbar: 0.011,
  acbar: 0.02,
  tbhrec: 25e-12,
  ibets: 2.5e-16,
  abet: 36.0,
  dvgbe: -0.055,
  vgb: 1.12,
  vge: 1.17,
  vgc: 1.15,
  flnqs: 1,
  flcono: 1,
};

export const MODEL_CARD_PRESETS: ModelCardPreset[] = [
  {
    id: 'manual_test',
    name: 'Manual Test Card (Tables 3.1–3.17)',
    badge: 'Verified Reference',
    description:
      'Complete HICUM/L2 v2.4.0 reference test parameter set from Manual Tables 3.1–3.17 activating transit times, depletion charges, series resistances, avalanche, NQS, correlated noise, and self-heating.',
    params: TEST_MODEL_CARD,
  },
  {
    id: 'sige_hetero',
    name: 'High-Speed SiGe HBT (Barrier & Grading)',
    badge: 'SiGe HBT Physics',
    description:
      'Activates HBT bandgap-grading charge weighting factors (hjei, ahjei, hjci, hfe, hfc), high-current BC heterojunction barrier (vcbar, icbar, acbar), and B-E Zener tunneling (ibets, abet).',
    params: SIGE_HBT_CARD,
  },
  {
    id: 'manual_default',
    name: 'Manual Raw Default Card (Minimal)',
    badge: 'SPICE Defaults',
    description:
      'Raw Verilog-A parameter defaults from Chapter 3 where optional physical effects (capacitances, transit time, series resistances, avalanche, self-heating) are set to 0.',
    params: DEFAULT_MODEL_CARD,
  },
];

// Physical constants from hicumL2V2p34.va.txt
const P_Q = 1.602176634e-19;
const P_K = 1.380649e-23;
const KB_Q = P_K / P_Q; // ~8.617333e-5 V/K
const T0_ABS = 273.15;
const DFa_fj = 1.921812;
const GMIN = 1e-12;

function limExp(x: number): number {
  if (x > 80.0) {
    return Math.exp(80.0) * (1.0 + (x - 80.0));
  }
  if (x < -80.0) {
    return Math.exp(-80.0);
  }
  return Math.exp(x);
}

/**
 * QJMODF: Forward-bias smoothed depletion capacitance and charge (no punch-through)
 * Matches `define QJMODF in hicumL2V2p34.va.txt (Lines 240–256)
 */
export function evalQJMODF(
  c0: number,
  ud: number,
  z: number,
  aj: number,
  Ucap: number,
  VT: number
): { C: number; Qz: number } {
  if (c0 <= 0.0 || ud <= 0.0 || z <= 0.0 || aj <= 0.0) {
    return { C: 0.0, Qz: 0.0 };
  }
  const safeAj = Math.max(aj, 1.01);
  const DFV_f = ud * (1.0 - Math.exp(-Math.log(safeAj) / z));
  const DFv_e = (DFV_f - Ucap) / VT;
  const DFs_q = Math.sqrt(DFv_e * DFv_e + DFa_fj);
  const DFs_q2 = (DFv_e + DFs_q) * 0.5;
  const DFv_j = DFV_f - VT * DFs_q2;
  const DFdvj_dv = DFs_q2 / DFs_q;
  const ratio = Math.max(1.0 - DFv_j / ud, 1e-12);
  const DFb = Math.log(ratio);
  const DFC_j1 = c0 * Math.exp(-z * DFb) * DFdvj_dv;
  const C = DFC_j1 + safeAj * c0 * (1.0 - DFdvj_dv);
  const DFQ_j = (c0 * ud * (1.0 - Math.exp(DFb * (1.0 - z)))) / (1.0 - z);
  const Qz = DFQ_j + safeAj * c0 * (Ucap - DFv_j);
  return { C, Qz };
}

/**
 * QJMOD: Depletion capacitance & charge with reverse punch-through limiting and forward peak limiting
 * Matches `define QJMOD in hicumL2V2p34.va.txt (Lines 276–340)
 */
export function evalQJMOD(
  c0: number,
  ud: number,
  z: number,
  aj: number,
  vpt: number,
  Ucap: number,
  VT: number
): { C: number; Qz: number } {
  if (c0 <= 0.0 || ud <= 0.0 || z <= 0.0) {
    return { C: 0.0, Qz: 0.0 };
  }
  const safeAj = Math.max(aj, 1.01);
  if (vpt <= 0.0 || vpt >= 100.0) {
    return evalQJMODF(c0, ud, z, safeAj, Ucap, VT);
  }
  // Forward smoothing voltage
  const Vf = ud * (1.0 - Math.exp(-Math.log(safeAj) / z));
  const ve = (Vf - Ucap) / VT;
  const sq = Math.sqrt(ve * ve + DFa_fj);
  const sq2 = 0.5 * (ve + sq);
  const vj1 = Vf - VT * sq2;
  const dvj1 = sq2 / sq;

  // Reverse punch-through smoothing around V_jP = ud - vpt
  const vjp = ud - vpt;
  const vr = (Ucap - vjp) / (4.0 * VT);
  const sqr = Math.sqrt(vr * vr + DFa_fj);
  const vj2 = vjp + 2.0 * VT * (vr + sqr);
  const dvj2 = 0.5 * (1.0 + vr / sqr);

  // Combine medium/reverse punch-through and forward limit
  const c_min = c0 * Math.pow(Math.max(vpt / ud, 1.0), -z);
  if (Ucap < vjp + 6.0 * VT) {
    const ratio = Math.max(1.0 - vj2 / ud, 1e-9);
    const C1 = c0 * Math.pow(ratio, -z) * dvj2 + c_min * (1.0 - dvj2);
    const Q1 =
      (c0 * ud * (1.0 - Math.pow(ratio, 1.0 - z))) / (1.0 - z) +
      c_min * (Ucap - vj2);
    return { C: C1, Qz: Q1 };
  }
  const ratio = Math.max(1.0 - vj1 / ud, 1e-9);
  const C = c0 * Math.pow(ratio, -z) * dvj1 + safeAj * c0 * (1.0 - dvj1);
  const Qz =
    (c0 * ud * (1.0 - Math.pow(ratio, 1.0 - z))) / (1.0 - z) +
    safeAj * c0 * (Ucap - vj1);
  return { C, Qz };
}

/**
 * TMPHICJ: Temperature update of junction built-in voltage vd_t and zero-bias capacitance cj0_t
 * Matches `define TMPHICJ in hicumL2V2p34.va.txt (Lines 541–560)
 */
export function evalTMPHICJ(
  cj0: number,
  vd: number,
  z: number,
  vg: number,
  Tdev: number,
  Tnom: number
): { cj0_t: number; vd_t: number } {
  if (cj0 <= 0.0 || vd <= 0.0) {
    return { cj0_t: Math.max(cj0, 0), vd_t: Math.max(vd, 0.1) };
  }
  const VT = KB_Q * Tdev;
  const VT0 = KB_Q * Tnom;
  const rT = Tdev / Tnom;
  const ln_rT = Math.log(rT);
  const vd_j0 = 2.0 * VT0 * Math.log(Math.exp(vd * 0.5 / VT0) - Math.exp(-vd * 0.5 / VT0));
  const vd_jT = vd_j0 * rT - 3.0 * VT * ln_rT - vg * (rT - 1.0);
  const vd_t = VT * Math.log(0.5 * (Math.exp(vd_jT / VT) + Math.sqrt(Math.exp(2.0 * vd_jT / VT) + 4.0)));
  const cj0_t = cj0 * Math.exp(z * Math.log(vd / Math.max(vd_t, 0.05)));
  return { cj0_t, vd_t };
}

/**
 * HICICK: Critical current I_CK as a function of internal collector-emitter voltage Vc'e'
 * Matches `define HICICK in hicumL2V2p34.va.txt (Lines 397–416)
 */
export function evalHICICK(
  Vciei: number,
  vces_t: number,
  vlim_t: number,
  rci0_t: number,
  vpt: number,
  aick: number,
  delck: number,
  VT: number
): { ick: number; vceff: number } {
  const safeRci0 = Math.max(rci0_t, 1e-3);
  const safeVlim = Math.max(vlim_t, 1e-3);
  const d1 = (Vciei - vces_t) / VT;
  const vceff = VT * (1.0 + 0.5 * (d1 + Math.sqrt(d1 * d1 + DFa_fj)));
  const uv = vceff / safeVlim;
  const ick1 = vceff / (safeRci0 * Math.pow(1.0 + Math.pow(uv, Math.max(delck, 0.5)), 1.0 / Math.max(delck, 0.5)));

  let f_pt = 1.0;
  if (vpt > 0.0 && vpt < 100.0) {
    const x = (vceff - safeVlim) / vpt;
    const x_s = 0.5 * (x + Math.sqrt(x * x + Math.max(aick, 1e-6)));
    f_pt = 1.0 + x_s;
  }
  return { ick: Math.max(ick1 * f_pt, 1e-12), vceff };
}

/**
 * HICQFF: High-current transit time Tf,T and minority charge Qf,T (Manual Sec. 2.2.2 & VA lines 490–536)
 */
export function evalHICQFF(
  itf: number,
  ick: number,
  Tf0: number,
  p: HicumParamMap,
  tef0_t: number,
  thcs_t: number,
  VT: number
): {
  Tf: number;
  Qf: number;
  TfT: number;
  QfT: number;
  Qbf: number;
  dTef: number;
  dTfhc: number;
  dTbfb: number;
} {
  const hf0 = p.hf0 ?? 1.0;
  const hfe = p.hfe ?? 1.0;
  const hfc = p.hfc ?? 1.0;
  const gtfe = Math.max(p.gtfe ?? 1.0, 0.1);
  const ahc = Math.max(p.ahc ?? 0.1, 1e-4);
  const fthc = p.fthc ?? 0.0;
  const vcbar = p.vcbar ?? 0.0;
  const icbar = p.icbar ?? 0.0;
  const acbar = Math.max(p.acbar ?? 0.01, 1e-5);

  const Qf0 = Tf0 * itf;
  if (itf <= 1e-9 * ick || ick <= 0.0) {
    return {
      Tf: Tf0,
      Qf: Qf0,
      TfT: hf0 * Tf0,
      QfT: hf0 * Qf0,
      Qbf: 0.0,
      dTef: 0.0,
      dTfhc: 0.0,
      dTbfb: 0.0,
    };
  }

  const ratio = itf / ick;
  const dTef = tef0_t * Math.pow(ratio, gtfe);
  const dQef = (dTef * itf) / (1.0 + gtfe);

  // BC heterojunction barrier voltage FFdVc
  let dVc = 0.0;
  let dVc_ditf = 0.0;
  if (vcbar > 0.0 && icbar > 0.0) {
    const ib = (itf - ick) / icbar;
    const sq = Math.sqrt(ib * ib + acbar);
    const fcbar = 0.5 * (ib + sq);
    const dib_ditf = fcbar / (sq * icbar);
    dVc = vcbar * Math.exp(-1.0 / Math.max(fcbar, 1e-6));
    dVc_ditf = (dVc / Math.max(fcbar * fcbar, 1e-12)) * dib_ditf;
  }

  const expBar = limExp(dVc / VT);
  const dQbfb = (1.0 - fthc) * thcs_t * itf * (expBar - 1.0);
  const dTbfb =
    dQbfb / itf + ((1.0 - fthc) * thcs_t * itf * expBar * dVc_ditf) / VT;

  // High-current base-collector widening width factor w
  const ic = 1.0 - 1.0 / ratio;
  const sq_ic = Math.sqrt(ic * ic + ahc);
  const w = (ic + sq_ic) / (1.0 + Math.sqrt(1.0 + ahc));
  const expBarMod = vcbar > 0.0 && icbar > 0.0 ? limExp((dVc - vcbar) / VT) : 1.0;

  const dQfhc = thcs_t * itf * w * w * expBarMod;
  const dTfhc =
    dQfhc *
    ((1.0 / itf) * (1.0 + 2.0 / (ratio * sq_ic)) + dVc_ditf / VT);

  const dQcfc = fthc * dQfhc;
  const dTcfc = fthc * dTfhc;
  const dQbfc = (1.0 - fthc) * dQfhc;
  const dTbfc = (1.0 - fthc) * dTfhc;

  const QfT = hf0 * Qf0 + dQbfb + dQbfc + hfe * dQef + hfc * dQcfc;
  const TfT = hf0 * Tf0 + dTbfb + dTbfc + hfe * dTef + hfc * dTcfc;
  const Qf = Qf0 + dQbfb + dQbfc + dQef + dQcfc;
  const Tf = Tf0 + dTbfb + dTbfc + dTef + dTcfc;
  const Qbf = dQbfb + dQbfc;

  return { Tf, Qf, TfT, QfT, Qbf, dTef, dTfhc, dTbfb };
}

/**
 * Evaluate full HICUM/L2 DC + Small-Signal Operating Point at given BiasState
 */
export function evaluateOperatingPoint(
  params: HicumParamMap,
  bias: BiasState
): OperatingPointResult {
  const Tnom = (params.tnom ?? 27.0) + T0_ABS;
  const Tamb = bias.Tamb + (params.dt ?? 0.0);

  // Self-heating iterative temperature loop (2 iterations for smooth real-time convergence)
  let Tdev = Tamb;
  let lastResult: OperatingPointResult | null = null;

  for (let shIter = 0; shIter < 3; shIter++) {
    const VT = KB_Q * Tdev;
    const VT0 = KB_Q * Tnom;
    const rT = Tdev / Tnom;
    const dT = Tdev - Tnom;

    // Bandgap temperature dependence (Eq. 2.15.1-1)
    const f1vg = params.f1vg ?? -1.02377e-4;
    const f2vg = params.f2vg ?? 4.3215e-4;
    const vgb = params.vgb ?? 1.17;
    const vge = params.vge ?? 1.17;
    const vgc = params.vgc ?? 1.17;
    const vgs = params.vgs ?? 1.17;
    const dvgbe = params.dvgbe ?? 0.0;

    // Temperature-scaled saturation & charge parameters (Sec. 2.15)
    const zetact = params.zetact ?? 3.0;
    const zetabet = params.zetabet ?? 3.5;
    const c10_t =
      (params.c10 ?? 2e-30) *
      Math.pow(rT, zetact) *
      limExp(((vgb / VT) * (rT - 1.0)));
    const qp0_t =
      Math.max(params.qp0 ?? 2e-14, 1e-18) *
      Math.pow(rT, 1.5) *
      limExp(((dvgbe / VT) * (rT - 1.0)));

    const ibeis_t =
      (params.ibeis ?? 1e-18) *
      Math.pow(rT, zetabet) *
      limExp(((vge / VT) * (rT - 1.0)));
    const ireis_t =
      (params.ireis ?? 0.0) *
      Math.pow(rT, 0.5 * zetabet) *
      limExp(((0.5 * vgb) / VT) * (rT - 1.0));
    const ibeps_t =
      (params.ibeps ?? 0.0) *
      Math.pow(rT, zetabet) *
      limExp(((vge / VT) * (rT - 1.0)));
    const ireps_t =
      (params.ireps ?? 0.0) *
      Math.pow(rT, 0.5 * zetabet) *
      limExp(((0.5 * vgb) / VT) * (rT - 1.0));
    const ibcis_t =
      (params.ibcis ?? 1e-16) *
      Math.pow(rT, zetact) *
      limExp(((vgc / VT) * (rT - 1.0)));
    const ibcxs_t =
      (params.ibcxs ?? 0.0) *
      Math.pow(rT, zetact) *
      limExp(((vgc / VT) * (rT - 1.0)));
    const itss_t =
      (params.itss ?? 0.0) *
      Math.pow(rT, zetact) *
      limExp(((vgs / VT) * (rT - 1.0)));
    const iscs_t =
      (params.iscs ?? 0.0) *
      Math.pow(rT, zetact) *
      limExp(((vgs / VT) * (rT - 1.0)));

    // Temperature-scaled resistances & transit time parameters
    const rbi0_t = (params.rbi0 ?? 0.0) * Math.pow(rT, params.zetarbi ?? 0.0);
    const rbx_t = (params.rbx ?? 0.0) * Math.pow(rT, params.zetarbx ?? 0.0);
    const rcx_t = (params.rcx ?? 0.0) * Math.pow(rT, params.zetarcx ?? 0.0);
    const re_t = (params.re ?? 0.0) * Math.pow(rT, params.zetare ?? 0.0);
    const rci0_t = Math.max((params.rci0 ?? 150.0) * Math.pow(rT, params.zetaci ?? 0.0), 1e-3);
    const vlim_t = Math.max((params.vlim ?? 0.5) * Math.pow(rT, params.zetaci ?? 0.0) * (1.0 - (params.alvs ?? 0.0) * dT), 0.05);
    const vces_t = Math.max((params.vces ?? 0.1) * (1.0 + (params.alces ?? 0.0) * dT), 0.0);
    const t0_t = Math.max((params.t0 ?? 0.0) * (1.0 + (params.alt0 ?? 0.0) * dT + (params.kt0 ?? 0.0) * dT * dT), 0.0);
    const thcs_t = Math.max((params.thcs ?? 0.0) * Math.pow(rT, (params.zetaci ?? 0.0) - 1.0), 0.0);
    const tef0_t = Math.max(params.tef0 ?? 0.0, 0.0);
    const rth_t =
      (params.rth ?? 0.0) *
      Math.pow(rT, params.zetarth ?? 0.0) *
      (1.0 + (params.alrth ?? 0.0) * dT);

    // Temperature-scaled depletion junctions
    const jEi = evalTMPHICJ(params.cjei0 ?? 1e-30, params.vdei ?? 0.9, params.zei ?? 0.5, vgb, Tdev, Tnom);
    const jEp = evalTMPHICJ(params.cjep0 ?? 1e-30, params.vdep ?? 0.9, params.zep ?? 0.5, vgb, Tdev, Tnom);
    const jCi = evalTMPHICJ(params.cjci0 ?? 1e-30, params.vdci ?? 0.7, params.zci ?? 0.4, vgc, Tdev, Tnom);
    const jCx = evalTMPHICJ(params.cjcx0 ?? 1e-30, params.vdcx ?? 0.7, params.zcx ?? 0.4, vgc, Tdev, Tnom);
    const jS = evalTMPHICJ(params.cjs0 ?? 0.0, params.vds ?? 0.6, params.zs ?? 0.5, vgs, Tdev, Tnom);
    const jScp = evalTMPHICJ(params.cscp0 ?? 0.0, params.vdsp ?? 0.6, params.zsp ?? 0.5, vgs, Tdev, Tnom);

    // Internal node voltage estimation (accounting for series resistances via damped fixed-point)
    let Vbiei = bias.Vbe;
    let Vbpei = bias.Vbe;
    let Vciei = bias.Vce;
    let Vbici = bias.Vbe - bias.Vce;

    let itf = 0;
    let itr = 0;
    let it = 0;
    let ibei = 0;
    let ibep = 0;
    let ibci = 0;
    let ijbcx = 0;
    let ibet = 0;
    let iavl = 0;
    let rbi = rbi0_t;

    for (let nr = 0; nr < 5; nr++) {
      Vbici = Vbiei - Vciei;
      const dEi = evalQJMODF(jEi.cj0_t, jEi.vd_t, params.zei ?? 0.5, params.ajei ?? 2.5, Vbiei, VT);
      const dCi = evalQJMOD(jCi.cj0_t, jCi.vd_t, params.zci ?? 0.4, 2.4, params.vptci ?? 100, Vbici, VT);

      // Low-current transit time Tf0(Vb'c')
      const cc = jCi.cj0_t > 0 && dCi.C > 0 ? jCi.cj0_t / dCi.C : 1.0;
      const Tf0 = Math.max(
        t0_t + (params.dt0h ?? 0.0) * (cc - 1.0) + (params.tbvl ?? 0.0) * (1.0 / Math.max(cc, 0.1) - 1.0),
        0.0
      );

      // Critical current I_CK
      const { ick } = evalHICICK(
        Vciei,
        vces_t,
        vlim_t,
        rci0_t,
        params.vpt ?? 100.0,
        params.aick ?? 1e-3,
        params.delck ?? 2.0,
        VT
      );

      // HBT BE charge weighting factor hjei(Vb'e')
      const hjei0 = params.hjei ?? 1.0;
      const ahjei = params.ahjei ?? 0.0;
      const rhjei = Math.max(params.rhjei ?? 1.0, 0.1);
      let Qjei_weighted = hjei0 * dEi.Qz;
      if (ahjei !== 0.0 && jEi.vd_t > 0) {
        const xh = (jEi.vd_t - Vbiei) / (rhjei * VT);
        Qjei_weighted = hjei0 * (1.0 + ahjei * (1.0 - Math.exp(-Math.max(xh, 0) * 0.2))) * dEi.Qz;
      }

      const Q0 = Math.max(
        qp0_t + Qjei_weighted + (params.hjci ?? 1.0) * dCi.Qz,
        0.1 * qp0_t
      );

      const mcf = Math.max(params.mcf ?? 1.0, 0.5);
      const i_0f = c10_t * limExp(Vbiei / (mcf * VT));
      const i_0r = c10_t * limExp(Vbici / VT);

      // Solve GICCR transfer current equation iteratively (VA lines 1551–1588)
      let QpT = Q0;
      for (let k = 0; k < 8; k++) {
        const itf_k = i_0f / Math.max(QpT, 1e-20);
        const itr_k = i_0r / Math.max(QpT, 1e-20);
        const qff = evalHICQFF(itf_k, ick, Tf0, params, tef0_t, thcs_t, VT);
        const Qr = (params.tr ?? 0.0) * itr_k;
        const F = QpT - (Q0 + qff.QfT + Qr);
        const dF = 1.0 + (qff.TfT * itf_k + Qr) / Math.max(QpT, 1e-20);
        const dQ = -F / Math.max(dF, 1.0);
        QpT = Math.max(0.2 * Q0, QpT + Math.max(-0.35 * QpT, Math.min(0.35 * QpT, dQ)));
      }

      const ich = params.ich ?? 0.0;
      const I_Tf1 = i_0f / Math.max(QpT, 1e-20);
      const a_h = ich > 0.0 ? I_Tf1 / ich : 0.0;
      itf = I_Tf1 * (1.0 + a_h);
      itr = i_0r / Math.max(QpT, 1e-20);
      it = itf - itr;

      const qffFinal = evalHICQFF(itf, ick, Tf0, params, tef0_t, thcs_t, VT);

      // Base-emitter & base-collector diode currents
      ibei =
        ibeis_t * (limExp(Vbiei / ((params.mbei ?? 1.0) * VT)) - 1.0) +
        ireis_t * (limExp(Vbiei / ((params.mrei ?? 2.0) * VT)) - 1.0) +
        (params.tbhrec && params.tbhrec > 0 ? qffFinal.Qbf / params.tbhrec : 0.0);
      ibep =
        ibeps_t * (limExp(Vbpei / ((params.mbep ?? 1.0) * VT)) - 1.0) +
        ireps_t * (limExp(Vbpei / ((params.mrep ?? 2.0) * VT)) - 1.0);
      ibci = ibcis_t * (limExp(Vbici / ((params.mbci ?? 1.0) * VT)) - 1.0);
      ijbcx = ibcxs_t * (limExp((Vbpei - Vciei) / ((params.mbcx ?? 1.0) * VT)) - 1.0);

      // Internal base resistance rBi* with conductivity modulation & crowding (HICRBI)
      if (rbi0_t > 0.0) {
        const f_QR = Math.max((1.0 + (params.fdqr0 ?? 0.0)) * qp0_t, 1e-20);
        const Qz0 = dEi.Qz + dCi.Qz + qffFinal.Qf;
        const Qz_nom = 1.0 + Qz0 / f_QR;
        const fQz = 0.5 * (Qz_nom + Math.sqrt(Qz_nom * Qz_nom + 0.01));
        rbi = rbi0_t / fQz;
        if (ibei > 1e-12) {
          const ETA = (rbi * ibei * (params.fgeo ?? 0.6557)) / VT;
          if (ETA > 1e-6) {
            rbi = (rbi * Math.log(1.0 + ETA)) / ETA;
          }
        }
      } else {
        rbi = 0.0;
      }

      // Update internal voltages with damping
      const ib_tot = ibei + ibep - ibci - ijbcx;
      const ic_tot = it + ibci;
      const ie_tot = it + ibei + ibep;

      const targetVbpei = bias.Vbe - ib_tot * rbx_t - ie_tot * re_t;
      const targetVbiei = targetVbpei - ibei * rbi;
      const targetVciei = bias.Vce - ic_tot * rcx_t - ie_tot * re_t;

      Vbpei = 0.55 * Vbpei + 0.45 * Math.max(-2.0, Math.min(bias.Vbe + 0.05, targetVbpei));
      Vbiei = 0.55 * Vbiei + 0.45 * Math.max(-2.0, Math.min(Vbpei + 0.02, targetVbiei));
      Vciei = 0.55 * Vciei + 0.45 * Math.max(0.01, Math.min(bias.Vce + 0.1, targetVciei));
    }

    // Final evaluation at converged internal node voltages
    Vbici = Vbiei - Vciei;
    const dEi = evalQJMODF(jEi.cj0_t, jEi.vd_t, params.zei ?? 0.5, params.ajei ?? 2.5, Vbiei, VT);
    const dEp = evalQJMODF(jEp.cj0_t, jEp.vd_t, params.zep ?? 0.5, params.ajep ?? 2.5, Vbpei, VT);
    const dCi = evalQJMOD(jCi.cj0_t, jCi.vd_t, params.zci ?? 0.4, 2.4, params.vptci ?? 100, Vbici, VT);
    const dCx = evalQJMOD(jCx.cj0_t, jCx.vd_t, params.zcx ?? 0.4, 2.4, params.vptcx ?? 100, Vbpei - Vciei, VT);
    const dS = evalQJMOD(jS.cj0_t, jS.vd_t, params.zs ?? 0.5, 2.4, params.vpts ?? 100, bias.Vsc - Vciei, VT);
    const dScp = evalQJMOD(jScp.cj0_t, jScp.vd_t, params.zsp ?? 0.5, 2.4, params.vptsp ?? 100, bias.Vsc - bias.Vce, VT);

    const cc = jCi.cj0_t > 0 && dCi.C > 0 ? jCi.cj0_t / dCi.C : 1.0;
    const Tf0 = Math.max(
      t0_t + (params.dt0h ?? 0.0) * (cc - 1.0) + (params.tbvl ?? 0.0) * (1.0 / Math.max(cc, 0.1) - 1.0),
      0.0
    );
    const { ick } = evalHICICK(
      Vciei,
      vces_t,
      vlim_t,
      rci0_t,
      params.vpt ?? 100.0,
      params.aick ?? 1e-3,
      params.delck ?? 2.0,
      VT
    );

    const qff = evalHICQFF(itf, ick, Tf0, params, tef0_t, thcs_t, VT);
    const QpT = Math.max(qp0_t + (params.hjei ?? 1.0) * dEi.Qz + (params.hjci ?? 1.0) * dCi.Qz + qff.QfT, 1e-20);

    // Avalanche current iAVL (HICAVL, VA lines 1617–1631)
    const favl_t = (params.favl ?? 0.0) * Math.exp((params.alfav ?? 0.0) * dT);
    const qavl_t = (params.qavl ?? 0.0) * Math.exp((params.alqav ?? 0.0) * dT);
    if (Vbici < 0.0 && favl_t > 0.0 && jCi.cj0_t > 0.0 && dCi.C > 0.0) {
      const v_bord = jCi.vd_t - Vbici;
      const v_q = qavl_t / dCi.C;
      const U0 = qavl_t / jCi.cj0_t;
      let avl = 0.0;
      if (U0 > 0 && v_bord > U0) {
        const av = favl_t * Math.exp(-v_q / U0);
        avl = av * (U0 + (1.0 + v_q / U0) * (v_bord - U0));
      } else {
        avl = favl_t * v_bord * Math.exp(-v_q / Math.max(v_bord, 1e-3));
      }
      iavl = itf * avl;
    } else {
      iavl = 0.0;
    }

    // Tunneling current iBEt (HICTUN, VA lines 569–598)
    const vbe_tun = (params.tunode ?? 1) === 1 ? Vbpei : Vbiei;
    if (vbe_tun < 0.0 && (params.ibets ?? 0.0) > 0.0) {
      const ude = (params.tunode ?? 1) === 1 ? jEp.vd_t : jEi.vd_t;
      const ze = (params.tunode ?? 1) === 1 ? (params.zep ?? 0.5) : (params.zei ?? 0.5);
      const vp = -vbe_tun / Math.max(ude, 0.1);
      ibet =
        (params.ibets ?? 0.0) *
        vp *
        Math.pow(1.0 + vp, 0.5 - ze) *
        Math.exp(-(params.abet ?? 40.0) * Math.pow(1.0 + vp, ze - 1.0));
    } else {
      ibet = 0.0;
    }

    // Substrate currents
    const ijsc = iscs_t * (limExp((bias.Vsc - Vciei) / ((params.msc ?? 1.0) * VT)) - 1.0);
    const its = itss_t * (limExp((Vbpei - Vciei) / ((params.msf ?? 1.0) * VT)) - 1.0);

    const Ib = ibei + ibep - ibci - ijbcx - iavl - ibet;
    const Ic = it - ibci - ijbcx + iavl - its;
    const Is = ijsc + its;
    const Betadc = Math.abs(Ib) > 1e-18 ? Ic / Ib : 0.0;

    // Small-signal derivatives (Chapter 4 Operating Point table)
    const mcf = Math.max(params.mcf ?? 1.0, 0.5);
    const Gmi = Math.max(itf / (mcf * VT * (1.0 + (qff.TfT * itf) / QpT)), GMIN);
    const Gms = Math.max(its / ((params.msf ?? 1.0) * VT), 0.0);
    const gPIi = Math.max(ibei / ((params.mbei ?? 1.0) * VT), GMIN);
    const gPIx = Math.max(ibep / ((params.mbep ?? 1.0) * VT), GMIN);
    const RPIi = 1.0 / gPIi;
    const RPIx = 1.0 / gPIx;
    const gMUi = Math.max(Math.abs(ibci) / VT, GMIN);
    const gMUx = Math.max(Math.abs(ijbcx) / VT, GMIN);
    const gAVL = Vbici < 0 ? iavl / Math.max(jCi.vd_t - Vbici, 0.1) : 0.0;
    const RMUi = 1.0 / Math.max(gMUi + gAVL, GMIN);
    const RMUx = 1.0 / gMUx;

    // Early effect output conductance gOi
    const gOi = Math.max((itf * (params.hjci ?? 1.0) * dCi.C) / QpT, GMIN);
    const ROi = 1.0 / (gOi + gAVL);

    const CdEi = qff.Tf * Gmi;
    const CdCi = (params.tr ?? 0.0) * (itr / VT);
    const CPIi = dEi.C + CdEi;
    const CPIx = dEp.C + (params.cbepar ?? 0.0);
    const CMUi = dCi.C + CdCi;
    const CMUx = dCx.C + (params.cbcpar ?? 0.0) + (params.tsf ?? 0.0) * Gms;
    const CCS = dS.C + dScp.C;
    const RB = rbi + rbx_t;
    const BETAAC = Gmi / (gPIi + gPIx);
    const CRBI = (params.fcrbi ?? 0.0) * (dEi.C + dCi.C + CdEi + CdCi);

    const totalDelay =
      (CPIi + CPIx + CMUi + CMUx) / Gmi +
      (rcx_t + re_t + (re_t + RB) / Math.max(BETAAC, 1.0)) * (CMUi + CMUx);
    const Ft = totalDelay > 0 ? 1.0 / (2.0 * Math.PI * totalDelay) : 0.0;
    const cbcEff = Math.max(CMUi + 0.5 * CMUx, 1e-16);
    const Fmax =
      Ft > 0 && RB > 0 ? Math.sqrt(Ft / (8.0 * Math.PI * RB * cbcEff)) : 0.0;

    // Self-heating power dissipation & temperature rise
    const Pdiss = Math.max(0, Math.abs(Ic * Vciei) + Math.abs(Ib * Vbiei));
    const Dtsh = (params.flsh ?? 0) !== 0 ? rth_t * Pdiss : 0.0;
    Tdev = Tamb + Math.min(Dtsh, 250.0);

    const opMap: Record<string, number> = {
      IB: Ib,
      IC: Ic,
      IS: Is,
      IAVL: iavl,
      VBE: bias.Vbe,
      VBC: bias.Vbe - bias.Vce,
      VCE: bias.Vce,
      VSC: bias.Vsc,
      BETADC: Betadc,
      GMi: Gmi,
      GMS: Gms,
      RPIi,
      RPIx,
      RMUi,
      RMUx,
      ROi,
      CPIi,
      CPIx,
      CMUi,
      CMUx,
      CCS,
      RBI: rbi,
      RB,
      RCX: rcx_t,
      RE: re_t,
      BETAAC,
      CRBI,
      TF: qff.Tf,
      FT: Ft,
      TK: Tdev,
      DTSH: Dtsh,
    };

    const fbcpar = params.fbcpar ?? 0.5;
    const fbepar = params.fbepar ?? 0.5;

    lastResult = {
      Ib,
      Ic,
      Is,
      Iavl: iavl,
      Betadc,
      Gmi,
      Rbi: rbi,
      Tf: qff.Tf,
      Ft,
      Fmax,
      Tk: Tdev,
      Dtsh,
      Ick: ick,
      QpT,
      Qf: qff.Qf,
      Cjei: dEi.C,
      Cjci: dCi.C,
      opMap,
      branchCurrents: {
        it,
        ibei,
        ibep,
        ibci,
        ijbcx,
        ibet,
        iavl,
        its,
        ijsc,
        pterm: Pdiss,
      },
      branchCharges: {
        cjei: dEi.C,
        cjep: dEp.C,
        cjci: dCi.C,
        cjcx1: (1.0 - fbcpar) * dCx.C + (1.0 - fbcpar) * (params.cbcpar ?? 0.0),
        cjcx2: fbcpar * dCx.C + fbcpar * (params.cbcpar ?? 0.0),
        cbepar1: (1.0 - fbepar) * (params.cbepar ?? 0.0),
        cbepar2: fbepar * (params.cbepar ?? 0.0),
        qf: qff.Qf,
        qr: (params.tr ?? 0.0) * itr,
        crbi: CRBI,
        cjs: dS.C,
        cscp: dScp.C,
      },
      nodeVoltages: {
        B: bias.Vbe,
        'B*': Vbpei,
        "B'": Vbiei,
        C: bias.Vce,
        "C'": Vciei,
        E: 0.0,
        "E'": (Ic + Ib) * re_t,
        S: bias.Vsc,
        "S'": bias.Vsc,
        T: Dtsh,
      },
    };
  }

  return lastResult!;
}

/**
 * Generate real-time scientific plot series for any of the 8 PlotCategoryId views
 */
export function generatePlotData(
  category: PlotCategoryId,
  params: HicumParamMap,
  bias: BiasState,
  baselineParams?: HicumParamMap
): PlotDataset {
  const hasBaseline = Boolean(baselineParams);

  switch (category) {
    case 'transfer_gummel': {
      const itPts: PlotPoint[] = [];
      const ibPts: PlotPoint[] = [];
      const betaPts: PlotPoint[] = [];
      const n = 56;
      for (let i = 0; i < n; i++) {
        const vbe = 0.45 + (i / (n - 1)) * 0.55; // 0.45V to 1.00V
        const op = evaluateOperatingPoint(params, { ...bias, Vbe: vbe });
        const opBase = hasBaseline
          ? evaluateOperatingPoint(baselineParams!, { ...bias, Vbe: vbe })
          : undefined;
        itPts.push({
          x: vbe,
          y: Math.max(op.Ic, 1e-15),
          yBaseline: opBase ? Math.max(opBase.Ic, 1e-15) : undefined,
        });
        ibPts.push({
          x: vbe,
          y: Math.max(op.Ib, 1e-15),
          yBaseline: opBase ? Math.max(opBase.Ib, 1e-15) : undefined,
        });
        betaPts.push({
          x: vbe,
          y: Math.max(op.Betadc * 1e-5, 1e-15), // scaled for dual log visibility or standalone
          yBaseline: opBase ? Math.max(opBase.Betadc * 1e-5, 1e-15) : undefined,
        });
      }
      return {
        category,
        title: 'Forward Gummel Characteristics (I_C, I_B vs. V_BE)',
        subtitle: `GICCR Transfer Current (Eq. 2.2.0-1) & Base Recombination at V_CE = ${bias.Vce.toFixed(2)} V, T_amb = ${bias.Tamb.toFixed(0)} K`,
        xLabel: 'Base-Emitter Voltage V_BE',
        xUnit: 'V',
        yLabel: 'Terminal Current I_C, I_B',
        yUnit: 'A',
        xLogDefault: false,
        yLogDefault: true,
        series: [
          {
            id: 'ic_gummel',
            label: 'Collector Current I_C',
            unit: 'A',
            color: '#1E40AF',
            description: 'Forward transfer current i_T governed by c10, qp0, hjei, hjci, and Kirk charge Qf,T',
            points: itPts,
          },
          {
            id: 'ib_gummel',
            label: 'Base Current I_B',
            unit: 'A',
            color: '#0F766E',
            description: 'Total base current i_BEi + i_BEp + i_Bh,rec - i_AVL',
            points: ibPts,
          },
          {
            id: 'beta_scaled',
            label: 'Scaled Gain β_DC × 10⁻⁵',
            unit: 'A',
            color: '#B45309',
            dashed: true,
            description: 'DC current gain β_DC = I_C / I_B scaled by 10⁻⁵ for direct overlay on Gummel plot',
            points: betaPts,
          },
        ],
      };
    }

    case 'critical_current': {
      const ickPts: PlotPoint[] = [];
      const ic1Pts: PlotPoint[] = [];
      const ic2Pts: PlotPoint[] = [];
      const ic3Pts: PlotPoint[] = [];
      const n = 55;
      const VT = KB_Q * bias.Tamb;
      for (let i = 0; i < n; i++) {
        const vce = 0.05 + (i / (n - 1)) * 3.45; // 0.05V to 3.5V
        const { ick } = evalHICICK(
          vce,
          params.vces ?? 0.1,
          params.vlim ?? 0.5,
          params.rci0 ?? 150,
          params.vpt ?? 100,
          params.aick ?? 1e-3,
          params.delck ?? 2.0,
          VT
        );
        const ickBase = hasBaseline
          ? evalHICICK(
              vce,
              baselineParams!.vces ?? 0.1,
              baselineParams!.vlim ?? 0.5,
              baselineParams!.rci0 ?? 150,
              baselineParams!.vpt ?? 100,
              baselineParams!.aick ?? 1e-3,
              baselineParams!.delck ?? 2.0,
              VT
            ).ick
          : undefined;
        ickPts.push({ x: vce, y: ick, yBaseline: ickBase });

        const op1 = evaluateOperatingPoint(params, { ...bias, Vbe: bias.Vbe - 0.025, Vce: vce });
        const op2 = evaluateOperatingPoint(params, { ...bias, Vbe: bias.Vbe, Vce: vce });
        const op3 = evaluateOperatingPoint(params, { ...bias, Vbe: bias.Vbe + 0.02, Vce: vce });

        const op2Base = hasBaseline
          ? evaluateOperatingPoint(baselineParams!, { ...bias, Vbe: bias.Vbe, Vce: vce })
          : undefined;

        ic1Pts.push({ x: vce, y: Math.max(0, op1.Ic) });
        ic2Pts.push({ x: vce, y: Math.max(0, op2.Ic), yBaseline: op2Base ? Math.max(0, op2Base.Ic) : undefined });
        ic3Pts.push({ x: vce, y: Math.max(0, op3.Ic) });
      }
      return {
        category,
        title: 'Output Family I_C(V_CE) & Critical Current Curve I_CK(V_C\'E\')',
        subtitle: 'Quasi-saturation knee (rci0, vlim, vces), Early slope (hjci), Avalanche (favl, qavl) & Kirk onset I_CK',
        xLabel: 'Collector-Emitter Voltage V_CE',
        xUnit: 'V',
        yLabel: 'Collector & Critical Current',
        yUnit: 'A',
        xLogDefault: false,
        yLogDefault: false,
        series: [
          {
            id: 'ick_curve',
            label: 'Kirk Critical Current I_CK(V_CE)',
            unit: 'A',
            color: '#9F1239',
            dashed: true,
            description: 'Critical current marking onset of high-current base push-out into collector epi (Eq. 2.2.1-1)',
            points: ickPts,
          },
          {
            id: 'ic_mid',
            label: `I_C at Active V_BE = ${bias.Vbe.toFixed(3)} V`,
            unit: 'A',
            color: '#1E40AF',
            description: 'Collector current at active V_BE bias point',
            points: ic2Pts,
          },
          {
            id: 'ic_high',
            label: `I_C at V_BE = ${(bias.Vbe + 0.02).toFixed(3)} V`,
            unit: 'A',
            color: '#0F766E',
            description: 'High-drive output curve showing self-heating and avalanche multiplication',
            points: ic3Pts,
          },
          {
            id: 'ic_low',
            label: `I_C at V_BE = ${(bias.Vbe - 0.025).toFixed(3)} V`,
            unit: 'A',
            color: '#64748B',
            description: 'Lower-drive output curve',
            points: ic1Pts,
          },
        ],
      };
    }

    case 'transit_time_ft': {
      const ftPts: PlotPoint[] = [];
      const fmaxPts: PlotPoint[] = [];
      const tfPts: PlotPoint[] = [];
      const n = 54;
      for (let i = 0; i < n; i++) {
        const vbe = 0.68 + (i / (n - 1)) * 0.30; // 0.68V to 0.98V
        const op = evaluateOperatingPoint(params, { ...bias, Vbe: vbe });
        const opBase = hasBaseline
          ? evaluateOperatingPoint(baselineParams!, { ...bias, Vbe: vbe })
          : undefined;
        const ic = Math.max(op.Ic, 1e-7);
        ftPts.push({
          x: ic,
          y: op.Ft / 1e9,
          yBaseline: opBase ? opBase.Ft / 1e9 : undefined,
        });
        fmaxPts.push({
          x: ic,
          y: op.Fmax / 1e9,
          yBaseline: opBase ? opBase.Fmax / 1e9 : undefined,
        });
        tfPts.push({
          x: ic,
          y: op.Tf * 1e12 * 10, // 10x ps for dual scale clarity
          yBaseline: opBase ? opBase.Tf * 1e12 * 10 : undefined,
        });
      }
      return {
        category,
        title: 'Cutoff Frequency f_T, f_max & Forward Transit Time τ_f vs. I_C',
        subtitle: `High-frequency performance vs. collector current at V_CE = ${bias.Vce.toFixed(2)} V (I_CK = ${(evaluateOperatingPoint(params, bias).Ick * 1e3).toFixed(2)} mA)`,
        xLabel: 'Collector Current I_C',
        xUnit: 'A',
        yLabel: 'Frequency (GHz) / Scaled Transit Time (10× ps)',
        yUnit: 'GHz',
        xLogDefault: true,
        yLogDefault: false,
        series: [
          {
            id: 'ft_curve',
            label: 'Transit Frequency f_T (GHz)',
            unit: 'GHz',
            color: '#1E40AF',
            description: 'Small-signal unity-current-gain cutoff frequency f_T (Manual Ch. 4)',
            points: ftPts,
          },
          {
            id: 'fmax_curve',
            label: 'Max Oscillation Freq f_max (GHz)',
            unit: 'GHz',
            color: '#0F766E',
            description: 'Maximum oscillation frequency governed by f_T, R_B, and C_BC',
            points: fmaxPts,
          },
          {
            id: 'tf_curve',
            label: 'Forward Transit Time 10 × τ_f (ps)',
            unit: 'GHz',
            color: '#9F1239',
            dashed: true,
            description: 'Forward transit time τ_f = τ_f0 + Δτ_Ef + Δτ_fh + Δτ_Bfb (multiplied by 10 in ps)',
            points: tfPts,
          },
        ],
      };
    }

    case 'depletion_cap': {
      const cjeiPts: PlotPoint[] = [];
      const cjepPts: PlotPoint[] = [];
      const cjciPts: PlotPoint[] = [];
      const cjcxPts: PlotPoint[] = [];
      const VT = KB_Q * bias.Tamb;
      const n = 60;
      for (let i = 0; i < n; i++) {
        const vj = -3.5 + (i / (n - 1)) * 4.6; // -3.5V to +1.1V
        const cEi = evalQJMODF(
          params.cjei0 ?? 1e-15,
          params.vdei ?? 0.9,
          params.zei ?? 0.5,
          params.ajei ?? 2.5,
          vj,
          VT
        ).C;
        const cEiBase = hasBaseline
          ? evalQJMODF(
              baselineParams!.cjei0 ?? 1e-15,
              baselineParams!.vdei ?? 0.9,
              baselineParams!.zei ?? 0.5,
              baselineParams!.ajei ?? 2.5,
              vj,
              VT
            ).C
          : undefined;

        const cEp = evalQJMODF(
          params.cjep0 ?? 1e-15,
          params.vdep ?? 0.9,
          params.zep ?? 0.5,
          params.ajep ?? 2.5,
          vj,
          VT
        ).C;
        const cEpBase = hasBaseline
          ? evalQJMODF(
              baselineParams!.cjep0 ?? 1e-15,
              baselineParams!.vdep ?? 0.9,
              baselineParams!.zep ?? 0.5,
              baselineParams!.ajep ?? 2.5,
              vj,
              VT
            ).C
          : undefined;

        const cCi = evalQJMOD(
          params.cjci0 ?? 1e-15,
          params.vdci ?? 0.7,
          params.zci ?? 0.4,
          2.4,
          params.vptci ?? 100,
          vj,
          VT
        ).C;
        const cCiBase = hasBaseline
          ? evalQJMOD(
              baselineParams!.cjci0 ?? 1e-15,
              baselineParams!.vdci ?? 0.7,
              baselineParams!.zci ?? 0.4,
              2.4,
              baselineParams!.vptci ?? 100,
              vj,
              VT
            ).C
          : undefined;

        const cCx = evalQJMOD(
          params.cjcx0 ?? 1e-15,
          params.vdcx ?? 0.7,
          params.zcx ?? 0.4,
          2.4,
          params.vptcx ?? 100,
          vj,
          VT
        ).C;
        const cCxBase = hasBaseline
          ? evalQJMOD(
              baselineParams!.cjcx0 ?? 1e-15,
              baselineParams!.vdcx ?? 0.7,
              baselineParams!.zcx ?? 0.4,
              2.4,
              baselineParams!.vptcx ?? 100,
              vj,
              VT
            ).C
          : undefined;

        cjeiPts.push({ x: vj, y: cEi * 1e15, yBaseline: cEiBase !== undefined ? cEiBase * 1e15 : undefined });
        cjepPts.push({ x: vj, y: cEp * 1e15, yBaseline: cEpBase !== undefined ? cEpBase * 1e15 : undefined });
        cjciPts.push({ x: vj, y: cCi * 1e15, yBaseline: cCiBase !== undefined ? cCiBase * 1e15 : undefined });
        cjcxPts.push({ x: vj, y: cCx * 1e15, yBaseline: cCxBase !== undefined ? cCxBase * 1e15 : undefined });
      }
      return {
        category,
        title: 'Junction Depletion Capacitances C_j(V) vs. Junction Voltage',
        subtitle: 'Hyperbolic forward-bias peak limiting (ajei·cjei0) & collector epitaxial punch-through plateau (vptci)',
        xLabel: 'Junction Voltage V_j',
        xUnit: 'V',
        yLabel: 'Depletion Capacitance C_j',
        yUnit: 'fF',
        xLogDefault: false,
        yLogDefault: false,
        series: [
          {
            id: 'cjei',
            label: 'Internal B-E Cap C_jEi (fF)',
            unit: 'fF',
            color: '#1E40AF',
            description: 'Intrinsic B-E depletion capacitance (cjei0, vdei, zei, ajei)',
            points: cjeiPts,
          },
          {
            id: 'cjep',
            label: 'Peripheral B-E Cap C_jEp (fF)',
            unit: 'fF',
            color: '#0F766E',
            description: 'Perimeter B-E depletion capacitance (cjep0, vdep, zep, ajep)',
            points: cjepPts,
          },
          {
            id: 'cjci',
            label: 'Internal B-C Cap C_jCi (fF)',
            unit: 'fF',
            color: '#B45309',
            description: 'Intrinsic B-C depletion capacitance with punch-through limiting (cjci0, vdci, zci, vptci)',
            points: cjciPts,
          },
          {
            id: 'cjcx',
            label: 'External B-C Cap C_jCx (fF)',
            unit: 'fF',
            color: '#9F1239',
            dashed: true,
            description: 'Extrinsic B-C depletion capacitance (cjcx0, vdcx, zcx, vptcx)',
            points: cjcxPts,
          },
        ],
      };
    }

    case 'base_resistance': {
      const rbiPts: PlotPoint[] = [];
      const rbTotPts: PlotPoint[] = [];
      const crbiPts: PlotPoint[] = [];
      const n = 52;
      for (let i = 0; i < n; i++) {
        const vbe = 0.50 + (i / (n - 1)) * 0.50;
        const op = evaluateOperatingPoint(params, { ...bias, Vbe: vbe });
        const opBase = hasBaseline
          ? evaluateOperatingPoint(baselineParams!, { ...bias, Vbe: vbe })
          : undefined;
        rbiPts.push({
          x: vbe,
          y: op.Rbi,
          yBaseline: opBase ? opBase.Rbi : undefined,
        });
        rbTotPts.push({
          x: vbe,
          y: op.opMap.RB,
          yBaseline: opBase ? opBase.opMap.RB : undefined,
        });
        crbiPts.push({
          x: vbe,
          y: (op.opMap.CRBI ?? 0) * 1e15,
          yBaseline: opBase ? (opBase.opMap.CRBI ?? 0) * 1e15 : undefined,
        });
      }
      return {
        category,
        title: 'Internal Base Resistance R_bi*(V_BE) & AC Shunt C_rBi',
        subtitle: 'Conductivity modulation by base charge (fdqr0, qp0) and lateral emitter current crowding (fgeo)',
        xLabel: 'Base-Emitter Voltage V_BE',
        xUnit: 'V',
        yLabel: 'Resistance (Ω) / Shunt Cap C_rBi (fF)',
        yUnit: 'Ω',
        xLogDefault: false,
        yLogDefault: false,
        series: [
          {
            id: 'rbi_star',
            label: 'Internal Base Resistance R_bi* (Ω)',
            unit: 'Ω',
            color: '#1E40AF',
            description: 'Bias-dependent pinch-base resistance modulated by Q_p and lateral emitter crowding',
            points: rbiPts,
          },
          {
            id: 'rb_total',
            label: 'Total Base Resistance R_B = R_bi* + R_bx (Ω)',
            unit: 'Ω',
            color: '#0F766E',
            description: 'Sum of intrinsic pinch-base resistance and extrinsic base resistance rbx',
            points: rbTotPts,
          },
          {
            id: 'crbi_shunt',
            label: 'AC Crowding Shunt Cap C_rBi (fF)',
            unit: 'fF',
            color: '#B45309',
            dashed: true,
            description: 'High-frequency lateral NQS shunt capacitance across R_bi* (fcrbi)',
            points: crbiPts,
          },
        ],
      };
    }

    case 'breakdown_tunneling': {
      const avlPts: PlotPoint[] = [];
      const tunPts: PlotPoint[] = [];
      const n = 54;
      for (let i = 0; i < n; i++) {
        const vRev = 0.05 + (i / (n - 1)) * 4.45; // 0.05V to 4.5V reverse voltage
        const opAvl = evaluateOperatingPoint(params, {
          ...bias,
          Vce: bias.Vbe + vRev,
        });
        const opAvlBase = hasBaseline
          ? evaluateOperatingPoint(baselineParams!, {
              ...bias,
              Vce: bias.Vbe + vRev,
            })
          : undefined;
        avlPts.push({
          x: vRev,
          y: Math.max(opAvl.Iavl, 1e-18),
          yBaseline: opAvlBase ? Math.max(opAvlBase.Iavl, 1e-18) : undefined,
        });

        const opTun = evaluateOperatingPoint(params, {
          ...bias,
          Vbe: -vRev,
        });
        const opTunBase = hasBaseline
          ? evaluateOperatingPoint(baselineParams!, {
              ...bias,
              Vbe: -vRev,
            })
          : undefined;
        tunPts.push({
          x: vRev,
          y: Math.max(opTun.branchCurrents.ibet ?? 0, 1e-18),
          yBaseline: opTunBase
            ? Math.max(opTunBase.branchCurrents.ibet ?? 0, 1e-18)
            : undefined,
        });
      }
      return {
        category,
        title: 'Base-Collector Avalanche i_AVL(V_CB) & B-E Tunneling i_BEt(-V_BE)',
        subtitle: 'Impact ionization multiplication (favl, qavl) & reverse Zener band-to-band tunneling (ibets, abet)',
        xLabel: 'Reverse Junction Voltage V_CB or -V_BE',
        xUnit: 'V',
        yLabel: 'Breakdown / Tunneling Current',
        yUnit: 'A',
        xLogDefault: false,
        yLogDefault: true,
        series: [
          {
            id: 'iavl_curve',
            label: 'BC Avalanche Current i_AVL vs. V_CB',
            unit: 'A',
            color: '#9F1239',
            description: 'Avalanche impact ionization current in the B-C space-charge region (Eq. 2.10.1-1)',
            points: avlPts,
          },
          {
            id: 'ibet_curve',
            label: 'BE Tunneling Current i_BEt vs. -V_BE',
            unit: 'A',
            color: '#1E40AF',
            description: 'Reverse B-E band-to-band Zener tunneling current (Eq. 2.9.0-1)',
            points: tunPts,
          },
        ],
      };
    }

    case 'temperature_selfheating': {
      const icTempPts: PlotPoint[] = [];
      const betaTempPts: PlotPoint[] = [];
      const ftTempPts: PlotPoint[] = [];
      const dtshPts: PlotPoint[] = [];
      const n = 50;
      for (let i = 0; i < n; i++) {
        const tempK = 220 + (i / (n - 1)) * 240; // 220K to 460K
        const op = evaluateOperatingPoint(params, { ...bias, Tamb: tempK });
        const opBase = hasBaseline
          ? evaluateOperatingPoint(baselineParams!, { ...bias, Tamb: tempK })
          : undefined;

        icTempPts.push({
          x: tempK,
          y: op.Ic * 1e3, // mA
          yBaseline: opBase ? opBase.Ic * 1e3 : undefined,
        });
        betaTempPts.push({
          x: tempK,
          y: op.Betadc * 0.1, // 0.1x for scale clarity
          yBaseline: opBase ? opBase.Betadc * 0.1 : undefined,
        });
        ftTempPts.push({
          x: tempK,
          y: op.Ft / 1e9, // GHz
          yBaseline: opBase ? opBase.Ft / 1e9 : undefined,
        });
        dtshPts.push({
          x: tempK,
          y: op.Dtsh, // K
          yBaseline: opBase ? opBase.Dtsh : undefined,
        });
      }
      return {
        category,
        title: 'Temperature Scaling (220 K – 460 K) & Self-Heating ΔT_j',
        subtitle: `Thermal variation at V_BE = ${bias.Vbe.toFixed(3)} V, V_CE = ${bias.Vce.toFixed(2)} V (vgb, dvgbe, zetact, zetaci, alt0, rth)`,
        xLabel: 'Ambient Temperature T_amb',
        xUnit: 'K',
        yLabel: 'f_T (GHz) / I_C (mA) / 0.1×β_DC / ΔT_j (K)',
        yUnit: '-',
        xLogDefault: false,
        yLogDefault: false,
        series: [
          {
            id: 'ft_temp',
            label: 'Cutoff Frequency f_T (GHz)',
            unit: 'GHz',
            color: '#1E40AF',
            description: 'Cutoff frequency degradation at elevated temperatures due to τ_0(T) and R_Ci0(T)',
            points: ftTempPts,
          },
          {
            id: 'ic_temp',
            label: 'Collector Current I_C (mA)',
            unit: 'mA',
            color: '#0F766E',
            description: 'Collector current rise with temperature at fixed V_BE',
            points: icTempPts,
          },
          {
            id: 'beta_temp',
            label: 'Scaled Gain 0.1 × β_DC',
            unit: '-',
            color: '#B45309',
            description: 'Temperature dependence of current gain controlled by dvgbe and zetabet - zetact',
            points: betaTempPts,
          },
          {
            id: 'dtsh_temp',
            label: 'Self-Heating Rise ΔT_j (K)',
            unit: 'K',
            color: '#9F1239',
            dashed: true,
            description: 'Junction temperature rise ΔT_j = R_th(T) · P_diss',
            points: dtshPts,
          },
        ],
      };
    }

    case 'noise_nqs_substrate': {
      const op = evaluateOperatingPoint(params, bias);
      const opBase = hasBaseline ? evaluateOperatingPoint(baselineParams!, bias) : undefined;
      const n = 55;
      const nfCorrPts: PlotPoint[] = [];
      const nfUncorrPts: PlotPoint[] = [];
      const y21PhasePts: PlotPoint[] = [];

      const computePoint = (p: HicumParamMap, opRes: OperatingPointResult, freq: number) => {
        const omega = 2.0 * Math.PI * freq;
        const tf = Math.max(opRes.Tf, 1e-13);
        const ft = Math.max(opRes.Ft, 1e8);
        const gm = Math.max(opRes.Gmi, 1e-6);
        const rb = Math.max(opRes.opMap.RB ?? 10, 0.5);
        const re = p.re ?? 1.0;
        const beta = Math.max(opRes.Betadc, 10);
        const alit = (p.flnqs ?? 1) !== 0 ? (p.alit ?? 0.333) : 0.0;
        const alqf = (p.flnqs ?? 1) !== 0 ? (p.alqf ?? 0.167) : 0.0;
        const corrOn = (p.flcono ?? 1) !== 0;

        // Minimum Noise Figure NF_min in dB with and without correlated noise (Manual Sec. 2.14)
        const rn = (rb + re) * gm;
        const fRatio = freq / ft;
        const corrFactor = corrOn ? Math.max(0.15, 1.0 - 2.0 * alit * (alqf / Math.max(alit, 0.1))) : 1.0;
        const FminUncorr =
          1.0 +
          1.0 / beta +
          Math.sqrt((2.0 * rn) / beta + 2.0 * rn * fRatio * fRatio);
        const FminCorr =
          1.0 +
          1.0 / beta +
          Math.sqrt((2.0 * rn) / beta + 2.0 * rn * corrFactor * fRatio * fRatio);

        // NQS excess phase of Y21 in degrees ( divided by 10 for clean 0-15 scale alongside dB)
        const nqsPhaseDeg = (omega * tf * (1.0 + alit + alqf) * 180.0) / Math.PI;
        return {
          nfCorrDb: 10.0 * Math.log10(Math.max(FminCorr, 1.001)),
          nfUncorrDb: 10.0 * Math.log10(Math.max(FminUncorr, 1.001)),
          phaseScaled: Math.min(nqsPhaseDeg * 0.1, 18.0),
        };
      };

      for (let i = 0; i < n; i++) {
        const freq = Math.pow(10, 8.0 + (i / (n - 1)) * 3.4); // 100 MHz to 250 GHz
        const cur = computePoint(params, op, freq);
        const base = opBase ? computePoint(baselineParams!, opBase, freq) : undefined;
        nfCorrPts.push({
          x: freq,
          y: cur.nfCorrDb,
          yBaseline: base ? base.nfCorrDb : undefined,
        });
        nfUncorrPts.push({
          x: freq,
          y: cur.nfUncorrDb,
          yBaseline: base ? base.nfUncorrDb : undefined,
        });
        y21PhasePts.push({
          x: freq,
          y: cur.phaseScaled,
          yBaseline: base ? base.phaseScaled : undefined,
        });
      }

      return {
        category,
        title: 'High-Frequency Noise Figure NF_min(f) & Vertical NQS Excess Phase',
        subtitle: 'Correlated vs. uncorrelated shot noise (flcono, alit, alqf) & Bessel NQS delay network (flnqs)',
        xLabel: 'Frequency f',
        xUnit: 'Hz',
        yLabel: 'NF_min (dB) / NQS Phase Delay (0.1 × deg)',
        yUnit: 'dB',
        xLogDefault: true,
        yLogDefault: false,
        series: [
          {
            id: 'nf_corr',
            label: 'Correlated NF_min (dB, flcono=1)',
            unit: 'dB',
            color: '#1E40AF',
            description: 'Minimum noise figure including dynamic base-collector shot noise correlation',
            points: nfCorrPts,
          },
          {
            id: 'nf_uncorr',
            label: 'Uncorrelated NF_min (dB, Classical)',
            unit: 'dB',
            color: '#64748B',
            dashed: true,
            description: 'Classical uncorrelated shot noise prediction overestimating HF noise figure',
            points: nfUncorrPts,
          },
          {
            id: 'nqs_phase',
            label: 'NQS Excess Phase 0.1 × Δφ(Y_21) (deg)',
            unit: 'deg',
            color: '#0F766E',
            description: 'Vertical NQS phase lag controlled by τ_f, alit, and alqf',
            points: y21PhasePts,
          },
        ],
      };
    }
  }
}
