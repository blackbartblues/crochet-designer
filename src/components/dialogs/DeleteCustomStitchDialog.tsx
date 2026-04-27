import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BuiltInStitchKey, CustomStitchMeta } from '../../domain/stitches';
import { STITCHES, STITCH_ORDER } from '../../domain/stitches';

interface DeleteCustomStitchDialogProps {
  meta: CustomStitchMeta;
  usageCount: number;
  onCancel: () => void;
  onConfirm: (replacement: BuiltInStitchKey | null) => void;
}

type Mode = 'clear' | 'replace';

export function DeleteCustomStitchDialog({
  meta,
  usageCount,
  onCancel,
  onConfirm,
}: DeleteCustomStitchDialogProps) {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage ?? 'pl').startsWith('en');
  const [mode, setMode] = useState<Mode>('clear');
  const [replacement, setReplacement] = useState<BuiltInStitchKey>('sc');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  const confirm = () => {
    onConfirm(mode === 'replace' ? replacement : null);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-card"
        role="dialog"
        aria-label={t('customStitch.delete.title', { code: meta.code })}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">
          {t('customStitch.delete.title', { code: meta.code })}
        </h2>

        {usageCount > 0 ? (
          <>
            <p className="modal-message">
              {t('customStitch.delete.usedBody', { count: usageCount })}
            </p>
            <div className="custom-stitch-form-row custom-stitch-delete-options">
              <label className="custom-stitch-radio">
                <input
                  type="radio"
                  name="delete-mode"
                  value="clear"
                  checked={mode === 'clear'}
                  onChange={() => setMode('clear')}
                />
                <span>{t('customStitch.delete.optionClear')}</span>
              </label>
              <label className="custom-stitch-radio">
                <input
                  type="radio"
                  name="delete-mode"
                  value="replace"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                />
                <span>{t('customStitch.delete.optionReplace')}</span>
                <select
                  className="custom-stitch-input"
                  disabled={mode !== 'replace'}
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value as BuiltInStitchKey)}
                >
                  {STITCH_ORDER.map((k) => (
                    <option key={k} value={k}>
                      {STITCHES[k].code} — {isEn ? STITCHES[k].labelEn : STITCHES[k].labelPl}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </>
        ) : (
          <p className="modal-message">{t('customStitch.delete.unusedBody')}</p>
        )}

        <div className="modal-actions">
          <button type="button" className="modal-btn modal-btn-ghost" onClick={onCancel}>
            {t('customStitch.delete.btn.cancel')}
          </button>
          <button type="button" className="modal-btn modal-btn-danger" onClick={confirm}>
            {t('customStitch.delete.btn.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
