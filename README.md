# Bloom Tracker

A gentle monthly todo & habit tracker with sunset colours and little flowers.

## Features

- **Main** — current-month day rows; `+` adds tasks; task `+` adds subtasks
- Subtasks auto-complete the parent when all are checked
- Tabs: Weekly, Monthly, Hobbies, Sleep, Diet, Workout
- Sync modes: Everyday / Weekdays / Weekly / Monthly / Today → Main tracker
- Sleep logging mirrors onto the Main day row
- Summary with completion ratio (`3/5`) and current streak
- Notifications: hobby reminders (7 & 2 days before), sleep/wake alarms, task ping 10 min before
- Diet dashboard: height/weight profile, optional lab values, meal photos, serving-based calorie,
  macro, fiber, B12, vitamin D and iron estimates
- Data saved in `localStorage` on this device
- Responsive for mobile and desktop

> Keep the Bloom Tracker tab open (or wake it) for reminders to fire. Browsers cannot reliably alarm when the site is fully closed.

> Meal photos are stored as compressed visual records. Nutrition is calculated from the foods and
> servings selected in the meal form; automatic photo recognition requires a separately configured
> vision/nutrition API.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).
