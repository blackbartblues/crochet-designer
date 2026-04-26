import {
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
  BaseDirectory,
} from '@tauri-apps/plugin-fs';
import { z } from 'zod';

const RECENTS_FILE = 'recents.json';
export const MAX_RECENTS = 6;

export interface RecentEntry {
  path: string;
  name: string;
  cols: number;
  rows: number;
  /** ISO 8601 timestamp of when this entry was last opened. */
  lastOpenedAt: string;
}

const recentEntrySchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1),
  cols: z.number().int().nonnegative(),
  rows: z.number().int().nonnegative(),
  lastOpenedAt: z.string(),
});

const recentsFileSchema = z.object({
  schemaVersion: z.literal(1),
  entries: z.array(recentEntrySchema),
});

async function ensureConfigDir(): Promise<void> {
  try {
    await mkdir('', { recursive: true, baseDir: BaseDirectory.AppConfig });
  } catch {
    // Directory may already exist; ignore
  }
}

/** Read recents.json, prune entries whose files no longer exist. */
export async function readRecents(): Promise<RecentEntry[]> {
  try {
    const fileExists = await exists(RECENTS_FILE, { baseDir: BaseDirectory.AppConfig });
    if (!fileExists) return [];

    const text = await readTextFile(RECENTS_FILE, { baseDir: BaseDirectory.AppConfig });
    const parsed = recentsFileSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return [];

    // Drop entries whose underlying file is missing
    const checked: RecentEntry[] = [];
    for (const entry of parsed.data.entries) {
      try {
        if (await exists(entry.path)) checked.push(entry);
      } catch {
        // Path may be invalid (e.g., across mounts); skip
      }
    }
    return checked.slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

export async function writeRecents(entries: RecentEntry[]): Promise<void> {
  await ensureConfigDir();
  const payload = {
    schemaVersion: 1 as const,
    entries: entries.slice(0, MAX_RECENTS),
  };
  await writeTextFile(RECENTS_FILE, JSON.stringify(payload, null, 2), {
    baseDir: BaseDirectory.AppConfig,
  });
}

/**
 * Push an entry to the front of the recents list (deduping by path).
 * Returns the new list (caller should update store).
 */
export function addRecent(existing: readonly RecentEntry[], entry: RecentEntry): RecentEntry[] {
  const filtered = existing.filter((e) => e.path !== entry.path);
  return [entry, ...filtered].slice(0, MAX_RECENTS);
}

export function removeRecent(existing: readonly RecentEntry[], path: string): RecentEntry[] {
  return existing.filter((e) => e.path !== path);
}
