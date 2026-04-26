import { useTranslation } from 'react-i18next';
import type { StitchKey, DisplayMode } from '../../domain/stitches';
import { STITCHES, STITCH_ORDER } from '../../domain/stitches';
import { StitchButton } from './StitchButton';
import { DisplayModeToggle } from './DisplayModeToggle';

interface StitchPaletteProps {
  selected: StitchKey;
  onSelect: (key: StitchKey) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
}

export function StitchPalette({
  selected,
  onSelect,
  displayMode,
  onDisplayModeChange,
}: StitchPaletteProps) {
  const { t } = useTranslation();
  return (
    <section className="palette-strip" aria-label={t('palette.stitches')}>
      <div className="palette-label">
        <div className="palette-label-text">{t('palette.stitches')}</div>
        <div className="palette-label-hint">{t('palette.stitches_hint')}</div>
      </div>

      <div className="stitch-grid">
        {STITCH_ORDER.map((key) => (
          <StitchButton
            key={key}
            meta={STITCHES[key]}
            isActive={key === selected}
            onSelect={() => onSelect(key)}
          />
        ))}
      </div>

      <DisplayModeToggle mode={displayMode} onChange={onDisplayModeChange} />
    </section>
  );
}
