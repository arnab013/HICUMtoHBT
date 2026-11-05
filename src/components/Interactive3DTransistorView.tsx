import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  HicumParameter,
  CircuitElement,
  CircuitNode,
  BiasState,
  OperatingPointResult,
} from '../data/hicumTypes';
import { HICUM_EQUATIONS } from '../data/hicumEquations';
import {
  SENTAURUS_3D_REGIONS,
  EMBEDDED_3D_NODE_PINS,
  EMBEDDED_3D_COMPONENTS,
  Sentaurus3DRegionSpec,
  Embedded3DComponentSpec,
  EmbeddedComponentCategory,
  getExplodedPointUm,
} from '../data/sentaurus3DModel';
import { OrientationCube3D, CameraPresetId } from './OrientationCube3D';
import { CircuitSymbolGlyph } from './CircuitSymbol3DOverlay';
import { FormulaView } from './FormulaView';
import { CitationBadges } from './CitationBadges';
import {
  Box,
  Layers,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Hand,
  Orbit,
  Scissors,
  Eye,
  EyeOff,
  Camera,
  Search,
  Download,
  Focus,
  Tag,
  Sliders,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Compass,
  Info,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface Interactive3DTransistorViewProps {
  parameters: HicumParameter[];
  elements: CircuitElement[];
  nodes: CircuitNode[];
  bias: BiasState;
  opResult: OperatingPointResult;
  selectedParamId: string | null;
  selectedElementId: string | null;
  onSelectParamInLab: (paramId: string) => void;
  onSelectElementInLab: (elementId: string) => void;
}

type InteractionTool = 'orbit' | 'pan';
type CutawayAxis = 'none' | 'z_cross' | 'x_half' | 'y_depth';
type ViewModePreset = 'cross_section' | 'assembled_3d' | 'exploded_3d';

interface ProjectedOverlayState {
  nodes: Record<string, { x: number; y: number; visible: boolean }>;
  components: Record<
    string,
    {
      x: number;
      y: number;
      visible: boolean;
      wirePoints: { x: number; y: number }[];
    }
  >;
}

const SCALE_UM_TO_3D = 10.0; // 1 um = 10 Three.js world units

export const Interactive3DTransistorView: React.FC<Interactive3DTransistorViewProps> = ({
  parameters,
  elements,
  opResult,
  selectedParamId,
  selectedElementId,
  onSelectParamInLab,
  onSelectElementInLab,
}) => {
  // Primary Workspace State
  const [viewModePreset, setViewModePreset] = useState<ViewModePreset>('cross_section');
  const [interactionTool, setInteractionTool] = useState<InteractionTool>('orbit');
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraPresetId | null>('front');
  const [explodePct, setExplodePct] = useState<number>(0); // 0 to 100
  const [cutawayAxis, setCutawayAxis] = useState<CutawayAxis>('z_cross');
  const [cutawayPos, setCutawayPos] = useState<number>(0.02); // in um
  const [globalOpacity, setGlobalOpacity] = useState<number>(0.94);

  // Visibility & Hover Toggles
  const [hoverLabelsEnabled, setHoverLabelsEnabled] = useState<boolean>(true);
  const [showMaterials, setShowMaterials] = useState<boolean>(true);
  const [showContacts, setShowContacts] = useState<boolean>(true);
  const [showOxide, setShowOxide] = useState<boolean>(true);
  const [showHicumOverlay, setShowHicumOverlay] = useState<boolean>(true);
  const [showComponentLabels, setShowComponentLabels] = useState<boolean>(true);
  const [showComponentWires, setShowComponentWires] = useState<boolean>(true);
  const [enabledCategories, setEnabledCategories] = useState<Record<EmbeddedComponentCategory, boolean>>({
    resistances: true,
    capacitances: true,
    currents: true,
    charges: true,
  });

  // Per-Region Selection, Isolation, Hide, and Opacity
  const [selectedRegionId, setSelectedRegionId] = useState<string>('intrinsic_sige_base');
  const [isolatedRegionId, setIsolatedRegionId] = useState<string | null>(null);
  const [hiddenRegionIds, setHiddenRegionIds] = useState<Record<string, boolean>>({});
  const [regionOpacityMap, setRegionOpacityMap] = useState<Record<string, number>>({});

  // Hover state (for 3D semiconductor regions and embedded HICUM components)
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [mouseScreenPos, setMouseScreenPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Parameter Search inside 3D Workspace
  const [paramSearchQuery, setParamSearchQuery] = useState<string>('');
  const [paramSearchOpen, setParamSearchOpen] = useState<boolean>(false);

  // UI Panels & Popovers
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [bottomCardsExpanded, setBottomCardsExpanded] = useState<boolean>(true);
  const [showCategoryMenu, setShowCategoryMenu] = useState<boolean>(false);
  const [showRegionManager, setShowRegionManager] = useState<boolean>(false);
  const [screenshotTransparent, setScreenshotTransparent] = useState<boolean>(false);
  const [glbLoadedStatus, setGlbLoadedStatus] = useState<boolean>(false);

  // Camera angles synced to OrientationCube3D
  const [camAngles, setCamAngles] = useState<{ theta: number; phi: number }>({
    theta: 0.14,
    phi: Math.PI / 2 - 0.12,
  });

  // Projected 2D coordinates for the SVG HICUM schematic overlay
  const [overlayProj, setOverlayProj] = useState<ProjectedOverlayState>({
    nodes: {},
    components: {},
  });

  // Refs for Three.js lifecycle & smooth animation
  const artboardContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgOverlayRef = useRef<SVGSVGElement | null>(null);

  const cameraStateRef = useRef({
    theta: 0.14,
    phi: Math.PI / 2 - 0.12,
    radius: 25.5,
    targetTheta: 0.14,
    targetPhi: Math.PI / 2 - 0.12,
    targetRadius: 25.5,
    panX: 0.0,
    panY: -1.1,
    panZ: 0.0,
    targetPanX: 0.0,
    targetPanY: -1.1,
    targetPanZ: 0.0,
    currentExplode: 0.0,
    targetExplode: 0.0,
  });

  const pointerRef = useRef<{
    isDown: boolean;
    button: number;
    startX: number;
    startY: number;
    moved: boolean;
  }>({
    isDown: false,
    button: 0,
    startX: 0,
    startY: 0,
    moved: false,
  });

  const sceneObjectsRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    clippingPlane: THREE.Plane;
    meshEntries: {
      regionId: string;
      side: 'left' | 'right' | 'center';
      group: THREE.Group;
      mesh: THREE.Mesh;
      edges: THREE.LineSegments;
      material: THREE.MeshStandardMaterial;
      edgeMaterial: THREE.LineBasicMaterial;
    }[];
  }>({
    scene: null,
    camera: null,
    renderer: null,
    clippingPlane: new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.2),
    meshEntries: [],
  });

  // Keep latest state in a ref for the Three.js animation & raycast loop
  const liveStateRef = useRef({
    selectedRegionId,
    hoveredRegionId,
    isolatedRegionId,
    hiddenRegionIds,
    regionOpacityMap,
    globalOpacity,
    showMaterials,
    showContacts,
    showOxide,
    cutawayAxis,
    cutawayPos,
    selectedParamId,
    selectedElementId,
    interactionTool,
  });

  useEffect(() => {
    liveStateRef.current = {
      selectedRegionId,
      hoveredRegionId,
      isolatedRegionId,
      hiddenRegionIds,
      regionOpacityMap,
      globalOpacity,
      showMaterials,
      showContacts,
      showOxide,
      cutawayAxis,
      cutawayPos,
      selectedParamId,
      selectedElementId,
      interactionTool,
    };
  }, [
    selectedRegionId,
    hoveredRegionId,
    isolatedRegionId,
    hiddenRegionIds,
    regionOpacityMap,
    globalOpacity,
    showMaterials,
    showContacts,
    showOxide,
    cutawayAxis,
    cutawayPos,
    selectedParamId,
    selectedElementId,
    interactionTool,
  ]);

  useEffect(() => {
    cameraStateRef.current.targetExplode = explodePct / 100;
  }, [explodePct]);

  // Verify Blender GLB asset availability via GLTFLoader
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      './models/sige_hbt_sentaurus.glb',
      () => {
        setGlbLoadedStatus(true);
      },
      undefined,
      () => {
        setGlbLoadedStatus(false);
      }
    );
  }, []);

  // Active Region & Active Embedded Component resolution
  const activeRegion: Sentaurus3DRegionSpec = useMemo(() => {
    return (
      SENTAURUS_3D_REGIONS.find((r) => r.id === selectedRegionId) ||
      SENTAURUS_3D_REGIONS[6]
    );
  }, [selectedRegionId]);

  const activeEmbeddedComponent: Embedded3DComponentSpec = useMemo(() => {
    if (selectedElementId) {
      const found = EMBEDDED_3D_COMPONENTS.find((c) => c.id === selectedElementId);
      if (found) return found;
    }
    const regionComp = EMBEDDED_3D_COMPONENTS.find(
      (c) => c.hostRegionId === activeRegion.id
    );
    return regionComp || EMBEDDED_3D_COMPONENTS[11]; // default 'it'
  }, [selectedElementId, activeRegion.id]);

  const activeCircuitElement: CircuitElement | undefined = useMemo(
    () => elements.find((e) => e.id === activeEmbeddedComponent.id),
    [elements, activeEmbeddedComponent.id]
  );

  const activeEquation = useMemo(() => {
    const eqId = activeEmbeddedComponent.primaryEquationId;
    return (
      HICUM_EQUATIONS.find((eq) => eq.id === eqId) ||
      HICUM_EQUATIONS.find((eq) =>
        activeCircuitElement?.governingEquations.includes(eq.id)
      ) ||
      HICUM_EQUATIONS[0]
    );
  }, [activeEmbeddedComponent, activeCircuitElement]);

  // Regions highlighted by the currently selected parameter
  const paramHighlightedRegionIds = useMemo(() => {
    if (!selectedParamId) return new Set<string>();
    return new Set(
      SENTAURUS_3D_REGIONS.filter((r) =>
        r.keyParameters.includes(selectedParamId)
      ).map((r) => r.id)
    );
  }, [selectedParamId]);

  const paramHighlightedComponentIds = useMemo(() => {
    if (!selectedParamId) return new Set<string>();
    const matchingElementIds = new Set(
      elements
        .filter((el) => el.parameters.includes(selectedParamId))
        .map((el) => el.id)
    );
    return matchingElementIds;
  }, [selectedParamId, elements]);

  // Camera Preset Handler
  const handleSelectCameraPreset = useCallback((preset: CameraPresetId) => {
    setActiveCameraPreset(preset);
    const cam = cameraStateRef.current;
    switch (preset) {
      case 'front':
        cam.targetTheta = 0.0;
        cam.targetPhi = Math.PI / 2 - 0.04;
        break;
      case 'back':
        cam.targetTheta = Math.PI;
        cam.targetPhi = Math.PI / 2 - 0.04;
        break;
      case 'left':
        cam.targetTheta = -Math.PI / 2;
        cam.targetPhi = Math.PI / 2 - 0.04;
        break;
      case 'right':
        cam.targetTheta = Math.PI / 2;
        cam.targetPhi = Math.PI / 2 - 0.04;
        break;
      case 'top':
        cam.targetTheta = 0.0;
        cam.targetPhi = 0.08;
        break;
      case 'bottom':
        cam.targetTheta = 0.0;
        cam.targetPhi = Math.PI - 0.08;
        break;
      case 'iso':
        cam.targetTheta = 0.52;
        cam.targetPhi = Math.PI / 2 - 0.36;
        break;
    }
  }, []);

  // Fit to Screen Handler
  const handleFitToScreen = useCallback(() => {
    const cam = cameraStateRef.current;
    cam.targetPanX = 0.0;
    cam.targetPanY = -1.1;
    cam.targetPanZ = 0.0;
    cam.targetRadius = 25.5 + cam.targetExplode * 5.5;
  }, []);

  // Focus Camera on Specific Region (Double-click or Focus button)
  const handleFocusOnRegion = useCallback((region: Sentaurus3DRegionSpec) => {
    const cam = cameraStateRef.current;
    const [fx, fy, fz] = region.focusCenterUm;
    const [, ey, ez] = region.explodeVectorUm;
    const exp = cam.targetExplode;
    cam.targetPanX = fx * SCALE_UM_TO_3D;
    cam.targetPanY = (fy + ey * exp) * SCALE_UM_TO_3D;
    cam.targetPanZ = (fz + ez * exp) * SCALE_UM_TO_3D;
    cam.targetRadius = 15.5;
    setSelectedRegionId(region.id);
  }, []);

  // Complete Reset Handler
  const handleResetAll = useCallback(() => {
    setViewModePreset('cross_section');
    setExplodePct(0);
    setCutawayAxis('z_cross');
    setCutawayPos(0.02);
    setGlobalOpacity(0.94);
    setIsolatedRegionId(null);
    setHiddenRegionIds({});
    setRegionOpacityMap({});
    setShowMaterials(true);
    setShowContacts(true);
    setShowOxide(true);
    setShowHicumOverlay(true);
    setActiveCameraPreset('front');
    const cam = cameraStateRef.current;
    cam.targetTheta = 0.14;
    cam.targetPhi = Math.PI / 2 - 0.12;
    cam.targetRadius = 25.5;
    cam.targetPanX = 0.0;
    cam.targetPanY = -1.1;
    cam.targetPanZ = 0.0;
    cam.targetExplode = 0.0;
  }, []);

  // Quick View Mode Switcher (Cross-Section vs Assembled 3D vs Exploded 3D)
  const handleSelectViewModePreset = useCallback((mode: ViewModePreset) => {
    setViewModePreset(mode);
    const cam = cameraStateRef.current;
    if (mode === 'cross_section') {
      setExplodePct(0);
      setCutawayAxis('z_cross');
      setCutawayPos(0.02);
      setActiveCameraPreset('front');
      cam.targetTheta = 0.12;
      cam.targetPhi = Math.PI / 2 - 0.10;
      cam.targetRadius = 25.5;
      cam.targetPanX = 0.0;
      cam.targetPanY = -1.1;
      cam.targetPanZ = 0.0;
    } else if (mode === 'assembled_3d') {
      setExplodePct(0);
      setCutawayAxis('none');
      setActiveCameraPreset('iso');
      cam.targetTheta = 0.52;
      cam.targetPhi = Math.PI / 2 - 0.34;
      cam.targetRadius = 27.5;
      cam.targetPanX = 0.0;
      cam.targetPanY = -1.1;
      cam.targetPanZ = 0.0;
    } else if (mode === 'exploded_3d') {
      setExplodePct(68);
      setCutawayAxis('z_cross');
      setCutawayPos(0.18);
      setActiveCameraPreset('iso');
      cam.targetTheta = 0.44;
      cam.targetPhi = Math.PI / 2 - 0.28;
      cam.targetRadius = 31.0;
      cam.targetPanX = 0.0;
      cam.targetPanY = -0.8;
      cam.targetPanZ = 0.0;
    }
  }, []);

  // Initialize Three.js Scene, Meshes from Sentaurus TCAD Geometry, Lighting & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = artboardContainerRef.current;
    if (!canvas || !container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1.6, 0.5, 250);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;

    // Soft, publication-grade studio illumination (no harsh specular glare)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffcf7, 1.15);
    keyLight.position.set(18, 28, 26);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xeef4fa, 0.65);
    fillLight.position.set(-22, 12, 18);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf5f5f0, 0.45);
    rimLight.position.set(0, -18, -20);
    scene.add(rimLight);

    const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.2);
    const meshEntries: typeof sceneObjectsRef.current.meshEntries = [];

    // Helper to build a single extruded 3D prism mesh + edge lines
    const buildExtrudedHalfMesh = (
      reg: Sentaurus3DRegionSpec,
      side: 'left' | 'right' | 'center'
    ) => {
      const group = new THREE.Group();
      const z0 = reg.extrudeZUm[0] * SCALE_UM_TO_3D;
      const z1 = reg.extrudeZUm[1] * SCALE_UM_TO_3D;
      const depth = z1 - z0;

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(reg.colorHex),
        roughness: reg.category === 'contacts' ? 0.35 : 0.62,
        metalness: reg.category === 'contacts' ? 0.25 : 0.04,
        transparent: true,
        opacity: reg.defaultOpacity,
        side: THREE.DoubleSide,
        clippingPlanes: [clippingPlane],
        clipShadows: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });

      const edgeMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(reg.edgeHex),
        transparent: true,
        opacity: 0.72,
        clippingPlanes: [clippingPlane],
      });

      for (const prism of reg.prisms) {
        const shape = new THREE.Shape();
        const pts =
          side === 'left'
            ? [...prism.xzPointsUm].reverse().map(([x, y]) => [-x * SCALE_UM_TO_3D, y * SCALE_UM_TO_3D])
            : prism.xzPointsUm.map(([x, y]) => [x * SCALE_UM_TO_3D, y * SCALE_UM_TO_3D]);

        pts.forEach(([px, py], idx) => {
          if (idx === 0) shape.moveTo(px, py);
          else shape.lineTo(px, py);
        });
        shape.closePath();

        const geom = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: false,
        });
        geom.translate(0, 0, z0);

        const mesh = new THREE.Mesh(geom, material);
        mesh.userData = { regionId: reg.id, side };
        group.add(mesh);

        const edgesGeom = new THREE.EdgesGeometry(geom, 18);
        const edges = new THREE.LineSegments(edgesGeom, edgeMaterial);
        group.add(edges);

        meshEntries.push({
          regionId: reg.id,
          side,
          group,
          mesh,
          edges,
          material,
          edgeMaterial,
        });
      }

      scene.add(group);
    };

    // Build all Sentaurus 3D regions (symmetric left and right halves)
    for (const reg of SENTAURUS_3D_REGIONS) {
      const touchesCenter = reg.prisms.some((p) =>
        p.xzPointsUm.some(([x]) => Math.abs(x) < 1e-4)
      );
      const isPurelyLateral = !touchesCenter;
      if (isPurelyLateral) {
        buildExtrudedHalfMesh(reg, 'right');
        buildExtrudedHalfMesh(reg, 'left');
      } else {
        // Regions touching X=0 are built as both right and left symmetric halves moving together along center Y
        buildExtrudedHalfMesh(reg, 'right');
        buildExtrudedHalfMesh(reg, 'left');
      }
    }

    sceneObjectsRef.current = {
      scene,
      camera,
      renderer,
      clippingPlane,
      meshEntries,
    };

    // Resize observer for responsive layout
    const updateSize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 900;
      const h = container.clientHeight || 540;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    // Wheel zoom listener with passive: false
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = cameraStateRef.current;
      const delta = e.deltaY * 0.018;
      cam.targetRadius = Math.max(9.0, Math.min(52.0, cam.targetRadius + delta));
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Animation loop
    let animFrameId = 0;
    let frameCounter = 0;
    const tempVec = new THREE.Vector3();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const cam = cameraStateRef.current;
      const st = liveStateRef.current;

      // Smoothly damp camera spherical coordinates, pan target, and explode factor
      const damp = 0.16;
      cam.theta += (cam.targetTheta - cam.theta) * damp;
      cam.phi += (cam.targetPhi - cam.phi) * damp;
      cam.radius += (cam.targetRadius - cam.radius) * damp;
      cam.panX += (cam.targetPanX - cam.panX) * damp;
      cam.panY += (cam.targetPanY - cam.panY) * damp;
      cam.panZ += (cam.targetPanZ - cam.panZ) * damp;
      cam.currentExplode += (cam.targetExplode - cam.currentExplode) * damp;

      // Update camera position from spherical coordinates
      const sinPhi = Math.sin(cam.phi);
      const cosPhi = Math.cos(cam.phi);
      const sinTheta = Math.sin(cam.theta);
      const cosTheta = Math.cos(cam.theta);

      camera.position.set(
        cam.panX + cam.radius * sinPhi * sinTheta,
        cam.panY + cam.radius * cosPhi,
        cam.panZ + cam.radius * sinPhi * cosTheta
      );
      camera.lookAt(cam.panX, cam.panY, cam.panZ);
      camera.updateMatrixWorld();

      // Update clipping plane
      if (st.cutawayAxis === 'none') {
        clippingPlane.constant = 999;
      } else if (st.cutawayAxis === 'z_cross') {
        clippingPlane.normal.set(0, 0, -1);
        clippingPlane.constant = st.cutawayPos * SCALE_UM_TO_3D;
      } else if (st.cutawayAxis === 'x_half') {
        clippingPlane.normal.set(-1, 0, 0);
        clippingPlane.constant = st.cutawayPos * SCALE_UM_TO_3D;
      } else if (st.cutawayAxis === 'y_depth') {
        clippingPlane.normal.set(0, -1, 0);
        clippingPlane.constant = st.cutawayPos * SCALE_UM_TO_3D;
      }

      // Update each mesh's exploded position, visibility, highlight, and opacity
      for (const entry of meshEntries) {
        const reg = SENTAURUS_3D_REGIONS.find((r) => r.id === entry.regionId);
        if (!reg) continue;

        const [ex, ey, ez] = reg.explodeVectorUm;
        const sideSign =
          Math.abs(ex) > 1e-4
            ? entry.side === 'left'
              ? -1
              : 1
            : 0;

        entry.group.position.set(
          ex * sideSign * cam.currentExplode * SCALE_UM_TO_3D,
          ey * cam.currentExplode * SCALE_UM_TO_3D,
          ez * cam.currentExplode * SCALE_UM_TO_3D
        );

        // Visibility check
        const catVisible =
          (reg.category === 'materials' && st.showMaterials) ||
          (reg.category === 'contacts' && st.showContacts) ||
          (reg.category === 'oxide' && st.showOxide);
        const isHidden = Boolean(st.hiddenRegionIds[reg.id]);
        const isIsolatedOut =
          st.isolatedRegionId !== null && st.isolatedRegionId !== reg.id;

        entry.group.visible = catVisible && !isHidden && !isIsolatedOut;

        // Material color & highlight state
        const isSelected = st.selectedRegionId === reg.id;
        const isHovered = st.hoveredRegionId === reg.id;
        const isParamMatch =
          st.selectedParamId !== null &&
          reg.keyParameters.includes(st.selectedParamId);

        const baseColor = new THREE.Color(reg.colorHex);
        if (isHovered) {
          baseColor.offsetHSL(0, 0.05, 0.06);
        } else if (isSelected || isParamMatch) {
          baseColor.offsetHSL(0, 0.04, 0.03);
        }
        entry.material.color.copy(baseColor);

        const customOpacity = st.regionOpacityMap[reg.id] ?? reg.defaultOpacity;
        const finalOpacity = Math.min(1, customOpacity * st.globalOpacity);
        entry.material.opacity = finalOpacity;
        entry.material.depthWrite = finalOpacity > 0.78;

        entry.edgeMaterial.color.set(
          isSelected || isHovered || isParamMatch ? '#23435C' : reg.edgeHex
        );
        entry.edgeMaterial.opacity = isSelected || isHovered ? 0.98 : 0.65;
      }

      renderer.render(scene, camera);

      // Update React overlay projection & orientation cube at ~30fps or when moving
      frameCounter++;
      if (frameCounter % 2 === 0) {
        const w = container.clientWidth || 900;
        const h = container.clientHeight || 540;

        const zFrontPlaneUm =
          st.cutawayAxis === 'z_cross'
            ? Math.min(0.55, st.cutawayPos + 0.01)
            : 0.56;

        const projectUmPoint = (ptUm: [number, number, number]) => {
          tempVec.set(
            ptUm[0] * SCALE_UM_TO_3D,
            ptUm[1] * SCALE_UM_TO_3D,
            ptUm[2] * SCALE_UM_TO_3D
          );
          tempVec.project(camera);
          return {
            x: (tempVec.x * 0.5 + 0.5) * w,
            y: (-tempVec.y * 0.5 + 0.5) * h,
            visible: tempVec.z >= -1 && tempVec.z <= 1,
          };
        };

        const nodesProj: ProjectedOverlayState['nodes'] = {};
        const explodedNodeCoordsUm: Record<string, [number, number, number]> = {};

        for (const pin of EMBEDDED_3D_NODE_PINS) {
          const baseUm: [number, number, number] = [
            pin.posUm[0],
            pin.posUm[1],
            zFrontPlaneUm,
          ];
          const expUm = getExplodedPointUm(
            baseUm,
            pin.hostRegionId,
            pin.hostSide,
            cam.currentExplode
          );
          explodedNodeCoordsUm[pin.id] = expUm;
          nodesProj[pin.id] = projectUmPoint(expUm);
        }

        const compsProj: ProjectedOverlayState['components'] = {};
        for (const comp of EMBEDDED_3D_COMPONENTS) {
          const baseSymUm: [number, number, number] = [
            comp.symbolPosUm[0],
            comp.symbolPosUm[1],
            zFrontPlaneUm,
          ];
          const expSymUm = getExplodedPointUm(
            baseSymUm,
            comp.hostRegionId,
            comp.hostSide,
            cam.currentExplode
          );
          const sym2D = projectUmPoint(expSymUm);

          const fromUm = explodedNodeCoordsUm[comp.fromNodePinId];
          const toUm = explodedNodeCoordsUm[comp.toNodePinId];
          const wirePts: { x: number; y: number }[] = [];

          if (fromUm && toUm) {
            wirePts.push(projectUmPoint(fromUm));
            if (comp.wireWaypoints && comp.wireWaypoints.length > 0) {
              for (const wp of comp.wireWaypoints) {
                const wpUm = getExplodedPointUm(
                  [wp.posUm[0], wp.posUm[1], zFrontPlaneUm],
                  wp.hostRegionId,
                  wp.hostSide,
                  cam.currentExplode
                );
                wirePts.push(projectUmPoint(wpUm));
              }
            }
            wirePts.push(sym2D);
            wirePts.push(projectUmPoint(toUm));
          }

          compsProj[comp.id] = {
            x: sym2D.x,
            y: sym2D.y,
            visible: sym2D.visible,
            wirePoints: wirePts,
          };
        }

        setOverlayProj({ nodes: nodesProj, components: compsProj });
        setCamAngles({ theta: cam.theta, phi: cam.phi });
      }
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, []);

  // Raycast helper to pick 3D semiconductor region under cursor
  const raycastRegionAtEvent = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): string | null => {
      const container = artboardContainerRef.current;
      const { camera, meshEntries, clippingPlane } = sceneObjectsRef.current;
      if (!container || !camera) return null;

      const rect = container.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      const visibleMeshes = meshEntries
        .filter((entry) => entry.group.visible)
        .map((entry) => entry.mesh);

      const hits = raycaster.intersectObjects(visibleMeshes, false);
      for (const hit of hits) {
        // Respect active clipping plane
        if (
          liveStateRef.current.cutawayAxis !== 'none' &&
          clippingPlane.distanceToPoint(hit.point) < -1e-3
        ) {
          continue;
        }
        const regId = hit.object.userData?.regionId;
        if (regId) return regId;
      }
      return null;
    },
    []
  );

  // Mouse handlers on the 3D Artboard
  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    pointerRef.current = {
      isDown: true,
      button: e.button,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = artboardContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setMouseScreenPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    if (pointerRef.current.isDown) {
      const dx = e.clientX - pointerRef.current.startX;
      const dy = e.clientY - pointerRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        pointerRef.current.moved = true;
      }
      pointerRef.current.startX = e.clientX;
      pointerRef.current.startY = e.clientY;

      const cam = cameraStateRef.current;
      const isPanGesture =
        interactionTool === 'pan' || e.button === 2 || e.shiftKey;

      if (isPanGesture) {
        const panScale = cam.radius * 0.0014;
        const cosT = Math.cos(cam.theta);
        const sinT = Math.sin(cam.theta);
        cam.targetPanX -= dx * cosT * panScale;
        cam.targetPanZ += dx * sinT * panScale;
        cam.targetPanY += dy * panScale;
      } else {
        setActiveCameraPreset(null);
        cam.targetTheta -= dx * 0.0075;
        cam.targetPhi = Math.max(
          0.08,
          Math.min(Math.PI - 0.08, cam.targetPhi - dy * 0.0065)
        );
      }
      return;
    }

    // Hover identification via Raycaster when not dragging
    const hitRegionId = raycastRegionAtEvent(e);
    setHoveredRegionId(hitRegionId);
  };

  const handlePointerUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const wasClick = pointerRef.current.isDown && !pointerRef.current.moved;
    pointerRef.current.isDown = false;

    if (wasClick && e.button === 0) {
      const hitRegionId = raycastRegionAtEvent(e);
      if (hitRegionId) {
        setSelectedRegionId(hitRegionId);
        const reg = SENTAURUS_3D_REGIONS.find((r) => r.id === hitRegionId);
        if (reg && reg.circuitElements.length > 0) {
          onSelectElementInLab(reg.circuitElements[0]);
        }
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const hitRegionId = raycastRegionAtEvent(e);
    if (hitRegionId) {
      const reg = SENTAURUS_3D_REGIONS.find((r) => r.id === hitRegionId);
      if (reg) {
        handleFocusOnRegion(reg);
      }
    }
  };

  // Screenshot Export Handler (WebGL Canvas + Optional SVG Circuit & Labels + Optional Transparent Background)
  const handleExportScreenshot = useCallback(() => {
    const canvas = canvasRef.current;
    const svg = svgOverlayRef.current;
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    if (!screenshotTransparent) {
      ctx.fillStyle = '#F7F6F2';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.drawImage(canvas, 0, 0, w, h);

    const triggerDownload = () => {
      const link = document.createElement('a');
      link.download = `HICUM_3D_SiGe_HBT_${viewModePreset}.png`;
      link.href = outCanvas.toDataURL('image/png');
      link.click();
    };

    if (showHicumOverlay && svg) {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        triggerDownload();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        triggerDownload();
      };
      img.src = url;
    } else {
      triggerDownload();
    }
  }, [screenshotTransparent, showHicumOverlay, viewModePreset]);

  // Filtered parameters for the 3D Workspace Parameter Locator Search
  const matchingSearchParams = useMemo(() => {
    const q = paramSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return parameters
      .filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.physicalRegion.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [paramSearchQuery, parameters]);

  // Hovered entity for the floating tooltip
  const hoveredRegionSpec = useMemo(
    () =>
      hoveredRegionId
        ? SENTAURUS_3D_REGIONS.find((r) => r.id === hoveredRegionId) || null
        : null,
    [hoveredRegionId]
  );

  const hoveredComponentSpec = useMemo(
    () =>
      hoveredComponentId
        ? EMBEDDED_3D_COMPONENTS.find((c) => c.id === hoveredComponentId) || null
        : null,
    [hoveredComponentId]
  );

  // Conceptual / Non-localized parameters
  const conceptualParams = useMemo(
    () =>
      parameters.filter(
        (p) => p.spatialNature === 'conceptual' || p.spatialNature === 'flag'
      ),
    [parameters]
  );

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#F7F6F2] overflow-y-auto p-4 sm:p-6 space-y-4'
          : 'space-y-5'
      }
    >
      {/* Publication Header & Compact Contextual Controls */}
      <div className="bg-white rounded-xl border border-slate-200/90 px-4 py-3 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#3B5978] bg-[#EEF3F8] px-2.5 py-0.5 rounded border border-[#D5E1EE]">
              Sentaurus TCAD → 3D SiGe HBT Workspace
            </span>
            {glbLoadedStatus && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#2C6E63] bg-[#EDF6F4] px-2 py-0.5 rounded border border-[#CBE4DF]">
                <CheckCircle2 className="w-3 h-3" />
                Blender 5.2 GLB Verified
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-scientific mt-0.5">
            Physical Mapping of the HICUM/L2 Compact Model to a 3D SiGe HBT
          </h2>
        </div>

        {/* Right Contextual Toolbar: Parameter Locator Search, View Mode Presets & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Parameter Search & 3D Region Locator */}
          <div className="relative">
            <div className="flex items-center bg-[#F8F7F4] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus-within:border-[#3B5978] focus-within:bg-white transition-all">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
              <input
                type="text"
                value={paramSearchQuery}
                onFocus={() => setParamSearchOpen(true)}
                onBlur={() => setTimeout(() => setParamSearchOpen(false), 180)}
                onChange={(e) => {
                  setParamSearchQuery(e.target.value);
                  setParamSearchOpen(true);
                }}
                placeholder="Locate parameter in 3D (e.g. rbi0, cjci0, rcx)..."
                className="bg-transparent outline-none w-48 sm:w-56 text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {paramSearchOpen && matchingSearchParams.length > 0 && (
              <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl border border-slate-200 shadow-lg p-2 z-50 space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Click Parameter to Highlight 3D Region & Element
                </div>
                {matchingSearchParams.map((p) => {
                  const mappedReg = SENTAURUS_3D_REGIONS.find((r) =>
                    r.keyParameters.includes(p.id)
                  );
                  return (
                    <button
                      key={p.id}
                      onMouseDown={() => {
                        onSelectParamInLab(p.id);
                        if (mappedReg) {
                          handleFocusOnRegion(mappedReg);
                        }
                        setParamSearchQuery('');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-mono font-bold text-[#3B5978]">
                          {p.id}
                        </span>
                        <span className="text-slate-500 ml-1.5 text-[11px] truncate">
                          {p.description}
                        </span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono shrink-0 ${
                          p.spatialNature === 'localized'
                            ? 'bg-[#EDF6F4] text-[#2C6E63]'
                            : p.spatialNature === 'distributed'
                            ? 'bg-[#EEF3F8] text-[#3B5978]'
                            : 'bg-[#F4EAE3] text-[#824726]'
                        }`}
                      >
                        {mappedReg ? mappedReg.shortLabel : p.spatialNature}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3 View Mode Presets: Cross-Section / Assembled 3D / Exploded */}
          <div className="flex items-center bg-[#F3F2EE] p-0.5 rounded-lg border border-slate-200/80 text-xs">
            <button
              onClick={() => handleSelectViewModePreset('cross_section')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewModePreset === 'cross_section'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3D Cross-Section
            </button>
            <button
              onClick={() => handleSelectViewModePreset('assembled_3d')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewModePreset === 'assembled_3d'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assembled 3D
            </button>
            <button
              onClick={() => handleSelectViewModePreset('exploded_3d')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewModePreset === 'exploded_3d'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Exploded View
            </button>
          </div>

          {/* Screenshot & GLB Export */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportScreenshot}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5"
              title="Export PNG Screenshot of 3D Artboard"
            >
              <Camera className="w-3.5 h-3.5 text-[#3B5978]" />
              <span className="hidden sm:inline">Screenshot</span>
            </button>
            <label className="hidden xl:inline-flex items-center gap-1 text-[11px] text-slate-600 px-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={screenshotTransparent}
                onChange={(e) => setScreenshotTransparent(e.target.checked)}
                className="accent-[#3B5978] rounded"
              />
              <span>Transp. BG</span>
            </label>
            <a
              href="./models/sige_hbt_sentaurus.glb"
              download="sige_hbt_sentaurus.glb"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1"
              title="Download Blender 5.2 Sentaurus 3D Model (.glb)"
            >
              <Download className="w-3.5 h-3.5 text-[#2C6E63]" />
              <span className="hidden md:inline">.GLB</span>
            </a>
            <button
              onClick={() => setIsFullscreen((f) => !f)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D Artboard'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* DOMINANT 3D SCIENTIFIC ARTBOARD */}
      <div className="bg-[#FAF9F5] rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        {/* Top Artboard Contextual Visibility Bar */}
        <div className="px-4 py-2 bg-white border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Layer & Component Visibility Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Layers:
            </span>
            <button
              onClick={() => setShowMaterials((v) => !v)}
              className={`px-2.5 py-1 rounded-md font-medium border transition-colors inline-flex items-center gap-1 ${
                showMaterials
                  ? 'bg-[#EEF3F8] text-[#3B5978] border-[#C5D6E8]'
                  : 'bg-white text-slate-400 border-slate-200'
              }`}
            >
              {showMaterials ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Semiconductors</span>
            </button>

            <button
              onClick={() => setShowContacts((v) => !v)}
              className={`px-2.5 py-1 rounded-md font-medium border transition-colors inline-flex items-center gap-1 ${
                showContacts
                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-white text-slate-400 border-slate-200'
              }`}
            >
              {showContacts ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Contacts (E, B, C, S)</span>
            </button>

            <button
              onClick={() => setShowOxide((v) => !v)}
              className={`px-2.5 py-1 rounded-md font-medium border transition-colors inline-flex items-center gap-1 ${
                showOxide
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-white text-slate-400 border-slate-200'
              }`}
            >
              {showOxide ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>STI & Spacers</span>
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Embedded HICUM Circuit Overlay Toggle & Category Filter */}
            <button
              onClick={() => setShowHicumOverlay((v) => !v)}
              className={`px-2.5 py-1 rounded-md font-semibold border transition-colors inline-flex items-center gap-1.5 ${
                showHicumOverlay
                  ? 'bg-[#2C6E63] text-white border-[#2C6E63]'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Embedded HICUM Elements</span>
            </button>

            {showHicumOverlay && (
              <div className="relative">
                <button
                  onClick={() => setShowCategoryMenu((m) => !m)}
                  className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium inline-flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3 text-[#2C6E63]" />
                  <span>Filter Symbols</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showCategoryMenu && (
                  <div className="absolute left-0 mt-1 w-60 bg-white rounded-xl border border-slate-200 shadow-lg p-3 z-40 space-y-2 text-xs">
                    <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1">
                      HICUM Component Categories
                    </div>
                    {(
                      [
                        { id: 'resistances', label: 'Resistances (R_E, R_Bx, R_bi*, R_Cx, R_su)' },
                        { id: 'capacitances', label: 'Capacitances (Q_jEi, Q_jCi, Q_BCx, Q_jS)' },
                        { id: 'currents', label: 'Currents & Diodes (i_T, i_jBE, i_AVL, i_TS)' },
                        { id: 'charges', label: 'Charges & Thermal (Q_f, R_th || C_th)' },
                      ] as { id: EmbeddedComponentCategory; label: string }[]
                    ).map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900"
                      >
                        <input
                          type="checkbox"
                          checked={enabledCategories[cat.id]}
                          onChange={(e) =>
                            setEnabledCategories((prev) => ({
                              ...prev,
                              [cat.id]: e.target.checked,
                            }))
                          }
                          className="accent-[#2C6E63] rounded"
                        />
                        <span className="text-[11px]">{cat.label}</span>
                      </label>
                    ))}
                    <div className="border-t border-slate-100 pt-2 space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={showComponentLabels}
                          onChange={(e) => setShowComponentLabels(e.target.checked)}
                          className="accent-[#3B5978] rounded"
                        />
                        <span className="text-[11px]">Show Component Labels</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={showComponentWires}
                          onChange={(e) => setShowComponentWires(e.target.checked)}
                          className="accent-[#3B5978] rounded"
                        />
                        <span className="text-[11px]">Show 3D Routing Wires</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Toggles: Hover Identification ON/OFF & Region Visibility Manager */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHoverLabelsEnabled((h) => !h)}
              className={`px-2.5 py-1 rounded-md font-medium border transition-colors inline-flex items-center gap-1 ${
                hoverLabelsEnabled
                  ? 'bg-[#EEF3F8] text-[#3B5978] border-[#C5D6E8]'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
              title="Toggle Hover Identification Labels ON/OFF"
            >
              <Tag className="w-3 h-3" />
              <span>Hover Labels: {hoverLabelsEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowRegionManager((r) => !r)}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium inline-flex items-center gap-1"
              >
                <Layers className="w-3 h-3 text-[#3B5978]" />
                <span>Regions (13)</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showRegionManager && (
                <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl border border-slate-200 shadow-lg p-3 z-40 space-y-1.5 text-xs max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-semibold text-slate-800">
                      Show / Hide / Isolate Regions
                    </span>
                    <button
                      onClick={() => {
                        setIsolatedRegionId(null);
                        setHiddenRegionIds({});
                      }}
                      className="text-[10px] text-[#3B5978] hover:underline font-medium"
                    >
                      Show All
                    </button>
                  </div>
                  {SENTAURUS_3D_REGIONS.map((reg) => {
                    const isHidden = Boolean(hiddenRegionIds[reg.id]);
                    const isIsolated = isolatedRegionId === reg.id;
                    return (
                      <div
                        key={reg.id}
                        className="flex items-center justify-between gap-2 py-1 px-1.5 rounded hover:bg-slate-50"
                      >
                        <button
                          onClick={() => setSelectedRegionId(reg.id)}
                          className="flex items-center gap-2 text-left truncate flex-1"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-xs shrink-0 border border-slate-400"
                            style={{ backgroundColor: reg.colorHex }}
                          />
                          <span className="truncate text-[11px] font-medium text-slate-700">
                            {reg.shortLabel}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              setIsolatedRegionId((prev) =>
                                prev === reg.id ? null : reg.id
                              )
                            }
                            className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono border ${
                              isIsolated
                                ? 'bg-[#3B5978] text-white border-[#3B5978]'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Iso
                          </button>
                          <button
                            onClick={() =>
                              setHiddenRegionIds((prev) => ({
                                ...prev,
                                [reg.id]: !prev[reg.id],
                              }))
                            }
                            className="p-1 text-slate-500 hover:text-slate-900"
                            title={isHidden ? 'Show Region' : 'Hide Region'}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3 h-3 text-[#A04A40]" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN 3D VIEWPORT CANVAS + EMBEDDED HICUM SVG OVERLAY */}
        <div
          ref={artboardContainerRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onContextMenu={(e) => e.preventDefault()}
          className={`relative w-full ${
            isFullscreen ? 'h-[68vh]' : 'h-[520px] sm:h-[560px]'
          } select-none overflow-hidden ${
            interactionTool === 'pan'
              ? 'cursor-move'
              : 'cursor-grab active:cursor-grabbing'
          }`}
        >
          {/* Three.js WebGL Canvas */}
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Synchronized 3D-Projected Embedded HICUM Circuit Overlay */}
          {showHicumOverlay && (
            <svg
              ref={svgOverlayRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              {/* Terminal Lead Stems for External Nodes B, E, C, S */}
              {(['B', 'E', 'C', 'S'] as const).map((termId) => {
                const pt = overlayProj.nodes[termId];
                if (!pt || !pt.visible) return null;
                const isBottom = termId === 'S';
                const stemY = isBottom ? pt.y + 26 : pt.y - 32;
                return (
                  <g key={`term-${termId}`}>
                    <line
                      x1={pt.x}
                      y1={pt.y}
                      x2={pt.x}
                      y2={stemY}
                      stroke="#0F172A"
                      strokeWidth={2}
                    />
                    <circle
                      cx={pt.x}
                      cy={stemY}
                      r={4.5}
                      fill="#FFFFFF"
                      stroke="#0F172A"
                      strokeWidth={2}
                    />
                    <text
                      x={pt.x}
                      y={isBottom ? stemY + 16 : stemY - 9}
                      textAnchor="middle"
                      className="fill-slate-900 font-scientific font-bold text-sm"
                    >
                      {termId}
                    </text>
                  </g>
                );
              })}

              {/* 3D Routing Wires Connecting Embedded HICUM Components */}
              {showComponentWires &&
                EMBEDDED_3D_COMPONENTS.map((comp) => {
                  if (!enabledCategories[comp.category]) return null;
                  const proj = overlayProj.components[comp.id];
                  if (!proj || !proj.visible || proj.wirePoints.length < 2)
                    return null;
                  const isSel =
                    selectedElementId === comp.id ||
                    hoveredComponentId === comp.id ||
                    paramHighlightedComponentIds.has(comp.id);
                  const d = proj.wirePoints
                    .map(
                      (p, i) =>
                        `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
                    )
                    .join(' ');
                  return (
                    <path
                      key={`wire-${comp.id}`}
                      d={d}
                      fill="none"
                      stroke={isSel ? '#B85D43' : '#1E293B'}
                      strokeWidth={isSel ? 2.1 : 1.25}
                      strokeOpacity={isSel ? 0.95 : 0.72}
                    />
                  );
                })}

              {/* Internal & External HICUM Node Dots (E', B*, B', C', S', T) */}
              {EMBEDDED_3D_NODE_PINS.map((pin) => {
                if (!pin.label) return null;
                const pt = overlayProj.nodes[pin.id];
                if (!pt || !pt.visible) return null;
                return (
                  <g key={`pin-${pin.id}`}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pin.isExternalTerminal ? 4 : 3.2}
                      fill="#0F172A"
                      stroke="#FFFFFF"
                      strokeWidth={1.2}
                    />
                    {!pin.isExternalTerminal && showComponentLabels && (
                      <text
                        x={pt.x + 6}
                        y={pt.y - 4}
                        className="fill-slate-900 font-mono font-bold text-[10.5px]"
                        style={{
                          paintOrder: 'stroke',
                          stroke: '#FAF9F5',
                          strokeWidth: 3,
                        }}
                      >
                        {pin.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Selectable Embedded HICUM Circuit Symbols */}
              <g className="pointer-events-auto">
                {EMBEDDED_3D_COMPONENTS.map((comp) => {
                  if (!enabledCategories[comp.category]) return null;
                  const proj = overlayProj.components[comp.id];
                  if (!proj || !proj.visible) return null;
                  return (
                    <CircuitSymbolGlyph
                      key={comp.id}
                      cx={proj.x}
                      cy={proj.y}
                      symbolType={comp.symbolType}
                      orientation={comp.orientation}
                      label={comp.symbolLabel}
                      showLabel={showComponentLabels}
                      isSelected={activeEmbeddedComponent.id === comp.id}
                      isHovered={hoveredComponentId === comp.id}
                      isHighlighted={paramHighlightedComponentIds.has(comp.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectElementInLab(comp.id);
                        setSelectedRegionId(comp.hostRegionId);
                      }}
                      onMouseEnter={() => setHoveredComponentId(comp.id)}
                      onMouseLeave={() => setHoveredComponentId(null)}
                    />
                  );
                })}
              </g>
            </svg>
          )}

          {/* LEFT FLOATING ORIENTATION CUBE */}
          <div
            className="absolute top-3 left-3 z-20"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <OrientationCube3D
              theta={camAngles.theta}
              phi={camAngles.phi}
              activePreset={activeCameraPreset}
              onSelectPreset={handleSelectCameraPreset}
            />
          </div>

          {/* RIGHT FLOATING NAVIGATION & CAMERA TOOLBAR */}
          <div
            className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 bg-white border border-slate-200/90 rounded-xl p-1.5 shadow-xs"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setInteractionTool('orbit')}
              className={`p-2 rounded-lg transition-colors ${
                interactionTool === 'orbit'
                  ? 'bg-[#3B5978] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="360° Orbit Tool (Left-Drag)"
            >
              <Orbit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setInteractionTool('pan')}
              className={`p-2 rounded-lg transition-colors ${
                interactionTool === 'pan'
                  ? 'bg-[#3B5978] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Pan / Grab Tool (Drag to Reposition)"
            >
              <Hand className="w-4 h-4" />
            </button>
            <div className="h-px bg-slate-200 my-0.5" />
            <button
              onClick={() => {
                cameraStateRef.current.targetRadius = Math.max(
                  9.0,
                  cameraStateRef.current.targetRadius - 3.2
                );
              }}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                cameraStateRef.current.targetRadius = Math.min(
                  52.0,
                  cameraStateRef.current.targetRadius + 3.2
                );
              }}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFitToScreen}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Fit Complete Device to Screen"
            >
              <Focus className="w-4 h-4" />
            </button>
            <div className="h-px bg-slate-200 my-0.5" />
            <button
              onClick={handleResetAll}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Reset Assembly, Camera & Visibility"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* SELECTED REGION CONTEXTUAL BAR (TOP-CENTER) */}
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-xs text-xs"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span
              className="w-3 h-3 rounded-xs border border-slate-400 shrink-0"
              style={{ backgroundColor: activeRegion.colorHex }}
            />
            <span className="font-semibold text-slate-800">
              {activeRegion.shortLabel}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                activeRegion.spatialNature === 'localized'
                  ? 'bg-[#EDF6F4] text-[#2C6E63]'
                  : 'bg-[#EEF3F8] text-[#3B5978]'
              }`}
            >
              {activeRegion.spatialNature === 'localized'
                ? 'Localized'
                : 'Distributed'}
            </span>
            <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
            <button
              onClick={() => handleFocusOnRegion(activeRegion)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px]"
              title="Focus Camera on This Region (or Double-Click Region)"
            >
              Focus
            </button>
            <button
              onClick={() =>
                setIsolatedRegionId((prev) =>
                  prev === activeRegion.id ? null : activeRegion.id
                )
              }
              className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                isolatedRegionId === activeRegion.id
                  ? 'bg-[#3B5978] text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isolatedRegionId === activeRegion.id ? 'Un-Isolate' : 'Isolate'}
            </button>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span>α:</span>
              <input
                type="range"
                min={0.15}
                max={1}
                step={0.05}
                value={
                  regionOpacityMap[activeRegion.id] ??
                  activeRegion.defaultOpacity
                }
                onChange={(e) =>
                  setRegionOpacityMap((prev) => ({
                    ...prev,
                    [activeRegion.id]: parseFloat(e.target.value),
                  }))
                }
                className="w-14 accent-[#3B5978] cursor-pointer"
                title="Adjust Selected Region Opacity"
              />
            </div>
          </div>

          {/* HOVER IDENTIFICATION TOOLTIP */}
          {hoverLabelsEnabled && (hoveredComponentSpec || hoveredRegionSpec) && (
            <div
              style={{
                left: Math.min(mouseScreenPos.x + 16, 620),
                top: Math.max(mouseScreenPos.y - 16, 12),
              }}
              className="absolute z-30 pointer-events-none bg-white border border-slate-300 rounded-xl px-3 py-2 shadow-md max-w-xs text-xs space-y-0.5"
            >
              {hoveredComponentSpec ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#B85D43]">
                      {hoveredComponentSpec.symbolLabel}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {hoveredComponentSpec.spatialNature}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900">
                    {hoveredComponentSpec.name}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {hoveredComponentSpec.physicalOriginNote}
                  </p>
                </>
              ) : (
                hoveredRegionSpec && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">
                        {hoveredRegionSpec.shortLabel}
                      </span>
                      <span className="text-[10px] font-mono text-[#3B5978]">
                        {hoveredRegionSpec.materialName}
                      </span>
                    </div>
                    <div className="text-[10.5px] font-mono text-slate-500">
                      {hoveredRegionSpec.dopingSummary} ·{' '}
                      {hoveredRegionSpec.sentaurusCoordsUm}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {hoveredRegionSpec.physicalFunction}
                    </p>
                  </>
                )
              )}
            </div>
          )}

          {/* BOTTOM FLOATING ARTBOARD CONTROLS: EXPLODED VIEW, CUTAWAY PLANE & OPACITY */}
          <div
            className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 shadow-xs text-xs"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Exploded View Slider (0-100%) */}
            <div className="flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-[#3B5978]" />
              <span className="font-semibold text-slate-700">
                Exploded View:
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={explodePct}
                onChange={(e) => setExplodePct(parseInt(e.target.value, 10))}
                className="w-28 sm:w-36 accent-[#3B5978] cursor-pointer"
              />
              <span className="font-mono font-semibold text-slate-800 w-9 text-right">
                {explodePct}%
              </span>
            </div>

            {/* Cutaway Clipping Plane Control */}
            <div className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-[#2C6E63]" />
              <span className="font-semibold text-slate-700">Cutaway:</span>
              <select
                value={cutawayAxis}
                onChange={(e) => {
                  const axis = e.target.value as CutawayAxis;
                  setCutawayAxis(axis);
                  if (axis === 'z_cross') setCutawayPos(0.02);
                  else if (axis === 'x_half') setCutawayPos(0.0);
                  else if (axis === 'y_depth') setCutawayPos(0.05);
                }}
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="z_cross">Z Cross-Section</option>
                <option value="x_half">X Symmetry Slice</option>
                <option value="y_depth">Y Horizontal Slice</option>
                <option value="none">Full Uncut 3D</option>
              </select>
              {cutawayAxis !== 'none' && (
                <input
                  type="range"
                  min={-0.55}
                  max={0.55}
                  step={0.02}
                  value={cutawayPos}
                  onChange={(e) => setCutawayPos(parseFloat(e.target.value))}
                  className="w-20 accent-[#2C6E63] cursor-pointer"
                  title="Adjust Clipping Plane Position"
                />
              )}
            </div>

            {/* Global Model Opacity Slider */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Opacity:</span>
              <input
                type="range"
                min={0.2}
                max={1.0}
                step={0.04}
                value={globalOpacity}
                onChange={(e) => setGlobalOpacity(parseFloat(e.target.value))}
                className="w-20 accent-[#3B5978] cursor-pointer"
              />
              <span className="font-mono text-[11px] text-slate-600 w-9 text-right">
                {Math.round(globalOpacity * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* MATERIAL & EMBEDDED SYMBOL LEGEND BAR BELOW ARTBOARD */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-slate-500">
              Material (SiGe HBT):
            </span>
            {[
              {
                id: 'emitter_poly_pedestal',
                label: 'N⁺ (Emitter)',
                color: '#7FA3C7',
              },
              {
                id: 'intrinsic_sige_base',
                label: 'P (Base, SiGe)',
                color: '#DFAEA6',
              },
              {
                id: 'extrinsic_base_poly',
                label: 'P⁺ (Poly-Base)',
                color: '#C68B82',
              },
              {
                id: 'intrinsic_collector_sic',
                label: 'N (SIC Collector)',
                color: '#6E94B8',
              },
              {
                id: 'buried_subcollector',
                label: 'N⁺ (Buried & Sinker)',
                color: '#E5C48A',
              },
              {
                id: 'p_substrate_bulk',
                label: 'P⁻ (Substrate)',
                color: '#BDD2C5',
              },
              {
                id: 'contact_emitter',
                label: 'Contact / Metal',
                color: '#78808A',
              },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  const reg = SENTAURUS_3D_REGIONS.find((r) => r.id === item.id);
                  if (reg) {
                    setSelectedRegionId(reg.id);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${
                  selectedRegionId === item.id
                    ? 'bg-slate-100 font-semibold text-slate-900 ring-1 ring-slate-300'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-3.5 h-2.5 rounded-xs border border-slate-400/80"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHicumOverlay((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-[#F8F7F4] hover:bg-slate-100 text-slate-700 font-medium text-[11px]"
            >
              <span className="font-mono font-bold">o—o</span>
              <span>HICUM element (embedded)</span>
            </button>
            <button
              onClick={() => setBottomCardsExpanded((b) => !b)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-[11px]"
            >
              <span>{bottomCardsExpanded ? 'Collapse Details' : 'Expand Details'}</span>
              {bottomCardsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE 3-COLUMN SCIENTIFIC PUBLICATION CARDS BELOW ARTBOARD */}
      {bottomCardsExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Card 1 (Left 4 Cols): Synchronized HICUM Equivalent Circuit */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-sm font-bold text-slate-900 font-scientific">
                  Synchronized HICUM Circuit
                </h3>
                <span className="text-[10.5px] font-mono text-[#3B5978] bg-[#EEF3F8] px-2 py-0.5 rounded">
                  Active: {activeEmbeddedComponent.symbolLabel}
                </span>
              </div>

              {/* Clean Interactive Compact HICUM Schematic SVG */}
              <svg
                viewBox="0 0 380 235"
                className="w-full h-auto bg-[#FAF9F5] rounded-lg border border-slate-200/70 p-1 select-none"
              >
                {/* Dashed Intrinsic Transistor Box */}
                <rect
                  x={122}
                  y={42}
                  width={162}
                  height={138}
                  rx={6}
                  fill="none"
                  stroke="#64748B"
                  strokeWidth={1.1}
                  strokeDasharray="4 3"
                />
                <text
                  x={203}
                  y={36}
                  textAnchor="middle"
                  className="fill-slate-500 font-mono text-[8px] font-semibold"
                >
                  eff. internal transistor (B&apos;, E&apos;, C&apos;)
                </text>

                {/* Main Schematic Wires */}
                <g stroke="#334155" strokeWidth={1.3} fill="none">
                  {/* Collector C' top rail -> R_Cx -> C */}
                  <line x1={80} y1={56} x2={348} y2={56} />
                  {/* Base B -> R_Bx -> B* -> R_bi* -> B' */}
                  <line x1={26} y1={122} x2={185} y2={122} />
                  {/* Emitter E' bottom rail -> R_E -> E */}
                  <line x1={128} y1={168} x2={265} y2={168} />
                  <line x1={215} y1={168} x2={215} y2={218} />
                  {/* Substrate S' rail -> R_su || C_su -> S */}
                  <line x1={48} y1={18} x2={348} y2={18} />
                  {/* Vertical branches */}
                  <line x1={48} y1={18} x2={48} y2={56} />
                  <line x1={96} y1={18} x2={96} y2={122} />
                  <line x1={52} y1={56} x2={52} y2={122} />
                  <line x1={80} y1={56} x2={80} y2={122} />
                  <line x1={108} y1={56} x2={108} y2={168} />
                  <line x1={185} y1={56} x2={185} y2={168} />
                  <line x1={225} y1={56} x2={225} y2={168} />
                  <line x1={265} y1={56} x2={265} y2={168} />
                  {/* B-E par */}
                  <line x1={38} y1={122} x2={38} y2={205} />
                  <line x1={38} y1={205} x2={215} y2={205} />
                </g>

                {/* Clickable Schematic Elements synced with 3D Artboard */}
                {(
                  [
                    { id: 'cjs', label: 'Q_jS', x: 48, y: 37 },
                    { id: 'its', label: 'i_TS', x: 96, y: 37 },
                    { id: 'rsu', label: 'R_su||C_su', x: 210, y: 18 },
                    { id: 'cjcx1', label: 'Q_BCx1', x: 52, y: 88 },
                    { id: 'cjcx2', label: 'Q_BCx2', x: 80, y: 88 },
                    { id: 'rbx', label: 'R_Bx', x: 64, y: 122 },
                    { id: 'rbi', label: 'R_bi*||C_rBi', x: 146, y: 122 },
                    { id: 'cjep', label: 'Q_jEp', x: 108, y: 148 },
                    { id: 'cbepar1', label: 'C_BEpar', x: 112, y: 205 },
                    { id: 'cjci', label: 'Q_jCi', x: 185, y: 88 },
                    { id: 'iavl', label: 'i_AVL', x: 225, y: 88 },
                    { id: 'cjei', label: 'Q_jEi', x: 185, y: 146 },
                    { id: 'qf', label: 'Q_f', x: 225, y: 146 },
                    { id: 'it', label: 'i_T', x: 265, y: 112 },
                    { id: 'rcx', label: 'R_Cx', x: 312, y: 56 },
                    { id: 're', label: 'R_E', x: 215, y: 192 },
                  ] as { id: string; label: string; x: number; y: number }[]
                ).map((item) => {
                  const isSel = activeEmbeddedComponent.id === item.id;
                  const isParamMatch = paramHighlightedComponentIds.has(item.id);
                  return (
                    <g
                      key={item.id}
                      onClick={() => {
                        onSelectElementInLab(item.id);
                        const comp = EMBEDDED_3D_COMPONENTS.find(
                          (c) => c.id === item.id
                        );
                        if (comp) setSelectedRegionId(comp.hostRegionId);
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x={item.x - 20}
                        y={item.y - 8}
                        width={40}
                        height={16}
                        rx={3.5}
                        fill={
                          isSel
                            ? '#B85D43'
                            : isParamMatch
                            ? '#2C6E63'
                            : '#FFFFFF'
                        }
                        stroke={
                          isSel
                            ? '#B85D43'
                            : isParamMatch
                            ? '#2C6E63'
                            : '#64748B'
                        }
                        strokeWidth={isSel ? 1.6 : 1}
                      />
                      <text
                        x={item.x}
                        y={item.y + 3}
                        textAnchor="middle"
                        className={`font-mono font-bold text-[7.5px] ${
                          isSel || isParamMatch ? 'fill-white' : 'fill-slate-800'
                        }`}
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                })}

                {/* Terminal Labels */}
                <text x={14} y={125} className="fill-slate-900 font-bold text-[10px]">
                  B
                </text>
                <text x={100} y={116} className="fill-slate-700 font-mono font-bold text-[8.5px]">
                  B*
                </text>
                <text x={175} y={116} className="fill-slate-700 font-mono font-bold text-[8.5px]">
                  B&apos;
                </text>
                <text x={174} y={51} className="fill-slate-700 font-mono font-bold text-[8.5px]">
                  C&apos;
                </text>
                <text x={174} y={180} className="fill-slate-700 font-mono font-bold text-[8.5px]">
                  E&apos;
                </text>
                <text x={115} y={13} className="fill-slate-700 font-mono font-bold text-[8.5px]">
                  S&apos;
                </text>
                <text x={355} y={22} className="fill-slate-900 font-bold text-[10px]">
                  S
                </text>
                <text x={355} y={60} className="fill-slate-900 font-bold text-[10px]">
                  C
                </text>
                <text x={224} y={224} className="fill-slate-900 font-bold text-[10px]">
                  E
                </text>
              </svg>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Click any branch in 2D or 3D to synchronize</span>
              <span className="font-mono text-slate-700 font-semibold">
                I_C = {(opResult.Ic * 1e3).toFixed(2)} mA · f_T = {(opResult.Ft / 1e9).toFixed(1)} GHz
              </span>
            </div>
          </div>

          {/* Card 2 (Center 4 Cols): Documented Key Equation & Parameters */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-scientific">
                    Key Documented Equation
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {activeEquation.eqNumber} · {activeEquation.section}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#EDF6F4] text-[#2C6E63] border border-[#CBE4DF]">
                  {activeEmbeddedComponent.symbolLabel}
                </span>
              </div>

              {/* LaTeX Equation Box */}
              <div className="bg-[#FAF9F5] border border-slate-200/80 rounded-xl p-3 overflow-x-auto">
                <FormulaView latex={activeEquation.latex} displayMode={true} />
              </div>

              {/* Equation Title & Physical Meaning */}
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {activeEquation.title}
                </div>
                <p className="text-[11.5px] text-slate-600 leading-relaxed mt-0.5">
                  {activeEquation.summary}
                </p>
              </div>

              {/* Related HICUM Parameters for Selected Component / Region */}
              <div>
                <div className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                  Associated HICUM/L2 Parameters (Click to Inspect)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(activeCircuitElement?.parameters.length
                    ? activeCircuitElement.parameters
                    : activeRegion.keyParameters
                  )
                    .slice(0, 12)
                    .map((pId) => {
                      const isSel = selectedParamId === pId;
                      return (
                        <button
                          key={pId}
                          onClick={() => onSelectParamInLab(pId)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-medium border transition-colors ${
                            isSel
                              ? 'bg-[#3B5978] text-white border-[#3B5978]'
                              : 'bg-[#F8F7F4] text-slate-800 border-slate-200 hover:border-[#3B5978]'
                          }`}
                        >
                          <span>{pId}</span>
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Sources · Eq. ({activeEquation.eqNumber}) & {activeEmbeddedComponent.symbolLabel}
              </div>
              <CitationBadges
                compact
                manualCitation={
                  activeEquation.manualLines
                    ? `Eq. (${activeEquation.eqNumber}), ${activeEquation.manualLines}`
                    : undefined
                }
                manualPage={activeEquation.manualPage}
                vaCitation={activeEquation.vaReference}
              />
              <CitationBadges
                compact
                manualCitation={activeEmbeddedComponent.manualCitation}
                vaCitation={activeEmbeddedComponent.vaCitation}
                sentaurusCitation={activeEmbeddedComponent.sentaurusCitation}
              />
            </div>
          </div>

          {/* Card 3 (Right 4 Cols): Physical Mapping, Sentaurus TCAD Spec & Localization */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900 font-scientific">
                  Physical Mapping & Sentaurus Spec
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                    activeRegion.spatialNature === 'localized'
                      ? 'bg-[#EDF6F4] text-[#2C6E63] border-[#CBE4DF]'
                      : 'bg-[#EEF3F8] text-[#3B5978] border-[#D5E1EE]'
                  }`}
                >
                  {activeRegion.spatialNature === 'localized'
                    ? 'Localized 3D Volume'
                    : 'Distributed 2D/3D Region'}
                </span>
              </div>

              {/* Selected Region & Embedded Component Explanation */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-900">
                  {activeRegion.name}
                </div>
                <CitationBadges
                  compact
                  manualCitation={activeRegion.manualCitation}
                  vaCitation={activeRegion.vaCitation}
                  sentaurusCitation={activeRegion.sentaurusCitation}
                />
                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  {activeRegion.description}
                </p>
              </div>

              {/* Localized vs Distributed Distinction */}
              <div className="p-2.5 rounded-lg bg-[#FAF9F5] border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800">
                  <Compass className="w-3.5 h-3.5 text-[#2C6E63] shrink-0" />
                  <span>Localized vs. Distributed Physical Origin</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {activeRegion.localizedVsDistributedNote}
                </p>
              </div>

              {/* Authoritative Sentaurus TCAD Coordinates & Code */}
              <div className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[10.5px] space-y-1">
                <div className="flex items-center justify-between text-[#88C0D0] font-semibold">
                  <span>{activeRegion.sentaurusId}</span>
                  <span>{activeRegion.dopingSummary}</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Coords: {activeRegion.sentaurusCoordsUm}
                </div>
                <pre className="text-[9.5px] text-slate-300 overflow-x-auto whitespace-pre-wrap pt-1 border-t border-slate-800">
                  {activeRegion.sentaurusSdeSnippet}
                </pre>
              </div>

              {/* Non-Localized / Conceptual Parameter Distinction */}
              <div className="p-2.5 rounded-lg bg-[#F4EAE3]/60 border border-[#DFC8B8]/80">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#6E3B1F] mb-1">
                  <span className="inline-flex items-center gap-1">
                    <Info className="w-3 h-3 text-[#9A5833]" />
                    Conceptual / Global Parameters ({conceptualParams.length})
                  </span>
                  <span className="font-mono text-[9.5px]">No 3D Point Invented</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
                  {conceptualParams.slice(0, 14).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectParamInLab(p.id)}
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-[#EBDACD] text-[#552D17] border border-[#DFC8B8] font-mono text-[10px]"
                      title={`${p.id}: ${p.description} (Conceptual/global parameter)`}
                    >
                      {p.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interactive3DTransistorView;
