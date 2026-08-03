import { useEffect, useState } from 'react';
import type { CategoryId, SyncMode } from '../types';
import type { TrackerStore } from '../store/useTrackerStore';
import { CATEGORY_META, WEEKDAY_NAMES, toDateKey } from '../utils/dates';

interface CategoryPanelProps {
  category: CategoryId;
  store: TrackerStore;
}

const SYNC_OPTIONS: { mode: SyncMode; label: string; desc: string }[] = [
  { mode: 'everyday', label: 'Everyday', desc: 'Add to every day this month' },
  { mode: 'weekdays', label: 'Weekdays', desc: 'Mon–Fri this month' },
  { mode: 'weekly', label: 'Weekly', desc: 'Same weekday each week' },
  { mode: 'monthly', label: 'Monthly', desc: 'Once this month on a chosen day' },
  { mode: 'today', label: 'Today only', desc: 'Add just to today’s main row' },
];

function defaultSync(category: CategoryId): SyncMode {
  if (category === 'weekly') return 'weekly';
  if (category === 'monthly') return 'monthly';
  return 'everyday';
}

export function CategoryPanel({ category, store }: CategoryPanelProps) {
  const meta = CATEGORY_META[category];
  const templates = store.state.templates.filter((t) => t.category === category);
  const [title, setTitle] = useState('');
  const [syncMode, setSyncMode] = useState<SyncMode>(() => defaultSync(category));
  const [weekDay, setWeekDay] = useState(new Date().getDay());
  const [monthDay, setMonthDay] = useState(1);
  const [subInput, setSubInput] = useState('');
  const [pendingSubs, setPendingSubs] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState('');

  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [sleepNotes, setSleepNotes] = useState('');

  const alarms = store.state.sleepAlarms;

  useEffect(() => {
    setSyncMode(defaultSync(category));
    setTitle('');
    setPendingSubs([]);
    setSubInput('');
    setEventDate('');
  }, [category]);

  const submit = () => {
    if (!title.trim()) return;
    store.addTemplate(title, category, syncMode, {
      weekDay: syncMode === 'weekly' ? weekDay : undefined,
      monthDay: syncMode === 'monthly' ? monthDay : undefined,
      subtasks: pendingSubs,
      eventDate: category === 'hobbies' && eventDate ? eventDate : undefined,
    });
    setTitle('');
    setPendingSubs([]);
    setSubInput('');
    setEventDate('');
  };

  const logSleep = () => {
    store.addSleepLog({
      date: toDateKey(new Date()),
      hours: sleepHours,
      quality: sleepQuality,
      notes: sleepNotes,
    });
    setSleepNotes('');
  };

  return (
    <div className="category-panel">
      <header className="panel-hero">
        <span className="panel-icon">{meta.icon}</span>
        <div>
          <h2>{meta.label}</h2>
          <p>{meta.hint}</p>
        </div>
      </header>

      {category === 'sleep' && (
        <>
          <section className="composer sleep-composer">
            <h3>Sleep & wake alarms</h3>
            <p className="sync-hint">
              Alarms fire at the set times (keep the app open). A soft tone plays with the bedtime /
              wake-up alert.
            </p>
            <label className="alarm-toggle">
              <input
                type="checkbox"
                checked={alarms.enabled}
                onChange={(e) => store.updateSleepAlarms({ enabled: e.target.checked })}
              />
              <span>Enable sleep alarms</span>
            </label>
            <div className="form-grid">
              <label>
                Bedtime
                <input
                  type="time"
                  value={alarms.bedtime}
                  onChange={(e) => store.updateSleepAlarms({ bedtime: e.target.value })}
                  disabled={!alarms.enabled}
                />
              </label>
              <label>
                Wake-up
                <input
                  type="time"
                  value={alarms.wakeupTime}
                  onChange={(e) => store.updateSleepAlarms({ wakeupTime: e.target.value })}
                  disabled={!alarms.enabled}
                />
              </label>
            </div>
          </section>

          <section className="composer sleep-composer">
            <h3>Log last night’s sleep</h3>
            <div className="form-grid">
              <label>
                Hours
                <input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                />
              </label>
              <label>
                Quality
                <select
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                >
                  <option value={1}>1 — Restless</option>
                  <option value={2}>2 — Fair</option>
                  <option value={3}>3 — Okay</option>
                  <option value={4}>4 — Good</option>
                  <option value={5}>5 — Great</option>
                </select>
              </label>
            </div>
            <input
              placeholder="Notes (optional)"
              value={sleepNotes}
              onChange={(e) => setSleepNotes(e.target.value)}
            />
            <button type="button" className="btn primary" onClick={logSleep}>
              Log sleep → Main tracker
            </button>

            {store.state.sleepLogs.length > 0 && (
              <ul className="sleep-history">
                {[...store.state.sleepLogs]
                  .slice(-5)
                  .reverse()
                  .map((log) => (
                    <li key={log.id}>
                      <strong>{log.date}</strong> · {log.hours}h · ★{log.quality}
                      {log.notes ? ` — ${log.notes}` : ''}
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </>
      )}

      <section className="composer">
        <h3>Add {meta.label.toLowerCase()} task</h3>
        <input
          placeholder={`e.g. ${placeholderFor(category)}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />

        {category === 'hobbies' && (
          <label className="inline-field stacked">
            Event / hobby date
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <span className="field-hint">Reminders: 1 week before and 2 days before</span>
          </label>
        )}

        <div className="sub-composer">
          <input
            placeholder="Optional subtask…"
            value={subInput}
            onChange={(e) => setSubInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && subInput.trim()) {
                e.preventDefault();
                setPendingSubs((p) => [...p, subInput.trim()]);
                setSubInput('');
              }
            }}
          />
          <button
            type="button"
            className="btn soft"
            onClick={() => {
              if (!subInput.trim()) return;
              setPendingSubs((p) => [...p, subInput.trim()]);
              setSubInput('');
            }}
          >
            + Sub
          </button>
        </div>
        {pendingSubs.length > 0 && (
          <ul className="pending-subs">
            {pendingSubs.map((s, i) => (
              <li key={`${s}-${i}`}>
                {s}
                <button
                  type="button"
                  className="icon-btn danger tiny"
                  onClick={() => setPendingSubs((p) => p.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="sync-pills">
          {SYNC_OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              type="button"
              className={`sync-pill ${syncMode === opt.mode ? 'active' : ''}`}
              title={opt.desc}
              onClick={() => setSyncMode(opt.mode)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {syncMode === 'weekly' && (
          <label className="inline-field">
            Weekday
            <select value={weekDay} onChange={(e) => setWeekDay(Number(e.target.value))}>
              {WEEKDAY_NAMES.map((n, i) => (
                <option key={n} value={i}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        {syncMode === 'monthly' && (
          <label className="inline-field">
            Day of month
            <input
              type="number"
              min={1}
              max={31}
              value={monthDay}
              onChange={(e) => setMonthDay(Number(e.target.value))}
            />
          </label>
        )}

        <p className="sync-hint">
          {SYNC_OPTIONS.find((o) => o.mode === syncMode)?.desc}. Tasks appear on the Main tracker.
        </p>

        <button type="button" className="btn primary" onClick={submit} disabled={!title.trim()}>
          Add & sync to Main
        </button>
      </section>

      <section className="template-list">
        <h3>Saved {meta.label.toLowerCase()} routines</h3>
        {templates.length === 0 && (
          <p className="empty-hint">Nothing here yet — add a task above.</p>
        )}
        {templates.map((t) => (
          <article key={t.id} className="template-card">
            <div className="template-top">
              <strong>{t.title}</strong>
              <span className="sync-tag">{t.syncMode}</span>
            </div>
            {t.eventDate && (
              <p className="template-meta">
                Event {t.eventDate} · reminds 7d & 2d before
              </p>
            )}
            {category === 'hobbies' && (
              <label className="inline-field stacked compact">
                Event date
                <input
                  type="date"
                  value={t.eventDate ?? ''}
                  onChange={(e) =>
                    store.updateTemplate(t.id, {
                      eventDate: e.target.value || undefined,
                    })
                  }
                />
              </label>
            )}
            {(t.subtasks?.length ?? 0) > 0 && (
              <ul>
                {(t.subtasks ?? []).map((s, i) => (
                  <li key={`${t.id}-${i}`}>{s}</li>
                ))}
              </ul>
            )}
            <div className="template-actions">
              <button
                type="button"
                className="btn soft"
                onClick={() => store.applyTemplateToMonth(t)}
              >
                Re-sync month
              </button>
              {SYNC_OPTIONS.filter((o) => o.mode !== t.syncMode)
                .slice(0, 3)
                .map((o) => (
                  <button
                    key={o.mode}
                    type="button"
                    className="btn ghost"
                    onClick={() => store.updateTemplateSync(t.id, o.mode)}
                  >
                    → {o.label}
                  </button>
                ))}
              <button
                type="button"
                className="btn ghost danger-text"
                onClick={() => store.deleteTemplate(t.id, true)}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function placeholderFor(category: CategoryId): string {
  switch (category) {
    case 'weekly':
      return 'Meal prep Sunday';
    case 'monthly':
      return 'Review budget';
    case 'hobbies':
      return 'Sketch for 20 min';
    case 'sleep':
      return 'No screens after 10pm';
    case 'diet':
      return 'Drink 8 glasses of water';
    case 'workout':
      return '30 min walk';
  }
}
