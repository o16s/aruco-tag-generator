import { useId, useRef, useState, type CSSProperties } from 'react';
import { ArucoMarker } from '../ArucoMarker';
import { clampMarkerId, DEFAULT_DICTIONARY, getDictionary, type ArucoDictionaryName } from '../../lib/aruco/dictionaries';
import { markerFileName, markerSvgDataUri, markerSvgString } from '../../lib/aruco/marker';
import { printArea } from '../../lib/print';
import { clampNumber } from '../../lib/number';
import { DictionarySelect, PrintPortal } from '../atg';
import type { ArucoGeneratorProps, ArucoGeneratorValue } from './types';

const MIN_SIZE_MM = 10;
const MAX_SIZE_MM = 5000;

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
    sizeMm: clampNumber(defaultSizeMm, MIN_SIZE_MM, MAX_SIZE_MM),
  }));
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
    const next = { dictionary: nextDictionary, id: nextId, sizeMm: clampNumber(Number(data.get('size')), MIN_SIZE_MM, MAX_SIZE_MM) };
    setValue(next);
    onChange?.(next);
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
            />
            <span aria-hidden="true">mm</span>
          </div>
        </div>

        <div className="atg-actions">
          <button type="button" className="atg-btn atg-btn--primary" onClick={() => printArea(printNode.current, 'size: A4; margin: 0')}>
            Print / PDF
          </button>
          <a
            className="atg-btn"
            href={markerSvgDataUri(markerSvgString(dictionary, id, { fixPdfArtifacts, sizeMm }))}
            download={markerFileName(dictionary, id)}
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
