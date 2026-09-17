import { useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ARUCO_DICTIONARIES, ARUCO_DICTIONARY_GROUPS, type ArucoDictionaryName } from '../lib/aruco/dictionaries';
import '../styles/atg.css';

/** Grouped dictionary select. Uncontrolled: read it through the form's FormData. */
export function DictionarySelect({ id, defaultValue }: { id: string; defaultValue: ArucoDictionaryName }) {
  return (
    <select id={id} name="dict" className="atg-input" defaultValue={defaultValue}>
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
  );
}

/**
 * Renders `children` in a hidden `.atg-print` element directly under `document.body`, so the
 * print stylesheet can hide every other body child. Nothing renders during SSR.
 */
export function PrintPortal({ nodeRef, children }: { nodeRef: RefObject<HTMLDivElement | null>; children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  if (!mounted) {
    return null;
  }
  return createPortal(
    <div className="atg atg-print" ref={nodeRef}>
      {children}
    </div>,
    document.body,
  );
}

const subscribeNever = () => () => {};
