import { useState } from 'react';
import type { DayEntry } from '../types';
import { formatDayLabel, isToday } from '../utils/dates';
import { isDayComplete, isTaskComplete } from '../utils/streak';
import { AddInline, PlusIcon, TaskRow } from './TaskRow';

interface DayRowProps {
  date: string;
  entry?: DayEntry;
  onAddTask: (title: string) => void;
  onAddSub: (taskId: string, title: string) => void;
  onToggleTask: (taskId: string) => void;
  onToggleSub: (taskId: string, subId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteSub: (taskId: string, subId: string) => void;
}

export function DayRow({
  date,
  entry,
  onAddTask,
  onAddSub,
  onToggleTask,
  onToggleSub,
  onDeleteTask,
  onDeleteSub,
}: DayRowProps) {
  const [open, setOpen] = useState(isToday(date));
  const [adding, setAdding] = useState(false);
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);

  const tasks = entry?.tasks ?? [];
  const doneCount = tasks.filter(isTaskComplete).length;
  const complete = isDayComplete(entry);
  const today = isToday(date);

  return (
    <section className={`day-row ${today ? 'today' : ''} ${complete ? 'complete' : ''}`}>
      <header className="day-header" onClick={() => setOpen((o) => !o)}>
        <button type="button" className="chevron" aria-label={open ? 'Collapse' : 'Expand'}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            style={{ transform: open ? 'rotate(90deg)' : 'none' }}
          >
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="day-label">
          <strong>{formatDayLabel(date)}</strong>
          {today && <span className="today-badge">Today</span>}
          {complete && tasks.length > 0 && <span className="streak-badge">✦ Done</span>}
        </div>
        <span className="day-progress">
          {tasks.length === 0 ? '—' : `${doneCount}/${tasks.length}`}
        </span>
        <button
          type="button"
          className="icon-btn accent"
          title="Add task"
          aria-label="Add task"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
            setAdding(true);
          }}
        >
          <PlusIcon />
        </button>
      </header>

      {open && (
        <div className="day-body">
          {tasks.length === 0 && !adding && (
            <p className="empty-hint">No tasks yet — tap + to add one.</p>
          )}
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              date={date}
              onToggle={() => onToggleTask(task.id)}
              onToggleSub={(subId) => onToggleSub(task.id, subId)}
              onAddSub={(title) => onAddSub(task.id, title)}
              onDelete={() => onDeleteTask(task.id)}
              onDeleteSub={(subId) => onDeleteSub(task.id, subId)}
              showAddSub={addingSubFor === task.id}
              onRequestAddSub={() => setAddingSubFor(task.id)}
              onCancelAddSub={() => setAddingSubFor(null)}
            />
          ))}
          {adding && (
            <AddInline
              placeholder="New task…"
              onSubmit={(title) => {
                onAddTask(title);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          )}
        </div>
      )}
    </section>
  );
}
