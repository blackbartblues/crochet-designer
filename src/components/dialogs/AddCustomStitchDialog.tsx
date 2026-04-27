import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CustomStitchMeta } from '../../domain/stitches';
import { validateCustomCode } from '../../domain/stitches';
import {
  LIBRARY_CATEGORIES,
  LIBRARY_SYMBOLS,
  searchLibrarySymbols,
  type LibraryCategoryId,
  type LibrarySymbol,
} from '../../domain/symbolLibrary';

interface AddCustomStitchDialogProps {
  customStitches: readonly CustomStitchMeta[];
  onCancel: () => void;
  onSubmit: (data: { code: string; labelPl?: string; labelEn?: string; symbolRef?: string }) => void;
}

type CategoryFilter = LibraryCategoryId | 'all' | 'none';

export function AddCustomStitchDialog({ customStitches, onCancel, onSubmit }: AddCustomStitchDialogProps) {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage ?? 'pl').startsWith('en');

  const [code, setCode] = useState('');
  const [labelPl, setLabelPl] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [symbolRef, setSymbolRef] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  const codeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    codeRef.current?.focus();
  }, []);

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

  const validation = useMemo(
    () => validateCustomCode(code, customStitches),
    [code, customStitches],
  );

  const visibleSymbols: readonly LibrarySymbol[] = useMemo(() => {
    let pool: readonly LibrarySymbol[] = LIBRARY_SYMBOLS;
    if (categoryFilter !== 'all' && categoryFilter !== 'none') {
      pool = pool.filter((s) => s.category === categoryFilter);
    }
    if (search.trim().length > 0) pool = searchLibrarySymbols(search).filter((s) =>
      categoryFilter === 'all' || categoryFilter === 'none' ? true : s.category === categoryFilter,
    );
    return pool;
  }, [categoryFilter, search]);

  const errorText = (() => {
    if (validation.ok) return null;
    switch (validation.reason) {
      case 'empty':         return t('customStitch.error.codeRequired');
      case 'format':        return t('customStitch.error.codeFormat');
      case 'collidesBuiltIn':
        return t('customStitch.error.codeBuiltIn', { code: validation.conflict ?? '' });
      case 'collidesCustom':
        return t('customStitch.error.codeDuplicate');
    }
  })();

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validation.ok) return;
    onSubmit({
      code: code.trim(),
      labelPl: labelPl.trim() || undefined,
      labelEn: labelEn.trim() || undefined,
      symbolRef,
    });
  };

  const pickSymbol = (symbol: LibrarySymbol) => {
    setSymbolRef(symbol.id);
    if (code.trim().length === 0 && symbol.suggestedCode) {
      setCode(symbol.suggestedCode.slice(0, 3));
    }
    if (labelPl.trim().length === 0) setLabelPl(symbol.labelPl);
    if (labelEn.trim().length === 0) setLabelEn(symbol.labelEn);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-card modal-card--wide"
        role="dialog"
        aria-label={t('customStitch.modal.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">{t('customStitch.modal.title')}</h2>

        <form onSubmit={submit} className="custom-stitch-form">
          <div className="custom-stitch-form-row">
            <label className="custom-stitch-field">
              <span className="custom-stitch-field-label">{t('customStitch.modal.field.code')}</span>
              <input
                ref={codeRef}
                type="text"
                className="custom-stitch-input"
                value={code}
                maxLength={3}
                onChange={(e) => setCode(e.target.value)}
                aria-invalid={!validation.ok && code.length > 0}
              />
              <span className="custom-stitch-field-help">
                {t('customStitch.modal.field.codeHelp')}
              </span>
              {errorText && code.length > 0 && (
                <span className="custom-stitch-field-error">{errorText}</span>
              )}
            </label>

            <label className="custom-stitch-field">
              <span className="custom-stitch-field-label">{t('customStitch.modal.field.labelPl')}</span>
              <input
                type="text"
                className="custom-stitch-input"
                value={labelPl}
                onChange={(e) => setLabelPl(e.target.value)}
              />
            </label>

            <label className="custom-stitch-field">
              <span className="custom-stitch-field-label">{t('customStitch.modal.field.labelEn')}</span>
              <input
                type="text"
                className="custom-stitch-input"
                value={labelEn}
                onChange={(e) => setLabelEn(e.target.value)}
              />
            </label>
          </div>

          <div className="custom-stitch-library">
            <div className="custom-stitch-library-toolbar">
              <span className="custom-stitch-field-label">{t('customStitch.modal.library.title')}</span>
              <input
                type="search"
                className="custom-stitch-input"
                placeholder={t('customStitch.modal.library.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="custom-stitch-library-categories">
              <button
                type="button"
                className={`category-chip${categoryFilter === 'all' ? ' is-active' : ''}`}
                onClick={() => setCategoryFilter('all')}
              >
                {t('customStitch.modal.library.allCategories')}
              </button>
              {LIBRARY_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`category-chip${categoryFilter === c.id ? ' is-active' : ''}`}
                  onClick={() => setCategoryFilter(c.id)}
                >
                  {isEn ? c.labelEn : c.labelPl}
                </button>
              ))}
              <button
                type="button"
                className={`category-chip${categoryFilter === 'none' ? ' is-active' : ''}`}
                onClick={() => {
                  setCategoryFilter('none');
                  setSymbolRef(undefined);
                }}
                title={t('customStitch.modal.library.noneTooltip')}
              >
                {t('customStitch.modal.library.none')}
              </button>
            </div>

            {categoryFilter === 'none' ? (
              <div className="custom-stitch-library-empty">
                {t('customStitch.modal.library.noneHint')}
              </div>
            ) : (
              <div className="custom-stitch-library-grid">
                {visibleSymbols.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`library-symbol-tile${symbolRef === s.id ? ' is-active' : ''}`}
                    onClick={() => pickSymbol(s)}
                    title={`${isEn ? s.labelEn : s.labelPl}${s.suggestedCode ? ` (${s.suggestedCode})` : ''}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <use href={`#${s.id}`} />
                    </svg>
                    <span className="library-symbol-label">{isEn ? s.labelEn : s.labelPl}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn-ghost"
              onClick={onCancel}
            >
              {t('customStitch.modal.btn.cancel')}
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-primary"
              disabled={!validation.ok}
            >
              {t('customStitch.modal.btn.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
