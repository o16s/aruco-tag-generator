import { useEffect, useId, useRef, useState } from 'react';
import { DEFAULT_DICTIONARY, type ArucoDictionaryName } from '../../lib/aruco/dictionaries';
import { clampNumber } from '../../lib/number';
import { createDetector, type MarkerDetector } from '../../lib/scanner/detect';
import { createTracker } from '../../lib/scanner/track';
import {
  AXIS_CONVENTIONS,
  DEFAULT_CONVENTION,
  estimatePose,
  focalFromFov,
  getConvention,
  gizmoSegments,
  type Intrinsics,
} from '../../lib/scanner/pose';
import { DictionarySelect } from '../atg';
import type { ArucoScannerProps, ScannedMarker, ScannerSource } from './types';

const MAX_DETECT_WIDTH = 640;

interface Settings {
  dictionary: ArucoDictionaryName;
  convention: string;
  markerSizeMm: number;
  fovDeg: number;
}

const sourceSize = (source: ScannerSource): { width: number; height: number } => {
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  return { width: source.width, height: source.height };
};

const cameraError = (error: unknown): string => {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError') {
    return 'Camera access was denied. Allow the camera for this site and try again.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No camera was found.';
  }
  return error instanceof Error ? error.message : 'The camera could not be started.';
};

const MAX_LISTED = 8;

/** One line, bounded in length, for the markers in view (nearest first). */
function statusText(markers: ScannedMarker[], active: boolean): string {
  if (markers.length === 0) {
    return active ? 'No marker in view.' : '';
  }
  const metres = (m: ScannedMarker) => `${(m.distanceMm / 1000).toFixed(2)} m`;
  if (markers.length === 1) {
    return `ID ${markers[0].id} · ${markers[0].dictionary} · ${metres(markers[0])}`;
  }
  const listed = markers.slice(0, MAX_LISTED).map((m) => `${m.id} (${metres(m)})`);
  const more = markers.length - listed.length;
  return `${markers.length} markers · ${markers[0].dictionary}: ${listed.join(', ')}${more > 0 ? ` +${more} more` : ''}`;
}

/** Draw corners, label and the XYZ gizmo for every marker onto the overlay. */
function drawOverlay(
  ctx: CanvasRenderingContext2D,
  background: ScannerSource | null,
  markers: ScannedMarker[],
  settings: Settings,
  intrinsics: Intrinsics,
) {
  const convention = getConvention(settings.convention);
  ctx.clearRect(0, 0, intrinsics.width, intrinsics.height);
  if (background) {
    ctx.drawImage(background, 0, 0, intrinsics.width, intrinsics.height);
  }
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const marker of markers) {
    const { corners } = marker;
    ctx.globalAlpha = marker.coasting ? 0.45 : 1;
    const edge = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
    const stroke = Math.max(2, edge / 40);
    const fontPx = Math.max(14, edge / 6);

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = stroke;
    ctx.beginPath();
    corners.forEach((c, i) => (i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)));
    ctx.closePath();
    ctx.stroke();

    for (const segment of gizmoSegments(marker.pose, convention, settings.markerSizeMm / 2, intrinsics)) {
      const dx = segment.to.x - segment.from.x;
      const dy = segment.to.y - segment.from.y;
      const length = Math.hypot(dx, dy);
      ctx.strokeStyle = segment.color;
      ctx.fillStyle = segment.color;
      ctx.lineWidth = stroke * 1.5;
      ctx.beginPath();
      ctx.moveTo(segment.from.x, segment.from.y);
      ctx.lineTo(segment.to.x, segment.to.y);
      ctx.stroke();
      if (length > 1) {
        const head = Math.min(length, stroke * 6);
        const ux = dx / length;
        const uy = dy / length;
        ctx.beginPath();
        ctx.moveTo(segment.to.x, segment.to.y);
        ctx.lineTo(segment.to.x - head * ux + head * 0.5 * uy, segment.to.y - head * uy - head * 0.5 * ux);
        ctx.lineTo(segment.to.x - head * ux - head * 0.5 * uy, segment.to.y - head * uy + head * 0.5 * ux);
        ctx.closePath();
        ctx.fill();
      }
      ctx.font = `bold ${fontPx}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lx = segment.to.x + (length > 1 ? (dx / length) * fontPx * 0.8 : fontPx);
      const ly = segment.to.y + (length > 1 ? (dy / length) * fontPx * 0.8 : 0);
      ctx.lineWidth = fontPx / 5;
      ctx.strokeStyle = '#fff';
      ctx.strokeText(segment.axis.toUpperCase(), lx, ly);
      ctx.fillText(segment.axis.toUpperCase(), lx, ly);
    }

    const text = `ID ${marker.id} · ${marker.dictionary} · ${(marker.distanceMm / 1000).toFixed(2)} m`;
    ctx.font = `${fontPx}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const pad = fontPx * 0.4;
    const width = ctx.measureText(text).width + pad * 2;
    // Below the marker so the box never hides an axis label.
    const x = Math.min(Math.max(0, Math.min(...corners.map((c) => c.x))), intrinsics.width - width);
    const y = Math.min(Math.max(...corners.map((c) => c.y)) + pad * 2, intrinsics.height - fontPx - pad * 2);
    ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
    ctx.fillRect(x, y, width, fontPx + pad * 2);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x + pad, y + pad);
  }
  ctx.globalAlpha = 1;
}

