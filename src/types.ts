export type CategoryId =
  | 'weekly'
  | 'monthly'
  | 'hobbies'
  | 'sleep'
  | 'diet'
  | 'workout';

export type SyncMode = 'everyday' | 'weekdays' | 'weekly' | 'monthly' | 'today';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  subtasks: Subtask[];
  category?: CategoryId;
  templateId?: string;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  tasks: Task[];
}

export interface TemplateTask {
  id: string;
  title: string;
  category: CategoryId;
  syncMode: SyncMode;
  weekDay?: number; // 0-6 for weekly
  monthDay?: number; // 1-31 for monthly
  subtasks: string[];
  notes?: string;
  targetHours?: number;
  /** Optional hobby event date YYYY-MM-DD */
  eventDate?: string;
}

export interface SleepLog {
  id: string;
  date: string;
  hours: number;
  quality: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export interface DietProfile {
  heightCm?: number;
  weightKg?: number;
  vitaminB12PgMl?: number;
  vitaminDNgMl?: number;
  ironMcgDl?: number;
  hemoglobinGDl?: number;
}

export interface Nutrients {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  vitaminB12Mcg: number;
  vitaminDMcg: number;
  ironMg: number;
}

export interface MealFood {
  id: string;
  foodId?: string;
  name: string;
  servings: number;
  servingLabel: string;
  nutrients: Nutrients;
}

export interface MealLog {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes: string;
  foods: MealFood[];
  /** IndexedDB key for the compressed image. */
  imageId?: string;
  /** Legacy inline image; read-only fallback for data saved before IndexedDB storage. */
  imageDataUrl?: string;
}

export interface AppState {
  days: Record<string, DayEntry>;
  templates: TemplateTask[];
  sleepLogs: SleepLog[];
  dietProfile: DietProfile;
  mealLogs: MealLog[];
  currentMonth: string; // YYYY-MM
}

export type TabId = 'main' | CategoryId | 'summary';

