import React, { useState, useMemo, useRef } from 'react';
import {
  PlotCategoryId,
  PLOT_CATEGORY_DEFINITIONS,
  BiasState,
  OperatingPointResult,
} from '../data/hicumTypes';
import { generatePlotData } from '../engine/hicumSolver';
import { FormulaView } from './FormulaView';
import {
  LineChart,
  Sliders,
  Eye,
  EyeOff,
  RotateCcw,
  Info,
  Crosshair,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface InteractivePlotPanelProps {
  activeCategory: PlotCategoryId;
  onSelectCategory: (cat: PlotCategoryId) => void;
  params: Record<string, number>;
  baselineParams: Record<string, number>;
  bias: BiasState;
  opResult: OperatingPointResult;
  selectedParamName: string | null;
  onSelectEquation?: (eqId: string) => void;
}

function formatSciTick(val: number, isLog: boolean): string {
  if (!Number.isFinite(val)) return '0';
  if (val === 0) return '0';
  const abs = Math.abs(val);
  if (isLog) {
    const exp = Math.round(Math.log10(abs));
    if (Math.abs(Math.pow(10, exp) - abs) / abs < 0.08) {
      if (exp === 0) return '1';
      if (exp === 1) return '10';
      if (exp === 2) return '100';
      return `10^${exp}`;
    }
  }
  if (abs >= 1e9) return `${(val / 1e9).toFixed(1)}G`;
  if (abs >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(val / 1e3).toFixed(1)}k`;
  if (abs >= 1) return val.toFixed(abs >= 10 ? 1 : 2);
  if (abs >= 1e-2) return val.toFixed(3);
  if (abs >= 1e-3) return `${(val * 1e3).toFixed(1)}m`;
  if (abs >= 1e-6) return `${(val * 1e6).toFixed(1)}μ`;
  if (abs >= 1e-9) return `${(val * 1e9).toFixed(1)}n`;
  if (abs >= 1e-12) return `${(val * 1e12).toFixed(1)}p`;
  if (abs >= 1e-15) return `${(val * 1e15).toFixed(1)}f`;
  return val.toExponential(1);
}

function formatReadoutValue(val: number, unit: string): string {
  if (!Number.isFinite(val)) return '—';
  const abs = Math.abs(val);
  if (abs === 0) return `0 ${unit}`;
  if (unit === 'A') {
    if (abs >= 1e-3) return `${(val * 1e3).toFixed(3)} mA`;
    if (abs >= 1e-6) return `${(val * 1e6).toFixed(3)} μA`;
    if (abs >= 1e-9) return `${(val * 1e9).toFixed(3)} nA`;
    if (abs >= 1e-12) return `${(val * 1e12).toFixed(3)} pA`;
    return `${val.toExponential(2)} A`;
  }
  if (unit === 'F' || unit === 'pF' || unit === 'fF') {
    if (unit === 'F') {
      if (abs >= 1e-12) return `${(val * 1e12).toFixed(3)} pF`;
      return `${(val * 1e15).toFixed(2)} fF`;
    }
    return `${val.toFixed(3)} ${unit}`;
  }
  if (unit === 's' || unit === 'ps') {
    if (unit === 's') {
      return `${(val * 1e12).toFixed(3)} ps`;
    }
    return `${val.toFixed(3)} ${unit}`;
  }
  if (unit === 'Hz' || unit === 'GHz') {
    if (unit === 'Hz') {
      return `${(val / 1e9).toFixed(2)} GHz`;
    }
    return `${val.toFixed(2)} ${unit}`;
  }
  if (abs >= 1e4 || (abs > 0 && abs < 1e-3)) {
    return `${val.toExponential(3)} ${unit}`;
  }
  return `${val.toFixed(3)} ${unit}`;
}

const REGIME_GUIDE: Record<
  PlotCategoryId,
  { title: string; formula: string; summary: string; eqId: string }[]
> = {
  transfer_gummel: [
    {
      title: 'Low-Bias Perimeter / Depletion Recombination',
      formula: 'i_{jBEi} = I_{REiS}[\\exp(v_{b\'e\'}/(m_{REi}V_T))-1]',
      summary: 'Governed by ireis, mrei, ireps, mrep at low V_BE where SRH recombination increases base current and reduces low-current β_DC.',
      eqId: 'eq-2.3.1-1',
    },
    {
      title: 'Ideal GICCR Transfer Current Regime',
      formula: 'i_T = i_{Tf} - i_{Tr} = \\frac{c_{10}}{Q_p}\\exp\\left(\\frac{v_{b\'e\'}}{m_{Cf}V_T}\\right)',
      summary: 'Mid-bias exponential region controlled by c10, qp0, and mcf. Collector and base currents track in parallel on a semi-log Gummel plot.',
      eqId: 'eq-2.2.0-1',
    },
    {
      title: 'High-Current HBT Weighting & Kirk Roll-Off',
      formula: 'Q_{p,T} = Q_{p0} + h_{jEi}Q_{jEi} + h_{jCi}Q_{jCi} + Q_{f,T} + Q_{r,T}',
      summary: 'At high V_BE, voltage drops across rBi*/re/rcx and mobile charge Q_f,T bend i_T and i_B downward.',
      eqId: 'eq-2.2.2-5',
    },
  ],
  critical_current: [
    {
      title: 'Quasi-Saturation & Velocity Saturation Onset',
      formula: 'I_{CK} = \\frac{v_{ceff}}{r_{Ci0}\\sqrt{1+(v_{ceff}/V_{lim})^2}}\\left[1+\\frac{x+\\sqrt{x^2+a_{ick}}}{2}\\right]',
      summary: 'At low V_CE and high I_C, internal BC junction forward-biases and epitaxial velocity saturation (rci0, vlim, vces) shapes the knee.',
      eqId: 'eq-2.2.1-1',
    },
    {
      title: 'Forward Active & Physics-Based Early Effect',
      formula: 'g_o = \\frac{\\partial I_C}{\\partial V_{CE}} \\propto \\frac{h_{jCi}C_{jCi}}{Q_{p,T}}',
      summary: 'Output conductance is physically determined by BC depletion charge modulation of Q_p,T via hjci, cjci0, vdci, and zci—without an artificial V_A parameter.',
      eqId: 'eq-2.2.2-5',
    },
    {
      title: 'High-Field Punch-Through Asymptote',
      formula: 'x = \\frac{v_{ceff} - V_{lim}}{V_{PT}}, \\quad I_{CK} \\propto 1 + x',
      summary: 'At large V_C\'E\' approaching V_PT, full depletion of the collector epitaxial layer increases I_CK linearly.',
      eqId: 'eq-2.2.1-3',
    },
  ],
  transit_time_ft: [
    {
      title: 'Low-Current Transit Time',
      formula: '\\tau_{f0}(V_{b\'c\'}) = \\tau_0 + \\Delta\\tau_{0h}(c - 1) + \\tau_{Bfvl}(1/c - 1)',
      summary: 'Base and BC space-charge delay at low injection governed by t0, dt0h, and tbvl via normalized depletion ratio c = CjCi0/CjCi.',
      eqId: 'eq-2.2.2-1',
    },
    {
      title: 'High-Current Kirk Base Widening & Barrier Storage',
      formula: '\\Delta\\tau_{f,h} = \\tau_{hcs}\\,w^2 + \\Delta\\tau_{Ef} + \\Delta\\tau_{Bf,b}',
      summary: 'Above I_CK, neutral base widening (thcs, ahc, fthc), emitter storage (tef0, gtfe), and SiGe BC barrier (vcbar, icbar) rapidly increase τ_f.',
      eqId: 'eq-2.2.2-8',
    },
    {
      title: 'Transit Frequency f_T Peak & Roll-Off',
      formula: 'f_T = \\frac{g_{m,i}}{2\\pi(C_{\\pi i}+C_{\\pi x}+C_{\\mu i}+C_{\\mu x} + g_{m,i}R_{eff}C_{\\mu})}',
      summary: 'Low-current f_T is limited by depletion charging (Cjei0, Cjci0); peak f_T is set by τ_0; high-current f_T rolls off above I_CK.',
      eqId: 'eq-4.0-ft',
    },
  ],
  depletion_cap: [
    {
      title: 'Reverse-Bias Depletion Law',
      formula: 'C_j(V) = \\frac{C_{j0}}{(1 - V/V_D)^z}',
      summary: 'Standard space-charge capacitance controlled by zero-bias capacitance Cj0, built-in voltage VD, and grading coefficient z.',
      eqId: 'eq-2.4.1-1',
    },
    {
      title: 'Forward-Bias Singularity Avoidance (QJMODF)',
      formula: 'C_{j,max} = a_j \\cdot C_{j0}',
      summary: 'Smoothly limits depletion capacitance to aj·Cj0 as junction voltage approaches and exceeds VD, ensuring continuous C(V) and Q(V) derivatives.',
      eqId: 'eq-2.4.1-2',
    },
    {
      title: 'Collector Epitaxial Punch-Through Limiting (QJMOD)',
      formula: 'C_{jCi}(V) \\to C_{jCi,min} \\text{ for } V_{D,Ci} - v_{B\'C\'} \\ge V_{PT,Ci}',
      summary: 'When the collector epi layer fully depletes at V_PT, CjCi smoothly approaches a constant minimum plateau set by vptci.',
      eqId: 'eq-2.4.2-1',
    },
  ],
  base_resistance: [
    {
      title: 'Conductivity Modulation by Total Base Charge',
      formula: 'r_i = \\frac{r_{Bi0}}{1 + (Q_{jEi} + Q_{jCi} + Q_f)/[(1+f_{dQr0})Q_{p0}]}',
      summary: 'Increasing forward bias injects minority charge Q_f into the intrinsic base, strongly reducing pinch-base sheet resistance r_i.',
      eqId: 'eq-2.5.1-1',
    },
    {
      title: 'Lateral Emitter Current Crowding Factor ψ(η)',
      formula: 'r_{Bi}^* = r_i \\cdot \\psi(\\eta), \\quad \\eta = f_{geo}\\frac{r_i\\,i_{jBEi}}{V_T}',
      summary: 'At high base current i_jBEi, lateral voltage drop along the emitter width crowds injection toward the perimeter, lowering effective DC/AC r_Bi*.',
      eqId: 'eq-2.5.1-3',
    },
    {
      title: 'Lateral NQS AC Shunt Capacitance C_rBi',
      formula: 'C_{rBi} = f_{CrBi}(C_{jEi} + C_{jCi} + C_{dEi} + C_{dCi})',
      summary: 'Models the high-frequency complex impedance of the distributed intrinsic base impedance network via fcrbi.',
      eqId: 'eq-2.5.2-1',
    },
  ],
  breakdown_tunneling: [
    {
      title: 'Base-Collector Impact Ionization (Avalanche)',
      formula: 'i_{AVL} = i_{Tf}\\,f_{avl}(V_{DCi}-v_{B\'C\'})\\exp\\left(-\\frac{q_{avl}}{C_{jCi}(V_{DCi}-v_{B\'C\'})}\\right)',
      summary: 'High electric field in the reverse-biased intrinsic BC space-charge region multiplies collector transit electrons via favl, qavl, kavl.',
      eqId: 'eq-2.10.1-1',
    },
    {
      title: 'Base-Emitter Band-to-Band Tunneling',
      formula: 'i_{BEt} = I_{BEtS}(-v_{BE}/V_{DE})^{1/2}\\exp\\left[-a_{BEt}(1 - v_{BE}/V_{DE})^{z_{BE}-1}\\right]',
      summary: 'In heavily doped emitter-base junctions under reverse bias, Zener tunneling current flows at perimeter (tunode=1) or intrinsic (tunode=0) nodes.',
      eqId: 'eq-2.9.0-1',
    },
    {
      title: 'BC Barrier Recombination Current',
      formula: 'i_{Bh,rec} = \\frac{Q_{Bf}}{\\tau_{Bh,rec}}',
      summary: 'Excess hole recombination associated with high-current BC barrier charge build-up Q_Bf controlled by tbhrec.',
      eqId: 'eq-2.3.1-3',
    },
  ],
  temperature_selfheating: [
    {
      title: 'Bandgap & Saturation Current Temperature Scaling',
      formula: 'V_g(T) = V_{g}(0) + K_1 T \\ln T + K_2 T',
      summary: 'Non-linear temperature dependence of bandgap (vgb, vge, vgc, f1vg, f2vg) governs c10(T), qp0(T), and junction built-in voltages VD(T).',
      eqId: 'eq-2.15.1-1',
    },
    {
      title: 'Mobility & Series Resistance Scaling',
      formula: 'R(T) = R(T_0)\\left(\\frac{T}{T_0}\\right)^{\\zeta_R}, \\quad \\tau_0(T) = \\tau_0(T_0)(1 + \\alpha_{t0}\\Delta T + k_{t0}\\Delta T^2)',
      summary: 'Phonon scattering increases base/collector/emitter resistances and low-current transit time with rising temperature.',
      eqId: 'eq-2.15.3-1',
    },
    {
      title: 'Electrothermal Self-Heating Network',
      formula: '\\Delta T_j = R_{th}(T)\\,P_{diss} + C_{th}\\frac{d(\\Delta T_j)}{dt}',
      summary: 'Power dissipated in intrinsic current branches heats the local junction node tnode when flsh = 1 or 2.',
      eqId: 'eq-2.16.0-1',
    },
  ],
  noise_nqs_substrate: [
    {
      title: 'Vertical Non-Quasi-Static (NQS) Delay Network',
      formula: '\\tau_{d,Qf} = \\alpha_{Qf}\\tau_f, \\quad \\tau_{d,iT} = \\alpha_{iT}\\tau_f',
      summary: 'Models excess phase lag of minority charge Q_f (RC network, alqf) and transfer current i_Tf (2nd-order Bessel LCR network, alit) when flnqs=1.',
      eqId: 'eq-2.13.0-1',
    },
    {
      title: 'Correlated Base/Collector HF Shot Noise',
      formula: '\\overline{i_{n,B} i_{n,C}^*} = j\\omega\\,\\alpha_{iT}\\tau_f\\,2qI_T',
      summary: 'Dynamic base charging by transit electrons correlates base and collector shot noise (flcono=1), significantly reducing minimum noise figure NF_min near f_T.',
      eqId: 'eq-2.14.0-3',
    },
    {
      title: 'Substrate Coupling & Parasitic PNP Action',
      formula: 'Z_{sub}(\\omega) = \\frac{R_{su}}{1 + j\\omega R_{su}C_{su}} + \\frac{1}{j\\omega C_{jS}}',
      summary: 'Models RF signal coupling from collector C\' through CjS into the lossy silicon substrate network (rsu, csu) and parasitic PNP transfer current i_TS.',
      eqId: 'eq-2.12.0-1',
    },
  ],
};

export const InteractivePlotPanel: React.FC<InteractivePlotPanelProps> = ({
  activeCategory,
  onSelectCategory,
  params,
  baselineParams,
  bias,
  opResult,
  selectedParamName,
  onSelectEquation,
}) => {
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});
  const [showBaselineComparison, setShowBaselineComparison] = useState<boolean>(true);
  const [logYOverride, setLogYOverride] = useState<Record<string, boolean | null>>({});
  const [logXOverride, setLogXOverride] = useState<Record<string, boolean | null>>({});
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Check if any parameter is modified relative to baselineParams
  const modifiedCount = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(params)) {
      if (baselineParams[key] !== undefined && Math.abs(params[key] - baselineParams[key]) > 1e-18) {
        count++;
      }
    }
    return count;
  }, [params, baselineParams]);

  // Compute plot data using the physics engine
  const plotData = useMemo(() => {
    return generatePlotData(
      activeCategory,
      params,
      bias,
      modifiedCount > 0 && showBaselineComparison ? baselineParams : undefined
    );
  }, [activeCategory, params, baselineParams, bias, modifiedCount, showBaselineComparison]);

  const useLogY =
    logYOverride[activeCategory] !== undefined && logYOverride[activeCategory] !== null
      ? Boolean(logYOverride[activeCategory])
      : Boolean(plotData.yLogDefault);

  const useLogX =
    logXOverride[activeCategory] !== undefined && logXOverride[activeCategory] !== null
      ? Boolean(logXOverride[activeCategory])
      : Boolean(plotData.xLogDefault);

  const visibleSeries = useMemo(
    () => plotData.series.filter((s) => !hiddenSeries[s.id]),
    [plotData.series, hiddenSeries]
  );

  // SVG layout dimensions
  const width = 760;
  const height = 370;
  const padLeft = 68;
  const padRight = 26;
  const padTop = 24;
  const padBottom = 46;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Compute X and Y domains
  const domain = useMemo(() => {
    let xVals: number[] = [];
    let yVals: number[] = [];

    const seriesToScan = visibleSeries.length > 0 ? visibleSeries : plotData.series;
    for (const s of seriesToScan) {
      for (const pt of s.points) {
        if (Number.isFinite(pt.x) && (!useLogX || pt.x > 0)) {
          xVals.push(useLogX ? Math.log10(Math.max(pt.x, 1e-18)) : pt.x);
        }
        if (Number.isFinite(pt.y) && (!useLogY || pt.y > 0)) {
          yVals.push(useLogY ? Math.log10(Math.max(pt.y, 1e-18)) : pt.y);
        }
        if (
          modifiedCount > 0 &&
          showBaselineComparison &&
          pt.yBaseline !== undefined &&
          Number.isFinite(pt.yBaseline) &&
          (!useLogY || pt.yBaseline > 0)
        ) {
          yVals.push(useLogY ? Math.log10(Math.max(pt.yBaseline, 1e-18)) : pt.yBaseline);
        }
      }
    }

    if (xVals.length === 0) xVals = [0, 1];
    if (yVals.length === 0) yVals = [0, 1];

    let xMin = Math.min(...xVals);
    let xMax = Math.max(...xVals);
    if (Math.abs(xMax - xMin) < 1e-12) {
      xMin -= 0.5;
      xMax += 0.5;
    }

    let yMin = Math.min(...yVals);
    let yMax = Math.max(...yVals);
    if (Math.abs(yMax - yMin) < 1e-12) {
      yMin -= 0.5;
      yMax += 0.5;
    } else {
      const span = yMax - yMin;
      yMin -= span * 0.06;
      yMax += span * 0.08;
    }

    return { xMin, xMax, yMin, yMax };
  }, [visibleSeries, plotData.series, useLogX, useLogY, modifiedCount, showBaselineComparison]);

  const mapX = (rawX: number): number => {
    const val = useLogX ? Math.log10(Math.max(rawX, 1e-18)) : rawX;
    const ratio = (val - domain.xMin) / (domain.xMax - domain.xMin || 1);
    return padLeft + Math.max(0, Math.min(1, ratio)) * plotW;
  };

  const mapY = (rawY: number): number => {
    const val = useLogY ? Math.log10(Math.max(rawY, 1e-18)) : rawY;
    const ratio = (val - domain.yMin) / (domain.yMax - domain.yMin || 1);
    return padTop + plotH - Math.max(0, Math.min(1, ratio)) * plotH;
  };

  // Generate grid ticks
  const xTicks = useMemo(() => {
    const count = 6;
    const ticks: { pos: number; label: string }[] = [];
    for (let i = 0; i <= count; i++) {
      const v = domain.xMin + (i / count) * (domain.xMax - domain.xMin);
      const raw = useLogX ? Math.pow(10, v) : v;
      ticks.push({
        pos: padLeft + (i / count) * plotW,
        label: formatSciTick(raw, useLogX),
      });
    }
    return ticks;
  }, [domain.xMin, domain.xMax, useLogX, plotW]);

  const yTicks = useMemo(() => {
    const count = 5;
    const ticks: { pos: number; label: string }[] = [];
    for (let i = 0; i <= count; i++) {
      const v = domain.yMin + (i / count) * (domain.yMax - domain.yMin);
      const raw = useLogY ? Math.pow(10, v) : v;
      ticks.push({
        pos: padTop + plotH - (i / count) * plotH,
        label: formatSciTick(raw, useLogY),
      });
    }
    return ticks;
  }, [domain.yMin, domain.yMax, useLogY, plotH]);

  // Operating point vertical marker on the X axis
  const opMarker = useMemo(() => {
    let xVal: number | null = null;
    let label = '';
    if (activeCategory === 'transfer_gummel' || activeCategory === 'base_resistance') {
      xVal = bias.Vbe;
      label = `V_BE = ${bias.Vbe.toFixed(3)} V`;
    } else if (activeCategory === 'critical_current') {
      xVal = bias.Vce;
      label = `V_CE = ${bias.Vce.toFixed(2)} V`;
    } else if (activeCategory === 'depletion_cap') {
      xVal = bias.Vbe;
      label = `V_BE = ${bias.Vbe.toFixed(2)} V`;
    } else if (activeCategory === 'transit_time_ft') {
      if (opResult.Ic > 0) {
        xVal = opResult.Ic;
        label = `I_C = ${formatReadoutValue(opResult.Ic, 'A')}`;
      }
    } else if (activeCategory === 'breakdown_tunneling') {
      xVal = Math.max(0, bias.Vce - bias.Vbe);
      label = `V_CB = ${xVal.toFixed(2)} V`;
    } else if (activeCategory === 'temperature_selfheating') {
      xVal = bias.Tamb;
      label = `T_amb = ${bias.Tamb.toFixed(1)} K`;
    } else if (activeCategory === 'noise_nqs_substrate') {
      if (opResult.Ft > 0) {
        xVal = opResult.Ft;
        label = `f_T = ${formatReadoutValue(opResult.Ft, 'Hz')}`;
      }
    }

    if (xVal === null) return null;
    const mapped = mapX(xVal);
    if (mapped < padLeft || mapped > padLeft + plotW) return null;
    return { x: mapped, label, rawX: xVal };
  }, [activeCategory, bias, opResult.Ic, opResult.Ft, domain, useLogX]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || plotData.series.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const svgX = (e.clientX - rect.left) * scaleX;
    if (svgX < padLeft || svgX > padLeft + plotW) {
      setHoverIndex(null);
      return;
    }
    const pts = plotData.series[0].points;
    if (pts.length === 0) return;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const px = mapX(pts[i].x);
      const dist = Math.abs(px - svgX);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    setHoverIndex(bestIdx);
  };

  const toggleSeries = (id: string) => {
    setHiddenSeries((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const primarySeriesPts = plotData.series[0]?.points ?? [];
  const hoveredX =
    hoverIndex !== null && primarySeriesPts[hoverIndex]
      ? primarySeriesPts[hoverIndex].x
      : null;

  const regimeItems = REGIME_GUIDE[activeCategory] || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Top Category Bar */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {PLOT_CATEGORY_DEFINITIONS.map((cat) => {
            const active = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  setHoverIndex(null);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-blue-800 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200/80 hover:border-blue-300 hover:text-blue-800'
                }`}
                title={cat.subtitle}
              >
                <span>{cat.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Scale & Baseline Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() =>
              setLogYOverride((prev) => ({
                ...prev,
                [activeCategory]: !useLogY,
              }))
            }
            className={`px-2 py-1 rounded border font-mono text-[11px] transition-colors ${
              useLogY
                ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Logarithmic / Linear Y-Axis"
          >
            {useLogY ? 'Y: Log10' : 'Y: Linear'}
          </button>

          <button
            onClick={() =>
              setLogXOverride((prev) => ({
                ...prev,
                [activeCategory]: !useLogX,
              }))
            }
            className={`px-2 py-1 rounded border font-mono text-[11px] transition-colors ${
              useLogX
                ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Logarithmic / Linear X-Axis"
          >
            {useLogX ? 'X: Log10' : 'X: Linear'}
          </button>

          {modifiedCount > 0 && (
            <button
              onClick={() => setShowBaselineComparison((v) => !v)}
              className={`px-2.5 py-1 rounded border text-[11px] font-medium flex items-center gap-1 transition-colors ${
                showBaselineComparison
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
              title="Overlay dashed baseline curves from the verified Manual card to compare against your adjusted parameters"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Baseline Overlay ({modifiedCount} modified)</span>
            </button>
          )}
        </div>
      </div>

      {/* Plot Header & Provenance Banner */}
      <div className="px-4 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-blue-800 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-900">{plotData.title}</h3>
            {selectedParamName && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200">
                Linked to: {selectedParamName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-0.5">{plotData.subtitle}</p>
        </div>

        {/* Provenance distinction badge: Verified Manual Card vs Illustrative User Adjustment */}
        <div className="flex items-center gap-1.5 shrink-0">
          {modifiedCount === 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Manual Model Card
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              Illustrative Sweep ({modifiedCount} param{modifiedCount > 1 ? 's' : ''} adjusted vs. Manual dashed)
            </span>
          )}
        </div>
      </div>

      {/* Series Legend Pills */}
      <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center flex-wrap gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
          Traces:
        </span>
        {plotData.series.map((s) => {
          const isHidden = Boolean(hiddenSeries[s.id]);
          return (
            <button
              key={s.id}
              onClick={() => toggleSeries(s.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                isHidden
                  ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                  : 'bg-white text-slate-700 border-slate-200 shadow-2xs hover:border-slate-300'
              }`}
              title={s.description || s.label}
            >
              <span
                className="w-3 h-0.5 rounded-full shrink-0"
                style={{
                  backgroundColor: isHidden ? '#94a3b8' : s.color,
                  borderBottom: s.dashed ? `2px dashed ${s.color}` : undefined,
                }}
              />
              <span>{s.label}</span>
              {isHidden ? (
                <EyeOff className="w-3 h-3 text-slate-400" />
              ) : (
                <Eye className="w-3 h-3 text-slate-400" />
              )}
            </button>
          );
        })}
        {Object.values(hiddenSeries).some(Boolean) && (
          <button
            onClick={() => setHiddenSeries({})}
            className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            Show All
          </button>
        )}
      </div>

      {/* Interactive SVG Plot Canvas */}
      <div className="relative px-2 pt-2 pb-1 bg-white select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[380px] overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <clipPath id={`plot-clip-${activeCategory}`}>
              <rect x={padLeft} y={padTop} width={plotW} height={plotH} rx={4} />
            </clipPath>
          </defs>

          {/* Plot Area Background */}
          <rect
            x={padLeft}
            y={padTop}
            width={plotW}
            height={plotH}
            fill="#F8FAFC"
            stroke="#E2E8F0"
            strokeWidth={1}
            rx={4}
          />

          {/* Horizontal Grid Lines & Y Ticks */}
          {yTicks.map((t, idx) => (
            <g key={`y-${idx}`}>
              <line
                x1={padLeft}
                y1={t.pos}
                x2={padLeft + plotW}
                y2={t.pos}
                stroke="#E2E8F0"
                strokeDasharray={idx === 0 || idx === yTicks.length - 1 ? undefined : '3 3'}
                strokeWidth={1}
              />
              <text
                x={padLeft - 8}
                y={t.pos + 4}
                textAnchor="end"
                className="fill-slate-500 font-mono text-[10.5px]"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Vertical Grid Lines & X Ticks */}
          {xTicks.map((t, idx) => (
            <g key={`x-${idx}`}>
              <line
                x1={t.pos}
                y1={padTop}
                x2={t.pos}
                y2={padTop + plotH}
                stroke="#E2E8F0"
                strokeDasharray={idx === 0 || idx === xTicks.length - 1 ? undefined : '3 3'}
                strokeWidth={1}
              />
              <text
                x={t.pos}
                y={padTop + plotH + 17}
                textAnchor="middle"
                className="fill-slate-500 font-mono text-[10.5px]"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Axis Titles */}
          <text
            x={padLeft + plotW / 2}
            y={height - 6}
            textAnchor="middle"
            className="fill-slate-700 font-medium text-[11.5px]"
          >
            {plotData.xLabel} ({plotData.xUnit})
          </text>
          <text
            x={16}
            y={padTop + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90, 16, ${padTop + plotH / 2})`}
            className="fill-slate-700 font-medium text-[11.5px]"
          >
            {plotData.yLabel} ({plotData.yUnit})
          </text>

          {/* Clipped Curves Group */}
          <g clipPath={`url(#plot-clip-${activeCategory})`}>
            {/* Current Bias Operating Point Vertical Marker */}
            {opMarker && (
              <g>
                <line
                  x1={opMarker.x}
                  y1={padTop}
                  x2={opMarker.x}
                  y2={padTop + plotH}
                  stroke="#0F766E"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <rect
                  x={Math.min(opMarker.x + 4, padLeft + plotW - 105)}
                  y={padTop + 6}
                  width={100}
                  height={18}
                  rx={4}
                  fill="#F0FDFA"
                  stroke="#99F6E4"
                  strokeWidth={1}
                />
                <text
                  x={Math.min(opMarker.x + 54, padLeft + plotW - 55)}
                  y={padTop + 18}
                  textAnchor="middle"
                  className="fill-teal-800 font-mono text-[9.5px] font-semibold"
                >
                  OP: {opMarker.label}
                </text>
              </g>
            )}

            {/* Baseline Dashed Curves (when parameters are modified) */}
            {modifiedCount > 0 &&
              showBaselineComparison &&
              visibleSeries.map((s) => {
                const validPts = s.points.filter(
                  (p) =>
                    p.yBaseline !== undefined &&
                    Number.isFinite(p.x) &&
                    Number.isFinite(p.yBaseline) &&
                    (!useLogX || p.x > 0) &&
                    (!useLogY || (p.yBaseline as number) > 0)
                );
                if (validPts.length < 2) return null;
                const d = validPts
                  .map(
                    (p, idx) =>
                      `${idx === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(
                        p.yBaseline as number
                      ).toFixed(1)}`
                  )
                  .join(' ');
                return (
                  <path
                    key={`baseline-${s.id}`}
                    d={d}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={1.6}
                    strokeDasharray="4 4"
                    opacity={0.55}
                  />
                );
              })}

            {/* Active Solid Curves */}
            {visibleSeries.map((s) => {
              const validPts = s.points.filter(
                (p) =>
                  Number.isFinite(p.x) &&
                  Number.isFinite(p.y) &&
                  (!useLogX || p.x > 0) &&
                  (!useLogY || p.y > 0)
              );
              if (validPts.length < 2) return null;
              const d = validPts
                .map(
                  (p, idx) =>
                    `${idx === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(p.y).toFixed(1)}`
                )
                .join(' ');
              return (
                <path
                  key={s.id}
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2.3}
                  strokeDasharray={s.dashed ? '6 4' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* Hover Crosshair & Intersection Dots */}
            {hoverIndex !== null && hoveredX !== null && (
              <g>
                <line
                  x1={mapX(hoveredX)}
                  y1={padTop}
                  x2={mapX(hoveredX)}
                  y2={padTop + plotH}
                  stroke="#475569"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
                {visibleSeries.map((s) => {
                  const pt = s.points[hoverIndex];
                  if (!pt || !Number.isFinite(pt.y) || (useLogY && pt.y <= 0)) return null;
                  return (
                    <circle
                      key={`dot-${s.id}`}
                      cx={mapX(pt.x)}
                      cy={mapY(pt.y)}
                      r={4.2}
                      fill={s.color}
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                  );
                })}
              </g>
            )}
          </g>
        </svg>

        {/* Interactive Cursor Readout Bar */}
        <div className="mx-2 mb-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Crosshair className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            {hoverIndex !== null && hoveredX !== null ? (
              <span className="font-mono font-semibold text-slate-800">
                {plotData.xLabel} = {formatReadoutValue(hoveredX, plotData.xUnit)}
              </span>
            ) : (
              <span className="text-slate-500">
                Hover over the plot to inspect exact HICUM/L2 equations & numerical trace readouts
              </span>
            )}
          </div>

          {hoverIndex !== null && (
            <div className="flex items-center flex-wrap gap-3">
              {visibleSeries.map((s) => {
                const pt = s.points[hoverIndex];
                if (!pt) return null;
                const hasDelta =
                  modifiedCount > 0 &&
                  pt.yBaseline !== undefined &&
                  Math.abs(pt.yBaseline) > 1e-20 &&
                  Math.abs(pt.y - pt.yBaseline) / Math.abs(pt.yBaseline) > 1e-3;
                const pctDelta = hasDelta
                  ? (((pt.y - (pt.yBaseline as number)) / Math.abs(pt.yBaseline as number)) * 100).toFixed(1)
                  : null;
                return (
                  <div key={`readout-${s.id}`} className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-slate-600">{s.label.split(' ')[0]}:</span>
                    <span className="font-semibold text-slate-900">
                      {formatReadoutValue(pt.y, plotData.yUnit)}
                    </span>
                    {pctDelta !== null && (
                      <span
                        className={`px-1 py-0.2 rounded text-[10px] ${
                          Number(pctDelta) >= 0
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {Number(pctDelta) >= 0 ? `+${pctDelta}%` : `${pctDelta}%`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Physical Regime & Governing Equations Strip */}
      <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
          <Info className="w-3.5 h-3.5 text-blue-800" />
          <span>Physical Regimes & Governing HICUM/L2 Equations in This Plot</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {regimeItems.map((reg, idx) => (
            <div
              key={idx}
              onClick={() => onSelectEquation && onSelectEquation(reg.eqId)}
              className="bg-white rounded-lg border border-slate-200/90 p-2.5 hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-800">{reg.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                    {reg.eqId}
                  </span>
                </div>
                <div className="my-1.5 py-1 px-2 bg-slate-50 rounded border border-slate-100 overflow-x-auto">
                  <FormulaView latex={reg.formula} displayMode={false} className="text-xs" />
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{reg.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractivePlotPanel;
