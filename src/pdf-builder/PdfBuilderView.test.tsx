import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PdfBuilderView } from './PdfBuilderView';
import { usePdfDocumentStore } from '../stores/pdfDocumentStore';
import { emptyPdfDocument } from '../pdf/document/build';

vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    PDFViewer: ({ children }: { children: React.ReactNode }) => <div data-testid="pdf-viewer-mock">{children}</div>,
  };
});

describe('PdfBuilderView', () => {
  beforeEach(() => {
    usePdfDocumentStore.getState().reset();
  });

  it('renders an empty state when no document is loaded', () => {
    render(<PdfBuilderView />);
    expect(screen.getByText(/load or create/i)).toBeInTheDocument();
  });

  it('renders the outline when a document is loaded', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    render(<PdfBuilderView />);
    // Outline shows section labels (Title, Thanks, Information, etc.)
    expect(screen.getAllByText(/Title/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Thanks/i).length).toBeGreaterThan(0);
  });
});
