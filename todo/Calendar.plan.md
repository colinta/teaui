# Calendar — Implementation Plan

## Summary

A month-grid calendar widget with day/month/year selection, keyboard and mouse
navigation, and optional range selection.

## Steps

```json
[
  {
    "step": 1,
    "title": "Create Calendar core component with day grid rendering",
    "description": "Create `packages/core/lib/components/Calendar.ts` extending `View`. Implement the day grid: render month/year header, weekday row (Su Mo Tu We Th Fr Sa), and 5-6 week rows. Fixed size ~22×8. Accept `date` (selected), `visibleDate` (displayed month), `firstDayOfWeek` (0=Sunday, 1=Monday). Render today in bold, selected date with highlight background, days outside the current month in dim. Calculate the grid layout: find the weekday of the 1st, fill previous-month days, current-month days, next-month days.",
    "files": ["packages/core/lib/components/Calendar.ts"],
    "done": true
  },
  {
    "step": 2,
    "title": "Add mouse interaction for day selection and month navigation",
    "description": "Register mouse regions for each day cell (3 chars wide × 1 row). On click, call `onChange(date1, date2)` with the clicked date. Add left/right arrow buttons in the header row for month navigation — clicking calls `onChangeVisible` with month ±1. Register mouse for the month label and year label in the header (for switching to picker modes in step 4).",
    "files": ["packages/core/lib/components/Calendar.ts"],
    "done": true
  },
  {
    "step": 3,
    "title": "Add keyboard navigation",
    "description": "Register focus and handle arrow keys (move selection by day/week), Enter (confirm selection), Escape (cancel picker mode), Page Up/Down (prev/next month), Home/End (first/last day of month). When arrow keys move past month boundaries, call `onChangeVisible` to navigate months. Support `selection: 'range'` — first Enter sets range start, second Enter sets range end, highlight the range in between.",
    "files": ["packages/core/lib/components/Calendar.ts"],
    "done": true
  },
  {
    "step": 4,
    "title": "Add month and year picker modes",
    "description": "Implement three internal display modes: 'days' | 'months' | 'years'. Month picker: 4×3 grid of month names, current month highlighted, click or Enter to select and return to day view. Year picker: scrollable vertical list centered on current year, supports mouse scroll and number key typing for search. Clicking the month label switches to month picker, clicking the year label switches to year picker. Escape returns to day view.",
    "files": ["packages/core/lib/components/Calendar.ts"],
    "done": true
  },
  {
    "step": 5,
    "title": "Export, reconciler, React wrapper, and tests",
    "description": "Export from `packages/core/lib/components/index.ts`. Add `case 'calendar'` / `case 'tui-calendar'` in reconciler. Add CalendarProps type, JSX intrinsic, and wrapper function in components.tsx. Add tests in `packages/core/tests/components/Calendar.test.ts` covering: rendering the correct month grid, day selection via mouse, keyboard navigation, month/year picker modes.",
    "files": [
      "packages/core/lib/components/index.ts",
      "packages/react/lib/reconciler.ts",
      "packages/react/lib/components.tsx",
      "packages/core/tests/components/Calendar.test.ts"
    ],
    "done": true
  },
  {
    "step": 6,
    "title": "Demo and documentation",
    "description": "Add `apps/demos/calendar.ts` demo using the core API. Add `apps/docs/examples/calendar.example.tsx` with render spec. Add `apps/docs/docs/components/calendar.mdx` documentation page with Example, props table, and keyboard shortcuts reference.",
    "files": [
      "apps/demos/calendar.ts",
      "apps/docs/examples/calendar.example.tsx",
      "apps/docs/docs/components/calendar.mdx"
    ],
    "done": true
  }
]
```
