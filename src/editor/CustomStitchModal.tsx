import { useState } from 'react';
import { EMPTY_DRAFT, type CustomStitchDraft } from '../domain/customStitch/types';
import { finalizeDraft, isShortCodeAvailable } from '../domain/customStitch/registry';
import type { CustomStitch } from '../domain/graph/types';
import { editorTheme } from './theme';

interface Props {
  existing: ReadonlyArray<CustomStitch>;
  onCancel: () => void;
  onCreate: (stitch: CustomStitch) => void;
}

const PRESET_SYMBOLS = [
  { id: 'shell',    label: 'Shell ∨' },
  { id: 'popcorn',  label: 'Popcorn ○' },
  { id: 'puff',     label: 'Puff ◇' },
  { id: 'picot',    label: 'Picot ⁂' },
  { id: 'v_stitch', label: 'V-stitch ∨' },
  { id: 'fpdc',     label: 'FPdc ⊥' },
  { id: 'bpdc',     label: 'BPdc ⊤' },
];

export function CustomStitchModal({ existing, onCancel, onCreate }: Props) {
  const [draft, setDraft] = useState<CustomStitchDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<string[]>([]);
  const codeFree = isShortCodeAvailable(existing, draft.shortCode);

  function update<K extends keyof CustomStitchDraft>(k: K, v: CustomStitchDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors([]);
  }

  function submit() {
    const r = finalizeDraft(draft);
    if (r.kind === 'error') return setErrors(r.messages);
    if (!codeFree) return setErrors(['shortCode collides with built-in or existing']);
    onCreate(r.value);
  }

  return (
    <div
      role="dialog"
      aria-label="Custom stitch"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(58, 47, 29, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        style={{
          background: editorTheme.color.paperHi,
          padding: editorTheme.spacing.xl,
          borderRadius: editorTheme.radius.l,
          minWidth: 380,
          fontFamily: editorTheme.font.body,
          color: editorTheme.color.ink,
        }}
      >
        <h2 style={{ margin: 0, fontStyle: 'italic' }}>Nowy splot</h2>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>
            ShortCode (1–3 letters)
            <input
              value={draft.shortCode}
              onChange={(e) => update('shortCode', e.target.value)}
              style={{ display: 'block', width: '100%' }}
            />
            {!codeFree && draft.shortCode && (
              <span style={{ color: editorTheme.color.accent, fontSize: 11 }}>collides</span>
            )}
          </label>
          <label>
            Nazwa (PL)
            <input value={draft.namePl} onChange={(e) => update('namePl', e.target.value)} style={{ display: 'block', width: '100%' }} />
          </label>
          <label>
            Name (EN)
            <input value={draft.nameEn} onChange={(e) => update('nameEn', e.target.value)} style={{ display: 'block', width: '100%' }} />
          </label>
          <label>
            Symbol
            <select
              value={draft.symbolPresetId ?? ''}
              onChange={(e) => update('symbolPresetId', e.target.value || undefined)}
              style={{ display: 'block', width: '100%' }}
            >
              <option value="">(choose…)</option>
              {PRESET_SYMBOLS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
        {errors.length > 0 && (
          <ul style={{ color: editorTheme.color.accent, fontSize: 12 }}>
            {errors.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )}
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel}>Anuluj</button>
          <button type="button" onClick={submit}>Dodaj</button>
        </div>
      </div>
    </div>
  );
}
