import { useTranslation } from 'react-i18next';
import { Icon } from '../primitives/Icon';
import { useUiStore } from '../../stores/uiStore';
import i18n, { SUPPORTED_LANGS, type SupportedLang } from '../../i18n';

interface TopbarProps {
  patternName?: string;
  patternStat?: string;
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
}

export function Topbar({ patternName, patternStat, onOpenSettings, onOpenShortcuts }: TopbarProps) {
  const { t, i18n: i18nInstance } = useTranslation();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  const currentLang = (i18nInstance.resolvedLanguage ?? 'pl') as SupportedLang;
  const cycleLang = () => {
    const idx = SUPPORTED_LANGS.indexOf(currentLang);
    const next = SUPPORTED_LANGS[(idx + 1) % SUPPORTED_LANGS.length]!;
    void i18n.changeLanguage(next);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <Icon name="ui-yarn-ball" size="md" />
        </div>
        <div className="brand-name">
          {t('brand.name')} <em>{t('brand.tagline')}</em>
        </div>

        {patternName && (
          <div className="pattern-meta">
            <div className="pattern-name">{patternName}</div>
            {patternStat && <div className="pattern-stat">{patternStat}</div>}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <button className="lang-pill" title={t('topbar.language')} onClick={cycleLang}>
          <Icon name="ui-language" size="sm" />
          <span>{currentLang.toUpperCase()}</span>
        </button>
        <button
          className="btn-icon"
          title={theme === 'dark' ? t('topbar.lightMode') : t('topbar.darkMode')}
          aria-label={theme === 'dark' ? t('topbar.lightMode') : t('topbar.darkMode')}
          onClick={toggleTheme}
        >
          <Icon name={theme === 'dark' ? 'ui-sun' : 'ui-moon'} size="md" />
        </button>
        <button
          className="btn-icon"
          title={t('topbar.settings')}
          aria-label={t('topbar.settings')}
          onClick={onOpenSettings}
        >
          <Icon name="ui-settings" size="md" />
        </button>
        <button
          className="btn-icon"
          title={t('shortcuts.title')}
          aria-label={t('shortcuts.title')}
          onClick={onOpenShortcuts}
        >
          <Icon name="ui-keyboard" size="md" />
        </button>
      </div>
    </header>
  );
}
