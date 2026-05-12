import { useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { usePdfDocumentStore } from '../stores/pdfDocumentStore';
import { newSection } from '../pdf/document/build';
import type { SectionKind } from '../pdf/document/types';
import { SectionOutline } from './SectionOutline';
import { SectionEditorRouter } from './SectionEditorRouter';
import { PdfDocumentRenderer } from '../pdf/PdfDocumentRenderer';
import { exportPdfDocument } from '../pdf/exportPdf';
import { PdfPreviewView } from '../views/PdfPreviewView';

export function PdfBuilderView() {
  const document = usePdfDocumentStore((s) => s.document);
  const selectedId = usePdfDocumentStore((s) => s.selectedSectionId);
  const select = usePdfDocumentStore((s) => s.selectSection);
  const add = usePdfDocumentStore((s) => s.addSection);
  const remove = usePdfDocumentStore((s) => s.removeSection);

  const [showPreview, setShowPreview] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  if (!document) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Georgia, serif', color: '#7a6347', fontStyle: 'italic' }}>
        Load or create a PDF pattern to begin.
      </div>
    );
  }

  const selected = document.sections.find((s) => s.id === selectedId) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f4f1ea' }}>
      <header
        style={{
          height: 40,
          background: '#fafaf7',
          borderBottom: '1px solid #b8a87a',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 16,
          fontFamily: 'Georgia, serif',
          color: '#3a2f1d',
        }}
      >
        <span style={{ fontStyle: 'italic', fontSize: 18, color: '#5a4730' }}>
          {document.meta.title.en || document.meta.title.pl || '(untitled)'}
        </span>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={() => setShowPreview(true)}>Preview PDF</button>
        <button
          type="button"
          onClick={async () => {
            if (!document) return;
            const r = await exportPdfDocument(document);
            if (r.kind === 'ok') setExportStatus(`Saved to ${r.path}`);
            else if (r.kind === 'error') setExportStatus(`Error: ${r.message}`);
            else setExportStatus(null);
            setTimeout(() => setExportStatus(null), 4000);
          }}
        >
          Export PDF
        </button>
      </header>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <SectionOutline
          sections={document.sections}
          selectedId={selectedId}
          onSelect={select}
          onAdd={(k: SectionKind) => add(newSection(k))}
          onRemove={remove}
        />
        <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          <SectionEditorRouter section={selected} />
        </div>
        <div style={{ width: 360, background: '#fafaf7', borderLeft: '1px solid #b8a87a', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#5a4730', fontSize: 12, borderBottom: '1px solid #b8a87a' }}>
            Live preview
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <PDFViewer width="100%" height="100%" showToolbar={false}>
              <PdfDocumentRenderer document={document} />
            </PDFViewer>
          </div>
        </div>
      </div>

      {showPreview && document && (
        <PdfPreviewView document={document} onClose={() => setShowPreview(false)} />
      )}
      {exportStatus && (
        <div
          style={{
            position: 'fixed',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fffcef',
            border: '1px solid #d4831a',
            padding: '8px 16px',
            borderRadius: 4,
            fontSize: 12,
            color: '#3a2f1d',
            zIndex: 9999,
          }}
        >
          {exportStatus}
        </div>
      )}
    </div>
  );
}
