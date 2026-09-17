import { describe, expect, it } from 'vitest';
import { markerGeometry } from '../aruco/marker';
import type { ArucoDictionaryName } from '../aruco/dictionaries';
import { createDetector } from './detect';

/** Paint a marker into a white RGBA raster, like a photo of a printed marker. */
function raster(dictionary: ArucoDictionaryName, id: number, cell = 24, rotateQuarterTurns = 0) {
  const { width, height, rects } = markerGeometry(dictionary, id, false);
  const modules = width + 2;
  const size = 640;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  const left = Math.floor((size - modules * cell) / 2);
  const top = left;
  const paint = (mx: number, my: number, black: boolean) => {
    for (let y = 0; y < cell; y++) {
      for (let x = 0; x < cell; x++) {
        let px = mx * cell + x;
        let py = my * cell + y;
        for (let r = 0; r < rotateQuarterTurns; r++) {
          [px, py] = [modules * cell - 1 - py, px];
        }
        const index = ((top + py) * size + left + px) * 4;
        const value = black ? 0 : 255;
        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
      }
    }
  };
  for (let my = 0; my < modules; my++) {
    for (let mx = 0; mx < modules; mx++) {
      paint(mx, my, true);
    }
  }
  for (const rect of rects) {
    paint(rect.x, rect.y, false);
  }
  const extent = modules * cell;
  const corners = [
    { x: left, y: top },
    { x: left + extent, y: top },
    { x: left + extent, y: top + extent },
    { x: left, y: top + extent },
  ];
  return { image: { width: size, height: size, data }, corners, extent, height };
}

describe('createDetector', () => {
  it.each([
    ['4x4_1000', 42],
    ['april_36h11', 586],
    ['7x7_1000', 999],
    ['aruco', 1023],
    ['mip_36h12', 249],
  ] as const)('finds %s marker %i in a synthetic raster', (dictionary, id) => {
    const { image, corners } = raster(dictionary, id);
    const found = createDetector(dictionary).detect(image);
    expect(found.map((m) => m.id)).toEqual([id]);
    expect(found[0].hammingDistance).toBe(0);
    // Corners clockwise from the canonical top-left, within a pixel or two of the painted square.
    found[0].corners.forEach((c, i) => {
      expect(Math.abs(c.x - corners[i].x)).toBeLessThan(3);
      expect(Math.abs(c.y - corners[i].y)).toBeLessThan(3);
    });
  });

  it('identifies a rotated marker and reports its canonical top-left first', () => {
    const { image, corners } = raster('4x4_1000', 7, 24, 1);
    const [found] = createDetector('4x4_1000').detect(image);
    expect(found.id).toBe(7);
    // One clockwise quarter turn moves the canonical top-left to the painted top-right.
    expect(Math.abs(found.corners[0].x - corners[1].x)).toBeLessThan(3);
    expect(Math.abs(found.corners[0].y - corners[1].y)).toBeLessThan(3);
  });

  it('returns nothing for a blank image', () => {
    const data = new Uint8ClampedArray(320 * 240 * 4).fill(255);
    expect(createDetector('4x4_1000').detect({ width: 320, height: 240, data })).toEqual([]);
  });
});
