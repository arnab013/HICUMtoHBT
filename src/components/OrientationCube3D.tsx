import React from 'react';

export type CameraPresetId =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'iso';

interface OrientationCube3DProps {
  /** Camera azimuth angle in radians (0 = +Z front) */
  theta: number;
  /** Camera polar angle from +Y up in radians (Math.PI/2 = horizontal) */
  phi: number;
  activePreset: CameraPresetId | null;
  onSelectPreset: (preset: CameraPresetId) => void;
}

interface CubeFaceSpec {
  id: CameraPresetId;
  label: string;
  normal: [number, number, number];
  corners: [number, number, number][];
  fill: string;
}

const C = 24; // Half-size of orientation cube in SVG units

const CUBE_FACES: CubeFaceSpec[] = [
  {
    id: 'front',
    label: 'FRONT',
    normal: [0, 0, 1],
    corners: [
      [-C, -C, C],
      [C, -C, C],
      [C, C, C],
      [-C, C, C],
    ],
    fill: '#F1F5F9',
  },
  {
    id: 'back',
    label: 'BACK',
    normal: [0, 0, -1],
    corners: [
      [C, -C, -C],
      [-C, -C, -C],
      [-C, C, -C],
      [C, C, -C],
    ],
    fill: '#E2E8F0',
  },
  {
    id: 'right',
    label: 'RIGHT',
    normal: [1, 0, 0],
    corners: [
      [C, -C, C],
      [C, -C, -C],
      [C, C, -C],
      [C, C, C],
    ],
    fill: '#E8EEF5',
  },
  {
    id: 'left',
    label: 'LEFT',
    normal: [-1, 0, 0],
    corners: [
      [-C, -C, -C],
      [-C, -C, C],
      [-C, C, C],
      [-C, C, -C],
    ],
    fill: '#E8EEF5',
  },
  {
    id: 'top',
    label: 'TOP',
    normal: [0, 1, 0],
    corners: [
      [-C, C, C],
      [C, C, C],
      [C, C, -C],
      [-C, C, -C],
    ],
    fill: '#F8FAFC',
  },
  {
    id: 'bottom',
    label: 'BTM',
    normal: [0, -1, 0],
    corners: [
      [-C, -C, -C],
      [C, -C, -C],
      [C, -C, C],
      [-C, -C, C],
    ],
    fill: '#CBD5E1',
  },
];

