import { ArucoGenerator } from './components/ArucoGenerator';

function App() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontWeight: 'normal', textAlign: 'center', fontSize: 22, margin: '20px 20px 40px' }}>
        ArUco markers generator
      </h1>
      <ArucoGenerator
        footer={
          <span>
            See the{' '}
            <a href="https://docs.opencv.org/4.x/d5/dae/tutorial_aruco_detection.html">OpenCV documentation</a>{' '}
            to learn about ArUco markers. Dictionaries from{' '}
            <a href="https://github.com/okalachev/arucogen">arucogen</a> by Oleg Kalachev.
          </span>
        }
      />
    </main>
  );
}

export default App;
