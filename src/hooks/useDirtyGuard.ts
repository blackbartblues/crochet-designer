import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { usePatternStore } from '../stores/patternStore';
import { savePattern } from '../services/fileIo';

interface DirtyGuardState {
  isCloseDialogOpen: boolean;
  saveError: string | null;
  /** Save then destroy window. Returns false if save failed/cancelled. */
  saveAndExit: () => Promise<void>;
  discardAndExit: () => Promise<void>;
  cancel: () => void;
}

/**
 * Intercepts the Tauri window close request when the pattern is dirty.
 * Surfaces a dialog state for the host component to render.
 */
export function useDirtyGuard(): DirtyGuardState {
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const win = getCurrentWindow();
        unlisten = await win.onCloseRequested((event) => {
          // Read fresh state — closure may be stale, store always current.
          const isDirty = usePatternStore.getState().isDirty;
          if (isDirty) {
            event.preventDefault();
            setIsCloseDialogOpen(true);
          }
        });
        if (cancelled && unlisten) unlisten();
      } catch {
        // Not running in Tauri (e.g., browser-only dev) — skip
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  const destroyWindow = async () => {
    try {
      await getCurrentWindow().destroy();
    } catch {
      // Ignore — best-effort
    }
  };

  const saveAndExit = async () => {
    const ps = usePatternStore.getState();
    if (!ps.pattern) {
      await destroyWindow();
      return;
    }
    setSaveError(null);
    const result = await savePattern(ps.pattern, ps.filePath);
    if (result.kind === 'ok') {
      ps.markSaved(result.value);
      setIsCloseDialogOpen(false);
      await destroyWindow();
      return;
    }
    if (result.kind === 'error') {
      setSaveError(result.error.message);
    }
    // 'cancelled' — keep dialog open, user can try again or pick Discard/Cancel
  };

  const discardAndExit = async () => {
    setIsCloseDialogOpen(false);
    await destroyWindow();
  };

  const cancel = () => {
    setIsCloseDialogOpen(false);
    setSaveError(null);
  };

  return { isCloseDialogOpen, saveError, saveAndExit, discardAndExit, cancel };
}
