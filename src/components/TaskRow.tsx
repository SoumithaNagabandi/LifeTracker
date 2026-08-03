import { isTaskComplete } from '../utils/streak';
import type { Task } from '../types';

interface TaskRowProps {
  task: Task;
  date: string;
  onToggle: () => void;
  onToggleSub: (subId: string) => void;
  onAddSub: (title: string) => void;
  onDelete: () => void;
  onDeleteSub: (subId: string) => void;
  onSetTime: (time?: string) => void;
  showAddSub: boolean;
  onRequestAddSub: () => void;
  onCancelAddSub: () => void;
}

export function TaskRow({
  task,
  onToggle,
  onToggleSub,
  onAddSub,
  onDelete,
  onDeleteSub,
  onSetTime,
  showAddSub,
  onRequestAddSub,
  onCancelAddSub,
}: TaskRowProps) {
  const done = isTaskComplete(task);
  const subs = task.subtasks ?? [];

  return (
    <div className={`task-row ${done ? 'done' : ''}`}>
      <div className="task-main">
        <label className="check">
          <input type="checkbox" checked={done} onChange={onToggle} />
          <span className="check-ui" />
        </label>
        <span className="task-title">{task.title}</span>
        {task.category && (
          <span className={`cat-pill cat-${task.category}`}>{task.category}</span>
        )}
        <label className="time-field" title="Reminder 10 min before" onClick={(e) => e.stopPropagation()}>
          <span className="time-icon" aria-hidden>
            ⏰
          </span>
          <input
            type="time"
            value={task.scheduledTime ?? ''}
            onChange={(e) => onSetTime(e.target.value || undefined)}
            aria-label={`Time for ${task.title}`}
          />
        </label>
        <button
          type="button"
          className="icon-btn"
          title="Add subtask"
          aria-label="Add subtask"
          onClick={onRequestAddSub}
        >
          <PlusIcon />
        </button>
        <button
          type="button"
          className="icon-btn danger"
          title="Delete task"
          aria-label="Delete task"
          onClick={onDelete}
        >
          <TrashIcon />
        </button>
      </div>

      {task.scheduledTime && (
        <p className="time-hint">Notify 10 min before {task.scheduledTime}</p>
      )}

      {subs.length > 0 && (
        <ul className="subtask-list">
          {subs.map((sub) => (
            <li key={sub.id} className={`subtask ${sub.completed ? 'done' : ''}`}>
              <label className="check small">
                <input
                  type="checkbox"
                  checked={sub.completed}
                  onChange={() => onToggleSub(sub.id)}
                />
                <span className="check-ui" />
              </label>
              <span>{sub.title}</span>
              <button
                type="button"
                className="icon-btn danger tiny"
                aria-label="Delete subtask"
                onClick={() => onDeleteSub(sub.id)}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showAddSub && (
        <AddInline
          placeholder="Subtask name…"
          onSubmit={(title) => {
            onAddSub(title);
            onCancelAddSub();
          }}
          onCancel={onCancelAddSub}
        />
      )}
    </div>
  );
}

export function AddInline({
  placeholder,
  onSubmit,
  onCancel,
  autoFocus = true,
}: {
  placeholder: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}) {
  return (
    <form
      className="add-inline"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const v = String(fd.get('title') ?? '');
        if (v.trim()) onSubmit(v);
        else onCancel();
      }}
    >
      <input
        name="title"
        placeholder={placeholder}
        autoFocus={autoFocus}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button type="submit" className="btn soft">
        Add
      </button>
      <button type="button" className="btn ghost" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}

export function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 7h14M10 11v6M14 11v6M8 7V5h8v2M6 7l1 12h10l1-12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
