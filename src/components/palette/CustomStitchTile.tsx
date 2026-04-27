import { useTranslation } from 'react-i18next';
import type { CustomStitchMeta } from '../../domain/stitches';
import { isValidLibrarySymbolId } from '../../domain/symbolLibrary';

interface CustomStitchTileProps {
  meta: CustomStitchMeta;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function CustomStitchTile({ meta, isActive, onSelect, onDelete }: CustomStitchTileProps) {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage ?? 'pl').startsWith('en');
  const label =
    (isEn ? meta.labelEn : meta.labelPl) ??
    (isEn ? meta.labelPl : meta.labelEn) ??
    meta.code;

  const useLibrarySymbol = !!meta.symbolRef && isValidLibrarySymbolId(meta.symbolRef);

  return (
    <div className={`stitch-btn stitch-btn--custom${isActive ? ' is-active' : ''}`} title={label}>
      <button
        type="button"
        className="stitch-btn-main"
        aria-pressed={isActive}
        onClick={onSelect}
      >
        <div className="stitch-symbol">
          {useLibrarySymbol ? (
            <svg>
              <use href={`#${meta.symbolRef}`} />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <text
                x="12"
                y="13"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontFamily="var(--font-mono, monospace)"
                fontWeight="600"
                fill="currentColor"
              >
                {meta.code.slice(0, 3).toUpperCase()}
              </text>
            </svg>
          )}
        </div>
        <div className="stitch-code">{meta.code}</div>
      </button>

      <button
        type="button"
        className="stitch-btn-delete"
        aria-label={t('customStitch.delete.tooltip')}
        title={t('customStitch.delete.tooltip')}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <use href="#ui-trash" />
        </svg>
      </button>
    </div>
  );
}
