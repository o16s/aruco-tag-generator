import type { ReactNode } from 'react';
import type { ArucoDictionaryName } from '../../lib/aruco/dictionaries';

export interface ArucoSheetGeneratorValue {
  dictionary: ArucoDictionaryName;
  from: number;
  to: number;
  /** A preset code from `LABEL_SHEET_PRESETS`, or `'custom'`. */
  sheet: string;
  /** Custom label size, used when `sheet === 'custom'`. */
  widthMm: number;
  heightMm: number;
  gapMm: number;
  cutLines: boolean;
}

export interface ArucoSheetGeneratorProps {
  defaultDictionary?: ArucoDictionaryName;
  /** First ID of the range. Default `0`. */
  defaultFrom?: number;
  /** Last ID of the range, inclusive. Default `20`. */
  defaultTo?: number;
  /** Preset code or `'custom'`. Default `'L7160'`. */
  defaultSheet?: string;
  onChange?: (value: ArucoSheetGeneratorValue) => void;
  className?: string;
  footer?: ReactNode;
}
