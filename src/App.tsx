import { useState } from 'react';
import type { CategoryId, TabId } from './types';
import { useTrackerStore } from './store/useTrackerStore';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import { computeStreak } from './utils/streak';
import { FlowerDecor } from './components/FlowerDecor';
import { MainTracker } from './components/MainTracker';
import { CategoryPanel } from './components/CategoryPanel';
import { DietTracker } from './components/DietTracker';
import { SummaryReport } from './components/SummaryReport';
import { NotifyCenter } from './components/NotifyCenter';
import './App.css';

const TABS: { id: TabId; label: string; short: string }[] = [
  { id: 'main', label: 'Main', short: 'Main' },
  { id: 'weekly', label: 'Weekly', short: 'Week' },
  { id: 'monthly', label: 'Monthly', short: 'Month' },
  { id: 'hobbies', label: 'Hobbies', short: 'Hobby' },
  { id: 'sleep', label: 'Sleep', short: 'Sleep' },
  { id: 'diet', label: 'Diet', short: 'Diet' },
  { id: 'workout', label: 'Workout', short: 'Move' },
  { id: 'summary', label: 'Summary', short: 'Stats' },
];

const CATEGORIES: CategoryId[] = [
  'weekly',
  'monthly',
  'hobbies',
  'sleep',
  'diet',
  'workout',
];

function isCategory(tab: TabId): tab is CategoryId {
  return (CATEGORIES as string[]).includes(tab);
}

export default function App() {
  const store = useTrackerStore();
  const [tab, setTab] = useState<TabId>('main');
  const streak = computeStreak(store.state.days, store.state.currentMonth);
  const { permission, enableNotifications, toasts, dismissToast } =
    useNotificationScheduler(store.state);

  return (
    <div className="app-shell">
      <FlowerDecor />
      <div className="sunset-glow" aria-hidden="true" />

      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            ✿
          </span>
          <div>
            <h1>Bloom Tracker</h1>
            <p className="tagline">Soft days · gentle streaks · daisy light</p>
          </div>
        </div>
        <div className="header-actions">
          {permission !== 'granted' && permission !== 'unsupported' && (
            <button type="button" className="btn soft notify-btn" onClick={() => void enableNotifications()}>
              🔔 Reminders
            </button>
          )}
          <div className="header-streak" title="Completed days / tracked days this month">
            <span className="streak-flame">✦</span>
            <div>
              <strong>{streak.ratioLabel}</strong>
              <small>
                {streak.currentStreak > 0
                  ? `${streak.currentStreak}-day streak`
                  : 'Start a streak'}
              </small>
            </div>
          </div>
        </div>
      </header>

      <NotifyCenter
        permission={permission}
        onEnable={() => void enableNotifications()}
        toasts={toasts}
        onDismiss={dismissToast}
      />

      <nav className="tab-bar" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-full">{t.label}</span>
            <span className="tab-short">{t.short}</span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === 'main' && <MainTracker store={store} />}
        {tab === 'diet' && <DietTracker store={store} />}
        {isCategory(tab) && tab !== 'diet' && <CategoryPanel category={tab} store={store} />}
        {tab === 'summary' && <SummaryReport store={store} />}
      </main>

      <footer className="app-footer">
        <span>Reminders work best while this tab stays open · data stays on this device</span>
      </footer>
    </div>
  );
}
