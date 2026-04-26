import { create } from 'zustand';
import {
  readRecents,
  writeRecents,
  addRecent,
  removeRecent,
  type RecentEntry,
} from '../services/recentFiles';

interface RecentState {
  entries: RecentEntry[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  add: (entry: RecentEntry) => Promise<void>;
  remove: (path: string) => Promise<void>;
}

export const useRecentStore = create<RecentState>((set, get) => ({
  entries: [],
  isHydrated: false,

  hydrate: async () => {
    const entries = await readRecents();
    set({ entries, isHydrated: true });
  },

  add: async (entry) => {
    const next = addRecent(get().entries, entry);
    set({ entries: next });
    try {
      await writeRecents(next);
    } catch {
      // Silently swallow — recents are nice-to-have, not critical
    }
  },

  remove: async (path) => {
    const next = removeRecent(get().entries, path);
    set({ entries: next });
    try {
      await writeRecents(next);
    } catch {
      // Same — best effort
    }
  },
}));
