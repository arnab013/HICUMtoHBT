# HICUM/L2 Interactive Physics & Equivalent Circuit Explorer

An interactive scientific learning and exploration platform for the **HICUM/L2 (High Current Model, Level 2)** compact bipolar and SiGe HBT transistor model (originated by Prof. Michael Schröter & A. Pawlak).

**Live Application (GitHub Pages):** [https://arnab013.github.io/HICUMtoHBT/](https://arnab013.github.io/HICUMtoHBT/)

---

## Key Subsystems & Scientific Features

1. **Structured HICUM/L2 Knowledge Database (Manual v2.4.0 & Verilog-A v2.34)**
   - **All 136 Official Model Parameters** across Manual Sections `3.1`–`3.17` (Tables 3.1–3.17, pp. 101–112) and `hicumL2V2p34.va` (lines 663–835), including exact default values, manual test card values, units, area/perimeter scaling (`M`-factor) rules, physical meanings, and spatial localization classifications (`localized`, `distributed`, `conceptual`, `flag`).
   - **All 47 Canonical Equations** across Manual Chapter 2 (`Sections 2.1–2.16`) and Chapter 4 (`Section 4.0 Operating Point`), complete with boxed-implementation flags, Verilog-A macro cross-references (`QJMODF`, `QJMOD`, `HICJQ`, `HICICK`, `HICQFF`, `HICQFC`, `HICDIO`, `HICRBI`, `HICAVL`, `HICTUN`, `TMPHICJ`), physical derivations, and interactive variable definitions.
   - **10 Comprehensive Physical Mechanism Guides** comparing HICUM/L2 physics (GICCR, Kirk critical current $I_{CK}$, SiGe bandgap grading & BC barrier, hyperbolic capacitance smoothing, internal base crowding, correlated HF noise, vertical NQS) against the classical SPICE Gummel-Poon Model (SGPM).

2. **Interactive HICUM/L2 Equivalent Circuit (`hic2_full`)**
   - Complete reconstruction of **Manual Fig. 2.1.0/1 (a–d)** and **Fig. 2.13.0/1**:
     - External terminals (`B`, `C`, `E`, `S`, `T`) and internal nodes (`B*`, `B'`, `C'`, `E'`, `S'`, plus NQS nodes `xf`, `xf1`, `xf2` and noise correlation nodes `n1`, `n2`).
     - All **34 selectable circuit branches** with live operating-point current, capacitance, resistance, and thermal readouts.
   - Synchronized selection: clicking any circuit element, node, or parameter highlights its associated branches, equations, physical device region, and live interactive plots.

3. **Real-Time Physics Solver & 8 Dynamic Plot Modes**
   - Numerically stable TypeScript solver executing the documented HICUM/L2 equations in real time:
     1. **Forward Gummel & Gain ($I_C, I_B, \beta_{DC}$ vs. $V_{BE}$)**
     2. **Collector Output Family & Kirk Critical Current $I_{CK}(V_{C'E'})$**
     3. **Transit Time $\tau_f(I_C)$ & Cutoff Frequencies $f_T, f_{max}$**
     4. **Junction Depletion Capacitances $C_{jEi}, C_{jEp}, C_{jCi}, C_{jCx}$ vs. $V_j$**
     5. **Internal Base Resistance $R_{bi}^*(V_{BE})$ & AC Shunt $C_{rBi}$**
     6. **BC Avalanche Multiplication $i_{AVL}(V_{CB})$ & BE Zener Tunneling $i_{BEt}(-V_{BE})$**
     7. **Temperature Scaling ($220\,\text{K} - 460\,\text{K}$) & Self-Heating $\Delta T_j$**
     8. **High-Frequency Correlated Noise Figure $NF_{min}(f)$ & Vertical NQS Excess Phase**
   - Explicitly distinguishes **Verified Manual Model Card** curves from **User-Adjusted Illustrative Sweeps** with real-time dashed baseline overlays and percentage delta readouts.

4. **Physical Device Cross-Sections & Spatial Localization Map**
   - Interactive 2D SiGe HBT cross-sections (`Manual Figs. 2.2.0/2, 2.7.0/1, 2.8.1–3, 2.11.0/1`) mapping every HICUM/L2 parameter and circuit element to physical semiconductor regions and preparing the taxonomy for Stage 5 Sentaurus 3D TCAD / Blender MCP integration.

---

## Local Development & Build

```bash
npm install
npm run dev
npm run build
```
