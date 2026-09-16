import { PRINTING_CLASS } from './constants';

/**
 * Open the browser print dialog showing only the contents of `.aruco-generator__print-area`
 * (the marker and its id). Mirrors arucogen's print stylesheet, scoped so it works inside any
 * host page. No-op outside a browser.
 */
export function printMarker(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const { body } = document;
  const cleanup = () => {
    body.classList.remove(PRINTING_CLASS);
    window.removeEventListener('afterprint', cleanup);
  };
  body.classList.add(PRINTING_CLASS);
  window.addEventListener('afterprint', cleanup);
  window.print();
}
