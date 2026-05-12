export interface Position {
  x: number;
  y: number;
}

export type LayoutAlgorithm = 'radial' | 'linear' | 'freeform';

/** Output of any layout algorithm — a map from stitchId to position. */
export type LayoutResult = Map<string, Position>;
