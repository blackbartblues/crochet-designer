import { create } from 'zustand';
import type { StitchKey, DisplayMode } from '../domain/stitches';
import type { ColorId } from '../domain/colors';

interface UiState {
  selectedStitch: StitchKey;
  selectedColorId: ColorId;
  displayMode: DisplayMode;
  /** When non-null, the color picker popover is open for this color. */
  openPickerId: ColorId | null;
  /** Theme — Phase 6 wires the toggle. Default: light. */
  theme: 'light' | 'dark';

  // Actions
  setStitch: (key: StitchKey) => void;
  setColorId: (id: ColorId) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  openPicker: (id: ColorId) => void;
  closePicker: () => void;
  togglePicker: (id: ColorId) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const THEME_STORAGE_KEY = 'wzornik-theme';

function readInitialTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage may be unavailable — fall back to default
  }
  return 'light';
}

function applyThemeToDom(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

const initialTheme = readInitialTheme();
applyThemeToDom(initialTheme);

export const useUiStore = create<UiState>((set) => ({
  selectedStitch: 'sc',
  selectedColorId: 'base',
  displayMode: 'symbol',
  openPickerId: null,
  theme: initialTheme,

  setStitch: (key) => set({ selectedStitch: key }),
  setColorId: (id) => set({ selectedColorId: id }),
  setDisplayMode: (mode) => set({ displayMode: mode }),
  openPicker: (id) => set({ openPickerId: id }),
  closePicker: () => set({ openPickerId: null }),
  togglePicker: (id) =>
    set((s) => ({ openPickerId: s.openPickerId === id ? null : id })),
  setTheme: (theme) => {
    set({ theme });
    applyThemeToDom(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Best effort — silently ignore
    }
  },
}));
