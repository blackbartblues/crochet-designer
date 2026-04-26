import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../primitives/Icon';
import type { YarnColor } from '../../domain/colors';
import { COLOR_PRESETS } from '../../domain/presets';
import { useClickOutside } from '../../hooks/useClickOutside';

interface ColorPickerPopoverProps {
  color: YarnColor;
  /** Called when user picks a preset — name + hex committed to the color slot. */
  onPick: (preset: { name: string; hex: string }) => void;
  onClose: () => void;
  /** Optional remove callback — when omitted the remove section is hidden. */
  onRemove?: () => void;
  /** True when this color is referenced by at least one cell (blocks remove). */
  isInUse?: boolean;
}

export function ColorPickerPopover({
  color,
  onPick,
  onClose,
  onRemove,
  isInUse = false,
}: ColorPickerPopoverProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [onClose]);

  const currentHexLower = color.hex.toLowerCase();

  return (
    <div
      ref={ref}
      className="color-picker-popover is-open"
      role="dialog"
      aria-label={t('color.pickerTitle')}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="picker-header">
        <div className="picker-preview" style={{ background: color.hex }} />
        <div className="picker-title">{color.name}</div>
        <div className="picker-hex">{color.hex.toUpperCase()}</div>
      </div>

      <div className="picker-grid" aria-label={t('color.presetsLabel')}>
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.hex}
            type="button"
            className={`picker-swatch${
              preset.hex.toLowerCase() === currentHexLower ? ' is-selected' : ''
            }`}
            style={{ background: preset.hex }}
            title={`${preset.name} · ${preset.hex.toUpperCase()}`}
            onClick={() => onPick(preset)}
            aria-label={preset.name}
          />
        ))}
      </div>

      {onRemove && (
        <div className="picker-remove-row">
          {isInUse ? (
            <span className="picker-warn">{t('color.inUseWarn')}</span>
          ) : (
            <button
              type="button"
              className="picker-btn picker-btn-danger"
              onClick={onRemove}
            >
              <Icon name="ui-trash" size="sm" /> {t('color.remove')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
