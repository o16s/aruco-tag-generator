import { describe, expect, it } from 'vitest';
import {
  CAP_HEIGHT,
  DIGIT_WIDTH,
  getPreset,
  LABEL_SHEET_PRESETS,
  labelOrigin,
  layoutLabel,
  layoutSheet,
  markerModules,
  MAX_PAGES,
  sheetPages,
} from './label';

describe('layoutSheet presets', () => {
  it('reproduces the published Avery L7160 margins by centring the grid', () => {
    const g = layoutSheet(getPreset('L7160'));
    expect(g.left).toBeCloseTo(7.25, 5);
    expect(g.top).toBeCloseTo(15.15, 5);
    expect(g.perPage).toBe(21);
    expect(labelOrigin(g, 0).x).toBeCloseTo(7.25, 5);
    expect(labelOrigin(g, 0).y).toBeCloseTo(15.15, 5);
    expect(labelOrigin(g, 1).x).toBeCloseTo(73.25, 5);
    expect(labelOrigin(g, 3).y).toBeCloseTo(15.15 + 38.1, 5);
  });

  it('keeps every preset inside the A4 page with positive margins', () => {
    for (const preset of LABEL_SHEET_PRESETS) {
      const g = layoutSheet(preset);
      expect(g.left).toBeGreaterThan(0);
      expect(g.top).toBeGreaterThan(0);
      const last = labelOrigin(g, g.perPage - 1);
      expect(last.x + g.width).toBeLessThanOrEqual(210);
      expect(last.y + g.height).toBeLessThanOrEqual(297);
    }
  });

  it('tiles a custom size inside a 10 mm margin', () => {
    const g = layoutSheet({ width: 50, height: 30, gap: 2 });
    // (190 + 2) / 52 = 3.69 → 3 cols, (277 + 2) / 32 = 8.7 → 8 rows
    expect(g.cols).toBe(3);
    expect(g.rows).toBe(8);
    expect(g.left).toBe(10);
    expect(labelOrigin(g, 4)).toEqual({ x: 62, y: 42 });
  });

  it('gives zero labels when the custom label is larger than the page', () => {
    expect(layoutSheet({ width: 300, height: 30, gap: 0 }).perPage).toBe(0);
  });
});

describe('layoutLabel', () => {
  it('lays out a rectangular label with the marker left and the ID right', () => {
    const l = layoutLabel(63.5, 38.1, markerModules('4x4_1000'), 4);
    expect(l.textPlacement).toBe('right');
    expect(l.markerSize).toBeCloseTo(38.1 * 6 / 8, 5); // 28.575
    expect(l.quietZone).toBeCloseTo(28.575 / 6, 5); // one module
    expect(l.markerX).toBe(l.quietZone);
    expect(l.textX).toBeCloseTo(l.markerSize + 2 * l.quietZone, 5);
    expect(l.textY).toBeCloseTo(l.quietZone + l.markerSize, 5);
    // Four digits cannot be as tall as the marker on this label, so the font shrinks to fit.
    const available = 63.5 - l.markerSize - 3 * l.quietZone;
    expect(l.fontSize).toBeCloseTo(available / (4 * DIGIT_WIDTH), 5);
  });

  it('keeps the ID as tall as the marker when it fits', () => {
    const l = layoutLabel(99.1, 33.9, markerModules('4x4_1000'), 1);
    expect(l.fontSize * CAP_HEIGHT).toBeCloseTo(l.markerSize, 5);
  });

  it('enforces a 2 mm quiet zone on small labels', () => {
    const l = layoutLabel(38.1, 21.2, markerModules('7x7_1000'));
    expect(l.quietZone).toBe(2);
    expect(l.markerSize).toBeCloseTo(21.2 - 4, 5);
  });

  it('shrinks the ID font when four digits do not fit', () => {
    const l = layoutLabel(45.7, 25.4, markerModules('4x4_1000'), 4);
    const available = 45.7 - l.markerSize - 3 * l.quietZone;
    expect(l.fontSize * DIGIT_WIDTH * 4).toBeLessThanOrEqual(available + 1e-9);
    expect(l.fontSize * CAP_HEIGHT).toBeLessThan(l.markerSize);
  });

  it('puts the ID below the marker on near-square labels', () => {
    const l = layoutLabel(63.5, 72, markerModules('4x4_1000'));
    expect(l.textPlacement).toBe('below');
    expect(l.textAnchor).toBe('middle');
    expect(l.markerX + l.markerSize / 2).toBeCloseTo(63.5 / 2, 5);
    expect(l.fontSize * CAP_HEIGHT).toBeCloseTo(0.15 * l.markerSize, 5);
    expect(l.textY).toBeLessThanOrEqual(72);
    expect(l.markerX).toBeGreaterThanOrEqual(l.quietZone - 1e-9);
  });
});

describe('sheetPages', () => {
  it('splits an inclusive range into pages and swaps a reversed range', () => {
    expect(sheetPages(0, 20, 21)).toEqual([Array.from({ length: 21 }, (_, i) => i)]);
    expect(sheetPages(0, 21, 21)[1]).toEqual([21]);
    expect(sheetPages(5, 3, 2)).toEqual([[3, 4], [5]]);
  });

  it('rejects more than MAX_PAGES pages or a label that does not fit', () => {
    expect(() => sheetPages(0, MAX_PAGES * 21, 21)).toThrow(RangeError);
    expect(() => sheetPages(0, 1, 0)).toThrow(RangeError);
  });
});
