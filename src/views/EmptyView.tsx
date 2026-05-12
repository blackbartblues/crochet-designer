import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Topbar } from '../components/shell/Topbar';
import { Statusbar } from '../components/shell/Statusbar';
import { EmptyState } from '../components/empty/EmptyState';
import { ConfirmDialog } from '../components/dialogs/ConfirmDialog';
import { useRecentStore } from '../stores/recentStore';
import { usePatternStore } from '../stores/patternStore';
import { useDocumentStore } from '../stores/documentStore';
import { loadPatternFromPath } from '../services/fileIo';
import { emptyPatternV3 } from '../domain/graph/build';

interface EmptyViewProps {
  onNew?: () => void;
  onOpen?: () => void;
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
}

/** Build a human-readable "X time ago" string via i18n. */
function relativeDate(iso: string, t: TFunction): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return t('time.justNow');
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t('time.minutes', { count: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t('time.hours', { count: diffHr });
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return t('time.yesterday');
  if (diffDay < 7) return t('time.days', { count: diffDay });
  if (diffDay < 14) return t('time.weekOne');
  if (diffDay < 30) return t('time.weeks', { count: Math.floor(diffDay / 7) });
  if (diffDay < 60) return t('time.monthOne');
  if (diffDay < 365) return t('time.months', { count: Math.floor(diffDay / 30) });
  return t('time.years', { count: Math.floor(diffDay / 365) });
}

export function EmptyView({ onNew, onOpen, onOpenSettings, onOpenShortcuts }: EmptyViewProps) {
  const { t } = useTranslation();
  const entries = useRecentStore((s) => s.entries);
  const removeRecent = useRecentStore((s) => s.remove);
  const loadPattern = usePatternStore((s) => s.loadPattern);
  const loadGraphPattern = useDocumentStore((s) => s.loadGraphPattern);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateRadial = () => {
    const pattern = emptyPatternV3({
      title: { pl: 'Nowy wzór', en: 'New pattern' },
      author: '',
    });
    loadGraphPattern(pattern);
  };

  const handleLoadRecent = async (path: string) => {
    setErrorMessage(null);
    const result = await loadPatternFromPath(path);
    if (result.kind === 'error') {
      setErrorMessage(result.error.message);
      void removeRecent(path);
      return;
    }
    if (result.kind === 'cancelled') return;
    loadPattern(result.value.pattern, result.value.path);
  };

  const recentCards = entries.map((e) => ({
    id: e.path,
    name: e.name,
    meta: t('empty.patternStat', {
      cols: e.cols,
      rows: e.rows,
      when: relativeDate(e.lastOpenedAt, t),
    }),
    onClick: () => void handleLoadRecent(e.path),
  }));

  return (
    <div className="app">
      <Topbar
        {...(onOpenSettings ? { onOpenSettings } : {})}
        {...(onOpenShortcuts ? { onOpenShortcuts } : {})}
      />
      <EmptyState onNew={onNew} onOpen={onOpen} onNewRadial={handleCreateRadial} recentCards={recentCards} />
      <Statusbar message={t('status.ready')} recentCount={entries.length} />

      {errorMessage && (
        <ConfirmDialog
          title={t('dialog.openErrorTitle')}
          message={errorMessage}
          actions={[{ label: t('dialog.ok'), kind: 'primary', onClick: () => setErrorMessage(null) }]}
          onDismiss={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
}
