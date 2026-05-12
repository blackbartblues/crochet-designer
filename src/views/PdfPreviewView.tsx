import type { Pattern } from '../domain/graph/types';
// import { PatternDocument } from '../pdf/PatternDocument';

interface Props {
  pattern: Pattern;
  onClose: () => void;
}

export function PdfPreviewView({ pattern, onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10000,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: '#f7f3e8',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          color: '#3a2f1d',
        }}
      >
        <span>PDF Preview — {pattern.meta.title.en || pattern.meta.title.pl}</span>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </header>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a2f1d' }}>
        {/* TODO: Task 5 will restore PDF preview with PdfDocumentRenderer */}
        <p>PDF preview temporarily disabled during refactoring</p>
      </div>
    </div>
  );
}
