/**
 * Vintage palette tokens used across the Phase 2 editor.
 * Same tokens will be consumed by Phase 3 PDF theme.
 */
export const editorTheme = {
  color: {
    paper:    '#f4f1ea',
    paperHi:  '#fafaf7',
    ink:      '#3a2f1d',
    inkSoft:  '#5a4730',
    rule:     '#b8a87a',
    accent:   '#d4831a',
    accentHi: '#fffcef',
    yarnSeam: '#a89466',
    yarnFlow: '#7a8a55',
  },
  font: {
    display:  'Georgia, serif',
    body:     'Georgia, serif',
    mono:     'JetBrains Mono, monospace',
  },
  spacing: {
    xs: 4,
    s:  8,
    m:  12,
    l:  16,
    xl: 24,
  },
  radius: {
    s: 3,
    m: 6,
    l: 10,
  },
} as const;

export type EditorTheme = typeof editorTheme;
