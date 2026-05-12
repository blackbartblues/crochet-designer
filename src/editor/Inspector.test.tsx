import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Inspector } from './Inspector';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
} from '../domain/graph/build';

describe('Inspector', () => {
  it('renders an empty state when no stitch is selected', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    render(<Inspector pattern={p} selectedStitchId={null} />);
    expect(screen.getByText(/no stitch selected/i)).toBeInTheDocument();
  });

  it('renders details for the selected stitch', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0 });
    const sc = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1 });
    const populated = {
      ...p,
      stitches: [ring, sc],
      edges: [newAnchorEdge(sc.id, { kind: 'stitch', id: ring.id })],
    };
    render(<Inspector pattern={populated} selectedStitchId={sc.id} />);
    expect(screen.getByText(/sc/i)).toBeInTheDocument();
    expect(screen.getByText(/round 1/i)).toBeInTheDocument();
  });

  it('shows validator warnings when present', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const orphan = newStitch({ kind: 'builtin', type: 'sc' });
    const populated = { ...p, stitches: [orphan], edges: [] };
    render(<Inspector pattern={populated} selectedStitchId={orphan.id} />);
    expect(screen.getByText(/orphan/i)).toBeInTheDocument();
  });
});
