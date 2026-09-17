import type { SVGProps } from 'react';
import type { ArucoDictionaryName } from '../../lib/aruco/dictionaries';
import { LABEL_FONT, layoutLabel, markerModules } from '../../lib/aruco/label';
import { ArucoMarker } from '../ArucoMarker';

export interface ArucoLabelProps extends Omit<SVGProps<SVGSVGElement>, 'id' | 'viewBox'> {
  dictionary: ArucoDictionaryName;
  id: number;
  /** Label size in millimetres. */
  widthMm: number;
  heightMm: number;
  /** Digit count used to size the ID text, so a whole range shares one font size. */
  digits?: number;
  /** Draw a dashed 0.2 mm border for cutting. */
  cutLines?: boolean;
}

/** One label: marker with quiet zone and the ID, laid out per docs/spec.md §5.5. Units are mm. */
export function ArucoLabel({
  dictionary,
  id,
  widthMm,
  heightMm,
  digits = String(id).length,
  cutLines = false,
  ...svgProps
}: ArucoLabelProps) {
  const l = layoutLabel(widthMm, heightMm, markerModules(dictionary), digits);
  return (
    <svg
      viewBox={`0 0 ${widthMm} ${heightMm}`}
      xmlns="http://www.w3.org/2000/svg"
      width={`${widthMm}mm`}
      height={`${heightMm}mm`}
      {...svgProps}
    >
      {cutLines ? (
        <rect
          x={0.1}
          y={0.1}
          width={widthMm - 0.2}
          height={heightMm - 0.2}
          fill="none"
          stroke="#9ca3af"
          strokeWidth={0.2}
          strokeDasharray="1 1"
        />
      ) : null}
      <ArucoMarker dictionary={dictionary} id={id} x={l.markerX} y={l.markerY} width={l.markerSize} height={l.markerSize} />
      <text
        x={l.textX}
        y={l.textY}
        fontSize={l.fontSize}
        fontFamily={LABEL_FONT}
        fontWeight={700}
        textAnchor={l.textAnchor}
        style={{ fontVariantNumeric: 'tabular-nums' }}
        fill="#000"
      >
        {id}
      </text>
    </svg>
  );
}
