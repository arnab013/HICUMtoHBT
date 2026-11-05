import React, { useState } from 'react';
import { FormulaView } from './FormulaView';
import { Code2, BookOpen, Cpu, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface VaBlockSpec {
  id: string;
  name: string;
  lines: string;
  manualSection: string;
  category: 'Macro' | 'Initialization & Thermal' | 'Core Evaluation' | 'Branch Loading & Noise' | 'Operating Point';
  purpose: string;
  keyEquationsLatex: string[];
  codeSnippet: string;
  linkedParams: string[];
  linkedElements: string[];
}

const VA_BLOCKS: VaBlockSpec[] = [
  {
    id: 'qjmodf',
    name: '`define QJMODF(c_0, u_d, z, a_j, U_cap, C, Qz)',
    lines: 'Lines 240–256',
    manualSection: 'Section 2.4.1 (pp. 32–35)',
    category: 'Macro',
    purpose:
      'Calculates internal and peripheral Base-Emitter depletion capacitance C and charge Qz with hyperbolic smoothing at forward bias to limit peak capacitance to a_j * c_0 and avoid the classical pole at U_cap = u_d.',
    keyEquationsLatex: [
      'V_f = V_{DEi}\\left[1 - a_{jEi}^{-1/z_{Ei}}\\right], \\quad v_j = V_f - V_T \\frac{x + \\sqrt{x^2 + 1.921812}}{2}',
      'Q_{jEi} = \\frac{C_{jEi0}V_{DEi}}{1-z_{Ei}}\\left[1 - \\left(1 - \\frac{v_j}{V_{DEi}}\\right)^{1-z_{Ei}}\\right] + a_{jEi}C_{jEi0}(v_{B\'E\'} - v_j)',
    ],
    codeSnippet: `\`define QJMODF(c_0,u_d,z,a_j,U_cap,C,Qz)\\
    if(c_0 > 0.0) begin\\
        DFV_f    = u_d*(1.0-exp(-ln(a_j)/z));\\
        DFv_e    = (DFV_f-U_cap)/VT;\\
        DFs_q    = sqrt(DFv_e*DFv_e+\`DFa_fj);\\
        DFs_q2   = (DFv_e+DFs_q)*0.5;\\
        DFv_j    = DFV_f-VT*DFs_q2;\\
        DFdvj_dv = DFs_q2/DFs_q;\\
        DFb      = ln(1.0-DFv_j/u_d);\\
        DFC_j1   = c_0*exp(-z*DFb)*DFdvj_dv;\\
        C        = DFC_j1+a_j*c_0*(1.0-DFdvj_dv);\\
        DFQ_j    = c_0*u_d*(1.0-exp(DFb*(1.0-z)))/(1.0-z);\\
        Qz       = DFQ_j+a_j*c_0*(U_cap-DFv_j);\\
    end`,
    linkedParams: ['cjei0', 'vdei', 'zei', 'ajei', 'cjep0', 'vdep', 'zep', 'ajep'],
    linkedElements: ['cjei', 'cjep'],
  },
  {
    id: 'qjmod',
    name: '`define QJMOD & `define HICJQ (Collector Punch-Through)',
    lines: 'Lines 280–333',
    manualSection: 'Section 2.4.2–2.4.4 (pp. 35–41)',
    category: 'Macro',
    purpose:
      'Calculates Base-Collector (internal & external) and Collector-Substrate depletion capacitance and charge across three bias regimes: medium bias, large forward bias (a_j=2.4), and large reverse bias beyond epitaxial collector punch-through (v_pt) where grading reduces to z_r = z/4.',
    keyEquationsLatex: [
      'C_{jCi} = C_{jCi,cl} + C_{jCi,PT} + C_{jCi,fb}, \\quad z_{Ci,r} = \\frac{z_{Ci}}{4}',
      'C_{jCi0,r} = C_{jCi0}\\left(\\frac{V_{DCi}}{V_{PTCi}}\\right)^{z_{Ci}-z_{Ci,r}}',
    ],
    codeSnippet: `\`define QJMOD(c_0,u_d,z,a_j,v_pt,U_cap,C,Qz)\\
    if(c_0 > 0.0) begin\\
        Dz_r    = z/4.0;\\
        Dv_p    = v_pt-u_d;\\
        DV_f    = u_d*(1.0-exp(-ln(a_j)/z));\\
        DC_max  = a_j*c_0;\\
        DC_c    = c_0*exp((Dz_r-z)*ln(v_pt/u_d));\\
        ...\\
        C       = DC_j1+DC_j2+DC_j3;\\
        Qz      = (DQ_j1+DQ_j2-DQ_j3)*u_d+DC_max*Dv_j4;\\
    end`,
    linkedParams: ['cjci0', 'vdci', 'zci', 'vptci', 'cjcx0', 'vdcx', 'zcx', 'vptcx', 'cjs0', 'vds', 'zs', 'vpts'],
    linkedElements: ['cjci', 'cjcx1', 'cjcx2', 'cjs', 'cscp'],
  },
  {
    id: 'hicqff',
    name: '`define HICQFF & `define HICQFC (High-Current Transit Time & 2D/3D Spreading)',
    lines: 'Lines 342–533',
    manualSection: 'Section 2.3.1 & 2.16.1 (pp. 23–31, 94–98)',
    category: 'Macro',
    purpose:
      'Evaluates high-current minority charge Qf, weighted GICCR minority charge QfT, forward transit time Tf, weighted transit time TfT, and excess base barrier charge Qbf including neutral emitter storage (tef0, gtfe), Kirk-effect collector injection width w (thcs, ahc, fthc), BC heterojunction barrier (vcbar, icbar, acbar), and 2D/3D lateral collector current spreading (latb, latl).',
    keyEquationsLatex: [
      'Q_{f,T} = h_{f0}Q_{f0} + \\Delta Q_{Bf,b} + \\Delta Q_{Bf,c} + h_{fE}\\Delta Q_{Ef} + h_{fC}\\Delta Q_{Cf,T}',
      '\\Delta V_{cB} = V_{cBar}\\exp\\left(-\\frac{2}{i_{Bar} + \\sqrt{i_{Bar}^2 + a_{cBar}}}\\right)',
    ],
    codeSnippet: `\`define HICQFF(itf,I_CK,T_f,Q_f,T_fT,Q_fT,Q_bf)\\
    FFitf_ick = itf/I_CK;\\
    FFdTef  = tef0_t*exp(gtfe*ln(FFitf_ick));\\
    FFdQef  = FFdTef*itf/(1+gtfe);\\
    ...\\
    FFdQbfb = (1-fthc)*thcs_t*itf*(exp(FFdVc/VT)-1);\\
    FFic    = 1-1.0/FFitf_ick;\\
    FFw     = (FFic+sqrt(FFic*FFic+ahc))/(1+sqrt(1+ahc));\\
    FFdQfhc = thcs_t*itf*FFw*FFw*exp((FFdVc-vcbar)/VT);\\
    ...\\
    Q_fT    = hf0_t*Q_f+FFdQbfb+FFdQbfc+hfe_t*FFdQef+hfc_t*FFdQcfcT;`,
    linkedParams: ['tef0', 'gtfe', 'thcs', 'ahc', 'fthc', 'vcbar', 'icbar', 'acbar', 'latb', 'latl', 'hf0', 'hfe', 'hfc'],
    linkedElements: ['qf', 'it'],
  },
  {
    id: 'tmphicj',
    name: '`define TMPHICJ & Thermal Update Blocks',
    lines: 'Lines 584–600, 1004–1428',
    manualSection: 'Section 2.14 (pp. 73–92)',
    category: 'Initialization & Thermal',
    purpose:
      'Computes temperature-dependent bandgap voltages Vg(T), built-in potentials VD(T), zero-bias capacitances Cj0(T), saturation currents IS(T), GICCR prefactor c10(T), transit times, series resistances, and HBT charge weighting factors at either ambient temperature (flsh=0) or instant self-heated junction temperature Tdev = Tamb + dt + V(br_sht).',
    keyEquationsLatex: [
      'V_{Dj}(T) = V_{Dj}(T_0)\\frac{T}{T_0} - m_g V_T \\ln\\left(\\frac{T}{T_0}\\right) - V_{geff}(0)\\left(\\frac{T}{T_0}-1\\right)',
      'C_{j0}(T) = C_{j0}(T_0)\\left(\\frac{V_D(T_0)}{V_D(T)}\\right)^z',
    ],
    codeSnippet: `\`define TMPHICJ(c_j,vd0,z,w,is_al,vgeff,c_j_t,vd_t,w_t)\\
    if (c_j > 0.0) begin\\
        vdj0  = 2*vt0*ln(exp(vd0*0.5/vt0)-exp(-0.5*vd0/vt0));\\
        vdjt  = vdj0*qtt0+vgeff*(1-qtt0)-mg*VT*ln_qtt0;\\
        vdt   = vdjt+2*VT*ln(0.5*(1+sqrt(1+4*exp(-vdjt/VT))));\\
        vd_t  = vdt;\\
        c_j_t = c_j*exp(z*ln(vd0/vd_t));\\
    end`,
    linkedParams: ['vgb', 'vge', 'vgc', 'vgs', 'f1vg', 'f2vg', 'zetact', 'zetabet', 'zetaci', 'alvs', 'zetarbi'],
    linkedElements: ['rth', 'cth', 'pterm'],
  },
  {
    id: 'hiccr_loop',
    name: 'GICCR Newton-Raphson Iteration & HICICK Critical Current',
    lines: 'Lines 1438–1596',
    manualSection: 'Section 2.2 & 2.3.1 (pp. 9–24)',
    category: 'Core Evaluation',
    purpose:
      'Evaluates bias-dependent BE weight factor hjEi(Vbiei), low-current hole charge Q_0 with base reach-through smoothing, low-current transit time T_f0, critical current ick(vceff), and iteratively solves the implicit non-linear GICCR equation for total weighted hole charge Q_pT to obtain exact forward and reverse transfer currents itf and itr.',
    keyEquationsLatex: [
      'I_{CK} = \\frac{v_{ceff}}{r_{Ci0}} \\frac{1}{\\left(1 + (v_{ceff}/V_{lim})^{\\delta_{ck}}\\right)^{1/\\delta_{ck}}} \\left[1 + \\frac{x + \\sqrt{x^2 + a_{ick}}}{2}\\right]',
      'Q_{p,T} = Q_{pT,low} + Q_{f,T}(i_{Tf}) + Q_r(i_{Tr})',
    ],
    codeSnippet: `while (abs(d_Q) >= \`RTOLC*abs(Q_pT) && l_it <= \`l_itmax) begin
    I_Tf1 = i_0f/Q_pT;
    a_h   = Oich*I_Tf1;
    itf   = I_Tf1*(1.0+a_h);
    itr   = i_0r/Q_pT;
    Tf    = T_f0;
    Qf    = T_f0*itf;
    \`HICQFF(itf,ick,Tf,Qf,T_fT,Q_fT,Q_bf)
    Qr    = Tr*itr;
    a     = 1.0+(T_fT*I_Tf1*(1.0+2.0*a_h)+Qr)/Q_pT;
    d_Q   = -(Q_pT-(Q_0+Q_fT+Qr))/a;
    Q_pT  = Q_pT+d_Q;
    l_it  = l_it+1;
end`,
    linkedParams: ['c10', 'qp0', 'hjei', 'ahjei', 'rhjei', 'hjci', 'rci0', 'vlim', 'vpt', 'vces', 'delck', 'aick'],
    linkedElements: ['it', 'qf', 'qr'],
  },
  {
    id: 'hicrbi_avl_tun',
    name: 'HICRBI (Modulated Base Resistance), HICAVL (Avalanche), & HICTUN (Tunneling)',
    lines: 'Lines 1617–1686',
    manualSection: 'Section 2.6 & 2.10 (pp. 45–49, 60–64)',
    category: 'Core Evaluation',
    purpose:
      'Computes internal base resistance rbi with conductivity modulation fQz, emitter current crowding ln(1+ETA)/ETA, and peripheral minority charge factor fqi; weak collector-base avalanche current iavl; and reverse base-emitter band-to-band tunneling current ibet.',
    keyEquationsLatex: [
      'r_{Bi}^* = r_{Bi0} \\frac{1}{f(q_r)} \\frac{\\ln(1+\\eta)}{\\eta} \\frac{Q_{jEi} + f_{Qi}Q_f}{Q_{jEi} + Q_f}',
      'i_{AVL} = i_{Tf} f_{AVL}(V_{DCi}-v_{B\'C\'})\\exp\\left(-\\frac{q_{AVL}}{C_{jCi}(V_{DCi}-v_{B\'C\'})}\\right)',
    ],
    codeSnippet: `if(rbi0_t > 0.0) begin : HICRBI
    f_QR   = (1+fdqr0)*qp0_t;
    Qz0    = Qjei+Qjci+Qf;
    Qz_nom = 1+Qz0/f_QR;
    fQz    = 0.5*(Qz_nom+sqrt(Qz_nom*Qz_nom+0.01));
    rbi    = rbi0_t/fQz;
    if(ibei > 0.0) begin
        ETA = rbi*ibei*fgeo/VT;
        rbi = (ETA < 1.0e-6) ? rbi*(1.0-0.5*ETA) : rbi*ln(1.0+ETA)/ETA;
    end
    if(Qf > 0.0) rbi = rbi*(Qjei+Qf*fqi)/(Qjei+Qf);
end`,
    linkedParams: ['rbi0', 'fdqr0', 'fgeo', 'fqi', 'favl', 'qavl', 'ibets', 'abet', 'tunode'],
    linkedElements: ['rbi', 'iavl', 'ibet'],
  },
  {
    id: 'nqs_load_noise',
    name: 'Vertical NQS Adjunct Networks, Branch Loading & Correlated Noise',
    lines: 'Lines 1756–1977',
    manualSection: 'Section 2.9 & 2.13 (pp. 57–59, 69–72)',
    category: 'Branch Loading & Noise',
    purpose:
      'Implements vertical NQS input charge delay (1st-order RC network on node xf) and transfer current excess phase (2nd-order Bessel LCR network on nodes xf1, xf2), loads all 22 electrical/thermal branches, and assigns thermal, flicker, and correlated HF base-collector shot noise sources.',
    keyEquationsLatex: [
      'I_{xf1} = \\frac{V_{xf2} - i_{Tf}}{\\tau_f}\\tau_0, \\quad Q_{xf1} = \\alpha_{it}\\tau_0 V_{xf1}, \\quad Q_{xf2} = \\frac{\\alpha_{it}\\tau_0}{3}V_{xf2}',
      'S_{i_{nb}i_{nc}} = 2 q j \\omega \\frac{\\tau_{Bf}}{3} I_C',
    ],
    codeSnippet: `if ((flnqs != 0 || flcomp == 0.0 || flcomp == 2.1) && Tf != 0 && (alit > 0 || alqf > 0)) begin
    Vxf1  = V(br_bxf1);
    Vxf2  = V(br_bxf2);
    Ixf1  = (Vxf2-itf)/Tf*t0;
    Ixf2  = (Vxf2-Vxf1)/Tf*t0;
    Qxf1  = alit*Vxf1*t0;
    Qxf2  = alit*Vxf2/3*t0;
    Itxf  = Vxf2;
    Vxf   = V(br_bxf);
    Ixf   = (Vxf - Qdei)*(t0/Tf);
    Qxf   = alqf*Vxf*t0;
    Qdeix = Vxf;
end`,
    linkedParams: ['flnqs', 'alit', 'alqf', 'fcrbi', 'kf', 'af', 'cfbe', 'kfre', 'afre', 'flcono'],
    linkedElements: ['nqs_qf', 'nqs_it', 'crbi', 'noise_corr'],
  },
];

interface VerilogAExplorerViewProps {
  onSelectParamInLab: (paramId: string) => void;
  onSelectElementInLab: (elementId: string) => void;
}

export const VerilogAExplorerView: React.FC<VerilogAExplorerViewProps> = ({
  onSelectParamInLab,
  onSelectElementInLab,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string>(VA_BLOCKS[0].id);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#E5E2DA] rounded-lg p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#E7EEF4] text-[#2B4C65] font-semibold">
                Official Verilog-A Implementation (`hicumL2V2p34.va` · 2,066 Lines)
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#E6F0EE] text-[#2A645E] font-medium">
                Originator: M. Schröter & A. Pawlak
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A] mt-1.5 font-scientific">
              Verilog-A Architecture & Manual Cross-Reference
            </h2>
            <p className="text-sm text-[#475569] mt-1 max-w-3xl">
              Direct structural mapping between the compact model source code (<code>hic2_full</code>{' '}
              module with nodes <code>c, b, e, s, tnode</code> and internal nodes{' '}
              <code>ci, ei, bp, bi, si, xf, xf1, xf2</code>) and the manual equations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Navigation List */}
        <div className="lg:col-span-4 space-y-2.5">
          {VA_BLOCKS.map((blk) => {
            const active = blk.id === selectedBlockId;
            return (
              <button
                key={blk.id}
                onClick={() => setSelectedBlockId(blk.id)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                  active
                    ? 'bg-[#2B4C65] text-white border-[#2B4C65] shadow-sm'
                    : 'bg-white text-[#0F172A] border-[#E5E2DA] hover:border-[#94A3B8]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-[#EAE8E1] text-[#475569]'
                    }`}
                  >
                    {blk.category}
                  </span>
                  <span
                    className={`text-[11px] font-mono ${
                      active ? 'text-[#DCE6EF]' : 'text-[#64748B]'
                    }`}
                  >
                    {blk.lines}
                  </span>
                </div>
                <div className="font-mono font-bold text-xs mt-1.5">{blk.name}</div>
                <div
                  className={`text-[11px] mt-1 line-clamp-2 ${
                    active ? 'text-[#DCE6EF]' : 'text-[#475569]'
                  }`}
                >
                  {blk.manualSection}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Code & Physics Inspector */}
        <div className="lg:col-span-8">
          {VA_BLOCKS.filter((b) => b.id === selectedBlockId).map((blk) => (
            <div
              key={blk.id}
              className="bg-white border border-[#E5E2DA] rounded-lg p-5 shadow-sm space-y-4"
            >
              <div className="border-b border-[#E5E2DA] pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-[#E7EEF4] text-[#2B4C65]">
                    {blk.lines}
                  </span>
                  <span className="text-xs font-mono text-[#2A645E] font-medium">
                    {blk.manualSection}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-mono text-[#0F172A] mt-1.5">
                  {blk.name}
                </h3>
                <p className="text-xs text-[#334155] leading-relaxed mt-2">
                  {blk.purpose}
                </p>
              </div>

              {/* Governing Equations */}
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-[#475569] font-semibold">
                  Corresponding Documented Equations
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {blk.keyEquationsLatex.map((eq, i) => (
                    <div
                      key={i}
                      className="p-3 rounded bg-[#F7F6F2] border border-[#D8D4CA] overflow-x-auto"
                    >
                      <FormulaView latex={eq} displayMode />
                    </div>
                  ))}
                </div>
              </div>

              {/* Verilog-A Source Excerpt */}
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-[#475569] font-semibold">
                  Verilog-A Implementation Excerpt (`hicumL2V2p34.va`)
                </div>
                <pre className="p-4 rounded-md bg-[#0F172A] text-[#F7F6F2] font-mono text-xs overflow-x-auto leading-relaxed">
                  <code>{blk.codeSnippet}</code>
                </pre>
              </div>

              {/* Linked Parameters & Elements */}
              <div className="pt-3 border-t border-[#E5E2DA] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-mono text-[#64748B]">Parameters:</span>
                  {blk.linkedParams.map((pid) => (
                    <button
                      key={pid}
                      onClick={() => onSelectParamInLab(pid)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-semibold rounded bg-[#E7EEF4]/70 text-[#2B4C65] hover:bg-[#2B4C65] hover:text-white transition-colors"
                    >
                      {pid} <ArrowUpRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-mono text-[#64748B]">Circuit Elements:</span>
                  {blk.linkedElements.map((cid) => (
                    <button
                      key={cid}
                      onClick={() => onSelectElementInLab(cid)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded bg-[#E6F0EE]/70 text-[#2A645E] hover:bg-[#2A645E] hover:text-white transition-colors"
                    >
                      EC:{cid} <ArrowUpRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
