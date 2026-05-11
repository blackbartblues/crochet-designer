import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GraphInspector } from './GraphInspector';
import { emptyPatternV3 } from '../../domain/graph/build';

describe('GraphInspector', () => {
  it('renders the schemaVersion and stitch count', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    render(<GraphInspector pattern={p} />);
    expect(screen.getByText(/^schemaVersion: 3$/)).toBeInTheDocument();
    expect(screen.getByText(/^Stitches: 0$/)).toBeInTheDocument();
  });

  it('renders nothing when pattern is null', () => {
    const { container } = render(<GraphInspector pattern={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