export const OrientationCube3D: React.FC<OrientationCube3DProps> = ({
  theta,
  phi,
  activePreset,
  onSelectPreset,
}) => {
  // Rotate a 3D point (x, y_up, z_front) into camera-aligned view space
  const projectCubePoint = (x: number, y: number, z: number) => {
    // Rotate by -theta around Y axis
    const cosT = Math.cos(-theta);
    const sinT = Math.sin(-theta);
    const x1 = x * cosT + z * sinT;
    const z1 = -x * sinT + z * cosT;
    const y1 = y;

    // Tilt by (Math.PI/2 - phi) around X axis
    const tilt = Math.PI / 2 - phi;
    const cosP = Math.cos(tilt);
    const sinP = Math.sin(tilt);
    const y2 = y1 * cosP - z1 * sinP;
    const z2 = y1 * sinP + z1 * cosP;

    const persp = 180 / Math.max(120, 180 - z2 * 0.35);
    return {
      sx: 50 + x1 * persp,
      sy: 50 - y2 * persp,
      depth: z2,
    };
  };

  // Sort cube faces by depth and filter front-facing ones
  const projectedFaces = CUBE_FACES.map((face) => {
    const pts = face.corners.map(([x, y, z]) => projectCubePoint(x, y, z));
    const avgDepth = pts.reduce((acc, p) => acc + p.depth, 0) / pts.length;
    const center = {
      sx: pts.reduce((acc, p) => acc + p.sx, 0) / pts.length,
      sy: pts.reduce((acc, p) => acc + p.sy, 0) / pts.length,
    };
    // 2D signed area to check if face is pointing toward viewer
    const dx1 = pts[1].sx - pts[0].sx;
    const dy1 = pts[1].sy - pts[0].sy;
    const dx2 = pts[2].sx - pts[0].sx;
    const dy2 = pts[2].sy - pts[0].sy;
    const crossZ = dx1 * dy2 - dy1 * dx2;
    return {
      ...face,
      pts,
      avgDepth,
      center,
      isVisible: crossZ < 0,
    };
  })
    .filter((f) => f.isVisible)
    .sort((a, b) => a.avgDepth - b.avgDepth);

  // Project XYZ axis stubs from bottom-left corner (-C, -C, C)
  const axOrigin = projectCubePoint(-C, -C, C);
  const axX = projectCubePoint(-C + 26, -C, C);
  const axY = projectCubePoint(-C, -C + 26, C);
  const axZ = projectCubePoint(-C, -C, C + 26);

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative bg-white/90 backdrop-blur-xs border border-slate-200/90 rounded-xl shadow-xs p-1.5">
        {/* Quick ISO Corner Button */}
        <button
          onClick={() => onSelectPreset('iso')}
          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-colors z-10 ${
            activePreset === 'iso'
              ? 'bg-[#3B5978] text-white border-[#3B5978]'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title="Rotate to Isometric 3D View"
        >
          ISO
        </button>

        <svg width={98} height={98} viewBox="0 0 100 100" className="overflow-visible">
          {/* Visible Cube Faces */}
          {projectedFaces.map((f) => {
            const ptsStr = f.pts.map((p) => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(' ');
            const isCurrent = activePreset === f.id;
            return (
              <g
                key={f.id}
                onClick={() => onSelectPreset(f.id)}
                className="cursor-pointer group"
              >
                <polygon
                  points={ptsStr}
                  fill={isCurrent ? '#DCE7F3' : f.fill}
                  stroke="#475569"
                  strokeWidth={1.25}
                  strokeLinejoin="round"
                  className="transition-colors group-hover:fill-[#E2ECF7]"
                />
                <text
                  x={f.center.sx}
                  y={f.center.sy + 3}
                  textAnchor="middle"
                  className="fill-slate-700 font-mono font-bold text-[8.5px] pointer-events-none select-none"
                >
                  {f.label}
                </text>
              </g>
            );
          })}

          {/* XYZ Orientation Axes */}
          <g className="pointer-events-none">
            <line
              x1={axOrigin.sx}
              y1={axOrigin.sy}
              x2={axX.sx}
              y2={axX.sy}
              stroke="#B85D43"
              strokeWidth={2}
            />
            <text
              x={axX.sx + 4}
              y={axX.sy + 3}
              className="fill-[#B85D43] font-mono font-bold text-[8px]"
            >
              X
            </text>

            <line
              x1={axOrigin.sx}
              y1={axOrigin.sy}
              x2={axY.sx}
              y2={axY.sy}
              stroke="#2C6E63"
              strokeWidth={2}
            />
            <text
              x={axY.sx}
              y={axY.sy - 3}
              textAnchor="middle"
              className="fill-[#2C6E63] font-mono font-bold text-[8px]"
            >
              Y
            </text>

            <line
              x1={axOrigin.sx}
              y1={axOrigin.sy}
              x2={axZ.sx}
              y2={axZ.sy}
              stroke="#3B5978"
              strokeWidth={2}
            />
            <text
              x={axZ.sx - 4}
              y={axZ.sy + 4}
              className="fill-[#3B5978] font-mono font-bold text-[8px]"
            >
              Z
            </text>
          </g>
        </svg>

        {/* Compact 6-Face Preset Strip Below Cube */}
        <div className="grid grid-cols-3 gap-0.5 pt-1 border-t border-slate-100">
          {(
            [
              { id: 'front', label: 'Front' },
              { id: 'right', label: 'Right' },
              { id: 'top', label: 'Top' },
              { id: 'back', label: 'Back' },
              { id: 'left', label: 'Left' },
              { id: 'bottom', label: 'Btm' },
            ] as { id: CameraPresetId; label: string }[]
          ).map((btn) => (
            <button
              key={btn.id}
              onClick={() => onSelectPreset(btn.id)}
              className={`px-1 py-0.5 rounded text-[9px] font-medium transition-colors ${
                activePreset === btn.id
                  ? 'bg-[#3B5978] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default OrientationCube3D;
