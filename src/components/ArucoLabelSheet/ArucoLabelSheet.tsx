import type { ArucoDictionaryName } from '../../lib/aruco/dictionaries';
import { A4, LABEL_FONT, labelOrigin, type SheetGeometry } from '../../lib/aruco/label';
import { ArucoLabel } from '../ArucoLabel';

export interface ArucoLabelSheetProps {
  dictionary: ArucoDictionaryName;
  /** IDs per page, e.g. from `sheetPages()`. */
  pages: readonly (readonly number[])[];
  geometry: SheetGeometry;
  /** Render only this page (0-based). Omit to render every page. */
  pageIndex?: number;
  digits?: number;
  cutLines?: boolean;
  /** Small muted line in the bottom page margin, e.g. dictionary and marker size. */
  footer?: (pageIndex: number, pageCount: number) => string;
  className?: string;
}

/** A4 pages of labels as SVG elements. Print CSS breaks after each page. */
export function ArucoLabelSheet({
  dictionary,
  pages,
  geometry,
  pageIndex,
  digits,
  cutLines,
  footer,
  className,
}: ArucoLabelSheetProps) {
  const shown = pageIndex === undefined ? pages : pages.slice(pageIndex, pageIndex + 1);
  return (
    <>
      {shown.map((ids, page) => (
        <svg
          key={pageIndex ?? page}
          className={`atg-sheet__page ${className ?? ''}`.trim()}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${A4.width} ${A4.height}`}
          width={`${A4.width}mm`}
          height={`${A4.height}mm`}
          role="img"
          aria-label={`Label sheet page ${(pageIndex ?? page) + 1} of ${pages.length}`}
        >
          {ids.map((id, index) => {
            const { x, y } = labelOrigin(geometry, index);
            return (
              <ArucoLabel
                key={id}
                dictionary={dictionary}
                id={id}
                widthMm={geometry.width}
                heightMm={geometry.height}
                digits={digits}
                cutLines={cutLines}
                x={x}
                y={y}
                width={geometry.width}
                height={geometry.height}
              />
            );
          })}
          {footer ? (
            <text
              x={A4.width / 2}
              y={A4.height - 2}
              fontSize={2.2}
              fontFamily={LABEL_FONT}
              fill="#6b7280"
              textAnchor="middle"
            >
              {footer(pageIndex ?? page, pages.length)}
            </text>
          ) : null}
        </svg>
      ))}
    </>
  );
}
