import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { StitchNode, type StitchNodeData } from './StitchNode';

function wrap(children: React.ReactNode) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}

describe('StitchNode', () => {
  it('renders the builtin stitch shortcode label', () => {
    const data: StitchNodeData = {
      label: 'sc',
      symbol: '×',
      isSelected: false,
    };
    render(wrap(<StitchNode data={data} id="n1" selected={false} />));
    expect(screen.getByText('sc')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('applies the selected style when selected prop is true', () => {
    const data: StitchNodeData = {
      label: 'dc',
      symbol: '⊤',
      isSelected: true,
    };
    const { container } = render(wrap(<StitchNode data={data} id="n1" selected={true} />));
    const root = container.querySelector('[data-testid="stitch-node"]');
    expect(root?.getAttribute('data-selected')).toBe('true');
  });
});
