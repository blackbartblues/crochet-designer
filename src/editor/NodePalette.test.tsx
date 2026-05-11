import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NodePalette } from './NodePalette';

describe('NodePalette', () => {
  it('renders all built-in stitch tiles', () => {
    render(<NodePalette onSelect={() => {}} onAddCustom={() => {}} customStitches={[]} colors={[]} />);
    expect(screen.getByText('sc')).toBeInTheDocument();
    expect(screen.getByText('dc')).toBeInTheDocument();
    expect(screen.getByText('ch')).toBeInTheDocument();
    expect(screen.getByText('ring')).toBeInTheDocument();
  });

  it('calls onSelect when a built-in tile is clicked', () => {
    const onSelect = vi.fn();
    render(<NodePalette onSelect={onSelect} onAddCustom={() => {}} customStitches={[]} colors={[]} />);
    fireEvent.click(screen.getByText('sc'));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'builtin', type: 'sc' });
  });

  it('calls onAddCustom when the + button is clicked', () => {
    const onAddCustom = vi.fn();
    render(<NodePalette onSelect={() => {}} onAddCustom={onAddCustom} customStitches={[]} colors={[]} />);
    fireEvent.click(screen.getByText(/\+ custom/i));
    expect(onAddCustom).toHaveBeenCalled();
  });

  it('lists custom stitches by shortCode', () => {
    render(
      <NodePalette
        onSelect={() => {}}
        onAddCustom={() => {}}
        customStitches={[
          {
            id: 'cs1',
            shortCode: 'HC',
            nameByLanguage: { pl: 'P', en: 'H' },
            symbol: { kind: 'svgPath', path: 'M0 0' },
          },
        ]}
        colors={[]}
      />,
    );
    expect(screen.getByText('HC')).toBeInTheDocument();
  });
});
