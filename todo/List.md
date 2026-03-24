# List Component — Demo / Cookbook

## Overview

Rather than a core component, this starts as a **demo app** showing how to
compose a filterable, selectable list using existing TeaUI primitives:
`Input`, `ScrollableList`, `Stack`, `Text`, `Keyboard`, etc.

## Goal

Show users how to build a real interactive list by composing core components —
demonstrating that TeaUI's primitives are powerful enough for this pattern
without needing a dedicated `List` component.

## Demo Features

1. **Text input** at the top for filtering (`Input` component)
2. **Scrollable list** of items (`ScrollableList` or `Scrollable` + `Stack`)
3. **Keyboard navigation**: arrow keys to move selection, Enter to confirm,
   typing to filter
4. **Mouse support**: click to select, scroll wheel to scroll
5. **Highlighted selection**: selected row gets background colour

## Sketch

```
┌─ Filter ─────────────────┐
│ > blo_                   │
├──────────────────────────┤
│   Blog Post 1            │
│ ▶ Blog Post 2            │  ← selected
│   Blog Post 3            │
│   Blogging Tips          │
│                          │
└──────────────────────────┘
```

## Implementation Plan

1. Create `apps/demos/list/` as a standalone demo app
2. Use `Stack` (vertical) to arrange `Input` + `ScrollableList`
3. Wire Input's `onChange` to filter the data set
4. Use `ScrollableList` for virtualised rendering of filtered items
5. Handle keyboard events: arrow keys change selection index, Enter fires callback
6. Demonstrate the pattern in the docs as a "Cookbook" recipe

## Notes

- If this pattern proves common enough, we could later extract a reusable
  `List` component into core — but starting as a demo keeps the core lean
- Could evolve into a `Combobox` or `Autocomplete` component
