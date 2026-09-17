import type { DetectedMarker } from './detect';
import type { Point2 } from './pose';

export interface TrackedMarker extends DetectedMarker {
  /** True while the marker is held from its last detection instead of seen in this frame. */
  coasting: boolean;
}

export interface TrackerOptions {
  /** Consecutive detections before a marker is shown. Default 2. */
  enterHits?: number;
  /** How long a marker survives without a detection, ms. Default 200. */
  holdMs?: number;
  /** Corner smoothing weight of the new detection, 0..1. Default 0.6 (1 = no smoothing). */
  alpha?: number;
}

interface Track {
  marker: DetectedMarker;
  hits: number;
  lastSeen: number;
  seenNow: boolean;
}

/**
 * Hysteresis and smoothing over frame-by-frame detections (docs/spec.md §10.5):
 * a marker appears after `enterHits` consecutive hits, survives `holdMs` without one, and
 * its corners are exponentially smoothed so the gizmo does not shimmer.
 */
export function createTracker({ enterHits = 2, holdMs = 200, alpha = 0.6 }: TrackerOptions = {}) {
  const tracks = new Map<number, Track>();

  const smooth = (previous: Point2[], next: Point2[]): Point2[] =>
    next.map((p, i) => ({ x: alpha * p.x + (1 - alpha) * previous[i].x, y: alpha * p.y + (1 - alpha) * previous[i].y }));

  return {
    update(detections: readonly DetectedMarker[], now: number): TrackedMarker[] {
      for (const track of tracks.values()) {
        track.seenNow = false;
      }
      for (const detection of detections) {
        const track = tracks.get(detection.id);
        if (track) {
          track.marker = { ...detection, corners: smooth(track.marker.corners, detection.corners) };
          track.hits += 1;
        } else {
          tracks.set(detection.id, { marker: detection, hits: 1, lastSeen: now, seenNow: true });
          continue;
        }
        track.lastSeen = now;
        track.seenNow = true;
      }
      const visible: TrackedMarker[] = [];
      for (const [id, track] of tracks) {
        if (!track.seenNow && now - track.lastSeen >= holdMs) {
          tracks.delete(id);
          continue;
        }
        if (!track.seenNow && track.hits < enterHits) {
          tracks.delete(id); // a candidate that vanished before it was confirmed
          continue;
        }
        if (track.hits >= enterHits) {
          visible.push({ ...track.marker, coasting: !track.seenNow });
        }
      }
      return visible;
    },
    reset() {
      tracks.clear();
    },
  };
}

export type MarkerTracker = ReturnType<typeof createTracker>;
