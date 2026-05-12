import { useTranslation } from 'react-i18next';
import { Icon } from '../primitives/Icon';
import { RecentCard } from './RecentCard';

interface RecentCardData {
  id: string;
  name: string;
  meta: string;
  /** Optional CSS background for the thumbnail. */
  thumbCss?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  onNew?: () => void;
  onOpen?: () => void;
  recentCards?: readonly RecentCardData[];
}

const PLACEHOLDER_THUMB = `repeating-linear-gradient(45deg,
  var(--yarn-cream) 0, var(--yarn-cream) 10px,
  var(--bg-sunken) 10px, var(--bg-sunken) 20px)`;

export function EmptyState({ onNew, onOpen, recentCards = [] }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <main className="empty-wrap" style={{ gridRow: '2 / span 4' }}>
      <div className="empty-state">
        <svg className="empty-illustration" aria-hidden="true">
          <use href="#illust-welcome" />
        </svg>

        <h1 className="empty-title">
          {t('empty.title')} <em>{t('brand.name')}</em>
        </h1>
        <p className="empty-subtitle">{t('empty.subtitle')}</p>

        <div className="empty-actions">
          <button className="btn-primary" onClick={onNew}>
            <Icon name="ui-file-new" size="md" />
            Stwórz nowy wzór PDF
          </button>
          <button className="btn-secondary" onClick={onOpen}>
            <Icon name="ui-folder-open" size="md" />
            {t('empty.openFromDisk')}
          </button>
        </div>
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted, #7a6347)', fontStyle: 'italic', textAlign: 'center' }}>
          Edytor PDF z gotowymi sekcjami (tytuł, copyright, informacje, wzór, zdjęcia, special stitches).
        </p>

        {recentCards.length > 0 && (
          <div className="recent-section">
            <div className="recent-title">{t('empty.recentTitle')}</div>
            <div className="recent-grid">
              {recentCards.map((r) => (
                <RecentCard
                  key={r.id}
                  name={r.name}
                  meta={r.meta}
                  thumbCss={r.thumbCss ?? PLACEHOLDER_THUMB}
                  {...(r.onClick ? { onClick: r.onClick } : {})}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
