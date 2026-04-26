import { useTranslation } from 'react-i18next';

interface StatusbarProps {
  patternName?: string;
  totalStitches?: number;
  rows?: number;
  colors?: number;
  zoom?: number;
  savedAt?: string;
  message?: string;
  recentCount?: number;
}

export function Statusbar(props: StatusbarProps) {
  const { t } = useTranslation();
  const {
    patternName,
    totalStitches,
    rows,
    colors,
    zoom = 100,
    savedAt,
    message,
    recentCount,
  } = props;

  const isEmpty = !patternName;

  return (
    <footer className="statusbar">
      {isEmpty ? (
        <>
          <div className="status-item">{message ?? t('status.ready')}</div>
          {recentCount !== undefined && (
            <>
              <div className="status-item-divider" />
              <div className="status-item">
                {t('status.savedRecents', { count: recentCount })}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="status-item">
            {t('status.pattern')}: <strong>{patternName}</strong>
          </div>
          <div className="status-item-divider" />
          <div className="status-item">
            {t('status.totalStitches')}: <strong>{totalStitches ?? 0}</strong>
          </div>
          <div className="status-item-divider" />
          <div className="status-item">
            {t('status.rows')}: <strong>{rows ?? 0}</strong>
          </div>
          <div className="status-item-divider" />
          <div className="status-item">
            {t('status.colors')}: <strong>{colors ?? 0}</strong>
          </div>
          <div className="status-item-divider" />
          <div className="status-item">
            {t('status.zoom')}: <strong>{zoom}%</strong>
          </div>
        </>
      )}

      {(savedAt || isEmpty) && (
        <div className="status-saved">
          <span className="status-saved-dot" />
          {savedAt ? t('status.savedAt', { time: savedAt }) : t('status.allSaved')}
        </div>
      )}
    </footer>
  );
}
