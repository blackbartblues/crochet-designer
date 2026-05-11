import { PDFViewer } from '@react-pdf/renderer';
import type { Pattern } from '../domain/graph/types';
import { PatternDocument } from '../pdf/PatternDocument';

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
      <div style={{ flex: 1, minHeight: 0 }}>
        <PDFViewer width="100%" height="100%" showToolbar>
          <PatternDocument pattern={pattern} />
        </PDFViewer>
      </div>
    </div>
  );
}
