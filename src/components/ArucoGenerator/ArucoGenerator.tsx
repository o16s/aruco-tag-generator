import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { ArucoMarker } from '../ArucoMarker';
import {
  ARUCO_DICTIONARIES,
  ARUCO_DICTIONARY_GROUPS,
  clampMarkerId,
  DEFAULT_DICTIONARY,
  getDictionary,
  isArucoDictionaryName,
  type ArucoDictionaryName,
} from '../../lib/aruco/dictionaries';
import { markerFileName, markerSvgDataUri, markerSvgString } from '../../lib/aruco/marker';
import { MAX_SIZE_MM, MIN_SIZE_MM } from './constants';
import { printMarker } from './printMarker';
import type { ArucoGeneratorProps, ArucoGeneratorValue } from './types';
import './ArucoGenerator.css';

const clampSize = (value: number): number => {
  if (!Number.isFinite(value)) {
    return MIN_SIZE_MM;
  }
  return Math.min(Math.max(value, MIN_SIZE_MM), MAX_SIZE_MM);
};

export function ArucoGenerator({
  defaultDictionary = DEFAULT_DICTIONARY,
  defaultId = 0,
  defaultSizeMm = 100,
  onChange,
  showSaveButton = true,
  showPrintButton = true,
  fixPdfArtifacts = true,
  className,
  footer,
}: ArucoGeneratorProps) {
  const [dictionary, setDictionary] = useState<ArucoDictionaryName>(defaultDictionary);
  const [id, setId] = useState<number>(() => clampMarkerId(defaultDictionary, defaultId));
  const [sizeMm, setSizeMm] = useState<number>(() => clampSize(defaultSizeMm));
  const [idText, setIdText] = useState<string>(() => String(clampMarkerId(defaultDictionary, defaultId)));
  const [sizeText, setSizeText] = useState<string>(() => String(clampSize(defaultSizeMm)));

  const uid = useId();
  const dictionaryInfo = getDictionary(dictionary);
  const maxId = dictionaryInfo.count - 1;

  useEffect(() => {
    onChange?.({ dictionary, id, sizeMm });
  }, [dictionary, id, sizeMm, onChange]);

  const handleDictionaryChange = useCallback(
    (value: string) => {
      if (!isArucoDictionaryName(value)) {
        return;
      }
      setDictionary(value);
      const clamped = clampMarkerId(value, id);
      if (clamped !== id) {
        setId(clamped);
        setIdText(String(clamped));
      }
    },
    [id],
  );

  const handleIdChange = useCallback(
    (value: string) => {
      setIdText(value);
      const parsed = Number(value);
      if (value.trim() === '' || !Number.isFinite(parsed)) {
        return;
      }
      const clamped = clampMarkerId(dictionary, parsed);
      setId(clamped);
      if (clamped !== parsed) {
        setIdText(String(clamped));
      }
    },
    [dictionary],
  );

  const handleSizeChange = useCallback((value: string) => {
    setSizeText(value);
    const parsed = Number(value);
    if (value.trim() === '' || !Number.isFinite(parsed)) {
      return;
    }
    setSizeMm(clampSize(parsed));
  }, []);

  const svgHref = useMemo(
    () => markerSvgDataUri(markerSvgString(dictionary, id, { fixPdfArtifacts, sizeMm })),
    [dictionary, id, fixPdfArtifacts, sizeMm],
  );

  const value: ArucoGeneratorValue = { dictionary, id, sizeMm };

  return (
    <section className={`aruco-generator ${className ?? ''}`.trim()} data-value={JSON.stringify(value)}>
      <form className="aruco-generator__form" onSubmit={(event) => event.preventDefault()}>
        <div className="aruco-generator__field">
          <label htmlFor={`${uid}-dict`}>Dictionary:</label>
          <select
            id={`${uid}-dict`}
            name="dict"
            value={dictionary}
            onChange={(event) => handleDictionaryChange(event.target.value)}
          >
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
            max={maxId}
            step={1}
            value={idText}
            onChange={(event) => handleIdChange(event.target.value)}
            onBlur={() => setIdText(String(id))}
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
            value={sizeText}
            onChange={(event) => handleSizeChange(event.target.value)}
            onBlur={() => setSizeText(String(sizeMm))}
          />
        </div>
      </form>

      <div className="aruco-generator__print-area">
        <div className="aruco-generator__marker-id">ID {id}</div>
        <div className="aruco-generator__marker">
          <ArucoMarker dictionary={dictionary} id={id} sizeMm={sizeMm} fixPdfArtifacts={fixPdfArtifacts} />
        </div>
      </div>

      {showSaveButton || showPrintButton ? (
        <div className="aruco-generator__tools">
          {showSaveButton ? (
            <>
              <a href={svgHref} download={markerFileName(dictionary, id)}>
                Save
              </a>{' '}
              this marker as SVG
            </>
          ) : null}
          {showSaveButton && showPrintButton ? ', or ' : null}
          {showPrintButton ? (
            <>
              <button type="button" onClick={printMarker}>
                open
              </button>{' '}
              standard browser&apos;s print dialog to print or get the PDF.
            </>
          ) : null}
        </div>
      ) : null}

      {footer ? <div className="aruco-generator__footer">{footer}</div> : null}
    </section>
  );
}
