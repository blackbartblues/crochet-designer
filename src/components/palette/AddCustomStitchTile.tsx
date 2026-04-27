import { useTranslation } from 'react-i18next';

interface AddCustomStitchTileProps {
  onClick: () => void;
}

export function AddCustomStitchTile({ onClick }: AddCustomStitchTileProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="stitch-btn stitch-btn--add"
      title={t('palette.addCustomTooltip')}
      aria-label={t('palette.addCustomTooltip')}
      onClick={onClick}
    >
      <div className="stitch-symbol">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <use href="#ui-plus" />
        </svg>
      </div>
      <div className="stitch-code">{t('palette.addCustomShort')}</div>
    </button>
  );
}
