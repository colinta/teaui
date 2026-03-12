# Calendar Component

## Overview

A classic calendar widget showing a month grid. Supports mouse interaction for
date selection, month/year navigation, and switching to month/year picker mode.

## Reference

```
  June      2026  
 Su Mo Tu We Th Fr Sa
 27 28 29 30 31  1  2    # previous month days are dimmed
  3  4  5  6  7  8  9
 10 11 12 13 14 15 16    # today is bold
 17 18 19 20 21 22 23
 24 25 26 27 28 29 30    # selected date is highlighted w/ bg color
 31  1  2  3  4  5  6
```

- Fixed width: ~20 chars (`3 × 7 + 1 = 22` for day cells w/ padding on both sides)
- Fixed height: 8 lines (title + weekday header + 5-6 week rows)
- Month and year in the header should be clickable - click the arrows to move by one,
  or click the month to go to month selection, or click the year to go to year selection

## Month selection

```
        June       ×    # cancel/Esc

[ Jan ][ Feb ][ Mar ]
[ Apr ][ May ][ Jun ]   # Jun is highlighted
[ Jul ][ Aug ][ Sep ]
[ Oct ][ Nov ][ Dec ]

Jun                     # typing month to jump
```

## Year selection

Scrollable w/ mouse, accepts numbers from keyboard

```
        ↑          ×    # cancel/Esc
       2024
       2025
       2026             # 2026 is highlighted
       2027
       2028
        ↓
Search: 2026            # typing numbers shows up here
```

## API

```ts
interface Props extends ViewProps {
  date: Date // selected date
  visibleDate: Date // displayed month and year
  // called when navigating months/years (but not when selecting a date)
  // day is always 1
  onChangeVisible: (date: Date) => void
  // called when selecting a date or range (date2 == date1 when selecting a single date)
  onChange?: (date1: Date, date2: Date) => void
  // can be configured to accept a single date or a range
  selection: 'single' | 'range'
  firstDayOfWeek?: 0 | 1 // 0=Sunday (default), 1=Monday
}
```

## Interaction

### Day Grid

- Arrow keys to move selection
- Mouse click to select a date
- Previous-month days shown dimmed (still clickable)

### Month/Year Header

- Clicking the **month** label → switches to month picker (grid of 12 months)
- Clicking the **year** label → switches to year picker (grid/scrollable list)
- Left/right arrows (or `<` `>` buttons) to navigate months
- These pickers replace the day grid; selecting a value returns to the day view

### Keyboard

- Arrow keys: move selected date
- Enter: confirm selection (or make first selection in range)
- Escape: cancel picker mode (return to day grid)
- Page Up/Page Down: previous/next month

## Implementation Notes

- Extends `View` — renders the grid directly in `render()`
- Three internal display modes: `'days'` | `'months'` | `'years'`
- Register mouse regions for each day cell, month label, year label, and nav arrows
- Today's date gets a distinct style (e.g. bold)
- Selected date gets highlighted bg
- Days outside the current month rendered in dim/muted style