export function ArucoScanner({
  defaultDictionary = DEFAULT_DICTIONARY,
  defaultConvention = DEFAULT_CONVENTION,
  defaultMarkerSizeMm = 100,
  defaultHorizontalFovDeg = 60,
  enterHits = 2,
  holdMs = 200,
  alpha = 0.6,
  source,
  onDetect,
  className,
}: ArucoScannerProps) {
  const [settings, setSettings] = useState<Settings>({
    dictionary: defaultDictionary,
    convention: defaultConvention,
    markerSizeMm: clampNumber(defaultMarkerSizeMm, 1, 10000),
    fovDeg: clampNumber(defaultHorizontalFovDeg, 10, 170),
  });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [cameraCount, setCameraCount] = useState(0);
  const [markers, setMarkers] = useState<ScannedMarker[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [cameraLabel, setCameraLabel] = useState<string | null>(null);
  const fovInput = useRef<HTMLInputElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const latest = useRef({ settings, onDetect });
  useEffect(() => {
    latest.current = { settings, onDetect };
  });
  const uid = useId();

  const stop = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) {
      video.current.srcObject = null;
    }
    setRunning(false);
  };

  const start = async (facingMode = facing) => {
    setError(null);
    if (!window.isSecureContext) {
      setError('The camera needs a secure context (HTTPS or localhost).');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support camera access.');
      return;
    }
    try {
      stop();
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      stream.current = media;
      if (video.current) {
        video.current.srcObject = media;
        await video.current.play();
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameraCount(devices.filter((device) => device.kind === 'videoinput').length);
      // The track reports resolution and facing mode, but no browser exposes focal length or field of view.
      const track = media.getVideoTracks()[0];
      const info = track?.getSettings();
      setCameraLabel(track ? `${track.label || 'Camera'} · ${info?.width ?? '?'} × ${info?.height ?? '?'}` : null);
      setRunning(true);
    } catch (cause) {
      setError(cameraError(cause));
    }
  };

  const toggleFullscreen = async () => {
    const el = stage.current;
    if (!el) {
      return;
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (!fullscreen && el.requestFullscreen) {
      try {
        await el.requestFullscreen();
        return;
      } catch {
        // fall through to the CSS fallback
      }
    }
    setFullscreen((value) => !value);
  };

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === stage.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  /**
   * Field of view from one measurement: distance scales linearly with focal length, so
   * f_true = f_current × measured / estimated. Needs exactly one marker in view.
   */
  const calibrate = () => {
    const marker = markers[0];
    const data = form.current ? new FormData(form.current) : null;
    const measured = Number(data?.get('measured'));
    if (!marker || markers.length !== 1 || !(measured > 0)) {
      return;
    }
    const width = overlay.current?.width || 1;
    const focal = focalFromFov(width, settings.fovDeg) * (measured / marker.distanceMm);
    const fovDeg = clampNumber((2 * Math.atan(width / 2 / focal) * 180) / Math.PI, 10, 170);
    if (fovInput.current) {
      fovInput.current.value = fovDeg.toFixed(1);
    }
    setSettings({ ...settings, fovDeg });
  };

  const switchCamera = () => {
    const next = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    void start(next);
  };

  // Detection loop: runs while the camera is on, or always when an element source is given.
  useEffect(() => {
    const active = source ?? (running ? video.current : null);
    if (!active || !overlay.current) {
      return;
    }
    const canvas = overlay.current;
    const ctx = canvas.getContext('2d');
    const scratch = document.createElement('canvas');
    const scratchCtx = scratch.getContext('2d', { willReadFrequently: true });
    if (!ctx || !scratchCtx) {
      return;
    }
    let detector: MarkerDetector | null = null;
    let frame = 0;
    let cancelled = false;
    const tracker = createTracker({ enterHits, holdMs, alpha });

    const tick = () => {
      if (cancelled) {
        return;
      }
      frame = requestAnimationFrame(tick);
      const { settings: current, onDetect: notify } = latest.current;
      const { width, height } = sourceSize(active);
      if (!width || !height || (active instanceof HTMLVideoElement && active.readyState < 2)) {
        return;
      }
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      if (!detector || detector.dictionary !== current.dictionary) {
        detector = createDetector(current.dictionary);
        tracker.reset();
      }
      const scale = Math.min(1, MAX_DETECT_WIDTH / width);
      scratch.width = Math.round(width * scale);
      scratch.height = Math.round(height * scale);
      scratchCtx.drawImage(active, 0, 0, scratch.width, scratch.height);
      const intrinsics: Intrinsics = { width, height, focal: focalFromFov(width, current.fovDeg) };
      const raw = detector
        .detect(scratchCtx.getImageData(0, 0, scratch.width, scratch.height))
        .map((marker) => ({ ...marker, corners: marker.corners.map((c) => ({ x: c.x / scale, y: c.y / scale })) }));
      // Hysteresis + smoothing: appear after two hits, survive short gaps, no corner jitter.
      const found: ScannedMarker[] = tracker
        .update(raw, performance.now())
        .map((marker) => {
          const { corners } = marker;
          const pose = estimatePose(corners, intrinsics, current.markerSizeMm);
          const [tx, ty, tz] = pose.translation;
          return { ...marker, corners, dictionary: current.dictionary, pose, distanceMm: Math.hypot(tx, ty, tz) };
        })
        .sort((a, b) => a.distanceMm - b.distanceMm);
      drawOverlay(ctx, active instanceof HTMLVideoElement ? null : active, found, current, intrinsics);
      setMarkers((previous) =>
        previous.length === found.length && previous.every((m, i) => m.id === found[i].id && Math.abs(m.distanceMm - found[i].distanceMm) < 5)
          ? previous
          : found,
      );
      notify?.(found);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [source, running, enterHits, holdMs, alpha]);

  useEffect(() => stop, []);

  const update = () => {
    if (!form.current) {
      return;
    }
    const data = new FormData(form.current);
    setSettings({
      dictionary: String(data.get('dict')) as ArucoDictionaryName,
      convention: String(data.get('convention')),
      markerSizeMm: clampNumber(Number(data.get('size')), 1, 10000),
      fovDeg: clampNumber(Number(data.get('fov')), 10, 170),
    });
  };

  const convention = getConvention(settings.convention);

  return (
    <section className={`atg ${className ?? ''}`.trim()}>
      <div className="atg-card">
        <div className="atg-preview atg-scanner">
          <div ref={stage} className={`atg-scanner__stage ${fullscreen ? 'is-fullscreen' : ''}`.trim()}>
            {source ? null : <video ref={video} className="atg-scanner__video" playsInline muted autoPlay />}
            <canvas ref={overlay} className="atg-scanner__overlay" aria-label="Detected markers" role="img" />
            {fullscreen ? (
              <button type="button" className="atg-btn atg-scanner__exit" onClick={() => void toggleFullscreen()} aria-label="Exit fullscreen">
                ×
              </button>
            ) : null}
          </div>
          {error ? (
            <p className="atg-preview__error" role="alert">
              {error}
            </p>
          ) : null}
          <p className="atg-scanner__status" aria-live="polite" data-detections={markers.length}>
            {statusText(markers, running || Boolean(source))}
          </p>
        </div>

        <form ref={form} className="atg-controls" onSubmit={(event) => event.preventDefault()} onChange={update}>
          {source ? null : (
            <div className="atg-actions">
              {running ? (
                <button type="button" className="atg-btn" onClick={stop}>
                  Stop camera
                </button>
              ) : (
                <button type="button" className="atg-btn atg-btn--primary" onClick={() => void start()}>
                  Start camera
                </button>
              )}
              {running && cameraCount > 1 ? (
                <button type="button" className="atg-btn" onClick={switchCamera}>
                  Switch camera
                </button>
              ) : null}
              {running ? (
                <button type="button" className="atg-btn" onClick={() => void toggleFullscreen()}>
                  Fullscreen
                </button>
              ) : null}
            </div>
          )}

          <div className="atg-field">
            <label className="atg-label" htmlFor={`${uid}-dict`}>
              Dictionary
            </label>
            <DictionarySelect id={`${uid}-dict`} defaultValue={settings.dictionary} />
          </div>

          <div className="atg-field">
            <label className="atg-label" htmlFor={`${uid}-convention`}>
              Axis convention
            </label>
            <select id={`${uid}-convention`} name="convention" className="atg-input" defaultValue={settings.convention}>
              {AXIS_CONVENTIONS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
            <p className="atg-help">
              <span style={{ color: '#e11d48' }}>X</span> <span style={{ color: '#16a34a' }}>Y</span>{' '}
              <span style={{ color: '#2563eb' }}>Z</span> · {convention.description}
            </p>
          </div>

          <div className="atg-field atg-field--row">
            <div className="atg-field">
              <label className="atg-label" htmlFor={`${uid}-size`}>
                Marker size
              </label>
              <div className="atg-unit">
                <input id={`${uid}-size`} className="atg-input" name="size" type="number" inputMode="decimal" min={1} max={10000} defaultValue={settings.markerSizeMm} />
                <span aria-hidden="true">mm</span>
              </div>
            </div>
            <div className="atg-field">
              <label className="atg-label" htmlFor={`${uid}-fov`}>
                Camera field of view
              </label>
              <div className="atg-unit">
                <input ref={fovInput} id={`${uid}-fov`} className="atg-input" name="fov" type="number" inputMode="decimal" min={10} max={170} step="any" defaultValue={settings.fovDeg} />
                <span aria-hidden="true">°</span>
              </div>
            </div>
          </div>
          <p className="atg-help">
            Marker size and field of view only affect the distance estimate. Browsers do not report the field of view
            {cameraLabel ? ` (${cameraLabel})` : ''}. To calibrate, hold one marker at a measured distance and enter it here.
          </p>
          <div className="atg-field atg-field--row">
            <div className="atg-field">
              <label className="atg-label" htmlFor={`${uid}-measured`}>
                Measured distance
              </label>
              <div className="atg-unit">
                <input id={`${uid}-measured`} className="atg-input" name="measured" type="number" inputMode="decimal" min={1} step="any" />
                <span aria-hidden="true">mm</span>
              </div>
            </div>
            <button type="button" className="atg-btn" style={{ alignSelf: 'end' }} onClick={calibrate} disabled={markers.length !== 1}>
              Calibrate field of view
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
