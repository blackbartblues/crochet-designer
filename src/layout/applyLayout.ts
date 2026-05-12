import type { Pattern } from '../domain/graph/types';
import { computeRadialLayout } from './radial';
import { computeLinearLayout } from './linear';
import type { LayoutResult } from './types';

export interface ApplyLayoutOptions {
  /** If true, preserve any existing `position` on stitches. */
  keepExisting?: boolean;
}

export function applyLayout(
  pattern: Pattern,
  options: ApplyLayoutOptions = {},
): Pattern {
  let layout: LayoutResult;
  switch (pattern.shape) {
    case 'radial':
      layout = computeRadialLayout(pattern);
      break;
    case 'rectangular':
      layout = computeLinearLayout(pattern);
      break;
    case 'freeform':
      layout = new Map();
      break;
  }

  const stitches = pattern.stitches.map((s) => {
    if (options.keepExisting && s.position) return s;
    const pos = layout.get(s.id);
    if (!pos) return s;
    return { ...s, position: pos };
  });

  return { ...pattern, stitches };
}
