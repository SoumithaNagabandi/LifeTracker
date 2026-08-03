import type { AppState, Task } from '../types';
import { parseDateKey, toDateKey } from './dates';
import { isTaskComplete } from './streak';

const FIRED_KEY = 'bloom-tracker-fired-v1';
const TASK_GRACE_MS = 120_000; // 2 min after remind-at (covers 20s poll)
const SLEEP_GRACE_MS = 180_000; // 3 min grace for bedtime / wake alarms

export type NotifyKind = 'hobby' | 'sleep' | 'task';

export interface PendingToast {
  id: string;
  title: string;
  body: string;
  kind: NotifyKind;
  at: number;
}

function loadFired(): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveFired(set: Set<string>) {
  // Keep set from growing forever
  const arr = [...set];
  const trimmed = arr.length > 400 ? arr.slice(-400) : arr;
  localStorage.setItem(FIRED_KEY, JSON.stringify(trimmed));
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotifyPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function playAlarmTone() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [0, 0.22, 0.44].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.12, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
    window.setTimeout(() => void ctx.close(), 1200);
  } catch {
    // Audio may be blocked until user gesture — ignore
  }
}

function showSystemNotification(title: string, body: string, tag: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      tag,
      icon: '/favicon.svg',
      silent: false,
    });
    window.setTimeout(() => n.close(), 12_000);
  } catch {
    // Some browsers throw if document is not fully active
  }
}

function parseHm(hm: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

function atLocal(dateKey: string, hm: string): Date | null {
  const parts = parseHm(hm);
  if (!parts) return null;
  const d = parseDateKey(dateKey);
  d.setHours(parts.h, parts.m, 0, 0);
  return d;
}

function daysBetween(fromKey: string, toKey: string): number {
  const a = parseDateKey(fromKey).getTime();
  const b = parseDateKey(toKey).getTime();
  return Math.round((b - a) / 86_400_000);
}

function inTimeWindow(target: Date, now: Date, graceMs: number): boolean {
  const delta = now.getTime() - target.getTime();
  return delta >= 0 && delta <= graceMs;
}

function markFired(key: string): boolean {
  const fired = loadFired();
  if (fired.has(key)) return false;
  fired.add(key);
  saveFired(fired);
  return true;
}

export function checkDueNotifications(
  state: AppState,
  now = new Date()
): PendingToast[] {
  const toasts: PendingToast[] = [];
  const today = toDateKey(now);

  // --- Hobbies: 7 days and 2 days before eventDate ---
  for (const t of state.templates) {
    if (t.category !== 'hobbies' || !t.eventDate) continue;
    const until = daysBetween(today, t.eventDate);
    if (until === 7) {
      const key = `hobby:${t.id}:7d:${t.eventDate}`;
      if (markFired(key)) {
        toasts.push({
          id: key,
          kind: 'hobby',
          title: 'Hobby in 1 week ✿',
          body: `"${t.title}" is coming up on ${t.eventDate}.`,
          at: now.getTime(),
        });
      }
    } else if (until === 2) {
      const key = `hobby:${t.id}:2d:${t.eventDate}`;
      if (markFired(key)) {
        toasts.push({
          id: key,
          kind: 'hobby',
          title: 'Hobby in 2 days ✿',
          body: `"${t.title}" is on ${t.eventDate} — get ready!`,
          at: now.getTime(),
        });
      }
    }
  }

  // --- Sleep alarms ---
  const alarms = state.sleepAlarms;
  if (alarms?.enabled) {
    if (alarms.bedtime) {
      const target = atLocal(today, alarms.bedtime);
      if (target && inTimeWindow(target, now, SLEEP_GRACE_MS)) {
        const key = `sleep:bed:${today}:${alarms.bedtime}`;
        if (markFired(key)) {
          toasts.push({
            id: key,
            kind: 'sleep',
            title: 'Bedtime alarm 😴',
            body: `It's ${alarms.bedtime} — time to wind down.`,
            at: now.getTime(),
          });
        }
      }
    }
    if (alarms.wakeupTime) {
      const target = atLocal(today, alarms.wakeupTime);
      if (target && inTimeWindow(target, now, SLEEP_GRACE_MS)) {
        const key = `sleep:wake:${today}:${alarms.wakeupTime}`;
        if (markFired(key)) {
          toasts.push({
            id: key,
            kind: 'sleep',
            title: 'Wake-up alarm ☀️',
            body: `It's ${alarms.wakeupTime} — rise and shine!`,
            at: now.getTime(),
          });
        }
      }
    }
  }

  // --- Tasks: 10 minutes before scheduledTime ---
  for (const [dateKey, day] of Object.entries(state.days)) {
    for (const task of day.tasks as Task[]) {
      if (!task.scheduledTime || isTaskComplete(task)) continue;
      const start = atLocal(dateKey, task.scheduledTime);
      if (!start) continue;
      const remindAt = new Date(start.getTime() - 10 * 60_000);
      if (!inTimeWindow(remindAt, now, TASK_GRACE_MS)) continue;
      const key = `task:${task.id}:${dateKey}:10m`;
      if (markFired(key)) {
        toasts.push({
          id: key,
          kind: 'task',
          title: 'Task in 10 minutes',
          body: `"${task.title}" at ${task.scheduledTime}`,
          at: now.getTime(),
        });
      }
    }
  }

  return toasts;
}

export function deliverNotifications(toasts: PendingToast[]) {
  for (const t of toasts) {
    showSystemNotification(t.title, t.body, t.id);
    if (t.kind === 'sleep') playAlarmTone();
  }
}
