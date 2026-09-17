import { describe, expect, it } from 'vitest';
import {
  AXIS_CONVENTIONS,
  estimatePose,
  focalFromFov,
  getConvention,
  gizmoSegments,
  mulMat,
  mulVec,
  projectPoint,
  type Intrinsics,
  type Mat3,
  type Vec3,
} from './pose';

const deg = (d: number) => (d * Math.PI) / 180;
const rotX = (a: number): Mat3 => [
  [1, 0, 0],
  [0, Math.cos(a), -Math.sin(a)],
  [0, Math.sin(a), Math.cos(a)],
];
const rotY = (a: number): Mat3 => [
  [Math.cos(a), 0, Math.sin(a)],
  [0, 1, 0],
  [-Math.sin(a), 0, Math.cos(a)],
];
/** Marker facing the camera: marker x right, y up, z towards the camera, in the OpenCV camera frame. */
const FRONTAL: Mat3 = [
  [1, 0, 0],
  [0, -1, 0],
  [0, 0, -1],
];
const intrinsics: Intrinsics = { width: 1280, height: 720, focal: 800 };
const SIZE = 100;
const objectCorners: Vec3[] = [
  [-SIZE / 2, SIZE / 2, 0],
  [SIZE / 2, SIZE / 2, 0],
  [SIZE / 2, -SIZE / 2, 0],
  [-SIZE / 2, -SIZE / 2, 0],
];

const synthesize = (rotation: Mat3, translation: Vec3) =>
  objectCorners.map((p) => {
    const c = mulVec(rotation, p);
    return projectPoint([c[0] + translation[0], c[1] + translation[1], c[2] + translation[2]], intrinsics);
  });

const expectClose = (actual: readonly number[], expected: readonly number[], tol: number) => {
  actual.forEach((v, i) => expect(Math.abs(v - expected[i])).toBeLessThan(tol));
};

describe('estimatePose', () => {
  it.each([
    ['frontal', FRONTAL, [0, 0, 500] as Vec3],
    ['tilted about X', mulMat(FRONTAL, rotX(deg(35))), [30, -20, 500] as Vec3],
    ['tilted about Y', mulMat(FRONTAL, rotY(deg(-20))), [30, -20, 500] as Vec3],
    ['both, farther', mulMat(mulMat(FRONTAL, rotX(deg(20))), rotY(deg(30))), [-80, 40, 900] as Vec3],
  ])('recovers a known pose (%s) in the OpenCV frame', (_name, rotation, translation) => {
    const pose = estimatePose(synthesize(rotation, translation), intrinsics, SIZE);
    expectClose(pose.rotation.flat(), rotation.flat(), 0.02);
    expectClose(pose.translation, translation, 2);
    expect(pose.errorPx).toBeLessThan(1);
  });

  it('points the OpenCV Z axis at the camera for a frontal marker', () => {
    const pose = estimatePose(synthesize(FRONTAL, [0, 0, 500]), intrinsics, SIZE);
    const z = mulVec(pose.rotation, [0, 0, 1]);
    expect(z[2]).toBeLessThan(-0.99); // camera z is forward, so towards the camera is negative
  });
});

describe('conventions and gizmo', () => {
  const pose = estimatePose(synthesize(FRONTAL, [0, 0, 500]), intrinsics, SIZE);

  it('draws OpenCV axes right, up and towards the viewer', () => {
    const [x, y, z] = gizmoSegments(pose, getConvention('opencv'), 50, intrinsics);
    expect(x.to.x).toBeGreaterThan(x.from.x + 50);
    expect(Math.abs(x.to.y - x.from.y)).toBeLessThan(1);
    expect(y.to.y).toBeLessThan(y.from.y - 50); // screen y grows downwards
    expect(Math.abs(z.to.x - z.from.x)).toBeLessThan(1); // straight at the camera: projects onto the origin
    expect(Math.abs(z.to.y - z.from.y)).toBeLessThan(1);
    expect(x.color).toBe('#e11d48');
    expect(y.color).toBe('#16a34a');
    expect(z.color).toBe('#2563eb');
  });

  it('flips Y and Z for the AprilTag convention', () => {
    const [xa, ya] = gizmoSegments(pose, getConvention('apriltag'), 50, intrinsics);
    const [xo, yo] = gizmoSegments(pose, getConvention('opencv'), 50, intrinsics);
    expect(xa.to.x).toBeCloseTo(xo.to.x, 3);
    expect(ya.to.y - ya.from.y).toBeCloseTo(-(yo.to.y - yo.from.y), 3);
    const zIntoMarker = mulVec(mulMat(pose.rotation, getConvention('apriltag').rotation), [0, 0, 1]);
    expect(zIntoMarker[2]).toBeGreaterThan(0.99);
  });

  it('lists every convention with a right-handed rotation', () => {
    for (const convention of AXIS_CONVENTIONS) {
      const [a, b, c] = convention.rotation;
      const det =
        a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
      expect(det).toBeCloseTo(1, 9);
    }
    expect(() => getConvention('nope')).toThrow();
  });

  it('derives the focal length from the horizontal field of view', () => {
    expect(focalFromFov(1280, 90)).toBeCloseTo(640, 6);
    expect(focalFromFov(1280, 60)).toBeCloseTo(1108.5, 0);
  });
});
