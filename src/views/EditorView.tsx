import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Topbar } from '../components/shell/Topbar';
import { Toolbar } from '../components/shell/Toolbar';
import { BrushBar } from '../components/shell/BrushBar';
import { Statusbar } from '../components/shell/Statusbar';
import { StitchPalette } from '../components/palette/StitchPalette';
import { ColorPalette } from '../components/palette/ColorPalette';
import { Canvas } from '../components/grid/Canvas';
import { ConfirmDialog } from '../components/dialogs/ConfirmDialog';
import { usePatternStore, selectCanUndo, selectCanRedo } from '../stores/patternStore';
import { useUiStore } from '../stores/uiStore';
import { useRecentStore } from '../stores/recentStore';
import { useSettingsStore } from '../stores/settingsStore';
import { countStitches } from '../domain/pattern';
import { BASE_COLOR } from '../domain/colors';
import type { ColorId } from '../domain/colors';
import { savePattern, openPattern } from '../services/fileIo';
import { exportPatternToXlsx } from '../services/excelExport';

const INITIAL_COLS = 5;

type PendingAction = null | 'new' | 'open' | 'close';

interface EditorViewProps {
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
}

export function EditorView({ onOpenSettings, onOpenShortcuts }: EditorViewProps = {}) {
  const { t } = useTranslation();
  const pattern = usePatternStore((s) => s.pattern);
  const cursor = usePatternStore((s) => s.cursor);
  const isDirty = usePatternStore((s) => s.isDirty);
  const filePath = usePatternStore((s) => s.filePath);
  const canUndo = usePatternStore(selectCanUndo);
  const canRedo = usePatternStore(selectCanRedo);

  const paintCell = usePatternStore((s) => s.paintCell);
  const newRow = usePatternStore((s) => s.newRow);
  const clearRow = usePatternStore((s) => s.clearRow);
  const toggleRowDirection = usePatternStore((s) => s.toggleRowDirection);
  const undo = usePatternStore((s) => s.undo);
  const redo = usePatternStore((s) => s.redo);
  const closePattern = usePatternStore((s) => s.closePattern);
  const newPattern = usePatternStore((s) => s.newPattern);
  const loadPattern = usePatternStore((s) => s.loadPattern);
  const markSaved = usePatternStore((s) => s.markSaved);
  const setDisplayMode = usePatternStore((s) => s.setDisplayMode);

  const stitch = useUiStore((s) => s.selectedStitch);
  const colorId = useUiStore((s) => s.selectedColorId);
  const openPickerId = useUiStore((s) => s.openPickerId);
  const setStitch = useUiStore((s) => s.setStitch);
  const setColorId = useUiStore((s) => s.setColorId);
  const togglePicker = useUiStore((s) => s.togglePicker);
  const openPicker = useUiStore((s) => s.openPicker);
  const closePicker = useUiStore((s) => s.closePicker);

  const addColor = usePatternStore((s) => s.addColor);
  const updateColor = usePatternStore((s) => s.updateColor);
  const removeColor = usePatternStore((s) => s.removeColor);
  const isColorInUse = usePatternStore((s) => s.isColorInUse);

  const addRecent = useRecentStore((s) => s.add);
  const defaultSavePath = useSettingsStore((s) => s.defaultSavePath);
  const defaultExportPath = useSettingsStore((s) => s.defaultExportPath);

  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Keep selectedColorId valid: if the active color is removed, fall back to base.
  useEffect(() => {
    if (!pattern) return;
    if (!pattern.colors.some((c) => c.id === colorId)) {
      setColorId('base');
    }
  }, [pattern, colorId, setColorId]);

  if (!pattern) return null;

  const activeColor = pattern.colors.find((c) => c.id === colorId) ?? pattern.colors[0] ?? BASE_COLOR;
  const cols = pattern.rows[0]?.cells.length ?? 0;

  const handlePaint = (row: number, col: number) => {
    paintCell(row, col, stitch, colorId);
  };

  const handleClearActiveRow = () => {
    if (cursor) clearRow(cursor.row);
  };

  const handlePickColor = (id: ColorId, preset: { name: string; hex: string }) => {
    updateColor(id, preset);
    closePicker();
  };

  const handleRemoveColor = (id: ColorId) => {
    if (isColorInUse(id)) return;
    if (colorId === id) setColorId('base');
    removeColor(id);
    closePicker();
  };

  const handleAddColor = () => {
    const id = addColor(t('color.newColorName'), '#A8453F');
    setColorId(id);
    openPicker(id);
  };

  // ===== File operations =====

  const performSave = async (): Promise<boolean> => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const result = await savePattern(pattern, filePath, defaultSavePath);
      if (result.kind === 'cancelled') return false;
      if (result.kind === 'error') {
        setErrorMessage(result.error.message);
        return false;
      }
      markSaved(result.value);
      void addRecent({
        path: result.value,
        name: pattern.name,
        cols,
        rows: pattern.rows.length,
        lastOpenedAt: new Date().toISOString(),
      });
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const performOpen = async () => {
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

  const performNew = () => {
    newPattern('Wzór bez nazwy', INITIAL_COLS);
  };

  const performExport = async () => {
    setErrorMessage(null);
    setIsExporting(true);
    try {
      const result = await exportPatternToXlsx(pattern, defaultExportPath ?? defaultSavePath);
      if (result.kind === 'cancelled') return;
      if (result.kind === 'error') {
        setErrorMessage(result.error.message);
        return;
      }
      setSuccessMessage(t('dialog.exportSuccess', { path: result.path }));
    } finally {
      setIsExporting(false);
    }
  };

  const guardAction = (action: PendingAction) => {
    if (!isDirty) {
      executeAction(action);
    } else {
      setPendingAction(action);
    }
  };

  const executeAction = (action: PendingAction) => {
    setPendingAction(null);
    if (action === 'new') performNew();
    else if (action === 'open') void performOpen();
    else if (action === 'close') closePattern();
  };

  return (
    <div className="app">
      <Topbar
        patternName={pattern.name}
        patternStat={
          t('topbar.stats_dim', { cols, rows: pattern.rows.length }) +
          (isDirty ? t('topbar.stats_unsaved') : '')
        }
        {...(onOpenSettings ? { onOpenSettings } : {})}
        {...(onOpenShortcuts ? { onOpenShortcuts } : {})}
      />

      <Toolbar
        canUndo={canUndo}
        canRedo={canRedo}
        isSaving={isSaving}
        isExporting={isExporting}
        onNew={() => guardAction('new')}
        onOpen={() => guardAction('open')}
        onSave={() => void performSave()}
        onExport={() => void performExport()}
        onUndo={undo}
        onRedo={redo}
        onClearRow={handleClearActiveRow}
      />

      <StitchPalette
        selected={stitch}
        onSelect={setStitch}
        displayMode={pattern.displayMode}
        onDisplayModeChange={setDisplayMode}
      />

      <ColorPalette
        colors={pattern.colors}
        selectedId={colorId}
        onSelect={setColorId}
        openPickerId={openPickerId}
        onEdit={togglePicker}
        onClosePicker={closePicker}
        onPickColor={handlePickColor}
        onRemoveColor={handleRemoveColor}
        onAddColor={handleAddColor}
        isColorInUse={isColorInUse}
      />

      <BrushBar
        stitch={stitch}
        color={activeColor}
        cursorRow={(cursor?.row ?? 0) + 1}
        cursorCol={(cursor?.col ?? 0) + 1}
      />

      <Canvas
        pattern={pattern}
        cursor={cursor}
        onPaintCell={handlePaint}
        onToggleRowDirection={toggleRowDirection}
        onNewRow={newRow}
      />

      <Statusbar
        patternName={pattern.name}
        totalStitches={countStitches(pattern)}
        rows={pattern.rows.length}
        colors={pattern.colors.length}
        zoom={100}
        savedAt={isDirty ? undefined : '—'}
      />

      {pendingAction !== null && (
        <ConfirmDialog
          title={t('dialog.unsavedTitle')}
          message={t('dialog.unsavedMessage')}
          actions={[
            { label: t('dialog.cancel'), kind: 'ghost', onClick: () => setPendingAction(null) },
            { label: t('dialog.discard'), kind: 'danger', onClick: () => executeAction(pendingAction) },
            {
              label: t('dialog.saveAndContinue'),
              kind: 'primary',
              onClick: async () => {
                const saved = await performSave();
                if (saved) executeAction(pendingAction);
              },
            },
          ]}
          onDismiss={() => setPendingAction(null)}
        />
      )}

      {errorMessage && (
        <ConfirmDialog
          title={t('dialog.errorTitle')}
          message={errorMessage}
          actions={[{ label: t('dialog.ok'), kind: 'primary', onClick: () => setErrorMessage(null) }]}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {successMessage && (
        <ConfirmDialog
          title={t('dialog.successTitle')}
          message={successMessage}
          actions={[{ label: t('dialog.ok'), kind: 'primary', onClick: () => setSuccessMessage(null) }]}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
}
