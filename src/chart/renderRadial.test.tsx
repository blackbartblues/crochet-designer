import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderRadialChart } from './renderRadial';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
} from '../domain/graph/build';
import type { Pattern } from '../domain/graph/types';

function ringPattern(): Pattern {
  const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
  const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0, position: { x: 0, y: 0 } });
  const a = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1, position: { x: 80, y: 0 } });
  const b = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1, position: { x: -80, y: 0 } });
  return {
    ...p,
    shape: 'radial',
    stitches: [ring, a, b],
    edges: [
      newAnchorEdge(a.id, { kind: 'magic_ring' }),
      newAnchorEdge(b.id, { kind: 'magic_ring' }),
    ],
  };
}

describe('renderRadialChart', () => {
  it('returns an SVG element for a non-empty pattern', () => {
    const svg = renderRadialChart(ringPattern());
    const { container } = render(<>{svg}</>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders one text glyph per stitch', () => {
    const svg = renderRadialChart(ringPattern());
    const { container } = render(<>{svg}</>);
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBe(3);
  });

  it('returns an empty SVG for an empty pattern', () => {
    const empty = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const svg = renderRadialChart({ ...empty, shape: 'radial' });
    const { container } = render(<>{svg}</>);
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBe(0);
  });
});
