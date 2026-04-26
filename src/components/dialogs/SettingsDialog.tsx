import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { Icon } from '../primitives/Icon';
import { useSettingsStore } from '../../stores/settingsStore';
import { SHORTCUTS, comboFromEvent, type ShortcutActionId } from '../../domain/shortcuts';

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const { t } = useTranslation();
  const defaultSavePath = useSettingsStore((s) => s.defaultSavePath);
  const defaultExportPath = useSettingsStore((s) => s.defaultExportPath);
  const setSavePath = useSettingsStore((s) => s.setSavePath);
  const setExportPath = useSettingsStore((s) => s.setExportPath);
  const shortcuts = useSettingsStore((s) => s.shortcuts);
  const setShortcut = useSettingsStore((s) => s.setShortcut);
  const resetShortcut = useSettingsStore((s) => s.resetShortcut);
  const comboFor = useSettingsStore((s) => s.comboFor);

  const [recordingId, setRecordingId] = useState<ShortcutActionId | null>(null);

  // Esc closes the dialog (or cancels recording)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (recordingId) setRecordingId(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [onClose, recordingId]);

  // Capture next keypress when recording
  useEffect(() => {
    if (!recordingId) return;
    const handler = (e: KeyboardEvent) => {
      const combo = comboFromEvent(e);
      if (!combo) return; // ignore raw modifier presses
      e.preventDefault();
      e.stopPropagation();
      setShortcut(recordingId, combo);
      setRecordingId(null);
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [recordingId, setShortcut]);

  const browseSavePath = async () => {
    const result = await openDialog({
      title: t('settings.pickSavePath'),
      directory: true,
      multiple: false,
    });
    if (typeof result === 'string') setSavePath(result);
  };

  const browseExportPath = async () => {
    const result = await openDialog({
      title: t('settings.pickExportPath'),
      directory: true,
      multiple: false,
    });
    if (typeof result === 'string') setExportPath(result);
  };

  // Group shortcuts by category
  const grouped = new Map<string, typeof SHORTCUTS[number][]>();
  for (const s of SHORTCUTS) {
    if (!grouped.has(s.categoryKey)) grouped.set(s.categoryKey, []);
    grouped.get(s.categoryKey)!.push(s);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card settings-card"
        role="dialog"
        aria-label={t('settings.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">{t('settings.title')}</h2>

        <section className="settings-section">
          <h3 className="settings-section-title">{t('settings.paths')}</h3>

          <div className="settings-row">
            <label className="settings-label">{t('settings.defaultSavePath')}</label>
            <div className="settings-value">
              <code className="settings-path">{defaultSavePath ?? t('settings.defaultPathSystem')}</code>
              <button className="modal-btn modal-btn-ghost" onClick={() => void browseSavePath()}>
                <Icon name="ui-folder-open" size="sm" /> {t('settings.browse')}
              </button>
              {defaultSavePath && (
                <button className="modal-btn modal-btn-ghost" onClick={() => setSavePath(null)}>
                  {t('settings.reset')}
                </button>
              )}
            </div>
          </div>

          <div className="settings-row">
            <label className="settings-label">{t('settings.defaultExportPath')}</label>
            <div className="settings-value">
              <code className="settings-path">{defaultExportPath ?? t('settings.defaultPathSystem')}</code>
              <button className="modal-btn modal-btn-ghost" onClick={() => void browseExportPath()}>
                <Icon name="ui-folder-open" size="sm" /> {t('settings.browse')}
              </button>
              {defaultExportPath && (
                <button className="modal-btn modal-btn-ghost" onClick={() => setExportPath(null)}>
                  {t('settings.reset')}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">{t('settings.shortcuts')}</h3>
          {Array.from(grouped.entries()).map(([catKey, items]) => (
            <div key={catKey} className="settings-shortcut-group">
              <div className="settings-shortcut-group-title">{t(catKey)}</div>
              {items.map((s) => {
                const isRecording = recordingId === s.id;
                const isOverridden = shortcuts[s.id] !== undefined;
                const combo = comboFor(s.id);
                return (
                  <div key={s.id} className="settings-shortcut-row">
                    <span className="settings-shortcut-label">{t(s.labelKey)}</span>
                    <button
                      className={`settings-shortcut-combo${isRecording ? ' is-recording' : ''}`}
                      onClick={() => setRecordingId(isRecording ? null : s.id)}
                      title={t('settings.clickToRecord')}
                    >
                      {isRecording ? t('settings.pressKey') : combo}
                    </button>
                    {isOverridden && !isRecording && (
                      <button
                        className="modal-btn modal-btn-ghost"
                        onClick={() => resetShortcut(s.id)}
                        title={t('settings.resetToDefault')}
                      >
                        ↺
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </section>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-primary" onClick={onClose}>
            {t('dialog.ok')}
          </button>
        </div>
      </div>
    </div>
  );
}
