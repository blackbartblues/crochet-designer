import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ReactFlowProvider, Position } from 'reactflow';
import { AnchorEdge } from './AnchorEdge';
import { YarnFlowEdge } from './YarnFlowEdge';
import { JoinEdge } from './JoinEdge';

function wrap(children: React.ReactNode) {
  return (
    <ReactFlowProvider>
      <svg>{children}</svg>
    </ReactFlowProvider>
  );
}

const baseProps = {
  id: 'e1',
  source: 's',
  target: 't',
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 100,
  sourcePosition: Position.Bottom,
  targetPosition: Position.Top,
};

describe('custom edges', () => {
  it('AnchorEdge renders a path', () => {
    const { container } = render(wrap(<AnchorEdge {...baseProps} />));
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
  });

  it('YarnFlowEdge renders a dashed path', () => {
    const { container } = render(wrap(<YarnFlowEdge {...baseProps} />));
    const path = container.querySelector('path');
    const style = path?.getAttribute('style');
    expect(style?.includes('stroke-dasharray')).toBeTruthy();
  });

  it('JoinEdge renders a path', () => {
    const { container } = render(wrap(<JoinEdge {...baseProps} />));
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
  });
});
