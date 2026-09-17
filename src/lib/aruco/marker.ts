import { getDictionary, getMarkerBytes, type ArucoDictionaryName } from './dictionaries';

export interface MarkerRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MarkerSvgOptions {
  /**
   * Overlap adjacent white cells by half a unit so PDF viewers and printers do not draw
   * hairline seams between them. Same behaviour as arucogen. Default `true`.
   */
  fixPdfArtifacts?: boolean;
  /** Physical size in millimetres, emitted as the SVG `width`/`height` attributes. */
  sizeMm?: number;
}

/**
 * Unpack marker bytes into `width * height` bits (1 = white cell), MSB first.
 * The last byte only contributes the remaining bits, exactly like arucogen.
 */
export function decodeMarkerBits(bytes: readonly number[], width: number, height: number): number[] {
  const bits: number[] = [];
  const bitsCount = width * height;

  for (const byte of bytes) {
    const start = bitsCount - bits.length;
    for (let i = Math.min(7, start - 1); i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }

  return bits;
}

/**
 * White rectangles for the marker in a `(width + 2) x (height + 2)` coordinate system whose
 * outer ring is the black border. Rects are emitted in arucogen's order so that SVG output
 * is byte-for-byte identical.
 */
export function markerRects(
  bits: readonly number[],
  width: number,
  height: number,
  fixPdfArtifacts = true,
): MarkerRect[] {
  const rects: MarkerRect[] = [];

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      if (!bits[i * width + j]) {
        continue;
      }

      const rightIsWhite = fixPdfArtifacts && j < width - 1 && Boolean(bits[i * width + j + 1]);
      const belowIsWhite = fixPdfArtifacts && i < height - 1 && Boolean(bits[(i + 1) * width + j]);

      rects.push({ x: j + 1, y: i + 1, width: rightIsWhite ? 1.5 : 1, height: 1 });

      if (belowIsWhite) {
        rects.push({ x: j + 1, y: i + 1, width: 1, height: 1.5 });
      }
    }
  }

  return rects;
}

/** Size and white rects for a marker id. */
export function markerGeometry(name: ArucoDictionaryName, id: number, fixPdfArtifacts = true) {
  const { width, height } = getDictionary(name);
  const bits = decodeMarkerBits(getMarkerBytes(name, id), width, height);
  return { width, height, rects: markerRects(bits, width, height, fixPdfArtifacts) };
}

/** Standalone SVG markup for a marker. Output matches arucogen's `generateMarkerSvg`. */
export function markerSvgString(
  name: ArucoDictionaryName,
  id: number,
  options: MarkerSvgOptions = {},
): string {
  const { fixPdfArtifacts = true, sizeMm } = options;
  const { width, height, rects } = markerGeometry(name, id, fixPdfArtifacts);
  const size = sizeMm === undefined ? '' : ` width="${sizeMm}mm" height="${sizeMm}mm"`;

  const pixels = rects
    .map(
      (rect) =>
        `<rect width="${rect.width}" height="${rect.height}" x="${rect.x}" y="${rect.y}" fill="white"></rect>`,
    )
    .join('');

  return (
    `<svg viewBox="0 0 ${width + 2} ${height + 2}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"${size}>` +
    `<rect x="0" y="0" width="${width + 2}" height="${height + 2}" fill="black"></rect>` +
    pixels +
    `</svg>`
  );
}

/** `data:` URI usable as a download `href` for an SVG string. */
export function markerSvgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/** Download file name, e.g. `4x4_1000-0.svg`, same as arucogen. */
export function markerFileName(name: ArucoDictionaryName, id: number): string {
  return `${name}-${id}.svg`;
}
