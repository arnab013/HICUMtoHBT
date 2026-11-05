import React, { useState } from 'react';
import {
  HicumParameter,
  CircuitElement,
} from '../data/hicumTypes';
import { FormulaView } from './FormulaView';
import {
  Layers,
  Compass,
  Cpu,
  ArrowUpRight,
  CheckCircle2,
  Box,
  Sparkles,
  Info,
} from 'lucide-react';

interface CrossSectionDiagramsProps {
  parameters: HicumParameter[];
  elements: CircuitElement[];
  onSelectParamInLab: (paramId: string) => void;
  onSelectElementInLab: (elementId: string) => void;
}

interface PhysicalRegionSpec {
  id: string;
  name: string;
  dopingTag: string;
  manualRef: string;
  color: string;
  spatialClassification: 'localized' | 'distributed';
  description: string;
  physicalMechanisms: string[];
  circuitElements: string[];
  keyParameters: string[];
}

const PHYSICAL_REGIONS: PhysicalRegionSpec[] = [
  {
    id: 'emitter_stack',
    name: 'Polysilicon & Mono-Crystalline Emitter Window',
    dopingTag: 'n+ Poly / n+ Mono-Si',
    manualRef: 'Sections 2.2.2, 2.8.1 (Figs. 2.2.0/2, 2.8.1/1)',
    color: '#2B4C65',
    spatialClassification: 'localized',
    description:
      'Heavily doped n+ polysilicon and single-crystal emitter window feeding electrons into the intrinsic base. Stores neutral emitter hole charge ΔQ_Ef at high injection and contributes emitter contact/poly/interfacial series resistance R_E.',
    physicalMechanisms: [
      'Emitter series resistance R_E = r_Em + r_Ep + r_Ei + r_Eb',
      'High-current neutral emitter minority hole charge storage ΔQ_Ef (tef0, gtfe, hfe)',
      'Emitter resistance 1/f flicker noise (kfre, afre)',
    ],
    circuitElements: ['re', 'qf'],
    keyParameters: ['re', 'zetare', 'tef0', 'gtfe', 'hfe', 'kfre', 'afre'],
  },
  {
    id: 'be_spacer_perim',
    name: 'B-E Oxide Sidewall Spacer & Emitter Perimeter Junction',
    dopingTag: 'SiO2/Si3N4 Spacer & n+/p+ Sidewall',
    manualRef: 'Sections 2.3.2, 2.4.1, 2.8.3, 2.9 (Fig. 2.8.3/1)',
    color: '#2A645E',
    spatialClassification: 'localized',
    description:
      'Dielectric sidewall spacer separating the emitter poly/pedestal from the extrinsic base poly, plus the high-field peripheral B*-E\' junction surrounding the emitter stripe.',
    physicalMechanisms: [
      'Peripheral B-E depletion capacitance C_jEp (cjep0, vdep, zep, ajep)',
      'Peripheral B-E injection & SRH recombination diode i_jBEp (ibeps, mbep, ireps, mrep)',
      'Reverse B-E band-to-band Zener tunneling i_BEt (ibets, abet, tunode)',
      'Sidewall spacer parasitic capacitance C_BEpar partitioned by fbepar into C_BEpar1 and C_BEpar2',
    ],
    circuitElements: ['cjep', 'ibep', 'ibet', 'cbepar1', 'cbepar2'],
    keyParameters: ['cjep0', 'vdep', 'zep', 'ajep', 'ibeps', 'mbep', 'ireps', 'mrep', 'ibets', 'abet', 'cbepar', 'fbepar'],
  },
  {
    id: 'intrinsic_sige_base',
    name: 'Intrinsic Graded SiGe Base Under Emitter Window',
    dopingTag: 'p-Si_{1-x}Ge_x Graded Base',
    manualRef: 'Sections 2.2, 2.3.1, 2.4.1, 2.5 (Fig. 2.2.0/2)',
    color: '#0D9488',
    spatialClassification: 'distributed',
    description:
      'Thin p-type SiGe base layer directly beneath the emitter window (node B\'). Ge mole-fraction grading creates a built-in drift field accelerating electrons toward the collector while modulating zero-bias hole charge Q_p0 and weighting factors h_jEi, h_jCi.',
    physicalMechanisms: [
      'GICCR transfer current i_T = i_Tf - i_Tr governed by integrated hole charge Q_p,T',
      'Intrinsic B-E depletion charge Q_jEi & diode current i_jBEi',
      'Conductivity-modulated & emitter-crowded internal pinch-base resistance R_bi* and AC shunt C_rBi',
      'Vertical NQS delay (alqf, alit) and correlated base-collector shot noise (flcono)',
    ],
    circuitElements: ['it', 'ibei', 'cjei', 'qf', 'rbi', 'crbi', 'nqs_qf', 'nqs_it', 'noise_corr'],
    keyParameters: ['c10', 'qp0', 'hjei', 'ahjei', 'hjci', 't0', 'rbi0', 'fdqr0', 'fgeo', 'fcrbi', 'cjei0', 'vdei', 'zei', 'ajei', 'ibeis', 'mbei'],
  },
  {
    id: 'extrinsic_base_link',
    name: 'Extrinsic Base Polysilicon, Silicide & Link-Base Region',
    dopingTag: 'p+ Poly / CoSi2 / p+ Link Base',
    manualRef: 'Sections 2.5, 2.6, 2.7 (Figs. 2.7.0/1, 2.7.0/2)',
    color: '#1D4ED8',
    spatialClassification: 'distributed',
    description:
      'Connects the external base terminal B through silicide/contact resistance r_KB, poly-base sheet resistance r_po/r_pm, and link-base spacer resistance r_sp to the perimeter base node B*.',
    physicalMechanisms: [
      'Extrinsic base resistance R_Bx = r_KB + r_po + r_pm + r_sp (rbx, zetarbx)',
      'Split extrinsic B-C depletion & isolation capacitance C_jCx1 (to B) and C_jCx2 (to B*) via fbcpar',
      'Extrinsic B-C diode current i_jBCx and parasitic PNP base terminal (node B*)',
    ],
    circuitElements: ['rbx', 'cjcx1', 'cjcx2', 'ijbcx'],
    keyParameters: ['rbx', 'zetarbx', 'cjcx0', 'vdcx', 'zcx', 'vptcx', 'cbcpar', 'fbcpar', 'ibcxs', 'mbcx'],
  },
  {
    id: 'intrinsic_collector_epi',
    name: 'Intrinsic Collector Epitaxial Layer & SIC Pedestal',
    dopingTag: 'n- Epi / n-SIC Pedestal',
    manualRef: 'Sections 2.2.1, 2.2.2, 2.4.2, 2.10 (Fig. 2.2.0/2)',
    color: '#824726',
    spatialClassification: 'distributed',
    description:
      'Lightly doped n-type epitaxial collector beneath the intrinsic base. Governs the B\'-C\' space-charge width, Kirk critical current onset I_CK(V_C\'E\'), high-current base push-out Δτ_fh, SiGe/Si heterojunction barrier (vcbar), and impact ionization i_AVL.',
    physicalMechanisms: [
      'Kirk critical current I_CK governed by rci0, vlim, vces, vpt, aick, delck (no separate internal R_Ci node needed)',
      'High-current collector/base widening charge Q_fhc and BC barrier charge Q_Bfb (thcs, ahc, fthc, vcbar, icbar)',
      'Intrinsic B-C depletion capacitance C_jCi with epitaxial punch-through limiting (vptci)',
      'High-field impact ionization avalanche current i_AVL (favl, qavl, kavl)',
    ],
    circuitElements: ['cjci', 'ibci', 'iavl', 'qr', 'it'],
    keyParameters: ['rci0', 'vlim', 'vces', 'vpt', 'thcs', 'ahc', 'fthc', 'vcbar', 'icbar', 'cjci0', 'vdci', 'zci', 'vptci', 'favl', 'qavl'],
  },
  {
    id: 'buried_layer_sinker',
    name: 'n+ Subcollector Buried Layer & Collector Sinker Plug',
    dopingTag: 'n+ Buried Layer / n+ Sinker',
    manualRef: 'Section 2.8.2 (Fig. 2.8.2/1)',
    color: '#7C2D12',
    spatialClassification: 'localized',
    description:
      'Low-resistivity n+ buried subcollector layer beneath the epi collector and vertical n+ sinker diffusion leading to the surface collector metal contact C.',
    physicalMechanisms: [
      'External collector series resistance R_Cx = r_KC + r_sink + r_bl (rcx, zetarcx)',
      'Forms the internal collector node C\' boundary at the bottom of the intrinsic epitaxial layer',
    ],
    circuitElements: ['rcx'],
    keyParameters: ['rcx', 'zetarcx'],
  },
  {
    id: 'substrate_trench',
    name: 'p- Silicon Substrate & STI / DTI Trench Isolation',
    dopingTag: 'p- Substrate / Oxide Trench',
    manualRef: 'Sections 2.11, 2.12 (Fig. 2.11.0/1)',
    color: '#8A3B33',
    spatialClassification: 'distributed',
    description:
      'P-type silicon wafer substrate and shallow/deep trench oxide isolation surrounding the subcollector. Models collector-substrate junction depletion (C_jS, C_SCp), parasitic PNP action (i_TS), and lossy bulk coupling (R_su, C_su).',
    physicalMechanisms: [
      'Collector-substrate bottom (C_jS) and perimeter (C_SCp) depletion capacitances with punch-through',
      'Parasitic substrate PNP transfer current i_TS and storage charge Q_dS (itss, msf, tsf)',
      'Intra-device bulk substrate resistance R_su and permittivity relaxation capacitance C_su between S\' and S',
    ],
    circuitElements: ['cjs', 'cscp', 'ijsc', 'its', 'qdsu', 'rsu', 'csu'],
    keyParameters: ['cjs0', 'vds', 'zs', 'vpts', 'cscp0', 'vdsp', 'zsp', 'itss', 'msf', 'tsf', 'iscs', 'msc', 'rsu', 'csu'],
  },
];

