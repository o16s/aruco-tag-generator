import { useId, useRef, useState } from 'react';
import { clampMarkerId, DEFAULT_DICTIONARY, getDictionary, type ArucoDictionaryName } from '../../lib/aruco/dictionaries';
import {
  A4,
  DEFAULT_PRESET,
  PAGE_PADDING_MM,
  getPreset,
  LABEL_SHEET_PRESETS,
  layoutLabel,
  layoutSheet,
  markerModules,
  sheetPages,
} from '../../lib/aruco/label';
import { printArea } from '../../lib/print';
import { ArucoLabelSheet } from '../ArucoLabelSheet';
import { clampNumber } from '../../lib/number';
import { DictionarySelect, PrintPortal } from '../atg';
import type { ArucoSheetGeneratorProps, ArucoSheetGeneratorValue } from './types';

const CUSTOM = 'custom';

export function ArucoSheetGenerator({
  defaultDictionary = DEFAULT_DICTIONARY,
  defaultFrom = 0,
  defaultTo = 20,
  defaultSheet = DEFAULT_PRESET,
  onChange,
  className,
  footer,
}: ArucoSheetGeneratorProps) {
  const [value, setValue] = useState<ArucoSheetGeneratorValue>(() => ({
    dictionary: defaultDictionary,
    from: clampMarkerId(defaultDictionary, Math.min(defaultFrom, defaultTo)),
    to: clampMarkerId(defaultDictionary, Math.max(defaultFrom, defaultTo)),
    sheet: defaultSheet,
    widthMm: 50,
    heightMm: 30,
    gapMm: 2,
    cutLines: true,
  }));
  const [page, setPage] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const fromInput = useRef<HTMLInputElement>(null);
  const toInput = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const printNode = useRef<HTMLDivElement>(null);
  const uid = useId();

  const { dictionary, from, to, sheet, widthMm, heightMm, gapMm, cutLines } = value;
  const maxId = getDictionary(dictionary).count - 1;
  const custom = sheet === CUSTOM;
  const geometry = layoutSheet(custom ? { width: widthMm, height: heightMm, gap: gapMm } : getPreset(sheet));
  const digits = String(to).length;
  const markerSize = layoutLabel(geometry.width, geometry.height, markerModules(dictionary), digits).markerSize;

  let pages: number[][] = [];
  let error: string | null = null;
  if (geometry.perPage === 0) {
    const maxW = A4.width - 2 * PAGE_PADDING_MM;
    const maxH = A4.height - 2 * PAGE_PADDING_MM;
    error = `A ${widthMm} × ${heightMm} mm label does not fit on A4 with ${PAGE_PADDING_MM} mm margins. The maximum is ${maxW} × ${maxH} mm.`;
  } else {
    try {
      pages = sheetPages(from, to, geometry.perPage);
    } catch (rangeError) {
      error = rangeError instanceof Error ? rangeError.message : String(rangeError);
    }
  }
  const pageIndex = Math.min(page, Math.max(pages.length - 1, 0));
  const sheetName = custom ? 'custom' : getPreset(sheet).code;
  const pageFooter = (index: number, total: number) =>
    `${dictionary} · marker ${markerSize.toFixed(1)} mm · label ${geometry.width} × ${geometry.height} mm (${sheetName}) · IDs ${pages[index]?.[0] ?? from}–${pages[index]?.at(-1) ?? to} · page ${index + 1} of ${total}`;

  const update = () => {
    if (!form.current) {
      return;
    }
    const data = new FormData(form.current);
    const nextDictionary = String(data.get('dict')) as ArucoDictionaryName;
    let nextFrom = clampMarkerId(nextDictionary, Number(data.get('from')));
    let nextTo = clampMarkerId(nextDictionary, Number(data.get('to')));
    if (nextFrom > nextTo) {
      [nextFrom, nextTo] = [nextTo, nextFrom];
    }
    if (fromInput.current && Number(fromInput.current.value) !== nextFrom) {
      fromInput.current.value = String(nextFrom);
    }
    if (toInput.current && Number(toInput.current.value) !== nextTo) {
      toInput.current.value = String(nextTo);
    }
    const next: ArucoSheetGeneratorValue = {
      dictionary: nextDictionary,
      from: nextFrom,
      to: nextTo,
      sheet: String(data.get('sheet')),
      widthMm: data.has('width') ? clampNumber(Number(data.get('width')), 5, Number.POSITIVE_INFINITY) : widthMm,
      heightMm: data.has('height') ? clampNumber(Number(data.get('height')), 5, Number.POSITIVE_INFINITY) : heightMm,
      gapMm: data.has('gap') ? clampNumber(Number(data.get('gap')), 0, 50) : gapMm,
      cutLines: data.has('width') ? data.get('cut') === 'on' : cutLines,
    };
    setValue(next);
    setPage(0);
    onChange?.(next);
  };

  const downloadPage = () => {
    const svg = preview.current?.querySelector('svg');
    if (!svg) {
      return;
    }
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dictionary}-${from}-${to}-page${pageIndex + 1}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className={`atg ${className ?? ''}`.trim()}>
      <div className="atg-card">
      <div className="atg-preview" ref={preview}>
        {error ? (
          <p className="atg-preview__error" role="alert">
            {error}
          </p>
        ) : (
          <ArucoLabelSheet
            dictionary={dictionary}
            pages={pages}
            geometry={geometry}
            pageIndex={pageIndex}
            digits={digits}
            cutLines={custom && cutLines}
            footer={pageFooter}
          />
        )}
        {pages.length > 1 ? (
          <div className="atg-pager">
            <button type="button" className="atg-btn" onClick={() => setPage(pageIndex - 1)} disabled={pageIndex === 0}>
              Previous
            </button>
            <span aria-live="polite">
              Page {pageIndex + 1} of {pages.length}
            </span>
            <button
              type="button"
              className="atg-btn"
              onClick={() => setPage(pageIndex + 1)}
              disabled={pageIndex >= pages.length - 1}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      <form ref={form} className="atg-controls" onSubmit={(event) => event.preventDefault()} onChange={update}>
        <div className="atg-field">
          <label className="atg-label" htmlFor={`${uid}-dict`}>
            Dictionary
          </label>
          <DictionarySelect id={`${uid}-dict`} defaultValue={dictionary} />
        </div>

        <div className="atg-field">
          <div className="atg-field atg-field--row">
            <div className="atg-field">
              <label className="atg-label" htmlFor={`${uid}-from`}>
                From
              </label>
              <input
                ref={fromInput}
                id={`${uid}-from`}
                className="atg-input"
                name="from"
                type="number"
                inputMode="numeric"
                min={0}
                max={maxId}
                step={1}
                defaultValue={from}
              />
            </div>
            <div className="atg-field">
              <label className="atg-label" htmlFor={`${uid}-to`}>
                To
              </label>
              <input
                ref={toInput}
                id={`${uid}-to`}
                className="atg-input"
                name="to"
                type="number"
                inputMode="numeric"
                min={0}
                max={maxId}
                step={1}
                defaultValue={to}
              />
            </div>
          </div>
          <p className="atg-help">
            {to - from + 1} labels · IDs 0 – {maxId}
          </p>
        </div>

        <div className="atg-field">
          <label className="atg-label" htmlFor={`${uid}-sheet`}>
            Label sheet
          </label>
          <select id={`${uid}-sheet`} name="sheet" className="atg-input" defaultValue={sheet}>
            {LABEL_SHEET_PRESETS.map((preset) => (
              <option key={preset.code} value={preset.code}>
                {preset.label}
              </option>
            ))}
            <option value={CUSTOM}>Custom size</option>
          </select>
        </div>

        {custom ? (
          <>
            <div className="atg-field atg-field--row">
              <div className="atg-field">
                <label className="atg-label" htmlFor={`${uid}-width`}>
                  Width
                </label>
                <div className="atg-unit">
                  <input id={`${uid}-width`} className="atg-input" name="width" type="number" inputMode="decimal" min={5} max={A4.width - 2 * PAGE_PADDING_MM} defaultValue={widthMm} />
                  <span aria-hidden="true">mm</span>
                </div>
              </div>
              <div className="atg-field">
                <label className="atg-label" htmlFor={`${uid}-height`}>
                  Height
                </label>
                <div className="atg-unit">
                  <input id={`${uid}-height`} className="atg-input" name="height" type="number" inputMode="decimal" min={5} max={A4.height - 2 * PAGE_PADDING_MM} defaultValue={heightMm} />
                  <span aria-hidden="true">mm</span>
                </div>
              </div>
            </div>
            <div className="atg-field atg-field--row">
              <div className="atg-field">
                <label className="atg-label" htmlFor={`${uid}-gap`}>
                  Gap
                </label>
                <div className="atg-unit">
                  <input id={`${uid}-gap`} className="atg-input" name="gap" type="number" inputMode="decimal" min={0} max={50} defaultValue={gapMm} />
                  <span aria-hidden="true">mm</span>
                </div>
              </div>
              <label className="atg-check" style={{ alignSelf: 'end' }}>
                <input type="checkbox" name="cut" defaultChecked={cutLines} />
                Cut lines
              </label>
            </div>
          </>
        ) : null}

        <p className="atg-summary" aria-live="polite">
          {error
            ? 'Fix the error above to print.'
            : `${geometry.perPage} per page · ${pages.length} ${pages.length === 1 ? 'page' : 'pages'} · marker ${markerSize.toFixed(1)} mm`}
        </p>

        <div className="atg-actions">
          <button
            type="button"
            className="atg-btn atg-btn--primary"
            onClick={() => printArea(printNode.current, 'size: A4; margin: 0')}
            disabled={Boolean(error)}
          >
            Print / PDF
          </button>
          <button type="button" className="atg-btn" onClick={downloadPage} disabled={Boolean(error)}>
            Download SVG
          </button>
        </div>

        {footer ? <div className="atg-help">{footer}</div> : null}
      </form>
      </div>

      <PrintPortal nodeRef={printNode}>
        {error ? null : (
          <ArucoLabelSheet dictionary={dictionary} pages={pages} geometry={geometry} digits={digits} cutLines={custom && cutLines} footer={pageFooter} />
        )}
      </PrintPortal>
    </section>
  );
}
