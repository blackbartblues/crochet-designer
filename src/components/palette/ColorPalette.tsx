import { useTranslation } from 'react-i18next';
import { Icon } from '../primitives/Icon';
import { ColorSwatch } from './ColorSwatch';
import { ColorPickerPopover } from './ColorPickerPopover';
import type { YarnColor, ColorId } from '../../domain/colors';

interface ColorPaletteProps {
  colors: readonly YarnColor[];
  selectedId: ColorId;
  onSelect: (id: ColorId) => void;
  openPickerId: ColorId | null;
  onEdit: (id: ColorId) => void;
  onClosePicker: () => void;
  onPickColor: (id: ColorId, preset: { name: string; hex: string }) => void;
  onRemoveColor: (id: ColorId) => void;
  onAddColor: () => void;
  isColorInUse: (id: ColorId) => boolean;
}

export function ColorPalette({
  colors,
  selectedId,
  onSelect,
  openPickerId,
  onEdit,
  onClosePicker,
  onPickColor,
  onRemoveColor,
  onAddColor,
  isColorInUse,
}: ColorPaletteProps) {
  const { t } = useTranslation();

  return (
    <section className="color-strip" aria-label={t('palette.yarns')}>
      <div className="palette-label">
        <div className="palette-label-text">{t('palette.yarns')}</div>
        <div className="palette-label-hint">{t('palette.yarns_hint')}</div>
      </div>

      <div className="swatch-row">
        {colors.map((color) => {
          const popover =
            openPickerId === color.id ? (
              <ColorPickerPopover
                color={color}
                onPick={(preset) => onPickColor(color.id, preset)}
                onClose={onClosePicker}
                {...(color.isBase
                  ? {}
                  : {
                      onRemove: () => onRemoveColor(color.id),
                      isInUse: isColorInUse(color.id),
                    })}
              />
            ) : undefined;

          return (
            <ColorSwatch
              key={color.id}
              color={color}
              isActive={selectedId === color.id}
              onSelect={() => onSelect(color.id)}
              {...(!color.isBase ? { onEdit: () => onEdit(color.id) } : {})}
              {...(popover ? { popoverSlot: popover } : {})}
            />
          );
        })}
      </div>

      <button
        className="swatch-add"
        title={t('palette.addColor')}
        aria-label={t('palette.addColor')}
        onClick={onAddColor}
      >
        <Icon name="ui-plus" size="md" />
      </button>
    </section>
  );
}
