import type { ArucoDictionaryName } from '../../lib/aruco/dictionaries';
import type { DetectedMarker } from '../../lib/scanner/detect';
import type { MarkerPose } from '../../lib/scanner/pose';

export interface ScannedMarker extends DetectedMarker {
  dictionary: ArucoDictionaryName;
  pose: MarkerPose;
  /** Distance from the camera to the marker centre in millimetres (pinhole estimate). */
  distanceMm: number;
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
  /** Read frames from this element instead of the camera. */
  source?: ScannerSource;
  /** Called once per processed frame with the markers found. */
  onDetect?: (markers: ScannedMarker[]) => void;
  className?: string;
}
