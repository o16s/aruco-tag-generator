import { getDictionary, type ArucoDictionaryName } from './dictionaries';

/** A4 portrait, millimetres. */
export const A4 = { width: 210, height: 297 } as const;

/** Cap height of Arial / Liberation Sans as a fraction of font size. */
export const CAP_HEIGHT = 0.716;
/** Average digit advance of Arial Bold as a fraction of font size. */
export const DIGIT_WIDTH = 0.556;
export const LABEL_FONT = "Arial, Helvetica, 'Liberation Sans', sans-serif";
export const MAX_PAGES = 100;
const MIN_QUIET_ZONE = 2;
/** White page padding used by both print layouts, mm. */
export const PAGE_PADDING_MM = 10;

export interface LabelSheetPreset {
  code: string;
  /** Display name, e.g. "L7160 / J8160". */
  label: string;
  width: number;
  height: number;
  cols: number;
  rows: number;
  gapX: number;
  gapY: number;
}

const preset = (code: string, twin: string, width: number, height: number, cols: number, rows: number): LabelSheetPreset => ({
  code,
  label: `${code} / ${twin} · ${width} × ${height} mm · ${cols * rows} per sheet`,
  width,
  height,
  cols,
  rows,
  gapX: 2.5,
  gapY: 0,
});

/** Avery A4 sheets. The grid is centred on the page, which reproduces the published margins. */
export const LABEL_SHEET_PRESETS: readonly LabelSheetPreset[] = [
  preset('L7651', 'J8651', 38.1, 21.2, 5, 13),
  preset('L7636', 'J8636', 45.7, 21.2, 4, 12),
  preset('L7654', 'J8654', 45.7, 25.4, 4, 10),
  preset('L7159', 'J8159', 63.5, 33.9, 3, 8),
  preset('L7160', 'J8160', 63.5, 38.1, 3, 7),
  preset('L7161', 'J8161', 63.5, 46.6, 3, 6),
  preset('L7162', 'J8162', 99.1, 33.9, 2, 8),
  preset('L7163', 'J8163', 99.1, 38.1, 2, 7),
  preset('L7164', 'J8164', 63.5, 72, 3, 4),
  preset('L7173', 'J8173', 99.1, 57, 2, 5),
  preset('L7165', 'J8165', 99.1, 67.7, 2, 4),
  preset('L7169', 'J8169', 99.1, 139, 2, 2),
];

export const DEFAULT_PRESET = 'L7160';

export function getPreset(code: string): LabelSheetPreset {
  const found = LABEL_SHEET_PRESETS.find((entry) => entry.code === code);
  if (!found) {
    throw new Error(`Unknown label sheet preset: ${code}`);
  }
  return found;
}

export interface LabelLayout {
  width: number;
  height: number;
  /** Marker side including its black border, mm. */
  markerSize: number;
  markerX: number;
  markerY: number;
  quietZone: number;
  /** 'right' for rectangular labels, 'below' for near-square ones. */
  textPlacement: 'right' | 'below';
  fontSize: number;
  textX: number;
  /** Baseline of the ID text. */
  textY: number;
  textAnchor: 'start' | 'middle';
}

/**
 * Place one marker and its ID inside a label. `modules` is the marker side in modules
 * including the border (a 4x4 dictionary has 6). See docs/spec.md §5.5.
 */
