import { create } from 'zustand';
import { SHORTCUTS, type ShortcutActionId } from '../domain/shortcuts';

const STORAGE_KEY = 'wzornik-settings';

export interface AppSettings {
  /** Absolute directory path for default Save location. Null → ~/Documents/Wzornik */
  defaultSavePath: string | null;
  /** Absolute directory path for default Export location. Null → same as save */
  defaultExportPath: string | null;
  /** Per-action key combo overrides. Missing keys fall back to defaults. */
  shortcuts: Partial<Record<ShortcutActionId, string>>;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultSavePath: null,
  defaultExportPath: null,
  shortcuts: {},
};

interface SettingsState extends AppSettings {
  setSavePath: (path: string | null) => void;
  setExportPath: (path: string | null) => void;
  setShortcut: (id: ShortcutActionId, combo: string) => void;
  resetShortcut: (id: ShortcutActionId) => void;
  resetAll: () => void;
  /** Resolve the effective combo for an action (override or default). */
  comboFor: (id: ShortcutActionId) => string;
}

function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      defaultSavePath: typeof parsed.defaultSavePath === 'string' ? parsed.defaultSavePath : null,
      defaultExportPath: typeof parsed.defaultExportPath === 'string' ? parsed.defaultExportPath : null,
      shortcuts: parsed.shortcuts && typeof parsed.shortcuts === 'object' ? parsed.shortcuts : {},
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(s: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Best-effort
  }
}

const initial = readSettings();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initial,

  setSavePath: (path) => {
    set({ defaultSavePath: path });
    writeSettings({ ...get(), defaultSavePath: path });
  },

  setExportPath: (path) => {
    set({ defaultExportPath: path });
    writeSettings({ ...get(), defaultExportPath: path });
  },

  setShortcut: (id, combo) => {
    const next = { ...get().shortcuts, [id]: combo };
    set({ shortcuts: next });
    writeSettings({ ...get(), shortcuts: next });
  },

  resetShortcut: (id) => {
    const next = { ...get().shortcuts };
    delete next[id];
    set({ shortcuts: next });
    writeSettings({ ...get(), shortcuts: next });
  },

  resetAll: () => {
    set({ ...DEFAULT_SETTINGS });
    writeSettings(DEFAULT_SETTINGS);
  },

  comboFor: (id) => {
    const override = get().shortcuts[id];
    if (override) return override;
    const def = SHORTCUTS.find((s) => s.id === id);
    return def?.defaultCombo ?? '';
  },
}));
