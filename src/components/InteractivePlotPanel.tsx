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
    if (abs >= 1e-6) return `${(val * 1e6).toFixed(2)} μA`;
    if (abs >= 1e-9) return `${(val * 1e9).toFixed(2)} nA`;
    if (abs >= 1e-12) return `${(val * 1e12).toFixed(2)} pA`;
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
      title: 'Generalized Integral Charge-Control Relation (GICCR)',
      formula: 'i_T = \\frac{c_{10}}{Q_{p,T}}\\left[\\exp\\left(\\frac{v_{B\'E\'}}{m_{Tf}V_T}\\right) - \\exp\\left(\\frac{v_{B\'C\'}}{m_{Tr}V_T}\\right)\\right]',
      summary: 'Accurately predicts collector transfer current from sub-pA forward active injection up to high current Kirk effect.',
      eqId: 'eq-2.2.0-1',
    },
    {
      title: 'Non-Ideal Low-Current Base Recombination',
      formula: 'i_{jBEi,non} = I_{REiS}\\left[\\exp\\left(\\frac{v_{B\'E\'}}{m_{REi}V_T}\\right) - 1\\right]',
      summary: 'Recombination in the base-emitter space-charge region causes the low-VBE non-ideal base current slope (mREi ≈ 2).',
      eqId: 'eq-2.3.1-7',
    },
    {
      title: 'Base Current Partitioning: Intrinsic vs Peripheral',
      formula: 'i_{B,tot} = i_{jBEi} + i_{jBEp} + i_{jBCi} + i_{jBCx} + i_{BEt}',
      summary: 'Separates bottom intrinsic injection from perimeter injection across sidewall spacers and reverse-bias band-to-band tunneling.',
      eqId: 'eq-2.3.1-6',
    },
  ],
  critical_current: [
    {
      title: 'Kirk Effect Critical Push-Out Current',
      formula: 'I_{CK} = \\frac{v_{ces}}{\\overline{r}_{Ci0}}\\frac{1}{\\left[1 + (v_{ces}/V_{lim})^2\\right]^{1/2}}\\left(1 + \\frac{x_{i}}{1 + x_i}\\right)',
      summary: 'Critical current where injected electrons neutralize collector dopants, causing electric field collapse and base push-out.',
      eqId: 'eq-2.3.1-4',
    },
    {
      title: 'Quasi-Saturation Collector Transit Charge',
      formula: '\\Delta Q_{fh} = \\tau_{hcs}\\,i_{Tf}\\left(\\frac{i_{Tf}}{I_{CK}}\\right)^2\\frac{1}{1 + (i_{Tf}/I_{CK})^2}',
      summary: 'Massive minority carrier charge accumulation in the pushed-out collector under high forward bias.',
      eqId: 'eq-2.3.1-5',
    },
    {
      title: 'Early Voltage & Collector Series Drop',
      formula: 'v_{ces} = v_{C\'E\'} - V_{CE,sat}',
      summary: 'Effective internal collector-emitter voltage controlling velocity saturation and output conductance go = dIC/dVCE.',
      eqId: 'eq-2.3.1-1',
    },
  ],
  transit_time_ft: [
    {
      title: 'Unity Current-Gain Cutoff Frequency fT',
      formula: 'f_T = \\frac{1}{2\\pi\\tau_{EC}}, \\quad \\tau_{EC} = \\tau_f + \\frac{V_T}{I_C}(C_{jEi} + C_{jCi}) + (R_E + R_{Cx})C_{jCi}',
      summary: 'Forward cutoff frequency peaks at optimum collector current before Kirk effect transit time degradation sets in.',
      eqId: 'eq-2.14.0-1',
    },
    {
      title: 'Maximum Oscillation Frequency fmax',
      formula: 'f_{max} = \\sqrt{\\frac{f_T}{8\\pi R_B C_{BC}}}',
      summary: 'Governed by total base resistance RB = rBx + rBi* and partitioned base-collector capacitance CBC = CjCi + CjCx.',
      eqId: 'eq-2.14.0-2',
    },
    {
      title: 'Forward Transit Time Bias Dependence',
      formula: '\\tau_f = \\tau_0 + \\Delta\\tau_f(v_{B\'E\'}, v_{B\'C\'}, i_{Tf})',
      summary: 'Composed of neutral base transit time, emitter storage delay, collector space charge delay, and high-current Kirk accumulation.',
      eqId: 'eq-2.3.1-2',
    },
  ],
  depletion_cap: [
    {
      title: 'Classical vs Limiting Depletion Capacitance',
      formula: 'C_j(v) = \\frac{C_{j0}}{\\left(1 - v/V_D\\right)^z}, \\quad v \\le a_{j}V_D',
      summary: 'Standard power-law depletion capacitance transitioning smoothly to a linear approximation at forward bias ajVD.',
      eqId: 'eq-2.4.1-1',
    },
    {
      title: 'Collector Space-Charge Punch-Through',
      formula: 'C_{jCi}(v) \\rightarrow C_{jCi,PT} \\quad \\text{for } v_{B\'C\'} \\le -V_{PT,Ci}',
      summary: 'When the lightly doped epitaxial collector is fully depleted at punch-through voltage VPT, capacitance saturates.',
      eqId: 'eq-2.4.2-1',
    },
    {
      title: 'Diffusion Capacitance & Dynamic Charge Storage',
      formula: 'C_{dE} = \\frac{d Q_f}{d v_{B\'E\'}} = \\tau_f g_{mi} + i_{Tf}\\frac{d\\tau_f}{d v_{B\'E\'}}',
      summary: 'Diffusion capacitance dominant at high forward current, composed of transit delay product and charge derivative.',
      eqId: 'eq-2.5.0-1',
    },
  ],
  base_resistance: [
    {
      title: 'Internal Base Resistance & Conductivity Modulation',
      formula: 'r_{Bi}^* = \\frac{r_{Bi0}}{\\psi(\\eta)}, \\quad \\psi(\\eta) = \\frac{Q_{p,T}}{Q_{p0}}',
      summary: 'Pinch base sheet resistance modulated by minority hole injection and Early effects.',
      eqId: 'eq-2.6.0-1',
    },
    {
      title: 'AC Base Crowding Capacitance',
      formula: 'C_{rBi} = f_{CrBi}\\,C_{jEi0}',
      summary: 'High-frequency AC current crowding shunt in parallel with rBi*.',
      eqId: 'eq-2.6.0-18',
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
      summary: 'In heavily doped emitter-base junctions under reverse bias, Zener tunneling current flows at perimeter or intrinsic nodes.',
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
      summary: 'Non-linear temperature dependence of bandgap governs c10(T), qp0(T), and junction built-in voltages VD(T).',
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
      summary: 'Models excess phase lag of minority charge Q_f and transfer current i_Tf when flnqs=1.',
      eqId: 'eq-2.13.0-1',
    },
    {
      title: 'Correlated Base/Collector HF Shot Noise',
      formula: '\\overline{i_{n,B} i_{n,C}^*} = j\\omega\\,\\alpha_{iT}\\tau_f\\,2qI_T',
      summary: 'Dynamic base charging by transit electrons correlates base and collector shot noise (flcono=1).',
      eqId: 'eq-2.14.0-3',
    },
    {
      title: 'Substrate Coupling & Parasitic PNP Action',
      formula: 'Z_{sub}(\\omega) = \\frac{R_{su}}{1 + j\\omega R_{su}C_{su}} + \\frac{1}{j\\omega C_{jS}}',
      summary: 'Models RF signal coupling from collector C\' through CjS into the lossy silicon substrate network and parasitic PNP transfer current.',
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

    let minX = Math.min(...xVals);
    let maxX = Math.max(...xVals);
    let minY = Math.min(...yVals);
    let maxY = Math.max(...yVals);

    if (minX === maxX) {
      minX -= 1;
      maxX += 1;
    }
    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    }

    if (!useLogY) {
      const spanY = maxY - minY;
      minY = Math.min(minY, 0);
      maxY = maxY + spanY * 0.08;
    }

    return { minX, maxX, minY, maxY };
  }, [visibleSeries, plotData.series, useLogX, useLogY, modifiedCount, showBaselineComparison]);

  const mapX = (xVal: number) => {
    const xv = useLogX ? Math.log10(Math.max(xVal, 1e-18)) : xVal;
    return padLeft + ((xv - domain.minX) / (domain.maxX - domain.minX)) * plotW;
  };

  const mapY = (yVal: number) => {
    const yv = useLogY ? Math.log10(Math.max(yVal, 1e-18)) : yVal;
    return padTop + plotH - ((yv - domain.minY) / (domain.maxY - domain.minY)) * plotH;
  };

  const yTicks = useMemo(() => {
    const ticks: { val: number; pos: number; label: string }[] = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      const frac = i / count;
      const yv = domain.minY + frac * (domain.maxY - domain.minY);
      const val = useLogY ? Math.pow(10, yv) : yv;
      ticks.push({
        val,
        pos: padTop + plotH - frac * plotH,
        label: formatSciTick(val, useLogY),
      });
    }
    return ticks;
  }, [domain, useLogY, padTop, plotH]);

  const xTicks = useMemo(() => {
    const ticks: { val: number; pos: number; label: string }[] = [];
    const count = 6;
    for (let i = 0; i <= count; i++) {
      const frac = i / count;
      const xv = domain.minX + frac * (domain.maxX - domain.minX);
      const val = useLogX ? Math.pow(10, xv) : xv;
      ticks.push({
        val,
        pos: padLeft + frac * plotW,
        label: formatSciTick(val, useLogX),
      });
    }
    return ticks;
  }, [domain, useLogX, padLeft, plotW]);

  const toggleSeries = (id: string) => {
    setHiddenSeries((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || visibleSeries.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    const refSeries = visibleSeries[0];
    if (!refSeries || refSeries.points.length === 0) return;

    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < refSeries.points.length; i++) {
      const px = mapX(refSeries.points[i].x);
      const dist = Math.abs(px - svgX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    setHoverIndex(closestIdx);
  };

  const hoveredX =
    hoverIndex !== null && visibleSeries[0]?.points[hoverIndex]
      ? visibleSeries[0].points[hoverIndex].x
      : null;

  const opMarker = useMemo(() => {
    if (activeCategory === 'transfer_gummel') {
      const vbe = bias.Vbe;
      if (vbe >= domain.minX && vbe <= domain.maxX) {
        return { x: mapX(vbe), label: `VBE=${vbe.toFixed(3)}V` };
      }
    } else if (activeCategory === 'critical_current') {
      const vce = bias.Vce;
      if (vce >= domain.minX && vce <= domain.maxX) {
        return { x: mapX(vce), label: `VCE=${vce.toFixed(2)}V` };
      }
    }
    return null;
  }, [activeCategory, bias, domain]);

  const regimeItems = REGIME_GUIDE[activeCategory] || REGIME_GUIDE.transfer_gummel;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors">
      {/* Category Navigation Strip */}
      <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {PLOT_CATEGORY_DEFINITIONS.map((cat) => {
            const isCur = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`btn-elite px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isCur
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat.shortTitle}
              </button>
            );
          })}
        </div>

        {/* Log / Linear and Baseline Comparison Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setLogYOverride((prev) => ({
                ...prev,
                [activeCategory]: !useLogY,
              }))
            }
            className={`btn-elite px-2.5 py-1 rounded-lg border text-xs font-mono font-medium ${
              useLogY
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
            title="Toggle between Logarithmic and Linear Y-axis scaling"
          >
            Y: {useLogY ? 'Log10' : 'Linear'}
          </button>

          {modifiedCount > 0 && (
            <button
              onClick={() => setShowBaselineComparison((v) => !v)}
              className={`btn-elite px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
                showBaselineComparison
                  ? 'bg-amber-50 border-amber-200/80 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
              title="Overlay dashed baseline curves from verified card to compare against tuned parameters"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Baseline ({modifiedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Plot Header & Provenance Banner */}
      <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <LineChart className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">{plotData.title}</h3>
            {selectedParamName && (
              <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60">
                Linked to: {selectedParamName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plotData.subtitle}</p>
        </div>

        {/* Provenance badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          {modifiedCount === 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Card
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60">
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              Sweep ({modifiedCount} tuned vs. dashed baseline)
            </span>
          )}
        </div>
      </div>

      {/* Series Legend Pills */}
      <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center flex-wrap gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 font-mono">
          Traces:
        </span>
        {plotData.series.map((s) => {
          const isHidden = Boolean(hiddenSeries[s.id]);
          return (
            <button
              key={s.id}
              onClick={() => toggleSeries(s.id)}
              className={`btn-elite inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                isHidden
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-300'
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
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            Show All
          </button>
        )}
      </div>

      {/* SVG Plot Canvas */}
      <div className="relative px-3 pt-3 pb-2 bg-white dark:bg-slate-900 select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[380px] overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <clipPath id={`plot-clip-${activeCategory}`}>
              <rect x={padLeft} y={padTop} width={plotW} height={plotH} rx={6} />
            </clipPath>
          </defs>

          {/* Plot Area Background */}
          <rect
            x={padLeft}
            y={padTop}
            width={plotW}
            height={plotH}
            className="fill-slate-50 dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={1}
            rx={6}
          />

          {/* Horizontal Grid Lines & Y Ticks */}
          {yTicks.map((t, idx) => (
            <g key={`y-${idx}`}>
              <line
                x1={padLeft}
                y1={t.pos}
                x2={padLeft + plotW}
                y2={t.pos}
                className="stroke-slate-200/80 dark:stroke-slate-800"
                strokeDasharray={idx === 0 || idx === yTicks.length - 1 ? undefined : '3 3'}
                strokeWidth={1}
              />
              <text
                x={padLeft - 8}
                y={t.pos + 4}
                textAnchor="end"
                className="fill-slate-400 font-mono text-[10.5px]"
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
                className="stroke-slate-200/80 dark:stroke-slate-800"
                strokeDasharray={idx === 0 || idx === xTicks.length - 1 ? undefined : '3 3'}
                strokeWidth={1}
              />
              <text
                x={t.pos}
                y={padTop + plotH + 18}
                textAnchor="middle"
                className="fill-slate-400 font-mono text-[10.5px]"
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
            className="fill-slate-600 dark:fill-slate-400 font-semibold text-xs"
          >
            {plotData.xLabel} ({plotData.xUnit})
          </text>
          <text
            x={16}
            y={padTop + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90, 16, ${padTop + plotH / 2})`}
            className="fill-slate-600 dark:fill-slate-400 font-semibold text-xs"
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
                  className="stroke-emerald-600 dark:stroke-emerald-400"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <rect
                  x={Math.min(opMarker.x + 4, padLeft + plotW - 105)}
                  y={padTop + 6}
                  width={100}
                  height={18}
                  rx={4}
                  className="fill-emerald-50 dark:fill-emerald-950 stroke-emerald-300 dark:stroke-emerald-800"
                  strokeWidth={1}
                />
                <text
                  x={Math.min(opMarker.x + 54, padLeft + plotW - 55)}
                  y={padTop + 18}
                  textAnchor="middle"
                  className="fill-emerald-700 dark:fill-emerald-300 font-mono text-[9.5px] font-semibold"
                >
                  OP: {opMarker.label}
                </text>
              </g>
            )}

            {/* Baseline Dashed Curves */}
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
                    opacity={0.5}
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
                  strokeWidth={2.4}
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
                  className="stroke-slate-400 dark:stroke-slate-500"
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
                      r={4.5}
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

        {/* Cursor Readout Bar */}
        <div className="mx-2 mb-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Crosshair className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            {hoverIndex !== null && hoveredX !== null ? (
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {plotData.xLabel} = {formatReadoutValue(hoveredX, plotData.xUnit)}
              </span>
            ) : (
              <span className="text-slate-400">
                Hover over the plot to inspect exact HICUM/L2 numerical trace readouts
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
                  <div key={`readout-${s.id}`} className="flex items-center gap-1.5 font-mono text-xs">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-slate-500 dark:text-slate-400">{s.label.split(' ')[0]}:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatReadoutValue(pt.y, plotData.yUnit)}
                    </span>
                    {pctDelta !== null && (
                      <span
                        className={`px-1 py-0.2 rounded text-[10px] ${
                          Number(pctDelta) >= 0
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
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

      {/* Physical Regime & Equations Strip */}
      <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
          <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Physical Regimes &amp; Governing HICUM/L2 Equations in This Plot</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {regimeItems.map((reg, idx) => (
            <div
              key={idx}
              onClick={() => onSelectEquation && onSelectEquation(reg.eqId)}
              className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">{reg.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 shrink-0 font-semibold">
                    {reg.eqId}
                  </span>
                </div>
                <div className="my-2 py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 overflow-x-auto text-slate-900 dark:text-slate-100">
                  <FormulaView latex={reg.formula} displayMode={false} className="text-xs" />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{reg.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractivePlotPanel;
