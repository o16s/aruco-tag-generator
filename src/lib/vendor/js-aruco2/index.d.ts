// Hand-written types for the vendored js-aruco2 subset that this package uses.

export interface ARPoint {
  x: number;
  y: number;
}

export interface ARMarker {
  id: number;
  /** Four corners, clockwise in image space, starting at the marker's canonical top-left. */
  corners: ARPoint[];
  hammingDistance: number;
}

export interface ARDictionaryDefinition {
  nBits: number;
  /** Accepted Hamming distance is `< tau`. `0` lets the library derive it from the code set. */
  tau: number;
  /** Packed marker bits per id: MSB first, last byte holds the remaining bits in its low bits. */
  codeList: readonly (readonly number[])[];
}

export interface ARImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export declare const AR: {
  DICTIONARIES: Record<string, ARDictionaryDefinition>;
  Detector: new (config?: { dictionaryName?: string; maxHammingDistance?: number }) => {
    detect(image: ARImage): ARMarker[];
  };
};

export interface POSError {
  euclidean: number;
  pixels: number;
  maximum: number;
}

export interface POSPose {
  /** A pixel error when the pose is valid, or an error object with `pixels: -1` when not. */
  bestError: number | POSError;
  /** Row-major 3×3, POSIT camera frame (x right, y up, z forward). */
  bestRotation: number[][];
  bestTranslation: number[];
  alternativeError: number | POSError;
  alternativeRotation: number[][];
  alternativeTranslation: number[];
}

export declare const POS: {
  Posit: new (modelSizeMm: number, focalLengthPx: number) => {
    /** `imagePoints` are centred on the image with y up: `{ x: px - w/2, y: h/2 - py }`. */
    pose(imagePoints: ARPoint[]): POSPose;
  };
};
