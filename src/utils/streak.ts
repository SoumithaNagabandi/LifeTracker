import type { DayEntry, Task } from '../types';
import { getMonthDays, toDateKey } from './dates';

export function isTaskComplete(task: Task): boolean {
  const subs = task.subtasks ?? [];
  if (subs.length === 0) return Boolean(task.completed);
  return subs.every((s) => s.completed);
}

export function isDayComplete(day: DayEntry | undefined): boolean {
  if (!day || day.tasks.length === 0) return false;
  return day.tasks.every(isTaskComplete);
}

export interface StreakStats {
  completedDays: number;
  trackedDays: number;
  currentStreak: number;
  ratioLabel: string;
  percent: number;
}

/** Count days (up to today) that have tasks and how many are fully done. */
export function computeStreak(
  days: Record<string, DayEntry>,
  monthKey: string
): StreakStats {
  const today = toDateKey(new Date());
  const monthDays = getMonthDays(monthKey).filter((d) => d <= today);

  let completedDays = 0;
  let trackedDays = 0;

  for (const dateKey of monthDays) {
    const entry = days[dateKey];
    if (!entry || entry.tasks.length === 0) continue;
    trackedDays += 1;
    if (isDayComplete(entry)) completedDays += 1;
  }

  let currentStreak = 0;
  const reversed = [...monthDays].reverse();
  for (const dateKey of reversed) {
    const entry = days[dateKey];
    if (!entry || entry.tasks.length === 0) continue;
    if (isDayComplete(entry)) currentStreak += 1;
    else break;
  }

  const percent = trackedDays === 0 ? 0 : Math.round((completedDays / trackedDays) * 100);

  return {
    completedDays,
    trackedDays,
    currentStreak,
    ratioLabel: trackedDays === 0 ? '0/0' : `${completedDays}/${trackedDays}`,
    percent,
  };
}

export interface CategorySummary {
  category: string;
  total: number;
  done: number;
}

export function summarizeByCategory(
  days: Record<string, DayEntry>,
  monthKey: string
): CategorySummary[] {
  const map = new Map<string, { total: number; done: number }>();
  const monthDays = getMonthDays(monthKey);

  for (const dateKey of monthDays) {
    const entry = days[dateKey];
    if (!entry) continue;
    for (const task of entry.tasks) {
      const key = task.category ?? 'general';
      const cur = map.get(key) ?? { total: 0, done: 0 };
      cur.total += 1;
      if (isTaskComplete(task)) cur.done += 1;
      map.set(key, cur);
    }
  }

  return Array.from(map.entries()).map(([category, v]) => ({
    category,
    ...v,
  }));
}
