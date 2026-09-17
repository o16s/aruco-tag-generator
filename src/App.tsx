import { ArucoGenerator } from './components/ArucoGenerator';
import { ArucoSheetGenerator } from './components/ArucoSheetGenerator';
import { ArucoScanner } from './components/ArucoScanner';

const credit = (
  <span>
    Dictionaries from OpenCV via{' '}
    <a href="https://github.com/okalachev/arucogen">arucogen</a>.
  </span>
);

function App() {
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 16, display: 'grid', gap: 32 }}>
      <section>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 12px' }}>Single marker</h1>
        <ArucoGenerator footer={credit} />
      </section>
      <section>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 12px' }}>Label sheets</h1>
        <ArucoSheetGenerator footer={credit} />
      </section>
      <section>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 12px' }}>Scanner</h1>
        <ArucoScanner />
      </section>
      <footer style={{ display: 'flex', justifyContent: 'center', padding: '24px 0 8px' }}>
        <a href="https://octanis.ch/en" aria-label="Octanis Instruments" style={{ opacity: 0.55, transition: 'opacity 120ms' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.55')}>
          <img src={`${import.meta.env.BASE_URL}octanis-logo.webp`} alt="Octanis" height={22} style={{ display: 'block', height: 22, width: 'auto' }} />
        </a>
      </footer>
    </main>
  );
}

export default App;
