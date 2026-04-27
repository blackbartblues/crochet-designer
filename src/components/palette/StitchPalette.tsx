import { useTranslation } from 'react-i18next';
import type {
  AnyStitchKey,
  CustomStitchKey,
  CustomStitchMeta,
  DisplayMode,
} from '../../domain/stitches';
import { STITCHES, STITCH_ORDER, isCustomStitch } from '../../domain/stitches';
import { StitchButton } from './StitchButton';
import { CustomStitchTile } from './CustomStitchTile';
import { AddCustomStitchTile } from './AddCustomStitchTile';
import { DisplayModeToggle } from './DisplayModeToggle';

interface StitchPaletteProps {
  selected: AnyStitchKey;
  onSelect: (key: AnyStitchKey) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  customStitches: readonly CustomStitchMeta[];
  onAddCustom: () => void;
  onDeleteCustom: (key: CustomStitchKey) => void;
}

export function StitchPalette({
  selected,
  onSelect,
  displayMode,
  onDisplayModeChange,
  customStitches,
  onAddCustom,
  onDeleteCustom,
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

        <div className="palette-divider" aria-hidden="true" />

        {customStitches.map((meta) => (
          <CustomStitchTile
            key={meta.key}
            meta={meta}
            isActive={isCustomStitch(selected) && selected === meta.key}
            onSelect={() => onSelect(meta.key)}
            onDelete={() => onDeleteCustom(meta.key)}
          />
        ))}

        <AddCustomStitchTile onClick={onAddCustom} />
      </div>

      <DisplayModeToggle mode={displayMode} onChange={onDisplayModeChange} />
    </section>
  );
}
