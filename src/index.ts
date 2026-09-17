export { ArucoMarker } from './components/ArucoMarker';
export type { ArucoMarkerProps } from './components/ArucoMarker';
export { ArucoLabel } from './components/ArucoLabel';
export type { ArucoLabelProps } from './components/ArucoLabel';
export { ArucoLabelSheet } from './components/ArucoLabelSheet';
export type { ArucoLabelSheetProps } from './components/ArucoLabelSheet';
export { ArucoGenerator } from './components/ArucoGenerator';
export type { ArucoGeneratorProps, ArucoGeneratorValue } from './components/ArucoGenerator';
export { ArucoSheetGenerator } from './components/ArucoSheetGenerator';
export type { ArucoSheetGeneratorProps, ArucoSheetGeneratorValue } from './components/ArucoSheetGenerator';
export { ArucoScanner } from './components/ArucoScanner';
export type { ArucoScannerProps, ScannedMarker, ScannerSource } from './components/ArucoScanner';
export { printArea } from './lib/print';
export {
  ARUCO_DICTIONARIES,
  DEFAULT_DICTIONARY,
  clampMarkerId,
  getDictionary,
  getMarkerBytes,
} from './lib/aruco/dictionaries';
export type { ArucoDictionary, ArucoDictionaryGroup, ArucoDictionaryName } from './lib/aruco/dictionaries';
export {
  decodeMarkerBits,
  markerFileName,
  markerGeometry,
  markerRects,
  markerSvgDataUri,
  markerSvgString,
} from './lib/aruco/marker';
export type { MarkerRect, MarkerSvgOptions } from './lib/aruco/marker';
export {
  A4,
  DEFAULT_PRESET,
  LABEL_SHEET_PRESETS,
  getPreset,
  labelOrigin,
  layoutLabel,
  layoutSheet,
  markerModules,
  MAX_PAGES,
  sheetPages,
} from './lib/aruco/label';
export type { CustomSheet, LabelLayout, LabelSheetPreset, SheetGeometry } from './lib/aruco/label';
export { createDetector } from './lib/scanner/detect';
export type { DetectedMarker, MarkerDetector } from './lib/scanner/detect';
export {
  AXIS_COLORS,
  AXIS_CONVENTIONS,
  DEFAULT_CONVENTION,
  estimatePose,
  focalFromFov,
  getConvention,
  gizmoSegments,
  projectPoint,
} from './lib/scanner/pose';
export type { AxisConvention, GizmoSegment, Intrinsics, MarkerPose, Point2 } from './lib/scanner/pose';
