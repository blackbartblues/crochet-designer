import { useTranslation } from 'react-i18next';
import type { StitchKey } from '../../domain/stitches';
import type { YarnColor } from '../../domain/colors';
import { STITCHES } from '../../domain/stitches';
import { isDarkHex } from '../../domain/colors';

interface BrushBarProps {
  stitch: StitchKey;
  color: YarnColor;
  cursorRow: number;
  cursorCol: number;
}

export function BrushBar({ stitch, color, cursorRow, cursorCol }: BrushBarProps) {
  const { t, i18n } = useTranslation();
  const meta = STITCHES[stitch];
  const isEn = (i18n.resolvedLanguage ?? 'pl').startsWith('en');
  const stitchLabel = isEn ? meta.labelEn : meta.labelPl;
  const dark = isDarkHex(color.hex);

  return (
    <section className="brush-bar" aria-label={t('brush.label')}>
      <div className="brush-card">
        <div
          className={`brush-preview${dark ? ' dark' : ''}`}
          style={{ background: color.hex }}
        >
          <svg aria-hidden="true">
            <use href={`#${meta.symbolId}`} />
          </svg>
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
