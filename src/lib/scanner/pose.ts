import { POS } from '../vendor/js-aruco2/posit.js';

export type Vec3 = [number, number, number];
export type Mat3 = [Vec3, Vec3, Vec3];

export interface Point2 {
  x: number;
  y: number;
}

/** Pinhole camera: principal point at the image centre, no distortion. */
export interface Intrinsics {
  width: number;
  height: number;
  /** Focal length in pixels. */
  focal: number;
}

/**
 * Marker pose in the OpenCV camera frame (x right, y down, z forward).
 * `rotation` maps marker-frame vectors (OpenCV ArUco: x right, y up, z out of the marker
 * towards the camera) into the camera frame. `translation` is the marker centre in mm.
 */
export interface MarkerPose {
  rotation: Mat3;
  translation: Vec3;
  /** Mean reprojection error of the corners in pixels. */
  errorPx: number;
}

export interface AxisConvention {
  id: string;
  label: string;
  description: string;
  /** Rotation from this convention's marker frame to the OpenCV ArUco marker frame. */
  rotation: Mat3;
}

const IDENTITY: Mat3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/** Colours are the universal RGB = XYZ mapping. */
export const AXIS_COLORS = { x: '#e11d48', y: '#16a34a', z: '#2563eb' } as const;

export const AXIS_CONVENTIONS: readonly AxisConvention[] = [
  {
    id: 'opencv',
    label: 'OpenCV ArUco',
    description: 'X right, Y up, Z out of the marker towards the camera. Also the original ArUco library.',
    rotation: IDENTITY,
  },
  {
    id: 'apriltag',
    label: 'AprilTag',
    description: 'X right, Y down, Z into the marker, away from the camera (apriltag C library, apriltag_ros).',
    rotation: [
      [1, 0, 0],
      [0, -1, 0],
      [0, 0, -1],
    ],
  },
];

export const DEFAULT_CONVENTION = 'opencv';

export function getConvention(id: string): AxisConvention {
  const found = AXIS_CONVENTIONS.find((entry) => entry.id === id);
  if (!found) {
    throw new Error(`Unknown axis convention: ${id}`);
  }
  return found;
}

/** Focal length in pixels for a horizontal field of view in degrees. */
export function focalFromFov(widthPx: number, horizontalFovDeg: number): number {
  return widthPx / 2 / Math.tan((horizontalFovDeg * Math.PI) / 360);
}

export const mulVec = (m: Mat3, v: Vec3): Vec3 => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];

export const mulMat = (a: Mat3, b: Mat3): Mat3 =>
  a.map((row) => [0, 1, 2].map((j) => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j])) as Mat3;

// POSIT works in a camera frame with y up (image y flipped) and its marker z points the other
// way, so: R_cv = diag(1,-1,1) · R_posit · diag(1,1,-1) and t_cv = diag(1,-1,1) · t_posit.
// Pinned by src/lib/scanner/pose.test.ts against synthetic projections.
const FLIP_Y: Mat3 = [
  [1, 0, 0],
  [0, -1, 0],
  [0, 0, 1],
];
const FLIP_Z: Mat3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, -1],
];

/**
 * Estimate the pose of a square marker from its four image corners (clockwise from the
 * canonical top-left, as returned by the detector). `markerSizeMm` is the printed marker
 * side including the black border.
 */
export function estimatePose(corners: readonly Point2[], intrinsics: Intrinsics, markerSizeMm: number): MarkerPose {
  const { width, height, focal } = intrinsics;
  const centred = corners.map((c) => ({ x: c.x - width / 2, y: height / 2 - c.y }));
  const pose = new POS.Posit(markerSizeMm, focal).pose(centred);
  const rotation = mulMat(mulMat(FLIP_Y, pose.bestRotation as Mat3), FLIP_Z);
  const t = pose.bestTranslation;
  const error = pose.bestError;
  return { rotation, translation: [t[0], -t[1], t[2]], errorPx: typeof error === 'number' ? error : error.pixels };
}

/** Project a camera-frame point (mm) to image pixels. */
export function projectPoint(point: Vec3, intrinsics: Intrinsics): Point2 {
  const z = Math.max(point[2], 1e-6);
  return {
    x: (intrinsics.focal * point[0]) / z + intrinsics.width / 2,
    y: (intrinsics.focal * point[1]) / z + intrinsics.height / 2,
  };
}

export interface GizmoSegment {
  axis: 'x' | 'y' | 'z';
  color: string;
  from: Point2;
  to: Point2;
}

/** Screen-space arrows for the marker's X, Y and Z axes in the chosen convention. */
export function gizmoSegments(
  pose: MarkerPose,
  convention: AxisConvention,
  lengthMm: number,
  intrinsics: Intrinsics,
): GizmoSegment[] {
  const toCamera = (markerPoint: Vec3): Vec3 => {
    const opencv = mulVec(convention.rotation, markerPoint);
    const cam = mulVec(pose.rotation, opencv);
    return [cam[0] + pose.translation[0], cam[1] + pose.translation[1], cam[2] + pose.translation[2]];
  };
  const origin = projectPoint(toCamera([0, 0, 0]), intrinsics);
  const axes: { axis: 'x' | 'y' | 'z'; unit: Vec3 }[] = [
    { axis: 'x', unit: [lengthMm, 0, 0] },
    { axis: 'y', unit: [0, lengthMm, 0] },
    { axis: 'z', unit: [0, 0, lengthMm] },
  ];
  return axes.map(({ axis, unit }) => ({
    axis,
    color: AXIS_COLORS[axis],
    from: origin,
    to: projectPoint(toCamera(unit), intrinsics),
  }));
}
