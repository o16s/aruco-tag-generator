import { describe, expect, it } from 'vitest';
import { DICT_DATA } from './dictData';
import {
  ARUCO_DICTIONARIES,
  clampMarkerId,
  getDictionary,
  getMarkerBytes,
} from './dictionaries';

// Counts as declared by arucogen's index.html (`data-number`, default 1000).
const EXPECTED_COUNTS = {
  aruco: 1024,
  '4x4_1000': 1000,
  '5x5_1000': 1000,
  '6x6_1000': 1000,
  '7x7_1000': 1000,
  mip_36h12: 250,
  april_16h5: 30,
  april_25h9: 35,
  april_36h10: 2320,
  april_36h11: 587,
} as const;

describe('ARUCO_DICTIONARIES', () => {
  it('matches arucogen dictionary sizes and counts', () => {
    expect(ARUCO_DICTIONARIES.map((d) => d.name)).toEqual(Object.keys(EXPECTED_COUNTS));
    for (const dictionary of ARUCO_DICTIONARIES) {
      expect(dictionary.count).toBe(EXPECTED_COUNTS[dictionary.name]);
      expect(dictionary.width).toBe(dictionary.height);
    }
  });

  it('has the right number of bytes for every marker', () => {
    for (const dictionary of ARUCO_DICTIONARIES) {
      const expectedBytes = Math.ceil((dictionary.width * dictionary.height) / 8);
      for (const marker of DICT_DATA[dictionary.name]) {
        expect(marker).toHaveLength(expectedBytes);
      }
    }
  });
});

describe('lookups', () => {
  it('getDictionary throws on unknown names', () => {
    expect(getDictionary('april_16h5').count).toBe(30);
    // @ts-expect-error intentional invalid name
    expect(() => getDictionary('nope')).toThrow(/Unknown ArUco dictionary/);
  });

  it('getMarkerBytes returns arucogen bytes and range-checks ids', () => {
    expect(getMarkerBytes('4x4_1000', 0)).toEqual([181, 50]);
    expect(() => getMarkerBytes('april_16h5', 30)).toThrow(RangeError);
    expect(() => getMarkerBytes('april_16h5', -1)).toThrow(RangeError);
    expect(() => getMarkerBytes('april_16h5', 1.5)).toThrow(RangeError);
  });

  it('clampMarkerId clamps into range', () => {
    expect(clampMarkerId('april_16h5', 999)).toBe(29);
    expect(clampMarkerId('april_16h5', -5)).toBe(0);
    expect(clampMarkerId('april_16h5', 12.9)).toBe(12);
    expect(clampMarkerId('april_16h5', Number.NaN)).toBe(0);
  });
});
