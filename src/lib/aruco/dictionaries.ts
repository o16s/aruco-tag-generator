import { DICT_DATA } from './dictData';

export type ArucoDictionaryName =
  | 'aruco'
  | '4x4_1000'
  | '5x5_1000'
  | '6x6_1000'
  | '7x7_1000'
  | 'mip_36h12'
  | 'april_16h5'
  | 'april_25h9'
  | 'april_36h10'
  | 'april_36h11';

export type ArucoDictionaryGroup = 'Standard dictionaries' | 'AprilTag';

export interface ArucoDictionary {
  name: ArucoDictionaryName;
  /** Human-readable label, identical to arucogen's select options. */
  label: string;
  group: ArucoDictionaryGroup;
  /** Marker width in bits (without the black border). */
  width: number;
  /** Marker height in bits (without the black border). */
  height: number;
  /** Number of markers in the dictionary. Valid ids are `0 .. count - 1`. */
  count: number;
}

interface DictionaryMeta {
  name: ArucoDictionaryName;
  label: string;
  group: ArucoDictionaryGroup;
  size: number;
}

const META: readonly DictionaryMeta[] = [
  { name: 'aruco', label: 'Original ArUco', group: 'Standard dictionaries', size: 5 },
  { name: '4x4_1000', label: '4x4 (50, 100, 250, 1000)', group: 'Standard dictionaries', size: 4 },
  { name: '5x5_1000', label: '5x5 (50, 100, 250, 1000)', group: 'Standard dictionaries', size: 5 },
  { name: '6x6_1000', label: '6x6 (50, 100, 250, 1000)', group: 'Standard dictionaries', size: 6 },
  { name: '7x7_1000', label: '7x7 (50, 100, 250, 1000)', group: 'Standard dictionaries', size: 7 },
  { name: 'mip_36h12', label: 'MIP_36h12 (250)', group: 'Standard dictionaries', size: 6 },
  { name: 'april_16h5', label: 'AprilTag 16h5 (30)', group: 'AprilTag', size: 4 },
  { name: 'april_25h9', label: 'AprilTag 25h9 (35)', group: 'AprilTag', size: 5 },
  { name: 'april_36h10', label: 'AprilTag 36h10 (2320)', group: 'AprilTag', size: 6 },
  { name: 'april_36h11', label: 'AprilTag 36h11 (587)', group: 'AprilTag', size: 6 },
];

/** All supported dictionaries, in the same order as arucogen's dictionary select. */
export const ARUCO_DICTIONARIES: readonly ArucoDictionary[] = META.map((meta) => ({
  name: meta.name,
  label: meta.label,
  group: meta.group,
  width: meta.size,
  height: meta.size,
  count: DICT_DATA[meta.name].length,
}));

export const ARUCO_DICTIONARY_GROUPS: readonly ArucoDictionaryGroup[] = [
  'Standard dictionaries',
  'AprilTag',
];

export const DEFAULT_DICTIONARY: ArucoDictionaryName = '4x4_1000';

const BY_NAME = new Map(ARUCO_DICTIONARIES.map((dictionary) => [dictionary.name, dictionary]));

export function isArucoDictionaryName(value: unknown): value is ArucoDictionaryName {
  return typeof value === 'string' && BY_NAME.has(value as ArucoDictionaryName);
}

export function getDictionary(name: ArucoDictionaryName): ArucoDictionary {
  const dictionary = BY_NAME.get(name);
  if (!dictionary) {
    throw new Error(`Unknown ArUco dictionary: ${String(name)}`);
  }
  return dictionary;
}

/** Clamp a marker id into the valid range of the dictionary. Non-finite ids become 0. */
export function clampMarkerId(name: ArucoDictionaryName, id: number): number {
  const { count } = getDictionary(name);
  if (!Number.isFinite(id)) {
    return 0;
  }
  return Math.min(Math.max(Math.trunc(id), 0), count - 1);
}

/** Packed marker bytes (MSB first, row-major). Throws a RangeError on an out-of-range id. */
export function getMarkerBytes(name: ArucoDictionaryName, id: number): readonly number[] {
  const { count } = getDictionary(name);
  if (!Number.isInteger(id) || id < 0 || id >= count) {
    throw new RangeError(`Marker id ${id} is out of range for ${name} (0..${count - 1})`);
  }
  return DICT_DATA[name][id];
}
