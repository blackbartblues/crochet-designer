import { useState } from 'react';
import { GraphCanvas } from './canvas/GraphCanvas';
import { NodePalette } from './NodePalette';
import { Inspector } from './Inspector';
import { CustomStitchModal } from './CustomStitchModal';
import { usePatternGraphStore } from '../stores/patternGraphStore';
import { useDocumentStore } from '../stores/documentStore';
import { newStitch } from '../domain/graph/build';
import { addCustomStitch } from '../domain/customStitch/registry';
import type { StitchTypeRef, CustomStitch } from '../domain/graph/types';
import { editorTheme } from './theme';

export function GraphEditorShell() {
  const pattern = usePatternGraphStore((s) => s.pattern);
  const selectedStitchId = usePatternGraphStore((s) => s.selectedStitchId);
  const setPattern = usePatternGraphStore((s) => s.setPattern);
  const addStitch = usePatternGraphStore((s) => s.addStitch);
  const selectStitch = usePatternGraphStore((s) => s.selectStitch);
  const switchToRectMode = () => useDocumentStore.getState().setMode('rectangular');
  const [showCustomModal, setShowCustomModal] = useState(false);

  function handlePaletteSelect(typeRef: StitchTypeRef) {
    if (!pattern) return;
    addStitch(newStitch(typeRef, { position: { x: 0, y: 0 } }));
  }

  function handleCustomCreated(stitch: CustomStitch) {
    if (!pattern) return;
    setPattern({ ...pattern, customStitches: addCustomStitch(pattern.customStitches, stitch) });
    setShowCustomModal(false);
  }

  if (!pattern) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: editorTheme.color.paper,
          fontFamily: editorTheme.font.body,
          color: editorTheme.color.inkSoft,
          fontStyle: 'italic',
        }}
      >
        Load or create a pattern to begin.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: editorTheme.color.paper }}>
      <header
        style={{
          height: 40,
          background: editorTheme.color.paperHi,
          borderBottom: `1px solid ${editorTheme.color.rule}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: editorTheme.font.display,
            fontStyle: 'italic',
            fontSize: 18,
            color: editorTheme.color.inkSoft,
          }}
        >
          crochet-designer
        </span>
        <span style={{ flex: 1 }} />
        {/* Export moved to PdfBuilderView */}
        <button type="button" onClick={() => { try { switchToRectMode(); } catch { /* no-op when no v2 pattern */ } }}>
          Switch to rectangular
        </button>
      </header>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <NodePalette
          onSelect={handlePaletteSelect}
          onAddCustom={() => setShowCustomModal(true)}
          customStitches={pattern.customStitches}
          colors={pattern.colors}
        />
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <GraphCanvas onNodeClick={selectStitch} />
        </div>
        <Inspector pattern={pattern} selectedStitchId={selectedStitchId} />
      </div>
      <footer
        style={{
          height: 28,
          background: editorTheme.color.paperHi,
          borderTop: `1px solid ${editorTheme.color.rule}`,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 11,
          color: editorTheme.color.inkSoft,
        }}
      >
        <span>Stitches: {pattern.stitches.length}</span>
        <span>Edges: {pattern.edges.length}</span>
        <span>Custom: {pattern.customStitches.length}</span>
      </footer>
      {showCustomModal && (
        <CustomStitchModal
          existing={pattern.customStitches}
          onCancel={() => setShowCustomModal(false)}
          onCreate={handleCustomCreated}
        />
      )}
    </div>
  );
}
