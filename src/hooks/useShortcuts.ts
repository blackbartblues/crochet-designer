import { useEffect } from 'react';
import { usePatternStore } from '../stores/patternStore';
import { useUiStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { STITCH_ORDER } from '../domain/stitches';
import { matchesCombo, type ShortcutActionId } from '../domain/shortcuts';

/** Optional callbacks the host (App / EditorView) supplies for file ops. */
export interface ShortcutHandlers {
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onExport?: () => void;
}

function isTextInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

/** Mounts global keyboard shortcuts. Pass file-op handlers as needed. */
export function useShortcuts(handlers: ShortcutHandlers = {}): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTextInputFocused()) return;

      const ps = usePatternStore.getState();
      const us = useUiStore.getState();
      const settings = useSettingsStore.getState();

      const matches = (id: ShortcutActionId): boolean => {
        const combo = settings.comboFor(id);
        return matchesCombo(e, combo);
      };

      // ===== File operations (no pattern required for some) =====
      if (matches('new')) {
        e.preventDefault();
        handlers.onNew?.();
        return;
      }
      if (matches('open')) {
        e.preventDefault();
        handlers.onOpen?.();
        return;
      }

      // Pattern-context shortcuts below need an open pattern
      if (matches('undo')) {
        e.preventDefault();
        ps.undo();
        return;
      }
      // Redo: also accept Ctrl+Shift+Z as legacy alias
      if (matches('redo') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        ps.redo();
        return;
      }
      if (matches('save')) {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }
      if (matches('export')) {
        e.preventDefault();
        handlers.onExport?.();
        return;
      }

      if (!ps.pattern) return;

      if (matches('newRow')) {
        e.preventDefault();
        ps.newRow();
        return;
      }
      if (matches('place')) {
        if (!ps.cursor) return;
        e.preventDefault();
        ps.paintCell(ps.cursor.row, ps.cursor.col, us.selectedStitch, us.selectedColorId);
        return;
      }
      if (matches('clearCell') || (e.key === 'Delete' && !e.ctrlKey && !e.shiftKey && !e.altKey)) {
        if (!ps.cursor) return;
        e.preventDefault();
        ps.clearCell(ps.cursor.row, ps.cursor.col);
        return;
      }

      // Built-in (non-remappable) navigation keys
      if (e.key.startsWith('Arrow')) {
        if (!ps.cursor) return;
        e.preventDefault();
        const { row, col } = ps.cursor;
        if (e.key === 'ArrowLeft') ps.setCursor(row, col - 1);
        else if (e.key === 'ArrowRight') ps.setCursor(row, col + 1);
        else if (e.key === 'ArrowUp') ps.setCursor(row - 1, col);
        else if (e.key === 'ArrowDown') ps.setCursor(row + 1, col);
        return;
      }

      if (/^[1-9]$/.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const idx = parseInt(e.key, 10) - 1;
        const key = STITCH_ORDER[idx];
        if (key) {
          e.preventDefault();
          us.setStitch(key);
        }
        return;
      }

      if (e.key === 'Escape') {
        if (us.openPickerId) {
          e.preventDefault();
          us.closePicker();
        }
        return;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handlers]);
}
