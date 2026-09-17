# Specification: ArUco tag generator components

Version 1.0. This document is the source of truth for the user interface, the print layouts, and the label sheets. When the code and this document do not agree, update one of them in the same change.

The text obeys ASD-STE100 Simplified Technical English in pragmatic mode. Code names, file names, and UI labels are technical names and stay as written.

## 1. Purpose and scope

The package `@o16s/aruco-tag-generator` gives React components that make ArUco and AprilTag markers as SVG. A host page can embed the components in its own design. The components do not copy the layout, the text, or the styles of other generators.

This document covers:

- The single-marker generator `ArucoGenerator`.
- The label-sheet generator `ArucoSheetGenerator`.
- The headless parts `ArucoMarker`, `ArucoLabel`, and `ArucoLabelSheet`.
- The print layouts.
- The theme tokens and the embedding rules.

This document does not cover the marker dictionaries. The dictionaries come from OpenCV and are described in the README.

## 2. Terms

Each term has one name in this document, in the code, and in the UI.

| Term | Meaning |
|---|---|
| marker | One ArUco or AprilTag pattern, with its black border. |
| dictionary | A named set of markers, for example `4x4_1000`. |
| ID | The number of a marker in its dictionary. The first ID is 0. |
| module | One cell of the marker grid. A `4x4_1000` marker has 6 modules on each side, border included. |
| marker size | The side length of the marker in millimeters, border included. |
| quiet zone | The white space around the marker. A camera needs this space to find the marker. |
| label | One rectangle on a sheet. It holds one marker and one ID. |
| sheet | One A4 page of labels. |
| preset | A named label geometry that matches a product, for example Avery L7160. |
| range | The IDs from a first ID to a last ID, both included. |
| host page | The web page that embeds a component. |
| token | A CSS custom property that sets one color, one radius, or one distance. |

## 3. Components and exports

The package exports these components:

| Component | Type | Function |
|---|---|---|
| `ArucoMarker` | headless | Shows one marker as an SVG element. |
| `ArucoLabel` | headless | Shows one label: marker, quiet zone, and ID, as an SVG element. |
| `ArucoLabelSheet` | headless | Shows one or more A4 pages of labels as SVG elements. |
| `ArucoGenerator` | UI | A form and a preview for one marker, with print and download. |
| `ArucoSheetGenerator` | UI | A form and a preview for a range of markers on label sheets, with print and download. |

Headless components have no stylesheet. UI components import one stylesheet, `src/styles/atg.css`.

The package also exports pure functions. The functions have no React dependency. The layout functions are `layoutLabel`, `layoutSheet`, and `sheetPages`. The marker functions are described in the README.

## 4. `ArucoGenerator`

### 4.1 Layout

The component is one card. The card has two panes:

- The preview pane shows the marker, the ID, and the dictionary name.
- The control pane shows the form and the action buttons.

If the card is 720 px wide or more, the preview pane is on the left and the control pane is on the right. If the card is narrower, the preview pane is on top and the control pane is below it.

The card measures its own width, not the width of the browser window. Thus the layout is correct in a narrow column of the host page.

### 4.2 Controls

The control pane has these fields, in this order:

1. Dictionary. A select with two groups, "Standard" and "AprilTag".
2. Marker ID. A stepper: a decrease button, a number input, and an increase button. A helper text shows the permitted range, for example "0 – 999".
3. Marker size. A number input with the unit "mm" after the value. The permitted range is 10 mm to 190 mm. The maximum is the A4 width minus two page margins of 10 mm.

The component clamps the ID into its permitted range. If the user selects a smaller dictionary, the component decreases the ID to the last ID of that dictionary.

The component does not clamp the marker size. If the size is outside the permitted range, the component shows an error below the field and disables the two buttons. The preview keeps the last valid size. Thus a printed marker always has the size that the user entered.

The buttons are below the fields:

- "Print / PDF" is the primary button. It opens the print dialog of the browser.
- "Download SVG" is the secondary button. It downloads the marker as `<dictionary>-<ID>.svg`.

### 4.3 Preview

The preview pane shows:

- The marker, with a width of not more than 320 px.
- The ID below the marker, in a large semibold font with tabular figures.
- The dictionary name below the ID, in a smaller muted font.

The preview has the same order of elements as the printed page.

### 4.4 Print layout for one marker

The printed page has these elements, from top to bottom:

1. The marker, at the marker size in millimeters, centered on the page.
2. The ID, centered, with a cap height of 10 % of the marker size. The text is the number only, without a prefix.
3. The dictionary name, centered, with a cap height of 5 % of the marker size, but not less than 3 mm.

