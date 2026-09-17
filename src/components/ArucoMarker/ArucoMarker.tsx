import { clampMarkerId } from '../../lib/aruco/dictionaries';
import { markerGeometry } from '../../lib/aruco/marker';
import type { ArucoMarkerProps } from './types';

export function ArucoMarker({
  dictionary,
  id,
  sizeMm,
  fixPdfArtifacts = true,
  className,
  style,
  title,
}: ArucoMarkerProps) {
  const markerId = clampMarkerId(dictionary, id);
  const { width, height, rects } = markerGeometry(dictionary, markerId, fixPdfArtifacts);
  const label = title ?? `${dictionary} marker ${markerId}`;
  const size = sizeMm === undefined ? undefined : `${sizeMm}mm`;

  return (
    <svg
      viewBox={`0 0 ${width + 2} ${height + 2}`}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={className}
      style={style}
    >
      <title>{label}</title>
      <rect x={0} y={0} width={width + 2} height={height + 2} fill="black" />
      {rects.map((rect, index) => (
        <rect key={index} x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="white" />
      ))}
    </svg>
  );
}
