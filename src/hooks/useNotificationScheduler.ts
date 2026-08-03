import { useCallback, useEffect, useState } from 'react';
import type { AppState, NotificationPermissionState } from '../types';
import {
  checkDueNotifications,
  deliverNotifications,
  getPermission,
  requestNotifyPermission,
  type PendingToast,
} from '../utils/notifications';

const POLL_MS = 20_000;

export function useNotificationScheduler(state: AppState) {
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    getPermission()
  );
  const [toasts, setToasts] = useState<PendingToast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const enableNotifications = useCallback(async () => {
    const result = await requestNotifyPermission();
    setPermission(result);
    return result;
  }, []);

  useEffect(() => {
    setPermission(getPermission());
  }, []);

  useEffect(() => {
    const run = () => {
      const due = checkDueNotifications(state);
      if (due.length === 0) return;
      deliverNotifications(due);
      setToasts((prev) => {
        const ids = new Set(prev.map((t) => t.id));
        const fresh = due.filter((t) => !ids.has(t.id));
        return [...fresh, ...prev].slice(0, 6);
      });
    };

    run();
    const id = window.setInterval(run, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [state]);

  return { permission, enableNotifications, toasts, dismissToast };
}
