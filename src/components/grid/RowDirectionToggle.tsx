import { useTranslation } from 'react-i18next';
import type { RowDirection } from '../../domain/pattern';

interface RowDirectionToggleProps {
  direction: RowDirection;
  onToggle?: () => void;
}

export function RowDirectionToggle({ direction, onToggle }: RowDirectionToggleProps) {
  const { t } = useTranslation();
  const isRight = direction === 'rtl';
  const symbolId = isRight ? 'ui-arrow-right' : 'ui-arrow-left';
  const label = isRight ? t('grid.rowDirection_rtl') : t('grid.rowDirection_ltr');

  return (
    <button
      className="row-direction"
      title={t('grid.rowDirection_tooltip')}
      onClick={onToggle}
    >
      <svg>
        <use href={`#${symbolId}`} />
      </svg>
      <span>{label}</span>
    </button>
  );
}
