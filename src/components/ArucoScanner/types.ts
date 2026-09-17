import type { ArucoDictionaryName } from '../../lib/aruco/dictionaries';
import type { TrackedMarker } from '../../lib/scanner/track';
import type { MarkerPose } from '../../lib/scanner/pose';

export interface ScannedMarker extends TrackedMarker {
  dictionary: ArucoDictionaryName;
  pose: MarkerPose;
  /** Distance from the camera to the marker centre in millimetres (pinhole estimate). */
  distanceMm: number;
  /** Marker edge length in pixels of the downscaled frame the detector processed. */
  edgePx: number;
}

/** An element the scanner reads frames from instead of the camera (stories, tests). */
export type ScannerSource = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

export interface ArucoScannerProps {
  defaultDictionary?: ArucoDictionaryName;
  /** Axis convention id from `AXIS_CONVENTIONS`. Default `'opencv'`. */
  defaultConvention?: string;
  /** Printed marker side in millimetres, used to estimate distance. Default `100`. */
  defaultMarkerSizeMm?: number;
  /** Horizontal field of view of the camera in degrees. Default `60`. */
  defaultHorizontalFovDeg?: number;
  /** Tracker: consecutive detections before a marker is shown. Default 2. */
  enterHits?: number;
  /** Tracker: how long a marker is held after its last detection, ms. Default 200. */
  holdMs?: number;
  /** Tracker: corner smoothing weight of the new detection, 0..1 (1 = none). Default 0.6. */
  alpha?: number;
  /** Read frames from this element instead of the camera. */
  source?: ScannerSource;
  /** Called once per processed frame with the markers found. */
  onDetect?: (markers: ScannedMarker[]) => void;
  className?: string;
}
