const PRINTING_CLASS = 'atg-printing';
const ACTIVE_CLASS = 'is-active';

/**
 * Print only `node` (an `.atg-print` element that lives directly under `document.body`).
 * Adds `atg-printing` to body and a temporary `@page` rule, opens the print dialog and
 * cleans up on `afterprint`. No-op outside a browser. See docs/spec.md §6.2.
 */
export function printArea(node: HTMLElement | null, page = 'size: A4; margin: 0'): void {
  if (typeof window === 'undefined' || !node) {
    return;
  }
  const style = document.createElement('style');
  style.textContent = `@page { ${page} }`;
  const cleanup = () => {
    document.body.classList.remove(PRINTING_CLASS);
    node.classList.remove(ACTIVE_CLASS);
    style.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  document.body.classList.add(PRINTING_CLASS);
  node.classList.add(ACTIVE_CLASS);
  document.head.appendChild(style);
  window.addEventListener('afterprint', cleanup);
  window.print();
}
