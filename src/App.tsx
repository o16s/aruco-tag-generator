import { ArucoGenerator } from './components/ArucoGenerator';
import { ArucoSheetGenerator } from './components/ArucoSheetGenerator';

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
    </main>
  );
}

export default App;
