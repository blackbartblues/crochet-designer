import { useEffect } from 'react';

export interface ConfirmAction {
  label: string;
  /** 'primary' | 'danger' | 'ghost' — visual treatment */
  kind?: 'primary' | 'danger' | 'ghost';
  onClick: () => void;
}

interface ConfirmDialogProps {
  title: string;
  message: string;
  actions: ConfirmAction[];
  /** Called when user dismisses via Esc or backdrop click. Defaults to last action. */
  onDismiss?: () => void;
}

export function ConfirmDialog({ title, message, actions, onDismiss }: ConfirmDialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss?.();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onDismiss]);

  return (
    <div className="modal-backdrop" onClick={() => onDismiss?.()}>
      <div className="modal-card" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              className={`modal-btn modal-btn-${a.kind ?? 'primary'}`}
              onClick={a.onClick}
              autoFocus={a.kind === 'primary'}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
