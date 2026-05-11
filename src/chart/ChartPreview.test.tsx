import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChartPreview } from './ChartPreview';
import { emptyPatternV3, newStitch } from '../domain/graph/build';

describe('ChartPreview', () => {
  it('renders an SVG for radial pattern', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0, position: { x: 0, y: 0 } });
    const radial = { ...p, shape: 'radial' as const, stitches: [ring] };
    const { container } = render(<ChartPreview pattern={radial} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders for rectangular pattern', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const s = newStitch({ kind: 'builtin', type: 'sc' }, { round: 0, position: { x: 0, y: 0 } });
    const rect = { ...p, shape: 'rectangular' as const, stitches: [s] };
    const { container } = render(<ChartPreview pattern={rect} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
