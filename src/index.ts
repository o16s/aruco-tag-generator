export { ArucoMarker } from './components/ArucoMarker';
export type { ArucoMarkerProps } from './components/ArucoMarker';
export { ArucoGenerator, printMarker, MIN_SIZE_MM, MAX_SIZE_MM } from './components/ArucoGenerator';
export type { ArucoGeneratorProps, ArucoGeneratorValue } from './components/ArucoGenerator';
export {
  ARUCO_DICTIONARIES,
  ARUCO_DICTIONARY_GROUPS,
  DEFAULT_DICTIONARY,
  clampMarkerId,
  getDictionary,
  getMarkerBytes,
  isArucoDictionaryName,
} from './lib/aruco/dictionaries';
export type {
  ArucoDictionary,
  ArucoDictionaryGroup,
  ArucoDictionaryName,
} from './lib/aruco/dictionaries';
export {
  decodeMarkerBits,
  markerFileName,
  markerGeometry,
  markerRects,
  markerSvgDataUri,
  markerSvgString,
} from './lib/aruco/marker';
export type { MarkerGeometry, MarkerRect, MarkerSvgOptions } from './lib/aruco/marker';
