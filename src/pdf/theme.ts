export const pdfTheme = {
  fonts: {
    display: 'Helvetica',
    body: 'Helvetica',
    accent: 'Helvetica-Oblique',
  },
  colors: {
    paper: '#f7f3e8',
    ink: '#3a2f1d',
    inkSoft: '#5a4730',
    rule: '#b8a87a',
    accent: '#d4831a',
    yarnSeam: '#a89466',
  },
  spacing: {
    page: 32,
    section: 24,
    rule: 16,
  },
  rules: {
    thin: 0.5,
    thick: 1.0,
  },
} as const;

export type PdfTheme = typeof pdfTheme;
