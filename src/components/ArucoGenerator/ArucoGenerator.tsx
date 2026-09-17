import { useId, useRef, useState, type CSSProperties } from 'react';
import { ArucoMarker } from '../ArucoMarker';
import { clampMarkerId, DEFAULT_DICTIONARY, getDictionary, type ArucoDictionaryName } from '../../lib/aruco/dictionaries';
import { markerFileName, markerSvgDataUri, markerSvgString } from '../../lib/aruco/marker';
import { A4, PAGE_PADDING_MM } from '../../lib/aruco/label';
import { printArea } from '../../lib/print';
import { DictionarySelect, PrintPortal } from '../atg';
import type { ArucoGeneratorProps, ArucoGeneratorValue } from './types';

const MIN_SIZE_MM = 10;
/** The marker must fit on an A4 page inside the print padding, so the size is physically true. */
const MAX_SIZE_MM = A4.width - 2 * PAGE_PADDING_MM;

const sizeError = (size: number): string | null => {
  if (!Number.isFinite(size) || size < MIN_SIZE_MM) {
    return `Enter a size of at least ${MIN_SIZE_MM} mm.`;
  }
  if (size > MAX_SIZE_MM) {
    return `${size} mm does not fit on A4. The maximum is ${MAX_SIZE_MM} mm (210 mm minus 2 × ${PAGE_PADDING_MM} mm).`;
  }
  return null;
};

export function ArucoGenerator({
  defaultDictionary = DEFAULT_DICTIONARY,
  defaultId = 0,
  defaultSizeMm = 100,
  onChange,
  fixPdfArtifacts = true,
  className,
  footer,
}: ArucoGeneratorProps) {
  const [value, setValue] = useState<ArucoGeneratorValue>(() => ({
    dictionary: defaultDictionary,
    id: clampMarkerId(defaultDictionary, defaultId),
    sizeMm: sizeError(defaultSizeMm) ? 100 : defaultSizeMm,
  }));
  const [error, setError] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const idInput = useRef<HTMLInputElement>(null);
  const printNode = useRef<HTMLDivElement>(null);
  const uid = useId();
  const { dictionary, id, sizeMm } = value;
  const maxId = getDictionary(dictionary).count - 1;

  // Inputs are uncontrolled: read the form on every change and clamp (docs/spec.md §4.2).
  const update = () => {
    if (!form.current) {
      return;
    }
    const data = new FormData(form.current);
    const nextDictionary = String(data.get('dict')) as ArucoDictionaryName;
    const nextId = clampMarkerId(nextDictionary, Number(data.get('id')));
    if (idInput.current && Number(idInput.current.value) !== nextId) {
      idInput.current.value = String(nextId);
    }
    const size = Number(data.get('size'));
    const problem = sizeError(size);
    setError(problem);
    // An invalid size keeps the last valid one: the preview stays true and the actions are disabled.
    const next = { dictionary: nextDictionary, id: nextId, sizeMm: problem ? sizeMm : size };
    setValue(next);
    if (!problem) {
      onChange?.(next);
    }
  };

  const step = (delta: number) => {
    if (idInput.current) {
      idInput.current.value = String(clampMarkerId(dictionary, id + delta));
      update();
    }
  };

  return (
    <section className={`atg ${className ?? ''}`.trim()}>
      <div className="atg-card">
      <div className="atg-preview">
        <ArucoMarker dictionary={dictionary} id={id} fixPdfArtifacts={fixPdfArtifacts} />
        <div className="atg-preview__id">{id}</div>
        <p className="atg-preview__caption">{dictionary}</p>
      </div>

      <form ref={form} className="atg-controls" onSubmit={(event) => event.preventDefault()} onChange={update}>
        <div className="atg-field">
          <label className="atg-label" htmlFor={`${uid}-dict`}>
            Dictionary
          </label>
          <DictionarySelect id={`${uid}-dict`} defaultValue={dictionary} />
        </div>

        <div className="atg-field">
          <label className="atg-label" htmlFor={`${uid}-id`}>
            Marker ID
          </label>
          <div className="atg-stepper">
            <button type="button" className="atg-btn" aria-label="Decrease ID" onClick={() => step(-1)} disabled={id <= 0}>
              −
            </button>
            <input
              ref={idInput}
              id={`${uid}-id`}
              className="atg-input"
              name="id"
              type="number"
              inputMode="numeric"
              min={0}
              max={maxId}
              step={1}
              defaultValue={id}
              aria-describedby={`${uid}-id-help`}
            />
            <button type="button" className="atg-btn" aria-label="Increase ID" onClick={() => step(1)} disabled={id >= maxId}>
              +
            </button>
          </div>
          <p id={`${uid}-id-help`} className="atg-help">
            0 – {maxId}
          </p>
        </div>

        <div className="atg-field">
          <label className="atg-label" htmlFor={`${uid}-size`}>
            Marker size
          </label>
          <div className="atg-unit">
            <input
              id={`${uid}-size`}
              className="atg-input"
              name="size"
              type="number"
              inputMode="decimal"
              min={MIN_SIZE_MM}
              max={MAX_SIZE_MM}
              defaultValue={sizeMm}
              aria-invalid={Boolean(error)}
              aria-describedby={`${uid}-size-help`}
            />
            <span aria-hidden="true">mm</span>
          </div>
          <p id={`${uid}-size-help`} className={error ? 'atg-preview__error' : 'atg-help'} role={error ? 'alert' : undefined}>
            {error ?? `${MIN_SIZE_MM} – ${MAX_SIZE_MM} mm, fits A4`}
          </p>
        </div>

        <div className="atg-actions">
          <button
            type="button"
            className="atg-btn atg-btn--primary"
            onClick={() => printArea(printNode.current, 'size: A4; margin: 0')}
            disabled={Boolean(error)}
          >
            Print / PDF
          </button>
          <a
            className="atg-btn"
            href={error ? undefined : markerSvgDataUri(markerSvgString(dictionary, id, { fixPdfArtifacts, sizeMm }))}
            download={markerFileName(dictionary, id)}
            aria-disabled={Boolean(error)}
          >
            Download SVG
          </a>
        </div>

        {footer ? <div className="atg-help">{footer}</div> : null}
      </form>
      </div>

      <PrintPortal nodeRef={printNode}>
        <div className="atg-print__single" style={{ '--atg-print-size': `${sizeMm}mm` } as CSSProperties}>
          <ArucoMarker dictionary={dictionary} id={id} sizeMm={sizeMm} fixPdfArtifacts={fixPdfArtifacts} />
          <div className="atg-print__id">{id}</div>
          <div className="atg-print__caption">{dictionary}</div>
        </div>
      </PrintPortal>
    </section>
  );
}
