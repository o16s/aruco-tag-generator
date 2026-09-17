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