The space between the marker and the ID is 10 % of the marker size. The page margin is 10 mm. The print shows nothing else from the host page.

## 5. `ArucoSheetGenerator`

### 5.1 Layout

The component uses the same card, the same panes, and the same breakpoint as `ArucoGenerator`.

### 5.2 Controls

The control pane has these fields, in this order:

1. Dictionary. The same select as in `ArucoGenerator`.
2. ID range. Two number inputs, "From" and "To". A helper text shows the count, for example "21 labels".
3. Label sheet. A select with the presets from section 5.3 and the item "Custom size".
4. If the user selects "Custom size", three more number inputs appear: "Width", "Height", and "Gap", all in millimeters. A checkbox "Cut lines" also appears.

A summary line below the fields shows the result, for example "21 per page · 2 pages · marker 28.6 mm".

The component clamps the range into the dictionary. If "From" is larger than "To", the component swaps the two values.

The buttons are the same as in `ArucoGenerator`. "Download SVG" downloads the page that the preview shows, as `<dictionary>-<from>-<to>-page<n>.svg`.

### 5.3 Presets

All presets are for A4 paper, 210 mm × 297 mm, in portrait orientation. A preset has a label width, a label height, a column count, a row count, a column gap, and a row gap. The component centers the grid on the page. Thus the left margin and the top margin follow from the other values.

| Preset | Label (mm) | Columns × rows | Column gap (mm) | Row gap (mm) |
|---|---|---|---|---|
| L7651 / J8651 | 38.1 × 21.2 | 5 × 13 | 2.5 | 0 |
| L7636 / J8636 | 45.7 × 21.2 | 4 × 12 | 2.5 | 0 |
| L7654 / J8654 | 45.7 × 25.4 | 4 × 10 | 2.5 | 0 |
| L7159 / J8159 | 63.5 × 33.9 | 3 × 8 | 2.5 | 0 |
| L7160 / J8160 | 63.5 × 38.1 | 3 × 7 | 2.5 | 0 |
| L7161 / J8161 | 63.5 × 46.6 | 3 × 6 | 2.5 | 0 |
| L7162 / J8162 | 99.1 × 33.9 | 2 × 8 | 2.5 | 0 |
| L7163 / J8163 | 99.1 × 38.1 | 2 × 7 | 2.5 | 0 |
| L7164 / J8164 | 63.5 × 72.0 | 3 × 4 | 2.5 | 0 |
| L7173 / J8173 | 99.1 × 57.0 | 2 × 5 | 2.5 | 0 |
| L7165 / J8165 | 99.1 × 67.7 | 2 × 4 | 2.5 | 0 |
| L7169 / J8169 | 99.1 × 139.0 | 2 × 2 | 2.5 | 0 |

The L7160 preset gives a left margin of 7.25 mm and a top margin of 15.15 mm. These values agree with the published Avery template.

### 5.4 Custom size

For a custom size, the page margin is 10 mm on all sides. The gap applies between columns and between rows. The column count is the largest integer that fits in the printable width. The row count is the largest integer that fits in the printable height.

If the label does not fit in the printable area, the component shows an error and disables the two buttons. The maximum label size is 190 mm × 277 mm.

If "Cut lines" is on, each label gets a dashed border with a line width of 0.2 mm.

### 5.5 Label layout

The layout function gets the label width `w`, the label height `h`, and the module count `n` of the dictionary. The module count includes the border. A `4x4_1000` marker has `n = 6`.

The quiet zone `q` is one module, but not less than 2 mm.

If `w` is 1.5 × `h` or more, the label is rectangular:

- The marker size is `s = h × n / (n + 2)`. If one module of that marker is less than 2 mm, then `q = 2 mm` and `s = h − 4 mm`.
- The marker is at the left, with the quiet zone on all sides.
- The ID is at the right of the marker. The distance from the marker is `q`.
- The cap height of the ID is `s`. The digits align with the bottom of the marker.
- If the ID does not fit in the remaining width, the component decreases the font size until it fits.

If `w` is less than 1.5 × `h`, the label is near-square:

- The marker size is the smaller of `w − 2q` and `(h − 3q) / 1.15`.
- The marker is centered horizontally, with the quiet zone above it.
- The ID is centered below the marker. The cap height of the ID is 15 % of `s`.

The digit count for the font size is the digit count of the last ID in the range. Thus all labels of one range have one font size.

The ID font is bold, with tabular figures. The font stack is `Arial, Helvetica, 'Liberation Sans', sans-serif`. The cap height of this font is 0.716 of the font size.

