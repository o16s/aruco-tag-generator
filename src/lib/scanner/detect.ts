import type { ArucoDictionaryName } from '../aruco/dictionaries';
import { AR } from '../vendor/js-aruco2/aruco.js';
import type { Point2 } from './pose';
import { registerDictionary } from './dictionaries';

/** RGBA pixels, like `ImageData`. */
export interface DetectorImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface DetectedMarker {
  id: number;
  /** Clockwise in image pixels, starting at the marker's canonical top-left. */
  corners: Point2[];
  /** Bit errors corrected during identification. */
  hammingDistance: number;
}

export interface MarkerDetector {
  dictionary: ArucoDictionaryName;
  detect(image: DetectorImage): DetectedMarker[];
}

/** A detector for one dictionary. Uses the same marker bits that the generator prints. */
export function createDetector(dictionary: ArucoDictionaryName): MarkerDetector {
  registerDictionary(dictionary);
  const detector = new AR.Detector({ dictionaryName: dictionary });
  return {
    dictionary,
    detect: (image) =>
      detector.detect(image).map((marker) => ({
        id: marker.id,
        corners: marker.corners.map((c) => ({ x: c.x, y: c.y })),
        hammingDistance: marker.hammingDistance,
      })),
  };
}
