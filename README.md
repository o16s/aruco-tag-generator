# @o16s/aruco-tag-generator

React components and pure TypeScript helpers for generating ArUco and AprilTag markers as SVG.
It is a component-library port of [arucogen](https://github.com/okalachev/arucogen) by Oleg Kalachev
with identical dictionaries and byte-for-byte identical SVG output.

## Install

```bash
npm install @o16s/aruco-tag-generator
```

## Usage

### Headless marker

```tsx
import { ArucoMarker } from '@o16s/aruco-tag-generator';

export function Example() {
  return <ArucoMarker dictionary="april_36h11" id={42} sizeMm={80} />;
}
```

Omit `sizeMm` to let the SVG scale to its container.

### Full generator UI

```tsx
import { ArucoGenerator } from '@o16s/aruco-tag-generator';
import '@o16s/aruco-tag-generator/style.css';

export function Example() {
  return <ArucoGenerator defaultDictionary="4x4_1000" onChange={(value) => console.log(value)} />;
}
```

`ArucoGenerator` provides the same controls as arucogen: dictionary select, marker id (clamped to the
dictionary size), marker size in mm, a "Save" link that downloads `<dictionary>-<id>.svg`, and a
button that opens the browser print dialog showing only the marker and its id.

### Helpers (no React needed)

```ts
import { markerSvgString, markerSvgDataUri, markerFileName, ARUCO_DICTIONARIES } from '@o16s/aruco-tag-generator';

const svg = markerSvgString('6x6_1000', 7, { sizeMm: 100 });
const href = markerSvgDataUri(svg);
const name = markerFileName('6x6_1000', 7); // "6x6_1000-7.svg"
```

Lower-level helpers: `decodeMarkerBits`, `markerRects`, `markerGeometry`, `getDictionary`,
`getMarkerBytes`, `clampMarkerId`.

## Dictionaries

| Name | Label | Bits | Markers |
|---|---|---|---|
| `aruco` | Original ArUco | 5x5 | 1024 |
| `4x4_1000` | 4x4 (50, 100, 250, 1000) | 4x4 | 1000 |
| `5x5_1000` | 5x5 (50, 100, 250, 1000) | 5x5 | 1000 |
| `6x6_1000` | 6x6 (50, 100, 250, 1000) | 6x6 | 1000 |
| `7x7_1000` | 7x7 (50, 100, 250, 1000) | 7x7 | 1000 |
| `mip_36h12` | MIP_36h12 | 6x6 | 250 |
| `april_16h5` | AprilTag 16h5 | 4x4 | 30 |
| `april_25h9` | AprilTag 25h9 | 5x5 | 35 |
| `april_36h10` | AprilTag 36h10 | 6x6 | 2320 |
| `april_36h11` | AprilTag 36h11 | 6x6 | 587 |

The `_50`, `_100` and `_250` OpenCV dictionaries are prefixes of the `_1000` ones, so use the
`_1000` dictionary with a smaller id.

## Notes

- The SVG has a one-cell black border and uses `shape-rendering="crispEdges"`.
- By default neighbouring white cells overlap by half a cell (`fixPdfArtifacts`) so PDF viewers do
  not draw hairline seams. Pass `fixPdfArtifacts={false}` for plain 1x1 cells.
- The download URI uses `image/svg+xml` (arucogen uses the non-standard `image/svg`).

## Development

```bash
npm install
npm run dev
npm run storybook
npm run test:unit
npm run lint
npm run build
```

Releases: publishing a GitHub release runs `.github/workflows/release.yml`, which lints, tests,
builds, packs, and publishes to npm when the `NPM_TOKEN` secret is set.

## Credits

Dictionary data comes from [arucogen](https://github.com/okalachev/arucogen) (MIT, Oleg Kalachev),
derived from OpenCV's `predefined_dictionaries.hpp`. See the
[OpenCV ArUco tutorial](https://docs.opencv.org/4.x/d5/dae/tutorial_aruco_detection.html).
