import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AppState,
  CategoryId,
  DayEntry,
  DietProfile,
  MealLog,
  SleepAlarms,
  SleepLog,
  Subtask,
  SyncMode,
  Task,
  TemplateTask,
} from '../types';
import { getMonthDays, parseDateKey, toDateKey, toMonthKey, uid } from '../utils/dates';

const STORAGE_KEY = 'bloom-tracker-v1';

const DEFAULT_SLEEP_ALARMS: SleepAlarms = {
  bedtime: '22:30',
  wakeupTime: '06:30',
  enabled: false,
};

function emptyState(): AppState {
  return {
    days: {},
    templates: [],
    sleepLogs: [],
    sleepAlarms: { ...DEFAULT_SLEEP_ALARMS },
    dietProfile: {},
    mealLogs: [],
    currentMonth: toMonthKey(new Date()),
  };
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    completed: Boolean(task.completed),
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = emptyState();
    const days: Record<string, DayEntry> = {};
    for (const [k, day] of Object.entries(parsed.days ?? {})) {
      days[k] = {
        date: day.date ?? k,
        tasks: (day.tasks ?? []).map(normalizeTask),
      };
    }
    return {
      ...base,
      ...parsed,
      days,
      templates: (Array.isArray(parsed.templates) ? parsed.templates : []).map((t) => ({
        ...t,
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
      })),
      sleepLogs: Array.isArray(parsed.sleepLogs) ? parsed.sleepLogs : [],
      sleepAlarms: {
        ...DEFAULT_SLEEP_ALARMS,
        ...(parsed.sleepAlarms ?? {}),
      },
      dietProfile: parsed.dietProfile ?? {},
      mealLogs: Array.isArray(parsed.mealLogs) ? parsed.mealLogs : [],
      currentMonth: parsed.currentMonth || base.currentMonth,
    };
  } catch {
    return emptyState();
  }
}

function ensureDay(days: Record<string, DayEntry>, date: string): DayEntry {
  if (!days[date]) {
    days[date] = { date, tasks: [] };
  }
  return days[date];
}

function syncTaskCompletion(task: Task): Task {
  const subtasks = task.subtasks ?? [];
  if (subtasks.length === 0) return { ...task, subtasks };
  const allDone = subtasks.every((s) => s.completed);
  return { ...task, subtasks, completed: allDone };
}

function datesForSync(
  mode: SyncMode,
  monthKey: string,
  weekDay?: number,
  monthDay?: number
): string[] {
  const all = getMonthDays(monthKey);
  const today = toDateKey(new Date());

  switch (mode) {
    case 'everyday':
      return all;
    case 'weekdays':
      return all.filter((d) => {
        const wd = parseDateKey(d).getDay();
        return wd >= 1 && wd <= 5;
      });
    case 'weekly': {
      const target = weekDay ?? new Date().getDay();
      return all.filter((d) => parseDateKey(d).getDay() === target);
    }
    case 'monthly': {
      const day = monthDay ?? 1;
      return all.filter((d) => Number(d.slice(-2)) === day);
    }
    case 'today':
      return all.includes(today) ? [today] : [];
    default:
      return [];
  }
}

function taskFromTemplate(template: TemplateTask): Task {
  return {
    id: uid(),
    title: template.title,
    completed: false,
    subtasks: (template.subtasks ?? []).map((title) => ({
      id: uid(),
      title,
      completed: false,
    })),
    category: template.category,
    templateId: template.id,
  };
}

