import type { CSSProperties } from 'react';
import type { ArucoDictionaryName } from '../../lib/aruco/dictionaries';

export interface ArucoMarkerProps {
  /** Dictionary the marker belongs to. */
  dictionary: ArucoDictionaryName;
  /** Marker id, `0 .. count - 1`. Out-of-range ids are clamped. */
  id: number;
  /**
   * Physical size in millimetres, emitted as the SVG `width`/`height` attributes.
   * Omit to let the SVG scale to its container.
   */
  sizeMm?: number;
  /** Overlap neighbouring white cells to avoid seams in PDF/print output. Default `true`. */
  fixPdfArtifacts?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Accessible name. Defaults to `"<dictionary> marker <id>"`. */
  title?: string;
}
