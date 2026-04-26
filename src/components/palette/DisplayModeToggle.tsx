import { useTranslation } from 'react-i18next';
import type { DisplayMode } from '../../domain/stitches';

interface DisplayModeToggleProps {
  mode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
}

export function DisplayModeToggle({ mode, onChange }: DisplayModeToggleProps) {
  const { t } = useTranslation();
  const options: { value: DisplayMode; key: string }[] = [
    { value: 'symbol', key: 'palette.displayMode.symbol' },
    { value: 'code', key: 'palette.displayMode.code' },
    { value: 'both', key: 'palette.displayMode.both' },
  ];

  return (
    <div className="display-toggle" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={mode === opt.value}
          className={`display-toggle-btn${mode === opt.value ? ' is-active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {t(opt.key)}
        </button>
      ))}
    </div>
  );
}
