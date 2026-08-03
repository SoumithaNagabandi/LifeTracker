export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getMonthDays(monthKey: string): string[] {
  const [y, m] = monthKey.split('-').map(Number);
  const count = daysInMonth(y, m - 1);
  return Array.from({ length: count }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    return `${monthKey}-${day}`;
  });
}

export function formatDayLabel(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function isToday(dateKey: string): boolean {
  return dateKey === toDateKey(new Date());
}

export function isPast(dateKey: string): boolean {
  return dateKey < toDateKey(new Date());
}

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CATEGORY_META: Record<
  string,
  { label: string; icon: string; hint: string }
> = {
  weekly: { label: 'Weekly', icon: '📅', hint: 'Recurring weekly goals' },
  monthly: { label: 'Monthly', icon: '🌙', hint: 'Once-a-month habits' },
  hobbies: { label: 'Hobbies', icon: '🎨', hint: 'Creative & leisure time' },
  sleep: { label: 'Sleep', icon: '😴', hint: 'Rest & wind-down' },
  diet: { label: 'Diet', icon: '🥗', hint: 'Meals & nutrition' },
  workout: { label: 'Workout', icon: '💪', hint: 'Movement & strength' },
};
