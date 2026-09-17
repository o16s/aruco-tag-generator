import type { ReactNode } from 'react';
import type { ArucoDictionaryName } from '../../lib/aruco/dictionaries';

export interface ArucoGeneratorValue {
  dictionary: ArucoDictionaryName;
  id: number;
  sizeMm: number;
}

export interface ArucoGeneratorProps {
  /** Initial dictionary. Default `'4x4_1000'`, same as arucogen. */
  defaultDictionary?: ArucoDictionaryName;
  /** Initial marker id. Default `0`. */
  defaultId?: number;
  /** Initial marker size in millimetres. Default `100`. */
  defaultSizeMm?: number;
  /** Called after the user changes dictionary, id or size. */
  onChange?: (value: ArucoGeneratorValue) => void;
  /** Overlap neighbouring white cells to avoid seams in PDF/print output. Default `true`. */
  fixPdfArtifacts?: boolean;
  className?: string;
  /** Optional content rendered below the tools row (e.g. attribution). */
  footer?: ReactNode;
}
