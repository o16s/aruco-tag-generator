import { useId, useRef, useState } from 'react';
import { ArucoMarker } from '../ArucoMarker';
import {
  ARUCO_DICTIONARIES,
  ARUCO_DICTIONARY_GROUPS,
  clampMarkerId,
  DEFAULT_DICTIONARY,
  getDictionary,
  type ArucoDictionaryName,
} from '../../lib/aruco/dictionaries';
import { markerFileName, markerSvgDataUri, markerSvgString } from '../../lib/aruco/marker';
import { printMarker } from './printMarker';
import type { ArucoGeneratorProps, ArucoGeneratorValue } from './types';
import './ArucoGenerator.css';

const MIN_SIZE_MM = 10;
const MAX_SIZE_MM = 5000;

const clampSize = (value: number): number =>
  Math.min(Math.max(value || MIN_SIZE_MM, MIN_SIZE_MM), MAX_SIZE_MM);

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
    sizeMm: clampSize(defaultSizeMm),
  }));
  const idInput = useRef<HTMLInputElement>(null);
  const uid = useId();
  const { dictionary, id, sizeMm } = value;

  // Inputs are uncontrolled, like arucogen: read the form on every change and clamp.
  const update = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const nextDictionary = String(data.get('dict')) as ArucoDictionaryName;
    const nextId = clampMarkerId(nextDictionary, Number(data.get('id')));
    if (idInput.current && Number(idInput.current.value) !== nextId) {
      idInput.current.value = String(nextId);
    }
    const next = { dictionary: nextDictionary, id: nextId, sizeMm: clampSize(Number(data.get('size'))) };
    setValue(next);
    onChange?.(next);
  };

  return (
    <section className={`aruco-generator ${className ?? ''}`.trim()}>
      <form
        className="aruco-generator__form"
        onSubmit={(event) => event.preventDefault()}
        onChange={(event) => update(event.currentTarget)}
      >
        <div className="aruco-generator__field">
          <label htmlFor={`${uid}-dict`}>Dictionary:</label>
          <select id={`${uid}-dict`} name="dict" defaultValue={dictionary}>
            {ARUCO_DICTIONARY_GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {ARUCO_DICTIONARIES.filter((entry) => entry.group === group).map((entry) => (
                  <option key={entry.name} value={entry.name}>
                    {entry.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="aruco-generator__field">
          <label htmlFor={`${uid}-id`}>Marker ID:</label>
          <input
            id={`${uid}-id`}
            name="id"
            type="number"
            min={0}
            max={getDictionary(dictionary).count - 1}
            step={1}
            defaultValue={id}
            ref={idInput}
          />
        </div>
        <div className="aruco-generator__field">
          <label htmlFor={`${uid}-size`}>Marker size, mm:</label>
          <input
            id={`${uid}-size`}
            name="size"
            type="number"
            min={MIN_SIZE_MM}
            max={MAX_SIZE_MM}
            defaultValue={sizeMm}
          />
        </div>
      </form>

      <div className="aruco-generator__print-area">
        <div className="aruco-generator__marker-id">ID {id}</div>
        <div className="aruco-generator__marker">
          <ArucoMarker dictionary={dictionary} id={id} sizeMm={sizeMm} fixPdfArtifacts={fixPdfArtifacts} />
        </div>
      </div>

      <div className="aruco-generator__tools">
        <a
          href={markerSvgDataUri(markerSvgString(dictionary, id, { fixPdfArtifacts, sizeMm }))}
          download={markerFileName(dictionary, id)}
        >
          Save
        </a>{' '}
        this marker as SVG, or{' '}
        <button type="button" onClick={printMarker}>
          open
        </button>{' '}
        standard browser&apos;s print dialog to print or get the PDF.
      </div>

      {footer ? <div className="aruco-generator__footer">{footer}</div> : null}
    </section>
  );
}
