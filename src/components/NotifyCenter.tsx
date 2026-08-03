import type { PendingToast } from '../utils/notifications';
import type { NotificationPermissionState } from '../types';

interface NotifyCenterProps {
  permission: NotificationPermissionState;
  onEnable: () => void;
  toasts: PendingToast[];
  onDismiss: (id: string) => void;
}

export function NotifyCenter({
  permission,
  onEnable,
  toasts,
  onDismiss,
}: NotifyCenterProps) {
  return (
    <div className="notify-center">
      {permission !== 'granted' && permission !== 'unsupported' && (
        <div className="notify-banner">
          <div>
            <strong>Enable reminders</strong>
            <p>
              Get hobby countdowns, sleep alarms, and 10‑minute task pings. Keep this tab open for
              best results.
            </p>
          </div>
          <button type="button" className="btn primary" onClick={onEnable}>
            {permission === 'denied' ? 'Blocked — check browser settings' : 'Allow notifications'}
          </button>
        </div>
      )}
      {permission === 'unsupported' && (
        <div className="notify-banner muted">
          <p>This browser doesn’t support notifications. In-app toasts will still appear.</p>
        </div>
      )}

      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <div>
              <strong>{t.title}</strong>
              <p>{t.body}</p>
            </div>
            <button
              type="button"
              className="icon-btn tiny"
              aria-label="Dismiss"
              onClick={() => onDismiss(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