export function layoutLabel(width: number, height: number, modules: number, digits = 4): LabelLayout {
  const shrink = (n: number) => n * modules / (modules + 2); // marker leaving one module of quiet zone each side

  if (width >= 1.5 * height) {
    let markerSize = shrink(height);
    let quietZone = markerSize / modules;
    if (quietZone < MIN_QUIET_ZONE) {
      quietZone = MIN_QUIET_ZONE;
      markerSize = height - 2 * MIN_QUIET_ZONE;
    }
    let fontSize = markerSize / CAP_HEIGHT;
    const maxTextWidth = width - markerSize - 3 * quietZone;
    fontSize = Math.min(fontSize, maxTextWidth / (digits * DIGIT_WIDTH));
    return {
      width,
      height,
      markerSize,
      markerX: quietZone,
      markerY: quietZone,
      quietZone,
      textPlacement: 'right',
      fontSize,
      textX: markerSize + 2 * quietZone,
      textY: quietZone + markerSize,
      textAnchor: 'start',
    };
  }

  const quietZone = Math.max(MIN_QUIET_ZONE, shrink(Math.min(width, height)) / modules);
  const markerSize = Math.min(width - 2 * quietZone, (height - 3 * quietZone) / 1.15);
  const capHeight = 0.15 * markerSize;
  return {
    width,
    height,
    markerSize,
    markerX: (width - markerSize) / 2,
    markerY: quietZone,
    quietZone,
    textPlacement: 'below',
    fontSize: capHeight / CAP_HEIGHT,
    textX: width / 2,
    textY: quietZone + markerSize + quietZone + capHeight,
    textAnchor: 'middle',
  };
}

export interface SheetGeometry {
  width: number;
  height: number;
  cols: number;
  rows: number;
  left: number;
  top: number;
  gapX: number;
  gapY: number;
  perPage: number;
}

export interface CustomSheet {
  width: number;
  height: number;
  gap: number;
}

/** Grid geometry for a preset (centred) or a custom label size (10 mm page margin, as many as fit). */
export function layoutSheet(sheet: LabelSheetPreset | CustomSheet): SheetGeometry {
  if ('cols' in sheet) {
    const { width, height, cols, rows, gapX, gapY } = sheet;
    return {
      width,
      height,
      cols,
      rows,
      gapX,
      gapY,
      left: (A4.width - cols * width - (cols - 1) * gapX) / 2,
      top: (A4.height - rows * height - (rows - 1) * gapY) / 2,
      perPage: cols * rows,
    };
  }
  const { width, height, gap } = sheet;
  const cols = Math.max(0, Math.floor((A4.width - 2 * PAGE_PADDING_MM + gap) / (width + gap)));
  const rows = Math.max(0, Math.floor((A4.height - 2 * PAGE_PADDING_MM + gap) / (height + gap)));
  return { width, height, cols, rows, gapX: gap, gapY: gap, left: PAGE_PADDING_MM, top: PAGE_PADDING_MM, perPage: cols * rows };
}

/** Top-left corner of label `index` (0-based, row-major) on its page. */
export function labelOrigin(geometry: SheetGeometry, index: number): { x: number; y: number } {
  const col = index % geometry.cols;
  const row = Math.floor(index / geometry.cols);
  return {
    x: geometry.left + col * (geometry.width + geometry.gapX),
    y: geometry.top + row * (geometry.height + geometry.gapY),
  };
}

/** Split an inclusive ID range into pages of IDs. Throws when the result exceeds MAX_PAGES. */
export function sheetPages(from: number, to: number, perPage: number): number[][] {
  const [first, last] = from <= to ? [from, to] : [to, from];
  const count = last - first + 1;
  if (perPage < 1) {
    throw new RangeError('The label does not fit on the page');
  }
  const pageCount = Math.ceil(count / perPage);
  if (pageCount > MAX_PAGES) {
    throw new RangeError(`${count} labels need ${pageCount} pages, the maximum is ${MAX_PAGES}`);
  }
  const pages: number[][] = [];
  for (let start = first; start <= last; start += perPage) {
    const ids: number[] = [];
    for (let id = start; id <= Math.min(last, start + perPage - 1); id++) {
      ids.push(id);
    }
    pages.push(ids);
  }
  return pages;
}

/** Marker side in modules, border included, for a dictionary. */
export function markerModules(dictionary: ArucoDictionaryName): number {
  return getDictionary(dictionary).width + 2;
}
