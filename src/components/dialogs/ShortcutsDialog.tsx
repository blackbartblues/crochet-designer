import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settingsStore';
import { SHORTCUTS } from '../../domain/shortcuts';

interface ShortcutsDialogProps {
  onClose: () => void;
}

/** Read-only list of all keyboard shortcuts (incl. built-ins like arrows). */
export function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  const { t } = useTranslation();
  const comboFor = useSettingsStore((s) => s.comboFor);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [onClose]);

  // Group user-configurable shortcuts by category
  const grouped = new Map<string, typeof SHORTCUTS[number][]>();
  for (const s of SHORTCUTS) {
    if (!grouped.has(s.categoryKey)) grouped.set(s.categoryKey, []);
    grouped.get(s.categoryKey)!.push(s);
  }

  // Built-in shortcuts (not remappable)
  const builtins = [
    { combo: '↑ ↓ ← →', labelKey: 'shortcuts.cursor' },
    { combo: '1–9', labelKey: 'shortcuts.selectStitch' },
    { combo: 'Esc', labelKey: 'shortcuts.closePicker' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card shortcuts-card"
        role="dialog"
        aria-label={t('shortcuts.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">{t('shortcuts.title')}</h2>

        {Array.from(grouped.entries()).map(([catKey, items]) => (
          <div key={catKey} className="shortcuts-group">
            <div className="shortcuts-group-title">{t(catKey)}</div>
            <div className="shortcuts-list">
              {items.map((s) => (
                <div key={s.id} className="shortcuts-row">
                  <span className="shortcuts-label">{t(s.labelKey)}</span>
                  <span className="shortcuts-combo">{comboFor(s.id)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="shortcuts-group">
          <div className="shortcuts-group-title">{t('shortcuts.cat_navigation')}</div>
          <div className="shortcuts-list">
            {builtins.map((b) => (
              <div key={b.combo} className="shortcuts-row">
                <span className="shortcuts-label">{t(b.labelKey)}</span>
                <span className="shortcuts-combo">{b.combo}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-primary" onClick={onClose}>
            {t('dialog.ok')}
          </button>
        </div>
      </div>
    </div>
  );
}