export const CrossSectionDiagrams: React.FC<CrossSectionDiagramsProps> = ({
  parameters,
  onSelectParamInLab,
  onSelectElementInLab,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('intrinsic_sige_base');
  const [activeFigureTab, setActiveFigureTab] = useState<'cross_section' | 'bandgap_grading' | 'resistance_isolation'>('cross_section');

  const activeRegion =
    PHYSICAL_REGIONS.find((r) => r.id === selectedRegionId) || PHYSICAL_REGIONS[0];

  const counts = {
    localized: parameters.filter((p) => p.spatialNature === 'localized').length,
    distributed: parameters.filter((p) => p.spatialNature === 'distributed').length,
    conceptual: parameters.filter((p) => p.spatialNature === 'conceptual').length,
    flag: parameters.filter((p) => p.spatialNature === 'flag').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Spatial Classification Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-[#E7EEF4] text-[#2B4C65] border border-[#C5D4E2] text-xs font-mono font-semibold">
                Physical Structure & Spatial Localization Map
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#E6F0EE] text-[#22544F] border border-[#C0D8D4] text-xs font-mono font-medium">
                Manual Figs. 2.2.0/2, 2.7.0/1, 2.8.1–3, 2.11.0/1
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1.5 font-scientific">
              SiGe HBT Physical Cross-Sections & Parameter Localization
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Interactive mapping between semiconductor device regions, HICUM/L2 equivalent-circuit branches, and model parameters—explicitly distinguishing physically localized junctions from distributed 2D/3D and conceptual parameters.
            </p>
          </div>

          {/* Spatial Taxonomy Pill Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <div className="px-3 py-2 rounded-lg bg-[#E6F0EE]/70 border border-[#C0D8D4]">
              <div className="text-[11px] font-medium text-[#22544F]">Physically Localized</div>
              <div className="text-lg font-bold font-mono text-[#153733]">{counts.localized} params</div>
            </div>
            <div className="px-3 py-2 rounded-lg bg-[#E7EEF4]/70 border border-[#C5D4E2]">
              <div className="text-[11px] font-medium text-[#2B4C65]">Distributed 2D/3D</div>
              <div className="text-lg font-bold font-mono text-[#1A3247]">{counts.distributed} params</div>
            </div>
            <div className="px-3 py-2 rounded-lg bg-[#F4EAE3]/70 border border-[#DFC8B8]">
              <div className="text-[11px] font-medium text-[#824726]">Conceptual / Thermal</div>
              <div className="text-lg font-bold font-mono text-[#552D17]">{counts.conceptual} params</div>
            </div>
            <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200">
              <div className="text-[11px] font-medium text-slate-700">Simulator Flags</div>
              <div className="text-lg font-bold font-mono text-slate-900">{counts.flag} params</div>
            </div>
          </div>
        </div>

        {/* Sub-figure selector tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 flex-wrap">
          <button
            onClick={() => setActiveFigureTab('cross_section')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFigureTab === 'cross_section'
                ? 'bg-[#2B4C65] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            1. Interactive 2D SiGe HBT Cross-Section & Region Map
          </button>
          <button
            onClick={() => setActiveFigureTab('bandgap_grading')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFigureTab === 'bandgap_grading'
                ? 'bg-[#2B4C65] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            2. HBT Bandgap & Doping Profile (Manual Fig. 2.2.0/2)
          </button>
          <button
            onClick={() => setActiveFigureTab('resistance_isolation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFigureTab === 'resistance_isolation'
                ? 'bg-[#2B4C65] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            3. Series Resistances & Trench Isolation (Figs. 2.7.0/1, 2.8.1–3, 2.11.0/1)
          </button>
        </div>
      </div>

      {activeFigureTab === 'cross_section' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Cols: Interactive SVG Cross-Section */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#2B4C65]" />
                  <span>Click any physical region in the SiGe HBT cross-section to inspect its compact model elements</span>
                </span>
              </div>

              <svg
                viewBox="0 0 720 430"
                className="w-full h-auto bg-[#F7F6F2] rounded-lg border border-slate-200 select-none"
              >
                {/* P- Substrate Bottom Layer */}
                <g
                  onClick={() => setSelectedRegionId('substrate_trench')}
                  className="cursor-pointer"
                >
                  <rect
                    x={30}
                    y={340}
                    width={660}
                    height={65}
                    rx={4}
                    fill={selectedRegionId === 'substrate_trench' ? '#E2C4BF' : '#F3E3E1'}
                    stroke="#8A3B33"
                    strokeWidth={selectedRegionId === 'substrate_trench' ? 2.5 : 1.3}
                  />
                  <text x={360} y={372} textAnchor="middle" className="fill-[#5A251F] font-bold text-[12px]">
                    p⁻ Silicon Wafer Substrate (Nodes S&apos;, S · R_su, C_su, C_jS, C_SCp, i_TS)
                  </text>
                  <text x={360} y={390} textAnchor="middle" className="fill-[#8A3B33] font-mono text-[10px]">
                    Click to inspect Collector-Substrate Junction & Intra-Device Substrate Coupling
                  </text>
                </g>

                {/* Deep Trench Isolation (DTI) Left & Right */}
                <g
                  onClick={() => setSelectedRegionId('substrate_trench')}
                  className="cursor-pointer"
                >
                  <rect x={45} y={145} width={38} height={205} fill="#E5E2DA" stroke="#64748B" strokeWidth={1.5} />
                  <rect x={637} y={145} width={38} height={205} fill="#E5E2DA" stroke="#64748B" strokeWidth={1.5} />
                  <text
                    x={64}
                    y={250}
                    textAnchor="middle"
                    transform="rotate(-90, 64, 250)"
                    className="fill-slate-700 font-mono text-[9.5px] font-semibold"
                  >
                    Deep Trench (DTI)
                  </text>
                  <text
                    x={656}
                    y={250}
                    textAnchor="middle"
                    transform="rotate(-90, 656, 250)"
                    className="fill-slate-700 font-mono text-[9.5px] font-semibold"
                  >
                    Deep Trench (DTI)
                  </text>
                </g>

                {/* n+ Buried Layer & Collector Sinker */}
                <g
                  onClick={() => setSelectedRegionId('buried_layer_sinker')}
                  className="cursor-pointer"
                >
                  {/* Buried subcollector */}
                  <rect
                    x={83}
                    y={285}
                    width={554}
                    height={55}
                    fill={selectedRegionId === 'buried_layer_sinker' ? '#DFC8B8' : '#F4EAE3'}
                    stroke="#824726"
                    strokeWidth={selectedRegionId === 'buried_layer_sinker' ? 2.5 : 1.4}
                  />
                  {/* Right n+ Sinker plug */}
                  <rect
                    x={545}
                    y={145}
                    width={92}
                    height={140}
                    fill={selectedRegionId === 'buried_layer_sinker' ? '#DFC8B8' : '#F4EAE3'}
                    stroke="#824726"
                    strokeWidth={selectedRegionId === 'buried_layer_sinker' ? 2.5 : 1.4}
                  />
                  {/* Collector metal contact C */}
                  <rect x={558} y={115} width={66} height={30} rx={3} fill="#0F172A" />
                  <text x={591} y={134} textAnchor="middle" className="fill-white font-mono font-bold text-[11px]">
                    Terminal C
                  </text>
                  <text x={320} y={316} textAnchor="middle" className="fill-[#552D17] font-bold text-[12px]">
                    n⁺ Subcollector Buried Layer & Sinker (R_Cx = r_KC + r_sink + r_bl → Node C&apos;)
                  </text>
                  <text x={591} y={220} textAnchor="middle" className="fill-[#552D17] font-mono font-semibold text-[10px]">
                    n⁺ Sinker
                  </text>
                </g>

                {/* Shallow Trench Isolation (STI) */}
                <rect x={460} y={145} width={85} height={55} fill="#D8D4CA" stroke="#64748B" strokeWidth={1.2} />
                <text x={502} y={176} textAnchor="middle" className="fill-slate-700 font-mono text-[9.5px] font-semibold">
                  STI Oxide
                </text>

                {/* Intrinsic Collector Epi & SIC Pedestal */}
                <g
                  onClick={() => setSelectedRegionId('intrinsic_collector_epi')}
                  className="cursor-pointer"
                >
                  <rect
                    x={83}
                    y={195}
                    width={377}
                    height={90}
                    fill={selectedRegionId === 'intrinsic_collector_epi' ? '#FED7AA' : '#FFEDD5'}
                    stroke="#D97706"
                    strokeWidth={selectedRegionId === 'intrinsic_collector_epi' ? 2.5 : 1.4}
                  />
                  {/* SIC Pedestal under emitter window */}
                  <rect
                    x={210}
                    y={195}
                    width={130}
                    height={90}
                    fill={selectedRegionId === 'intrinsic_collector_epi' ? '#FDBA74' : '#FED7AA'}
                    stroke="#824726"
                    strokeDasharray="4 2"
                    strokeWidth={1.6}
                  />
                  <text x={275} y={232} textAnchor="middle" className="fill-[#552D17] font-bold text-[11px]">
                    n-SIC / Epi Collector (C&apos;)
                  </text>
                  <text x={275} y={248} textAnchor="middle" className="fill-[#6E3B1F] font-mono text-[9.5px]">
                    I_CK, Q_jCi, i_AVL, Δτ_fh, v_cbar
                  </text>
                </g>

                {/* Intrinsic Graded SiGe Base (p-SiGe) */}
                <g
                  onClick={() => setSelectedRegionId('intrinsic_sige_base')}
                  className="cursor-pointer"
                >
                  <rect
                    x={195}
                    y={152}
                    width={160}
                    height={43}
                    fill={selectedRegionId === 'intrinsic_sige_base' ? '#C0D8D4' : '#E6F0EE'}
                    stroke="#2A645E"
                    strokeWidth={selectedRegionId === 'intrinsic_sige_base' ? 2.5 : 1.6}
                  />
                  <text x={275} y={171} textAnchor="middle" className="fill-[#153733] font-bold text-[11px]">
                    p-SiGe Intrinsic Base (Node B&apos;)
                  </text>
                  <text x={275} y={186} textAnchor="middle" className="fill-[#1C4642] font-mono text-[9.5px]">
                    Q_p0, i_T, R_bi*, C_rBi, Q_jEi, Q_f
                  </text>
                </g>

                {/* Extrinsic Base Poly & Link Base (Left & Right of Emitter) */}
                <g
                  onClick={() => setSelectedRegionId('extrinsic_base_link')}
                  className="cursor-pointer"
                >
                  {/* Left extrinsic base */}
                  <rect
                    x={83}
                    y={145}
                    width={112}
                    height={50}
                    fill={selectedRegionId === 'extrinsic_base_link' ? '#C5D4E2' : '#E7EEF4'}
                    stroke="#2B4C65"
                    strokeWidth={selectedRegionId === 'extrinsic_base_link' ? 2.5 : 1.4}
                  />
                  {/* Right extrinsic base */}
                  <rect
                    x={355}
                    y={145}
                    width={105}
                    height={50}
                    fill={selectedRegionId === 'extrinsic_base_link' ? '#C5D4E2' : '#E7EEF4'}
                    stroke="#2B4C65"
                    strokeWidth={selectedRegionId === 'extrinsic_base_link' ? 2.5 : 1.4}
                  />
                  {/* Base terminal contact B */}
                  <rect x={95} y={115} width={66} height={30} rx={3} fill="#0F172A" />
                  <text x={128} y={134} textAnchor="middle" className="fill-white font-mono font-bold text-[11px]">
                    Terminal B
                  </text>
                  <text x={139} y={168} textAnchor="middle" className="fill-[#1A3247] font-bold text-[10px]">
                    p⁺ Extrinsic Base
                  </text>
                  <text x={139} y={182} textAnchor="middle" className="fill-[#23435C] font-mono text-[9px]">
                    R_Bx → Node B*
                  </text>
                  <text x={407} y={168} textAnchor="middle" className="fill-[#1A3247] font-bold text-[10px]">
                    p⁺ Link Base (B*)
                  </text>
                  <text x={407} y={182} textAnchor="middle" className="fill-[#23435C] font-mono text-[9px]">
                    C_jCx1,2 · i_jBCx
                  </text>
                </g>

                {/* B-E Sidewall Spacer & Perimeter Junction */}
                <g
                  onClick={() => setSelectedRegionId('be_spacer_perim')}
                  className="cursor-pointer"
                >
                  <rect
                    x={182}
                    y={92}
                    width={28}
                    height={62}
                    rx={3}
                    fill={selectedRegionId === 'be_spacer_perim' ? '#5EEAD4' : '#C0D8D4'}
                    stroke="#2A645E"
                    strokeWidth={selectedRegionId === 'be_spacer_perim' ? 2.5 : 1.4}
                  />
                  <rect
                    x={340}
                    y={92}
                    width={28}
                    height={62}
                    rx={3}
                    fill={selectedRegionId === 'be_spacer_perim' ? '#5EEAD4' : '#C0D8D4'}
                    stroke="#2A645E"
                    strokeWidth={selectedRegionId === 'be_spacer_perim' ? 2.5 : 1.4}
                  />
                  <text
                    x={196}
                    y={124}
                    textAnchor="middle"
                    transform="rotate(-90, 196, 124)"
                    className="fill-[#153733] font-mono font-bold text-[8.5px]"
                  >
                    BE Spacer
                  </text>
                  <text
                    x={354}
                    y={124}
                    textAnchor="middle"
                    transform="rotate(-90, 354, 124)"
                    className="fill-[#153733] font-mono font-bold text-[8.5px]"
                  >
                    BE Spacer
                  </text>
                </g>

                {/* Emitter T-Poly & Mono Emitter Window */}
                <g
                  onClick={() => setSelectedRegionId('emitter_stack')}
                  className="cursor-pointer"
                >
                  <path
                    d="M 190 58 L 360 58 L 360 92 L 340 92 L 340 152 L 210 152 L 210 92 L 190 92 Z"
                    fill={selectedRegionId === 'emitter_stack' ? '#93C5FD' : '#E7EEF4'}
                    stroke="#2B4C65"
                    strokeWidth={selectedRegionId === 'emitter_stack' ? 2.5 : 1.6}
                  />
                  <rect x={242} y={28} width={66} height={30} rx={3} fill="#0F172A" />
                  <text x={275} y={47} textAnchor="middle" className="fill-white font-mono font-bold text-[11px]">
                    Terminal E
                  </text>
                  <text x={275} y={108} textAnchor="middle" className="fill-[#1A3247] font-bold text-[11.5px]">
                    n⁺ Poly / Mono Emitter (E → E&apos;)
                  </text>
                  <text x={275} y={125} textAnchor="middle" className="fill-[#23435C] font-mono text-[9.5px]">
                    R_E, ΔQ_Ef (tef0, gtfe, hfe)
                  </text>
                </g>
              </svg>
            </div>

            {/* Region Selector Quick Buttons */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PHYSICAL_REGIONS.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setSelectedRegionId(reg.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                    selectedRegionId === reg.id
                      ? 'bg-[#2B4C65] text-white border-[#2B4C65]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#A9BFD3]'
                  }`}
                >
                  {reg.name.split(' ')[0]} {reg.name.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Right 5 Cols: Active Region Inspector */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded bg-[#E7EEF4] text-[#2B4C65] border border-[#C5D4E2] font-mono text-xs font-semibold">
                  {activeRegion.dopingTag}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-medium border ${
                    activeRegion.spatialClassification === 'localized'
                      ? 'bg-[#E6F0EE] text-[#22544F] border-[#C0D8D4]'
                      : 'bg-[#E7EEF4] text-[#2B4C65] border-[#C5D4E2]'
                  }`}
                >
                  {activeRegion.spatialClassification === 'localized'
                    ? 'Physically Localized Region'
                    : '2D/3D Distributed Region'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mt-2 font-scientific">
                {activeRegion.name}
              </h3>
              <div className="text-xs font-mono text-slate-500 mt-0.5">
                Documentation Reference: {activeRegion.manualRef}
              </div>

              <p className="text-xs text-slate-700 leading-relaxed mt-3">
                {activeRegion.description}
              </p>

              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Physical Mechanisms Modeled in This Region
                </h4>
                <ul className="space-y-1.5">
                  {activeRegion.physicalMechanisms.map((m, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2A645E] shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Linked Equivalent Circuit Elements */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Linked Equivalent-Circuit Branches (Click to Open in Lab)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeRegion.circuitElements.map((elId) => (
                    <button
                      key={elId}
                      onClick={() => onSelectElementInLab(elId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#E6F0EE] text-[#1C4642] border border-[#C0D8D4] hover:bg-[#D6E7E3] transition-colors"
                    >
                      <Cpu className="w-3 h-3" />
                      <span>{elId}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Linked HICUM Parameters */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Associated HICUM/L2 Parameters (Click to Tune & Plot)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeRegion.keyParameters.map((pId) => (
                    <button
                      key={pId}
                      onClick={() => onSelectParamInLab(pId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[#E7EEF4] text-[#23435C] border border-[#C5D4E2] hover:bg-[#DCE6EF] transition-colors"
                    >
                      <span>{pId}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stage 5 Sentaurus TCAD -> Blender MCP Readiness Banner */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/90">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Box className="w-4 h-4 text-[#2B4C65] shrink-0" />
                <span>Stage 5 Ready: 3D Sentaurus TCAD & Blender MCP Mapping</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Every HICUM/L2 parameter and circuit element is tagged with its spatial localization class (<code>localized</code>, <code>distributed</code>, <code>conceptual</code>, or <code>flag</code>) and physical region ID, ready for direct 3D mesh binding once the Sentaurus SiGe HBT structure files are supplied.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeFigureTab === 'bandgap_grading' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <h3 className="text-base font-bold text-slate-900 font-scientific mb-1">
              Bandgap Grading & Doping Profile in the Internal Base-Emitter-Collector Region (Manual Fig. 2.2.0/2, p. 16)
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Spatial variation of doping concentration <FormulaView latex="N_E(x), N_B(x), N_C(x)" inline /> and effective bandgap voltage <FormulaView latex="V_{Ge}(x)" inline /> across the 1D intrinsic SiGe HBT coordinate <FormulaView latex="x" inline />.
            </p>
            <svg viewBox="0 0 680 340" className="w-full h-auto bg-[#F7F6F2] rounded-lg border border-slate-200 p-2">
              {/* Vertical region dividers */}
              <line x1={80} y1={30} x2={80} y2={295} stroke="#334155" strokeWidth={1.5} />
              <line x1={80} y1={295} x2={640} y2={295} stroke="#334155" strokeWidth={1.5} />
              <line x1={230} y1={30} x2={230} y2={295} stroke="#94A3B8" strokeDasharray="4 4" />
              <line x1={430} y1={30} x2={430} y2={295} stroke="#94A3B8" strokeDasharray="4 4" />

              {/* Region Headers */}
              <text x={155} y={48} textAnchor="middle" className="fill-[#23435C] font-bold text-[12px]">
                n⁺ Emitter (N_E)
              </text>
              <text x={330} y={48} textAnchor="middle" className="fill-[#1C4642] font-bold text-[12px]">
                p-SiGe Graded Base (N_B)
              </text>
              <text x={535} y={48} textAnchor="middle" className="fill-[#6E3B1F] font-bold text-[12px]">
                n⁻ Epi Collector (N_C)
              </text>

              {/* Doping Curves */}
              <path
                d="M 90 75 L 180 75 Q 215 75 230 140 Q 255 110 310 115 Q 395 125 430 185 Q 465 215 620 215"
                fill="none"
                stroke="#2B4C65"
                strokeWidth={2.5}
              />
              <text x={135} y={68} className="fill-[#23435C] font-mono font-semibold text-[11px]">
                log N(x) Doping
              </text>

              {/* Bandgap Profile V_Ge(x) */}
              <path
                d="M 90 205 L 195 205 L 245 235 L 415 268 L 445 195 L 620 195"
                fill="none"
                stroke="#8A3B33"
                strokeWidth={2.5}
              />
              <text x={325} y={245} textAnchor="middle" className="fill-[#74312A] font-mono font-bold text-[11px]">
                Graded Bandgap V_Ge(x) (Ge Mole Fraction)
              </text>
              <text x={455} y={185} className="fill-[#74312A] font-mono text-[10px]">
                BC Barrier (vcbar, icbar)
              </text>

              {/* Depletion boundaries x_jE, x_e, x_b, x_c */}
              <text x={230} y={315} textAnchor="middle" className="fill-slate-700 font-mono text-[11px]">
                x_jE (BE Junction)
              </text>
              <text x={430} y={315} textAnchor="middle" className="fill-slate-700 font-mono text-[11px]">
                x_jC (BC Junction)
              </text>
            </svg>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 font-scientific">
              How HICUM/L2 Captures Heterojunction Bandgap Grading
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              In a SiGe HBT, the bandgap varies spatially across the base-emitter and base-collector regions, causing the intrinsic carrier density <FormulaView latex="n_i^2(x) \propto \exp(-qV_{Ge}(x)/k_BT)" inline /> to vary with position. HICUM/L2 incorporates this directly into the Generalized Integral Charge-Control Relation (GICCR) via physically derived charge weighting factors:
            </p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
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
                  className="px-2.5 py-1 rounded bg-[#E7EEF4] text-[#23435C] border border-[#C5D4E2] text-xs font-mono hover:bg-[#DCE6EF]"
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
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 font-scientific">
              1. External Base Resistance Breakdown (Manual Fig. 2.7.0/1, p. 48)
            </h3>
            <div className="my-2 p-2.5 bg-slate-50 rounded border border-slate-100">
              <FormulaView latex="R_{Bx} = r_{KB} + r_{po} + r_{pm} + r_{sp}" displayMode={false} />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Decomposes the extrinsic base path between terminal <code>B</code> and perimeter node <code>B*</code> into contact resistance (<FormulaView latex="r_{KB}" inline />), poly-on-oxide sheet resistance (<FormulaView latex="r_{po}" inline />), poly-to-monosilicon transition (<FormulaView latex="r_{pm}" inline />), and link-base under the spacer (<FormulaView latex="r_{sp}" inline />).
            </p>
            <div className="mt-3 flex gap-1.5">
              <button
                onClick={() => onSelectElementInLab('rbx')}
                className="px-2.5 py-1 rounded bg-[#E6F0EE] text-[#1C4642] border border-[#C0D8D4] text-xs font-mono"
              >
                Element: rbx ↗
              </button>
              <button
                onClick={() => onSelectParamInLab('rbx')}
                className="px-2.5 py-1 rounded bg-[#E7EEF4] text-[#23435C] border border-[#C5D4E2] text-xs font-mono"
              >
                Param: rbx ↗
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 font-scientific">
              2. Collector Buried Layer & Sinker Path (Manual Fig. 2.8.2/1, p. 53)
            </h3>
            <div className="my-2 p-2.5 bg-slate-50 rounded border border-slate-100">
              <FormulaView latex="R_{Cx} = r_{bl} + r_{sink} + r_{KC}" displayMode={false} />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Models the ohmic series path from the bottom of the active epitaxial collector (internal node <code>C&apos;</code>) laterally through the <FormulaView latex="n^+" inline /> buried layer (<FormulaView latex="r_{bl}" inline />), vertically up the collector sinker (<FormulaView latex="r_{sink}" inline />), and through the collector contact (<FormulaView latex="r_{KC}" inline />) to terminal <code>C</code>.
            </p>
            <div className="mt-3 flex gap-1.5">
              <button
                onClick={() => onSelectElementInLab('rcx')}
                className="px-2.5 py-1 rounded bg-[#E6F0EE] text-[#1C4642] border border-[#C0D8D4] text-xs font-mono"
              >
                Element: rcx ↗
              </button>
              <button
                onClick={() => onSelectParamInLab('rcx')}
                className="px-2.5 py-1 rounded bg-[#E7EEF4] text-[#23435C] border border-[#C5D4E2] text-xs font-mono"
              >
                Param: rcx ↗
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 font-scientific">
              3. Collector-Substrate Trench Variants (Manual Fig. 2.11.0/1, p. 61)
            </h3>
            <div className="my-2 p-2.5 bg-slate-50 rounded border border-slate-100">
              <FormulaView latex="C_{CS} = C_{jS}(v_{S'C'}) + C_{SCp}(v_{SC})" displayMode={false} />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compares junction isolation, Shallow Trench Isolation (STI), and Deep Trench Isolation (DTI). Bottom subcollector-to-substrate capacitance <FormulaView latex="C_{jS}" inline /> connects to internal substrate node <code>S&apos;</code>, while perimeter sidewall capacitance <FormulaView latex="C_{SCp}" inline /> connects between <code>S</code> and <code>C</code>.
            </p>
            <div className="mt-3 flex gap-1.5 flex-wrap">
              <button
                onClick={() => onSelectElementInLab('cjs')}
                className="px-2.5 py-1 rounded bg-[#E6F0EE] text-[#1C4642] border border-[#C0D8D4] text-xs font-mono"
              >
                Element: cjs ↗
              </button>
              <button
                onClick={() => onSelectElementInLab('cscp')}
                className="px-2.5 py-1 rounded bg-[#E6F0EE] text-[#1C4642] border border-[#C0D8D4] text-xs font-mono"
              >
                Element: cscp ↗
              </button>
              <button
                onClick={() => onSelectElementInLab('rsu')}
                className="px-2.5 py-1 rounded bg-[#E6F0EE] text-[#1C4642] border border-[#C0D8D4] text-xs font-mono"
              >
                Element: rsu ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossSectionDiagrams;
