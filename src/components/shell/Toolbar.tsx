import { useTranslation } from 'react-i18next';
import { Icon } from '../primitives/Icon';

interface ToolbarProps {
  canUndo?: boolean;
  canRedo?: boolean;
  isSaving?: boolean;
  isExporting?: boolean;
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClearRow?: () => void;
}

export function Toolbar({
  canUndo,
  canRedo,
  isSaving,
  isExporting,
  onNew,
  onOpen,
  onSave,
  onExport,
  onUndo,
  onRedo,
  onClearRow,
}: ToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="toolbar">
      <button className="btn" onClick={onNew} title={t('toolbar.tooltip_new')}>
        <Icon name="ui-file-new" size="sm" />
        {t('toolbar.new')}
      </button>
      <button className="btn" onClick={onOpen} title={t('toolbar.tooltip_open')}>
        <Icon name="ui-folder-open" size="sm" />
        {t('toolbar.open')}
      </button>
      <button
        className="btn"
        onClick={onSave}
        disabled={isSaving}
        title={t('toolbar.tooltip_save')}
      >
        <Icon name="ui-save" size="sm" />
        {isSaving ? t('toolbar.saving') : t('toolbar.save')}
      </button>
      <button
        className="btn"
        onClick={onExport}
        disabled={isExporting}
        title={t('toolbar.tooltip_export')}
      >
        <Icon name="ui-export" size="sm" />
        {isExporting ? t('toolbar.exporting') : t('toolbar.export')} ·{' '}
        {!isExporting && (
          <strong style={{ marginLeft: 4, color: 'var(--accent-sage)' }}>.xlsx</strong>
        )}
      </button>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="btn-icon"
          title={t('toolbar.tooltip_undo')}
          aria-label={t('toolbar.undo')}
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Icon name="ui-undo" size="md" />
        </button>
        <button
          className="btn-icon"
          title={t('toolbar.tooltip_redo')}
          aria-label={t('toolbar.redo')}
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Icon name="ui-redo" size="md" />
        </button>
      </div>

      <div className="toolbar-divider" />

      <button className="btn btn-ghost" onClick={onClearRow}>
        <Icon name="ui-trash" size="sm" />
        {t('toolbar.clearRow')}
      </button>

      <div className="toolbar-spacer" />
    </div>
  );
}
