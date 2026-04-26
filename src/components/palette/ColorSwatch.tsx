import { useTranslation } from 'react-i18next';
import { Icon } from '../primitives/Icon';
import type { YarnColor } from '../../domain/colors';

interface ColorSwatchProps {
  color: YarnColor;
  isActive: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  popoverSlot?: React.ReactNode;
}

export function ColorSwatch({ color, isActive, onSelect, onEdit, popoverSlot }: ColorSwatchProps) {
  const { t } = useTranslation();
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit?.();
  };

  return (
    <div
      className={`swatch${isActive ? ' is-active' : ''}${color.isBase ? ' is-base' : ''}`}
      onClick={onSelect}
      title={color.name}
    >
      <span className="swatch-dot-wrap">
        <span className="swatch-dot" style={{ background: color.hex }} />
        {color.isBase && (
          <span className="swatch-badge" title={t('color.base')}>
            <Icon name="ui-lock" size="sm" />
          </span>
        )}
      </span>

      <span className="swatch-name">
        {color.name}
        {color.isBase && <span className="swatch-name-suffix"> · {t('color.base')}</span>}
      </span>

      {!color.isBase && onEdit && (
        <button
          className="swatch-edit"
          onClick={handleEdit}
          title={t('color.edit')}
          aria-label={t('color.editAria', { name: color.name })}
        >
          <Icon name="ui-pencil" size="sm" />
        </button>
      )}

      {popoverSlot}
    </div>
  );
}
