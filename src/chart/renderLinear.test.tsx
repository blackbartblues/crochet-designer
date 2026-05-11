import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderLinearChart } from './renderLinear';
import { emptyPatternV3, newStitch } from '../domain/graph/build';

describe('renderLinearChart', () => {
  it('renders SVG with text glyphs for a row of stitches', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const a = newStitch({ kind: 'builtin', type: 'sc' }, { round: 0, position: { x: 0, y: 0 } });
    const b = newStitch({ kind: 'builtin', type: 'dc' }, { round: 0, position: { x: 60, y: 0 } });
    const linearPattern = { ...p, shape: 'rectangular' as const, stitches: [a, b] };
    const svg = renderLinearChart(linearPattern);
    const { container } = render(<>{svg}</>);
    expect(container.querySelectorAll('text').length).toBe(2);
  });

  it('handles empty patterns', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const svg = renderLinearChart({ ...p, shape: 'rectangular' as const });
    const { container } = render(<>{svg}</>);
    expect(container.querySelectorAll('text').length).toBe(0);
  });
});
