import { describe, expect, it } from 'vitest';
import {
  decodeMarkerBits,
  markerFileName,
  markerRects,
  markerSvgDataUri,
  markerSvgString,
} from './marker';
import golden from './__fixtures__/arucogen-golden.json';

describe('decodeMarkerBits', () => {
  it('unpacks bytes MSB first', () => {
    expect(decodeMarkerBits([181, 50], 4, 4).join('')).toBe('1011010100110010');
  });

  it('only takes the remaining bits from the last byte', () => {
    // 36 bits over 5 bytes: the last byte contributes its 4 low bits.
    const bits = decodeMarkerBits([0xff, 0xff, 0xff, 0xff, 0b1010], 6, 6);
    expect(bits).toHaveLength(36);
    expect(bits.slice(32).join('')).toBe('1010');
  });
});

describe('markerRects', () => {
  it('overlaps neighbouring white cells when fixing pdf artifacts', () => {
    expect(markerRects([1, 1, 1, 1], 2, 2)).toEqual([
      { x: 1, y: 1, width: 1.5, height: 1 },
      { x: 1, y: 1, width: 1, height: 1.5 },
      { x: 2, y: 1, width: 1, height: 1 },
      { x: 2, y: 1, width: 1, height: 1.5 },
      { x: 1, y: 2, width: 1.5, height: 1 },
      { x: 2, y: 2, width: 1, height: 1 },
    ]);
  });

  it('emits plain 1x1 cells without the fix', () => {
    expect(markerRects([1, 1, 1, 1], 2, 2, false)).toEqual([
      { x: 1, y: 1, width: 1, height: 1 },
      { x: 2, y: 1, width: 1, height: 1 },
      { x: 1, y: 2, width: 1, height: 1 },
      { x: 2, y: 2, width: 1, height: 1 },
    ]);
  });

  it('skips black cells', () => {
    expect(markerRects([0, 0, 0, 1], 2, 2)).toEqual([{ x: 2, y: 2, width: 1, height: 1 }]);
  });
});

describe('markerSvgString', () => {
  it('is byte-for-byte identical to arucogen generateMarkerSvg output', () => {
    for (const [key, expected] of Object.entries(golden)) {
      const [name, id] = key.split(':');
      expect(markerSvgString(name as never, Number(id), { sizeMm: 100 })).toBe(expected);
    }
  });

  it('omits width/height when no size is given', () => {
    const svg = markerSvgString('4x4_1000', 0);
    expect(svg.startsWith('<svg viewBox="0 0 6 6"')).toBe(true);
    expect(svg).not.toContain('mm"');
  });

  it('respects fixPdfArtifacts=false', () => {
    expect(markerSvgString('4x4_1000', 0, { fixPdfArtifacts: false })).not.toContain('1.5');
  });
});

describe('download helpers', () => {
  it('builds a base64 svg data uri', () => {
    const uri = markerSvgDataUri('<svg></svg>');
    expect(uri).toBe('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=');
  });

  it('names files like arucogen', () => {
    expect(markerFileName('april_36h11', 42)).toBe('april_36h11-42.svg');
  });
});
