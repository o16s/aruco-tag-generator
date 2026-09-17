import type { SVGProps } from 'react';
import type { ArucoDictionaryName } from '../../lib/aruco/dictionaries';

export interface ArucoMarkerProps extends Omit<SVGProps<SVGSVGElement>, 'id' | 'viewBox'> {
  /** Dictionary the marker belongs to. */
  dictionary: ArucoDictionaryName;
  /** Marker id, `0 .. count - 1`. Out-of-range ids are clamped. */
  id: number;
  /**
   * Physical size in millimetres, emitted as the SVG `width`/`height` attributes.
   * Omit to let the SVG scale to its container. Explicit `width`/`height` props win.
   */
  sizeMm?: number;
  /** Overlap neighbouring white cells to avoid seams in PDF/print output. Default `true`. */
  fixPdfArtifacts?: boolean;
  /** Accessible name. Defaults to `"<dictionary> marker <id>"`. */
  title?: string;
}
