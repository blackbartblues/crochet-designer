import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SvgSprite } from './icons/SvgSprite';
import { EditorView } from './views/EditorView';
import { EmptyView } from './views/EmptyView';
import { ConfirmDialog } from './components/dialogs/ConfirmDialog';
import { SettingsDialog } from './components/dialogs/SettingsDialog';
import { ShortcutsDialog } from './components/dialogs/ShortcutsDialog';
import { GraphInspector } from './components/devtools/GraphInspector';
import { usePatternStore } from './stores/patternStore';
import { useRecentStore } from './stores/recentStore';
import { useDocumentStore } from './stores/documentStore';
import { useShortcuts } from './hooks/useShortcuts';
// TODO Phase 4 follow-up: restore useDirtyGuard once we figure out why
// onCloseRequested in dev+StrictMode prevents the window from ever closing.
import { openPattern } from './services/fileIo';

/** Starting width for new patterns. Grows automatically as user paints at the edge. */
const INITIAL_COLS = 5;

export default function App() {
  const { t } = useTranslation();
  const pattern = usePatternStore((s) => s.pattern);
  const newPattern = usePatternStore((s) => s.newPattern);
  const loadPattern = usePatternStore((s) => s.loadPattern);
  const hydrateRecents = useRecentStore((s) => s.hydrate);
  const addRecent = useRecentStore((s) => s.add);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    void hydrateRecents();
  }, [hydrateRecents]);

  const handleNew = () => newPattern(t('empty.createNew'), INITIAL_COLS);

  const handleOpen = async () => {
    setErrorMessage(null);
    const result = await openPattern();
    if (result.kind === 'cancelled') return;
    if (result.kind === 'error') {
      setErrorMessage(result.error.message);
      return;
    }
    loadPattern(result.value.pattern, result.value.path);
    void addRecent({
      path: result.value.path,
      name: result.value.pattern.name,
      cols: result.value.pattern.rows[0]?.cells.length ?? 0,
      rows: result.value.pattern.rows.length,
      lastOpenedAt: new Date().toISOString(),
    });
  };

  // Wire shortcut handlers — file ops accessible globally
  useShortcuts({
    onNew: handleNew,
    onOpen: () => void handleOpen(),
  });

  const graphPatternForDevtools = useDocumentStore((s) => s.graphPattern);

  return (
    <>
      <SvgSprite />
      {pattern ? (
        <EditorView
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
      ) : (
        <EmptyView
          onNew={handleNew}
          onOpen={() => void handleOpen()}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
      )}

      {errorMessage && (
        <ConfirmDialog
          title={t('dialog.openErrorTitle')}
          message={errorMessage}
          actions={[{ label: t('dialog.ok'), kind: 'primary', onClick: () => setErrorMessage(null) }]}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {isSettingsOpen && <SettingsDialog onClose={() => setIsSettingsOpen(false)} />}
      {isShortcutsOpen && <ShortcutsDialog onClose={() => setIsShortcutsOpen(false)} />}

      {typeof window !== 'undefined' && window.location.search.includes('devtools') && (
        <GraphInspector pattern={graphPatternForDevtools} />
      )}
    </>
  );
}
