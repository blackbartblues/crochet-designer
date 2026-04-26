import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPickerPopover } from './ColorPickerPopover';
import type { YarnColor } from '../../domain/colors';
import { COLOR_PRESETS } from '../../domain/presets';

const SAMPLE: YarnColor = {
  id: 'sample',
  name: 'Bordo',
  hex: '#C97B84',
  isBase: false,
};

describe('ColorPickerPopover', () => {
  it('shows current color name + hex in the header', () => {
    render(<ColorPickerPopover color={SAMPLE} onPick={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Bordo')).toBeInTheDocument();
    expect(screen.getByText('#C97B84')).toBeInTheDocument();
  });

  it('renders one swatch per preset', () => {
    render(<ColorPickerPopover color={SAMPLE} onPick={() => {}} onClose={() => {}} />);
    const swatches = document.querySelectorAll('.picker-swatch');
    expect(swatches.length).toBe(COLOR_PRESETS.length);
  });

  it('highlights the current color in the grid', () => {
    render(<ColorPickerPopover color={SAMPLE} onPick={() => {}} onClose={() => {}} />);
    const selected = document.querySelector('.picker-swatch.is-selected');
    expect(selected).toBeTruthy();
    expect(selected?.getAttribute('aria-label')).toBe('Bordo');
  });

  it('clicking a preset commits its name + hex via onPick', () => {
    const onPick = vi.fn();
    render(<ColorPickerPopover color={SAMPLE} onPick={onPick} onClose={() => {}} />);
    const wino = screen.getByLabelText('Wino');
    fireEvent.click(wino);
    expect(onPick).toHaveBeenCalledWith({ name: 'Wino', hex: '#A8453F' });
  });

  it('shows in-use warning when isInUse is true', () => {
    render(
      <ColorPickerPopover
        color={SAMPLE}
        onPick={() => {}}
        onClose={() => {}}
        onRemove={() => {}}
        isInUse
      />,
    );
    expect(screen.getByText(/jest używany/i)).toBeInTheDocument();
    expect(screen.queryByText(/Usuń kolor/)).toBeNull();
  });

  it('shows remove button when not in use', () => {
    const onRemove = vi.fn();
    render(
      <ColorPickerPopover
        color={SAMPLE}
        onPick={() => {}}
        onClose={() => {}}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByText(/Usuń kolor/));
    expect(onRemove).toHaveBeenCalled();
  });

  it('hides remove section when no onRemove provided', () => {
    render(<ColorPickerPopover color={SAMPLE} onPick={() => {}} onClose={() => {}} />);
    expect(screen.queryByText(/Usuń kolor/)).toBeNull();
    expect(screen.queryByText(/jest używany/i)).toBeNull();
  });

  it('Escape closes the picker', () => {
    const onClose = vi.fn();
    render(<ColorPickerPopover color={SAMPLE} onPick={() => {}} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
