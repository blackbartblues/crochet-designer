import { usePdfDocumentStore } from '../stores/pdfDocumentStore';
import { newSection } from '../pdf/document/build';
import type { SectionKind } from '../pdf/document/types';
import { SectionOutline } from './SectionOutline';
import { SectionEditorRouter } from './SectionEditorRouter';

export function PdfBuilderView() {
  const document = usePdfDocumentStore((s) => s.document);
  const selectedId = usePdfDocumentStore((s) => s.selectedSectionId);
  const select = usePdfDocumentStore((s) => s.selectSection);
  const add = usePdfDocumentStore((s) => s.addSection);
  const remove = usePdfDocumentStore((s) => s.removeSection);

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
        <button type="button">Preview PDF</button>
        <button type="button">Export PDF</button>
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
        <div
          style={{
            width: 360,
            background: '#fafaf7',
            borderLeft: '1px solid #b8a87a',
            padding: 12,
            fontFamily: 'Georgia, serif',
            color: '#7a6347',
            fontStyle: 'italic',
            fontSize: 12,
          }}
        >
          Live PDF preview (Task 11).
        </div>
      </div>
    </div>
  );
}
