import type { Pattern } from '../../domain/graph/types';

interface GraphInspectorProps {
  pattern: Pattern | null;
}

export function GraphInspector({ pattern }: GraphInspectorProps) {
  if (!pattern) return null;

  return (
    <aside
      data-testid="graph-inspector"
      style={{
        position: 'fixed',
        right: 12,
        top: 12,
        bottom: 12,
        width: 360,
        background: '#fffcef',
        border: '1px solid #b8a87a',
        borderRadius: 4,
        padding: 12,
        fontFamily: 'monospace',
        fontSize: 11,
        overflow: 'auto',
        zIndex: 9999,
        color: '#3a2f1d',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}
    >
      <header style={{ marginBottom: 8 }}>
        <strong style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Graph inspector (dev)
        </strong>
      </header>
      <div>schemaVersion: {pattern.schemaVersion}</div>
      <div>shape: {pattern.shape}</div>
      <div>Stitches: {pattern.stitches.length}</div>
      <div>Edges: {pattern.edges.length}</div>
      <div>Rounds: {pattern.rounds.length}</div>
      <div>Custom stitches: {pattern.customStitches.length}</div>
      <div>Photos: {pattern.photos.length}</div>
      <details style={{ marginTop: 10 }}>
        <summary>Full JSON</summary>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {JSON.stringify(pattern, null, 2)}
        </pre>
      </details>
    </aside>
  );
}
