import type { ArucoDictionaryName } from '../aruco/dictionaries';
import { AR, type ARImage } from '../vendor/js-aruco2/aruco.js';
import type { Point2 } from './pose';
import { registerDictionaries } from './dictionaries';

export interface DetectedMarker {
  id: number;
  /** Clockwise in image pixels, starting at the marker's canonical top-left. */
  corners: Point2[];
  /** Bit errors corrected during identification. */
  hammingDistance: number;
}

export interface MarkerDetector {
  dictionary: ArucoDictionaryName;
  detect(image: ARImage): DetectedMarker[];
}

/** A detector for one dictionary. Uses the same marker bits that the generator prints. */
export function createDetector(dictionary: ArucoDictionaryName): MarkerDetector {
  registerDictionaries();
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
