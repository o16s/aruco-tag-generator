import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArucoGenerator } from './components/ArucoGenerator';
import { ArucoScanner } from './components/ArucoScanner';
import { ArucoSheetGenerator } from './components/ArucoSheetGenerator';

type Tab = 'scan' | 'generate';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'scan', label: 'Scan', hint: 'Read markers with the camera' },
  { id: 'generate', label: 'Generate', hint: 'Print markers and label sheets' },
];

const tabFromHash = (): Tab => (window.location.hash === '#generate' ? 'generate' : 'scan');

const credit = (
  <span>
    Dictionaries from OpenCV via <a href="https://github.com/okalachev/arucogen">arucogen</a>.
  </span>
);

function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  // The Generate panel stays mounted so edits survive a tab switch. The Scan panel mounts only
  // while active, which releases the camera when the user leaves it.
  const [generateMounted, setGenerateMounted] = useState(tab === 'generate');
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ scan: null, generate: null });

  useEffect(() => {
    const onHash = () => {
      const next = tabFromHash();
      if (next === 'generate') {
        setGenerateMounted(true);
      }
      setTab(next);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const select = (next: Tab) => {
    if (next === 'generate') {
      setGenerateMounted(true);
    }
    setTab(next);
    history.replaceState(null, '', next === 'scan' ? '#scan' : '#generate');
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((entry) => entry.id === tab);
    const move = { ArrowRight: 1, ArrowLeft: -1, Home: -index, End: TABS.length - 1 - index }[event.key];
    if (move === undefined) {
      return;
    }
    event.preventDefault();
    select(TABS[(index + move + TABS.length) % TABS.length].id);
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__mark" aria-hidden="true" />
          <span className="app__title">ArUco tags</span>
        </div>
        <div className="app__tabs" role="tablist" aria-label="Sections" onKeyDown={onKeyDown}>
          {TABS.map((entry) => (
            <button
              key={entry.id}
              ref={(el) => {
                tabRefs.current[entry.id] = el;
              }}
              id={`tab-${entry.id}`}
              type="button"
              role="tab"
              className="app__tab"
              aria-selected={tab === entry.id}
              aria-controls={`panel-${entry.id}`}
              tabIndex={tab === entry.id ? 0 : -1}
              title={entry.hint}
              onClick={() => select(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </header>

      <main className="app__main">
        {tab === 'scan' ? (
          <section id="panel-scan" role="tabpanel" aria-labelledby="tab-scan" className="app__panel">
            <ArucoScanner />
          </section>
        ) : null}
        {generateMounted ? (
          <section
            id="panel-generate"
            role="tabpanel"
            aria-labelledby="tab-generate"
            className="app__panel"
            hidden={tab !== 'generate'}
          >
            <h2 className="app__heading">Single marker</h2>
            <ArucoGenerator footer={credit} />
            <h2 className="app__heading">Label sheets</h2>
            <ArucoSheetGenerator footer={credit} />
          </section>
        ) : null}
      </main>

      <footer className="app__footer">
        <a href="https://octanis.ch/en" aria-label="Octanis Instruments" className="app__logo">
          <img src={`${import.meta.env.BASE_URL}octanis-logo.webp`} alt="Octanis" height={22} />
        </a>
      </footer>
    </div>
  );
}

export default App;
