import type { TrackerStore } from '../store/useTrackerStore';
import { CATEGORY_META } from '../utils/dates';
import {
  computeStreak,
  summarizeByCategory,
  isDayComplete,
  isTaskComplete,
} from '../utils/streak';
import { getMonthDays, formatDayLabel, toDateKey } from '../utils/dates';

interface SummaryReportProps {
  store: TrackerStore;
}

export function SummaryReport({ store }: SummaryReportProps) {
  const { state } = store;
  const streak = computeStreak(state.days, state.currentMonth);
  const byCat = summarizeByCategory(state.days, state.currentMonth);
  const today = toDateKey(new Date());
  const monthDays = getMonthDays(state.currentMonth).filter((d) => d <= today);

  const [y, m] = state.currentMonth.split('-').map(Number);
  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  let totalTasks = 0;
  let doneTasks = 0;
  for (const d of getMonthDays(state.currentMonth)) {
    const entry = state.days[d];
    if (!entry) continue;
    for (const t of entry.tasks) {
      totalTasks += 1;
      if (isTaskComplete(t)) {
        doneTasks += 1;
      }
    }
  }

  return (
    <div className="summary-report">
      <header className="panel-hero">
        <span className="panel-icon">🌅</span>
        <div>
          <h2>Summary · {monthLabel}</h2>
          <p>Your bloom streak and how the month is unfolding.</p>
        </div>
      </header>

      <div className="streak-hero">
        <div className="streak-ring" style={{ ['--p' as string]: `${streak.percent}` }}>
          <div className="streak-ring-inner">
            <span className="streak-ratio">{streak.ratioLabel}</span>
            <span className="streak-caption">days complete</span>
          </div>
        </div>
        <div className="streak-stats">
          <div className="stat">
            <strong>{streak.currentStreak}</strong>
            <span>Current streak</span>
          </div>
          <div className="stat">
            <strong>
              {doneTasks}/{totalTasks || 0}
            </strong>
            <span>Tasks done</span>
          </div>
          <div className="stat">
            <strong>{streak.percent}%</strong>
            <span>Completion</span>
          </div>
        </div>
      </div>

      <p className="streak-explain">
        Finish every task on a day to grow your streak. {streak.ratioLabel} means{' '}
        <strong>
          {streak.completedDays} out of {streak.trackedDays}
        </strong>{' '}
        tracked days this month are fully done.
      </p>

      <section className="summary-section">
        <h3>By category</h3>
        {byCat.length === 0 && <p className="empty-hint">No synced tasks yet.</p>}
        <div className="cat-bars">
          {byCat.map((c) => {
            const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
            const meta = CATEGORY_META[c.category];
            return (
              <div key={c.category} className="cat-bar">
                <div className="cat-bar-label">
                  <span>
                    {meta?.icon ?? '✦'} {meta?.label ?? c.category}
                  </span>
                  <span>
                    {c.done}/{c.total}
                  </span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="summary-section">
        <h3>Daily bloom map</h3>
        <div className="bloom-map">
          {monthDays.map((d) => {
            const entry = state.days[d];
            const has = (entry?.tasks.length ?? 0) > 0;
            const done = isDayComplete(entry);
            return (
              <div
                key={d}
                className={`bloom-cell ${!has ? 'empty' : done ? 'done' : 'partial'}`}
                title={`${formatDayLabel(d)}${!has ? ' — no tasks' : done ? ' — complete' : ' — in progress'}`}
              >
                {Number(d.slice(-2))}
              </div>
            );
          })}
        </div>
        <div className="bloom-legend">
          <span>
            <i className="swatch done" /> Complete
          </span>
          <span>
            <i className="swatch partial" /> In progress
          </span>
          <span>
            <i className="swatch empty" /> No tasks
          </span>
        </div>
      </section>
    </div>
  );
}
