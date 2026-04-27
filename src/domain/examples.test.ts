import { describe, it, expect } from 'vitest';
import { parsePatternJson } from './validation';

/**
 * Every file in /examples must parse successfully.
 * Examples are referenced by docs/LLM_PATTERN_GUIDE.md as templates the LLM can clone,
 * so a regression here means the guide is misleading users.
 *
 * Uses Vite's import.meta.glob to load example files at test time without depending on
 * @types/node — keeps the existing TS configuration intact.
 */
const exampleFiles = import.meta.glob('../../examples/*.wzor', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('examples/*.wzor parse cleanly', () => {
  const entries = Object.entries(exampleFiles);

  it('directory contains at least one example', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  for (const [path, json] of entries) {
    it(`${path} parses without errors`, () => {
      const report = { orphanedCellsCleared: 0 };
      const parsed = parsePatternJson(json, report);
      expect(parsed.schemaVersion).toBe(2);
      expect(report.orphanedCellsCleared).toBe(0);
    });
  }
});
