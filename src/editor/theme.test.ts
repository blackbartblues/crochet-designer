import { describe, it, expect } from 'vitest';
import { editorTheme } from './theme';

describe('editorTheme', () => {
  it('exposes expected color tokens', () => {
    expect(editorTheme.color.paper).toMatch(/^#/);
    expect(editorTheme.color.ink).toMatch(/^#/);
    expect(editorTheme.color.accent).toMatch(/^#/);
  });

  it('imports from reactflow without crashing', async () => {
    const rf = await import('reactflow');
    expect(typeof rf.ReactFlow).toBe('object');
  });
});
