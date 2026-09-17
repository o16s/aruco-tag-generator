import { DICT_DATA } from '../aruco/dictData';
import { ARUCO_DICTIONARIES, type ArucoDictionaryName } from '../aruco/dictionaries';
import { decodeMarkerBits } from '../aruco/marker';
import { AR } from '../vendor/js-aruco2/aruco.js';

/**
 * Accepted Hamming distance is `< tau`. Like OpenCV, correct up to 60 % of the unique-decoding
 * radius `floor((d - 1) / 2)` of each dictionary, where `d` is its minimum inter-code distance.
 * Computed once per dictionary on first use.
 */
const tauFor = (minDistance: number): number => Math.floor(0.6 * Math.floor((minDistance - 1) / 2)) + 1;

function minHammingDistance(name: ArucoDictionaryName, width: number, height: number): number {
  const codes = DICT_DATA[name].map((bytes) => decodeMarkerBits(bytes, width, height));
  let min = Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < codes.length; i++) {
    for (let j = i + 1; j < codes.length; j++) {
      let distance = 0;
      const a = codes[i];
      const b = codes[j];
      for (let k = 0; k < a.length && distance < min; k++) {
        if (a[k] !== b[k]) {
          distance++;
        }
      }
      if (distance < min) {
        min = distance;
      }
    }
  }
  return min;
}

let registered = false;

/** Register every generator dictionary with the vendored detector, under the same names. */
export function registerDictionaries(): void {
  if (registered) {
    return;
  }
  for (const { name, width, height } of ARUCO_DICTIONARIES) {
    AR.DICTIONARIES[name] = {
      nBits: width * height,
      tau: tauFor(minHammingDistance(name, width, height)),
      codeList: DICT_DATA[name],
    };
  }
  registered = true;
}