### 5.6 Pages

One page holds `columns × rows` labels. The page count is the label count divided by the labels per page, rounded up. The maximum page count is 100. If the range needs more pages, the component shows an error and does not print.

The preview shows one page at a time. If there is more than one page, the preview shows "Page 1 of N" and two buttons, "Previous" and "Next".

### 5.7 Print layout for sheets

The print uses A4 paper with a page margin of 0 mm. Each sheet is one printed page. The print shows nothing else from the host page.

## 6. Theme tokens and embedding

### 6.1 Tokens

The root element of a UI component has the class `atg`. The stylesheet sets these tokens on that class, with a default value for each:

| Token | Default | Function |
|---|---|---|
| `--atg-accent` | `#1d4ed8` | Primary button, focus ring, links. |
| `--atg-on-accent` | `#ffffff` | Text on the accent color. |
| `--atg-fg` | `#111827` | Text. |
| `--atg-muted` | `#4b5563` | Helper text and captions. |
| `--atg-border` | `#d1d5db` | Borders of fields and of the card. |
| `--atg-surface` | `#ffffff` | Background of the card. |
| `--atg-surface-2` | `#f3f4f6` | Background of the preview pane. |
| `--atg-radius` | `8px` | Corner radius of the card, the fields, and the buttons. |
| `--atg-gap` | `16px` | Base distance between elements. |

A host page can set the tokens on the component or on one of its ancestors. The stylesheet does not select the `prefers-color-scheme` media query. A host page with a dark theme sets dark token values.

### 6.2 Embedding rules

- The component inherits the font family and the text color of the host page.
- All class names start with `atg`.
- The stylesheet has no rules for `body`, `html`, or bare element names.
- The print rules apply only while the class `atg-printing` is on `body`. The component adds the class before the print and removes it after the print.
- The page size and the page margin for the print come from a temporary `<style>` element. The component adds it before the print and removes it after the print.

## 7. Accessibility

- Each field has a visible label element that is linked to the input.
- Each button has a text name or an `aria-label`.
- Each marker SVG has `role="img"` and an accessible name, for example "4x4_1000 marker 42".
- Text and background have a contrast ratio of 4.5:1 or more.
- Each interactive element shows a focus ring of 2 px when it gets keyboard focus.
- Each interactive element is 44 px high or more.
- Number inputs have the correct `min`, `max`, and `step` attributes.
- Transitions stop when the user sets `prefers-reduced-motion`.

## 8. Procedures

### 8.1 Print one marker

1. Select the dictionary.
2. Set the marker ID with the stepper or with the keyboard.
3. Set the marker size in millimeters.
4. Make sure that the preview shows the correct ID.
5. Click "Print / PDF".
6. In the print dialog, set the paper size to A4, the margins to none, and the scale to 100 %.
7. Print the page, or save the page as a PDF file.

### 8.2 Print a sheet of labels

1. Select the dictionary.
2. Set "From" and "To".
3. Select the label sheet, or select "Custom size" and set the width, the height, and the gap.
4. Make sure that the summary line shows the expected page count.
5. Put the label sheets in the printer.
6. Click "Print / PDF".
7. In the print dialog, set the paper size to A4, the margins to none, and the scale to 100 %.
8. Print the pages.

### 8.3 Embed a component in a host page

1. Install the package with `npm install @o16s/aruco-tag-generator`.
2. Import the stylesheet with `import '@o16s/aruco-tag-generator/style.css'`.
3. Put `<ArucoGenerator />` or `<ArucoSheetGenerator />` in the page.
4. If the host page has a theme, set the tokens from section 6.1 on an ancestor element.

### 8.4 Add a preset

1. Get the label width, the label height, the column count, the row count, and the gaps from the product template.
2. Add one entry to `LABEL_SHEET_PRESETS` in `src/lib/aruco/label.ts`.
3. Add one row to the table in section 5.3.
4. Add one test case in `src/lib/aruco/label.test.ts` for the position of the first label.
5. Print one test sheet on plain paper and compare it with a real label sheet.

## 9. Limits

- The sheets are A4 only. US Letter is not supported.
- The maximum page count is 100.
- The maximum marker size for a single print is 190 mm. The maximum custom label size is 190 mm × 277 mm.
- The ID font depends on the fonts of the printer or the PDF viewer. The fallback fonts are metric-compatible with Arial.
- The download of a sheet gives one SVG file per page.
- The components do not read or write a URL. The host page keeps the state if it needs a deep link.
