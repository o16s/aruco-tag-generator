# @o16s/aruco-tag-generator

React components and pure TypeScript helpers for ArUco and AprilTag markers: single markers as SVG, and ranges of markers laid out on A4 label sheets (Avery presets or a custom label size). Marker dictionaries come from OpenCV via [arucogen](https://github.com/okalachev/arucogen). The UI, print layouts and layout rules are original and specified in [docs/spec.md](docs/spec.md).

**Demo:** https://o16s.github.io/aruco-tag-generator/ · **Storybook:** https://o16s.github.io/aruco-tag-generator/storybook/

## Install

```bash
npm install @o16s/aruco-tag-generator
```

## Components

```tsx
import { ArucoGenerator, ArucoSheetGenerator } from '@o16s/aruco-tag-generator';
import '@o16s/aruco-tag-generator/style.css';

export function Example() {
  return (
    <>
      <ArucoGenerator defaultDictionary="4x4_1000" onChange={(v) => console.log(v)} />
      <ArucoSheetGenerator defaultSheet="L7160" defaultFrom={0} defaultTo={20} />
    </>
  );
}
```

| Component | What it does |
|---|---|
| `ArucoGenerator` | Dictionary, ID stepper and size. Preview, **Print / PDF** (marker, ID and dictionary name on one page) and **Download SVG**. |
| `ArucoSheetGenerator` | Dictionary, ID range and label sheet (12 Avery A4 presets or a custom size with cut lines). Paged preview, **Print / PDF** and **Download SVG** per page. |
| `ArucoScanner` | Camera scanner: finds markers of the selected dictionary in the live video and overlays ID, dictionary, distance and an XYZ gizmo (OpenCV ArUco or AprilTag axis convention). Needs HTTPS. |
| `ArucoMarker` | Headless SVG marker. `sizeMm` sets physical size; omit it to scale to the container. Accepts SVG props such as `x`, `y`, `width`, `height`. |
| `ArucoLabel` | Headless label: marker, quiet zone and ID. Rectangular labels put the ID right of the marker at marker height, near-square labels put it below. |
| `ArucoLabelSheet` | Headless A4 pages of labels for a list of IDs and a sheet geometry. |

Both generators are one `.atg` card that adapts to the width of its container, inherits the host font, and prints only its own content.

### Theming

Override the tokens on the component or any ancestor:

```css
.my-page { --atg-accent: #0f766e; --atg-radius: 2px; --atg-surface-2: #ecfdf5; }
```

Tokens: `--atg-accent`, `--atg-on-accent`, `--atg-fg`, `--atg-muted`, `--atg-border`, `--atg-surface`, `--atg-surface-2`, `--atg-radius`, `--atg-gap`. There is no automatic dark mode; set dark values yourself.

## Scanner

Detection is a vendored ES-module build of [js-aruco2](https://github.com/damianofalcioni/js-aruco2) (MIT) fed with this package's own dictionaries, so it reads exactly what the generators print. Pose comes from POSIT with a pinhole model (principal point at the centre, focal length from the field-of-view field, no distortion): axis directions are reliable, distance is an estimate. Helpers: `createDetector`, `estimatePose`, `gizmoSegments`, `AXIS_CONVENTIONS`.

## Helpers (no React needed)

```ts
import {
  markerSvgString, markerSvgDataUri, markerFileName,
  layoutLabel, layoutSheet, sheetPages, getPreset, LABEL_SHEET_PRESETS,
} from '@o16s/aruco-tag-generator';

const svg = markerSvgString('6x6_1000', 7, { sizeMm: 100 });
const sheet = layoutSheet(getPreset('L7160'));   // { cols: 3, rows: 7, left: 7.25, top: 15.15, ... }
const pages = sheetPages(0, 41, sheet.perPage);  // [[0..20], [21..41]]
const label = layoutLabel(63.5, 38.1, 6, 2);     // marker 28.6 mm, ID right of it
```

## Dictionaries

| Name | Bits | Markers |
|---|---|---|
| `aruco` (Original ArUco) | 5x5 | 1024 |
| `4x4_1000`, `5x5_1000`, `6x6_1000`, `7x7_1000` | 4x4 … 7x7 | 1000 each |
| `mip_36h12` | 6x6 | 250 |
| `april_16h5` | 4x4 | 30 |
| `april_25h9` | 5x5 | 35 |
| `april_36h10` | 6x6 | 2320 |
| `april_36h11` | 6x6 | 587 |

The OpenCV `_50`, `_100` and `_250` dictionaries are prefixes of the `_1000` ones, so use a smaller ID.

## Label sheets

Presets: L7651, L7636, L7654, L7159, L7160, L7161, L7162, L7163, L7164, L7173, L7165, L7169 (and their J-series inkjet twins). The grid is centred on the page, which reproduces the published Avery margins. Print with paper size A4, no margins, scale 100 %.

## Notes

- Marker SVG output is byte-for-byte identical to arucogen's generator (golden test), including the half-cell overlap that avoids seams in PDF viewers (`fixPdfArtifacts`).
- The ID text uses `Arial, Helvetica, 'Liberation Sans'`; the layout assumes that font's metrics.

## Development

```bash
npm install
npm run dev
npm run storybook
npm run test:unit
npm run lint
npm run build
```

Releases: publishing a GitHub release runs `.github/workflows/release.yml`, which lints, tests, builds, packs, and publishes to npm when the `NPM_TOKEN` secret is set.

## Credits

Dictionary data comes from [arucogen](https://github.com/okalachev/arucogen) (MIT, Oleg Kalachev), derived from OpenCV's `predefined_dictionaries.hpp`. See the [OpenCV ArUco tutorial](https://docs.opencv.org/4.x/d5/dae/tutorial_aruco_detection.html).
