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

export type ArucoDictionaryGroup = 'Standard' | 'AprilTag';

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

const STD = 'Standard';
const APRIL = 'AprilTag';

const dictionary = (
  name: ArucoDictionaryName,
  label: string,
  group: ArucoDictionaryGroup,
  size: number,
): ArucoDictionary => ({ name, label, group, width: size, height: size, count: DICT_DATA[name].length });

/** All supported dictionaries, in the same order as arucogen's dictionary select. */
export const ARUCO_DICTIONARIES: readonly ArucoDictionary[] = [
  dictionary('aruco', 'Original ArUco', STD, 5),
  dictionary('4x4_1000', '4x4 (50, 100, 250, 1000)', STD, 4),
  dictionary('5x5_1000', '5x5 (50, 100, 250, 1000)', STD, 5),
  dictionary('6x6_1000', '6x6 (50, 100, 250, 1000)', STD, 6),
  dictionary('7x7_1000', '7x7 (50, 100, 250, 1000)', STD, 7),
  dictionary('mip_36h12', 'MIP_36h12 (250)', STD, 6),
  dictionary('april_16h5', 'AprilTag 16h5 (30)', APRIL, 4),
  dictionary('april_25h9', 'AprilTag 25h9 (35)', APRIL, 5),
  dictionary('april_36h10', 'AprilTag 36h10 (2320)', APRIL, 6),
  dictionary('april_36h11', 'AprilTag 36h11 (587)', APRIL, 6),
];

export const ARUCO_DICTIONARY_GROUPS: readonly ArucoDictionaryGroup[] = [STD, APRIL];

export const DEFAULT_DICTIONARY: ArucoDictionaryName = '4x4_1000';

const BY_NAME = new Map(ARUCO_DICTIONARIES.map((dictionary) => [dictionary.name, dictionary]));

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
