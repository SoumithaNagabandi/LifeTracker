import type { TrackerStore } from '../store/useTrackerStore';
import { DayRow } from './DayRow';

interface MainTrackerProps {
  store: TrackerStore;
}

export function MainTracker({ store }: MainTrackerProps) {
  const { state, monthDays, shiftMonth } = store;
  const [y, m] = state.currentMonth.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="main-tracker">
      <div className="month-nav">
        <button
          type="button"
          className="btn soft"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
        >
          ←
        </button>
        <h2>{label}</h2>
        <button
          type="button"
          className="btn soft"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="day-list">
        {monthDays.map((date) => (
          <DayRow
            key={date}
            date={date}
            entry={state.days[date]}
            onAddTask={(title) => store.addTaskToDay(date, title)}
            onAddSub={(taskId, title) => store.addSubtask(date, taskId, title)}
            onToggleTask={(taskId) => store.toggleTask(date, taskId)}
            onToggleSub={(taskId, subId) => store.toggleSubtask(date, taskId, subId)}
            onDeleteTask={(taskId) => store.deleteTask(date, taskId)}
            onDeleteSub={(taskId, subId) => store.deleteSubtask(date, taskId, subId)}
          />
        ))}
      </div>
    </div>
  );
}
