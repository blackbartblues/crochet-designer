import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';
import type { Pattern } from '../domain/pattern';
import { parsePatternJson, serializePattern, PatternFileError } from '../domain/validation';

const FILE_EXT = 'wzor';
const FILE_FILTERS = [{ name: 'Wzór szydełkowy', extensions: [FILE_EXT] }];
const APP_FOLDER = 'Wzornik';

/** Result of an interactive save/open — null when the user cancelled. */
export type IoResult<T> = { kind: 'ok'; value: T } | { kind: 'cancelled' } | { kind: 'error'; error: PatternFileError };

function describeError(err: unknown): string {
  if (err == null) return 'nieznany błąd';
  if (err instanceof Error) return err.message || err.name || String(err);
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function toFileError(err: unknown): PatternFileError {
  if (err instanceof PatternFileError) return err;
  return new PatternFileError(`Operacja na pliku nie powiodła się: ${describeError(err)}`, err);
}

function suggestedFileName(pattern: Pattern): string {
  const safe = pattern.name
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, '')
    .trim()
    .slice(0, 80) || 'wzor';
  return `${safe}.${FILE_EXT}`;
}

async function defaultSaveDir(override?: string | null): Promise<string> {
  if (override) return override;
  const docs = await documentDir();
  const dir = await join(docs, APP_FOLDER);
  try {
    await mkdir(dir, { recursive: true, baseDir: BaseDirectory.Document });
  } catch {
    // mkdir may fail for various reasons (permissions, exists); save dialog will surface it
  }
  return dir;
}

/**
 * Save pattern to disk.
 *
 * @param pattern - the pattern to save (will be serialized to JSON)
 * @param path - if provided, write directly without dialog
 * @returns ok with the absolute path written, cancelled if user dismissed dialog, error on failure
 */
export async function savePattern(
  pattern: Pattern,
  path: string | null,
  defaultDirOverride?: string | null,
): Promise<IoResult<string>> {
  let target = path;
  if (!target) {
    try {
      const defaultDir = await defaultSaveDir(defaultDirOverride);
      const defaultPath = await join(defaultDir, suggestedFileName(pattern));
      const picked = await saveDialog({
        title: 'Zapisz wzór',
        defaultPath,
        filters: FILE_FILTERS,
      });
      if (!picked) return { kind: 'cancelled' };
      target = picked;
    } catch (err) {
      return { kind: 'error', error: toFileError(err) };
    }
  }

  try {
    const json = serializePattern({
      ...pattern,
      updatedAt: new Date().toISOString(),
    });
    await writeTextFile(target, json);
    return { kind: 'ok', value: target };
  } catch (err) {
    return { kind: 'error', error: toFileError(err) };
  }
}

/**
 * Open a file picker and load the chosen .wzor file.
 */
export async function openPattern(): Promise<IoResult<{ pattern: Pattern; path: string }>> {
  let picked: string | null;
  try {
    const result = await openDialog({
      title: 'Otwórz wzór',
      multiple: false,
      filters: FILE_FILTERS,
    });
    picked = typeof result === 'string' ? result : null;
  } catch (err) {
    return { kind: 'error', error: toFileError(err) };
  }
  if (!picked) return { kind: 'cancelled' };

  return loadPatternFromPath(picked);
}

/**
 * Load and validate a pattern file from a known path (used by recents, recovery, etc.).
 */
export async function loadPatternFromPath(
  path: string,
): Promise<IoResult<{ pattern: Pattern; path: string }>> {
  try {
    const text = await readTextFile(path);
    const pattern = parsePatternJson(text);
    return { kind: 'ok', value: { pattern, path } };
  } catch (err) {
    return { kind: 'error', error: toFileError(err) };
  }
}

// ===== V3 Persistence =====

import type { Pattern as PatternV3 } from '../domain/graph/types';
import { parsePatternAsV3 } from '../domain/validation';
import { serializePatternV3 } from '../domain/graph/schema';

/** Load any-version .wzor file from disk and return the v3 representation. */
export async function loadPatternAsV3FromPath(
  path: string,
): Promise<IoResult<{ pattern: PatternV3; path: string }>> {
  try {
    const text = await readTextFile(path);
    const pattern = parsePatternAsV3(text);
    return { kind: 'ok', value: { pattern, path } };
  } catch (err) {
    return { kind: 'error', error: toFileError(err) };
  }
}

/** Save a v3 pattern to disk at the given path. Does not show a dialog. */
export async function savePatternV3ToPath(
  pattern: PatternV3,
  path: string,
): Promise<IoResult<string>> {
  try {
    const json = serializePatternV3(pattern);
    await writeTextFile(path, json);
    return { kind: 'ok', value: path };
  } catch (err) {
    return { kind: 'error', error: toFileError(err) };
  }
}
