import { useTranslation } from 'react-i18next';
import type { AnyStitchKey, CustomStitchMeta } from '../../domain/stitches';
import type { YarnColor } from '../../domain/colors';
import { STITCHES, isCustomStitch } from '../../domain/stitches';
import { isValidLibrarySymbolId } from '../../domain/symbolLibrary';
import { isDarkHex } from '../../domain/colors';

interface BrushBarProps {
  stitch: AnyStitchKey;
  color: YarnColor;
  cursorRow: number;
  cursorCol: number;
  customStitches: readonly CustomStitchMeta[];
}

export function BrushBar({ stitch, color, cursorRow, cursorCol, customStitches }: BrushBarProps) {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage ?? 'pl').startsWith('en');
  const dark = isDarkHex(color.hex);

  let stitchLabel: string;
  let symbolNode: React.ReactNode;
  if (isCustomStitch(stitch)) {
    const custom = customStitches.find((c) => c.key === stitch);
    stitchLabel =
      (isEn ? custom?.labelEn : custom?.labelPl) ??
      (isEn ? custom?.labelPl : custom?.labelEn) ??
      custom?.code ??
      '?';
    if (custom?.symbolRef && isValidLibrarySymbolId(custom.symbolRef)) {
      symbolNode = (
        <svg aria-hidden="true">
          <use href={`#${custom.symbolRef}`} />
        </svg>
      );
    } else {
      symbolNode = (
        <svg aria-hidden="true" viewBox="0 0 24 24">
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
            {(custom?.code ?? '?').slice(0, 3).toUpperCase()}
          </text>
        </svg>
      );
    }
  } else {
    const meta = STITCHES[stitch];
    stitchLabel = isEn ? meta.labelEn : meta.labelPl;
    symbolNode = (
      <svg aria-hidden="true">
        <use href={`#${meta.symbolId}`} />
      </svg>
    );
  }

  return (
    <section className="brush-bar" aria-label={t('brush.label')}>
      <div className="brush-card">
        <div
          className={`brush-preview${dark ? ' dark' : ''}`}
          style={{ background: color.hex }}
        >
          {symbolNode}
        </div>
        <div className="brush-info">
          <div className="brush-info-label">{t('brush.label')}</div>
          <div className="brush-info-value">
            {stitchLabel} · {color.name.toLowerCase()}
          </div>
        </div>
      </div>

      <div className="cursor-info">
        <span>{t('brush.cursor')}</span>
        <span className="cursor-coord">
          {t('brush.cursorPos', { row: cursorRow, col: cursorCol })}
        </span>
        <span className="brush-divider" />
        <span>
          <span className="kbd">{isEn ? 'Space' : 'Spacja'}</span> {t('brush.hint_placeStitch')},{' '}
          <span className="kbd">Enter</span> {t('brush.hint_newRow')},{' '}
          <span className="kbd">⌫</span> {t('brush.hint_delete')}
        </span>
      </div>
    </section>
  );
}
