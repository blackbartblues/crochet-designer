import { useTranslation } from 'react-i18next';
import type { StitchMeta } from '../../domain/stitches';

interface StitchButtonProps {
  meta: StitchMeta;
  isActive: boolean;
  onSelect: () => void;
}

export function StitchButton({ meta, isActive, onSelect }: StitchButtonProps) {
  const { i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage ?? 'pl').startsWith('en');
  const label = isEn ? meta.labelEn : meta.labelPl;
  const counter = isEn ? meta.labelPl : meta.labelEn;

  return (
    <button
      className={`stitch-btn${isActive ? ' is-active' : ''}`}
      title={`${label} (${counter})`}
      onClick={onSelect}
    >
      <div className="stitch-symbol">
        <svg>
          <use href={`#${meta.symbolId}`} />
        </svg>
      </div>
      <div className="stitch-code">{meta.code}</div>
    </button>
  );
}
