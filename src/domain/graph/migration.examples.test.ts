import { describe, it, expect } from 'vitest';
// @ts-ignore - Node.js modules in test environment
import { readdirSync, readFileSync } from 'fs';
// @ts-ignore - Node.js modules in test environment
import { join, dirname } from 'path';
// @ts-ignore - Node.js modules in test environment
import { fileURLToPath } from 'url';
import { parsePatternAsV3 } from '../validation';
import { validateGraph } from '../validation/graph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const examplesDir = join(__dirname, '..', '..', '..', 'examples');

describe('migration: every bundled example round-trips losslessly', () => {
  const files = (readdirSync(examplesDir) as string[]).filter((f) => f.endsWith('.wzor'));

  it('finds at least one example', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`migrates ${file} to a graph with zero critical issues`, () => {
      const text = readFileSync(join(examplesDir, file), 'utf-8');
      const v3 = parsePatternAsV3(text);
      expect(v3.schemaVersion).toBe(3);

      const issues = validateGraph(v3);
      const critical = issues.filter((i) => i.severity === 'critical');
      if (critical.length > 0) {
        // surface the first issue to make CI logs readable
        throw new Error(
          `Critical issues in ${file}: ${JSON.stringify(critical, null, 2)}`,
        );
      }
      expect(critical).toEqual([]);
    });
  }
});
