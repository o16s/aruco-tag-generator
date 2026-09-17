import { describe, expect, it } from 'vitest';
import type { DetectedMarker } from './detect';
import { createTracker } from './track';

const square = (id: number, x = 100): DetectedMarker => ({
  id,
  hammingDistance: 0,
  corners: [
    { x, y: 100 },
    { x: x + 50, y: 100 },
    { x: x + 50, y: 150 },
    { x, y: 150 },
  ],
});

describe('createTracker', () => {
  it('shows a marker only after two consecutive hits', () => {
    const tracker = createTracker();
    expect(tracker.update([square(7)], 0)).toEqual([]);
    const shown = tracker.update([square(7)], 33);
    expect(shown.map((m) => [m.id, m.coasting])).toEqual([[7, false]]);
  });

  it('drops a one-frame false positive without ever showing it', () => {
    const tracker = createTracker();
    tracker.update([square(9)], 0);
    expect(tracker.update([], 33)).toEqual([]);
    expect(tracker.update([square(9)], 66)).toEqual([]); // starts over: one hit again
  });

  it('holds a confirmed marker through short gaps and drops it after holdMs', () => {
    const tracker = createTracker({ holdMs: 200 });
    tracker.update([square(3)], 0);
    tracker.update([square(3)], 33);
    const coasting = tracker.update([], 100);
    expect(coasting.map((m) => [m.id, m.coasting])).toEqual([[3, true]]);
    expect(tracker.update([], 233)).toEqual([]); // 200 ms since the last hit at 33
  });

  it('smooths corners towards new detections', () => {
    const tracker = createTracker({ alpha: 0.5 });
    tracker.update([square(1, 100)], 0);
    const [m] = tracker.update([square(1, 120)], 33);
    expect(m.corners[0].x).toBeCloseTo(110, 6);
    const [m2] = tracker.update([square(1, 120)], 66);
    expect(m2.corners[0].x).toBeCloseTo(115, 6);
  });

  it('keeps ids independent', () => {
    const tracker = createTracker();
    tracker.update([square(1), square(2, 300)], 0);
    const shown = tracker.update([square(1)], 33);
    expect(shown.map((m) => m.id)).toEqual([1]); // 2 had one hit only and vanished
  });
});
