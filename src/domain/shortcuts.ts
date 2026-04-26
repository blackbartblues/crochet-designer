/**
 * Shortcut action catalog and key-combo helpers.
 *
 * A "combo" is a string like "Ctrl+S" or "Space". Modifiers come first
 * in canonical order (Ctrl, Shift, Alt, Meta), each capitalized, then the key.
 */

export type ShortcutActionId =
  | 'place'
  | 'clearCell'
  | 'newRow'
  | 'undo'
  | 'redo'
  | 'save'
  | 'open'
  | 'new'
  | 'export';

export interface ShortcutDefinition {
  id: ShortcutActionId;
  /** i18n key for the action label, e.g. 'shortcuts.place' */
  labelKey: string;
  /** i18n key for the category, e.g. 'shortcuts.cat_editing' */
  categoryKey: string;
  /** Default key combo string, e.g. "Space", "Ctrl+S". */
  defaultCombo: string;
}

export const SHORTCUTS: readonly ShortcutDefinition[] = [
  // Editing
  { id: 'place',     labelKey: 'shortcuts.place',     categoryKey: 'shortcuts.cat_editing', defaultCombo: 'Space' },
  { id: 'clearCell', labelKey: 'shortcuts.clearCell', categoryKey: 'shortcuts.cat_editing', defaultCombo: 'Backspace' },
  { id: 'newRow',    labelKey: 'shortcuts.newRow',    categoryKey: 'shortcuts.cat_editing', defaultCombo: 'Enter' },
  { id: 'undo',      labelKey: 'shortcuts.undo',      categoryKey: 'shortcuts.cat_editing', defaultCombo: 'Ctrl+Z' },
  { id: 'redo',      labelKey: 'shortcuts.redo',      categoryKey: 'shortcuts.cat_editing', defaultCombo: 'Ctrl+Y' },
  // File
  { id: 'new',       labelKey: 'shortcuts.new',       categoryKey: 'shortcuts.cat_file',    defaultCombo: 'Ctrl+N' },
  { id: 'open',      labelKey: 'shortcuts.open',      categoryKey: 'shortcuts.cat_file',    defaultCombo: 'Ctrl+O' },
  { id: 'save',      labelKey: 'shortcuts.save',      categoryKey: 'shortcuts.cat_file',    defaultCombo: 'Ctrl+S' },
  { id: 'export',    labelKey: 'shortcuts.export',    categoryKey: 'shortcuts.cat_file',    defaultCombo: 'Ctrl+E' },
];

const MOD_ORDER = ['Ctrl', 'Shift', 'Alt', 'Meta'] as const;

/**
 * Build a canonical combo string from a KeyboardEvent.
 * Ignores plain modifier presses (returns null).
 */
export function comboFromEvent(e: KeyboardEvent): string | null {
  const key = normalizeKey(e);
  if (!key) return null;
  const mods: string[] = [];
  if (e.ctrlKey) mods.push('Ctrl');
  if (e.shiftKey) mods.push('Shift');
  if (e.altKey) mods.push('Alt');
  if (e.metaKey) mods.push('Meta');
  // Reorder to canonical
  const ordered = MOD_ORDER.filter((m) => mods.includes(m));
  return [...ordered, key].join('+');
}

function normalizeKey(e: KeyboardEvent): string | null {
  const k = e.key;
  // Skip raw modifier keys
  if (k === 'Control' || k === 'Shift' || k === 'Alt' || k === 'Meta') return null;
  if (k === ' ') return 'Space';
  if (k.length === 1) return k.toUpperCase();
  // Special keys: keep as-is but uppercase first letter (Enter, Escape, Backspace, Delete, ArrowLeft, etc.)
  return k;
}

/** Check whether a KeyboardEvent matches the given combo string. */
export function matchesCombo(e: KeyboardEvent, combo: string): boolean {
  const eventCombo = comboFromEvent(e);
  if (!eventCombo) return false;
  return eventCombo.toLowerCase() === combo.toLowerCase();
}