export function useTrackerStore() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Bloom Tracker could not save data. Browser storage may be full.', error);
    }
  }, [state]);

  const setMonth = useCallback((monthKey: string) => {
    setState((s) => ({ ...s, currentMonth: monthKey }));
  }, []);

  const shiftMonth = useCallback((delta: number) => {
    setState((s) => {
      const [y, m] = s.currentMonth.split('-').map(Number);
      const d = new Date(y, m - 1 + delta, 1);
      return { ...s, currentMonth: toMonthKey(d) };
    });
  }, []);

  const addTaskToDay = useCallback(
    (date: string, title: string, category?: CategoryId, templateId?: string) => {
      if (!title.trim()) return;
      setState((s) => {
        const days = { ...s.days };
        const day = { ...ensureDay(days, date), tasks: [...(days[date]?.tasks ?? [])] };
        day.tasks.push({
          id: uid(),
          title: title.trim(),
          completed: false,
          subtasks: [],
          category,
          templateId,
        });
        days[date] = day;
        return { ...s, days };
      });
    },
    []
  );

  const addSubtask = useCallback((date: string, taskId: string, title: string) => {
    if (!title.trim()) return;
    setState((s) => {
      const days = { ...s.days };
      const day = days[date];
      if (!day) return s;
      const tasks = day.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks: Subtask[] = [
          ...(t.subtasks ?? []),
          { id: uid(), title: title.trim(), completed: false },
        ];
        return syncTaskCompletion({ ...t, subtasks, completed: false });
      });
      days[date] = { ...day, tasks };
      return { ...s, days };
    });
  }, []);

  const toggleTask = useCallback((date: string, taskId: string) => {
    setState((s) => {
      const days = { ...s.days };
      const day = days[date];
      if (!day) return s;
      const tasks = day.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const completed = !t.completed;
        return {
          ...t,
          completed,
          subtasks: (t.subtasks ?? []).map((sub) => ({ ...sub, completed })),
        };
      });
      days[date] = { ...day, tasks };
      return { ...s, days };
    });
  }, []);

  const toggleSubtask = useCallback((date: string, taskId: string, subId: string) => {
    setState((s) => {
      const days = { ...s.days };
      const day = days[date];
      if (!day) return s;
      const tasks = day.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = (t.subtasks ?? []).map((sub) =>
          sub.id === subId ? { ...sub, completed: !sub.completed } : sub
        );
        return syncTaskCompletion({ ...t, subtasks });
      });
      days[date] = { ...day, tasks };
      return { ...s, days };
    });
  }, []);

  const deleteTask = useCallback((date: string, taskId: string) => {
    setState((s) => {
      const days = { ...s.days };
      const day = days[date];
      if (!day) return s;
      days[date] = { ...day, tasks: day.tasks.filter((t) => t.id !== taskId) };
      return { ...s, days };
    });
  }, []);

  const deleteSubtask = useCallback((date: string, taskId: string, subId: string) => {
    setState((s) => {
      const days = { ...s.days };
      const day = days[date];
      if (!day) return s;
      const tasks = day.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = (t.subtasks ?? []).filter((sub) => sub.id !== subId);
        return syncTaskCompletion({ ...t, subtasks });
      });
      days[date] = { ...day, tasks };
      return { ...s, days };
    });
  }, []);

  const renameTask = useCallback((date: string, taskId: string, title: string) => {
    setState((s) => {
      const days = { ...s.days };
      const day = days[date];
      if (!day) return s;
      days[date] = {
        ...day,
        tasks: day.tasks.map((t) => (t.id === taskId ? { ...t, title } : t)),
      };
      return { ...s, days };
    });
  }, []);

  const setTaskTime = useCallback((date: string, taskId: string, scheduledTime?: string) => {
    setState((s) => {
      const days = { ...s.days };
      const day = days[date];
      if (!day) return s;
      days[date] = {
        ...day,
        tasks: day.tasks.map((t) =>
          t.id === taskId
            ? { ...t, scheduledTime: scheduledTime || undefined }
            : t
        ),
      };
      return { ...s, days };
    });
  }, []);

  const applyTemplateToMonth = useCallback(
    (template: TemplateTask, monthKey?: string) => {
      setState((s) => {
        const mk = monthKey ?? s.currentMonth;
        const targets = new Set(
          datesForSync(template.syncMode, mk, template.weekDay, template.monthDay)
        );
        // Hobby with an event date should also land on that day
        if (template.eventDate?.startsWith(mk)) {
          targets.add(template.eventDate);
        }
        const days = { ...s.days };

        for (const date of targets) {
          const day = {
            ...ensureDay(days, date),
            tasks: [...(days[date]?.tasks ?? [])],
          };
          if (day.tasks.some((t) => t.templateId === template.id)) continue;
          day.tasks.push(taskFromTemplate(template));
          days[date] = day;
        }

        return { ...s, days };
      });
    },
    []
  );

  const addTemplate = useCallback(
    (
      title: string,
      category: CategoryId,
      syncMode: SyncMode,
      extras?: Partial<TemplateTask>
    ) => {
      if (!title.trim()) return;
      const template: TemplateTask = {
        id: uid(),
        title: title.trim(),
        category,
        syncMode,
        subtasks: extras?.subtasks ?? [],
        weekDay: extras?.weekDay,
        monthDay: extras?.monthDay,
        notes: extras?.notes,
        targetHours: extras?.targetHours,
        eventDate: extras?.eventDate,
      };
      setState((s) => ({ ...s, templates: [...s.templates, template] }));
      applyTemplateToMonth(template);
      return template;
    },
    [applyTemplateToMonth]
  );

  const updateTemplate = useCallback(
    (templateId: string, patch: Partial<TemplateTask>) => {
      setState((s) => ({
        ...s,
        templates: s.templates.map((t) =>
          t.id === templateId ? { ...t, ...patch } : t
        ),
      }));
    },
    []
  );

  const updateTemplateSync = useCallback(
    (templateId: string, syncMode: SyncMode, extras?: Partial<TemplateTask>) => {
      setState((s) => {
        const template = s.templates.find((t) => t.id === templateId);
        if (!template) return s;
        const updated = { ...template, syncMode, ...extras };
        const targets = new Set(
          datesForSync(syncMode, s.currentMonth, updated.weekDay, updated.monthDay)
        );
        if (updated.eventDate?.startsWith(s.currentMonth)) {
          targets.add(updated.eventDate);
        }
        const days = { ...s.days };
        for (const date of targets) {
          const day = {
            ...ensureDay(days, date),
            tasks: [...(days[date]?.tasks ?? [])],
          };
          if (day.tasks.some((t) => t.templateId === templateId)) continue;
          day.tasks.push(taskFromTemplate(updated));
          days[date] = day;
        }
        return {
          ...s,
          days,
          templates: s.templates.map((t) => (t.id === templateId ? updated : t)),
        };
      });
    },
    []
  );

  const deleteTemplate = useCallback((templateId: string, removeFromDays: boolean) => {
    setState((s) => {
      const templates = s.templates.filter((t) => t.id !== templateId);
      if (!removeFromDays) return { ...s, templates };
      const days: Record<string, DayEntry> = {};
      for (const [k, day] of Object.entries(s.days)) {
        days[k] = {
          ...day,
          tasks: day.tasks.filter((t) => t.templateId !== templateId),
        };
      }
      return { ...s, templates, days };
    });
  }, []);

  const addSleepLog = useCallback(
    (log: Omit<SleepLog, 'id'>) => {
      const entry: SleepLog = { ...log, id: uid() };
      setState((s) => ({ ...s, sleepLogs: [...s.sleepLogs, entry] }));
      addTaskToDay(log.date, `Sleep: ${log.hours}h (★${log.quality})`, 'sleep');
    },
    [addTaskToDay]
  );

  const updateSleepAlarms = useCallback((patch: Partial<SleepAlarms>) => {
    setState((s) => ({
      ...s,
      sleepAlarms: { ...s.sleepAlarms, ...patch },
    }));
  }, []);

  const updateDietProfile = useCallback((patch: Partial<DietProfile>) => {
    setState((s) => ({
      ...s,
      dietProfile: { ...s.dietProfile, ...patch },
    }));
  }, []);

  const addMealLog = useCallback((meal: MealLog) => {
    setState((s) => ({
      ...s,
      mealLogs: [...s.mealLogs, meal],
    }));
  }, []);

  const deleteMealLog = useCallback((mealId: string) => {
    setState((s) => ({
      ...s,
      mealLogs: s.mealLogs.filter((meal) => meal.id !== mealId),
    }));
  }, []);

  const monthDays = useMemo(
    () => getMonthDays(state.currentMonth),
    [state.currentMonth]
  );

  return {
    state,
    monthDays,
    setMonth,
    shiftMonth,
    addTaskToDay,
    addSubtask,
    toggleTask,
    toggleSubtask,
    deleteTask,
    deleteSubtask,
    renameTask,
    setTaskTime,
    addTemplate,
    updateTemplate,
    updateTemplateSync,
    deleteTemplate,
    applyTemplateToMonth,
    addSleepLog,
    updateSleepAlarms,
    updateDietProfile,
    addMealLog,
    deleteMealLog,
  };
}

export type TrackerStore = ReturnType<typeof useTrackerStore>;
