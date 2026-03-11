# Table Component

## Overview

A data table that accepts generic row data, configurable columns, and a
formatter function. Supports sortable headers, selectable/scrollable rows.

## API

```ts
interface Column<TData> {
  key: string
  title: string
  width?: number | 'auto' // fixed or flex
  align?: 'left' | 'center' | 'right'
}

interface Props<TData> extends ContainerProps {
  data: TData[]
  columns: Column<TData>[]
  format: (key: string, row: TData) => string
  selectedIndex?: number
  onSelect?: (row: TData, index: number) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
}
```

## Rendering

```
 Name         │ Age │ Email              │ Status       // dim │ separators
───────────────────────────────────────────────────
 Alice        │  30 │ alice@example.com  │ Active
▶Bob          │  25 │ bob@example.com    │ Pending ◀
 Charlie      │  35 │ charlie@ex.com     │ Active
```

- Header row with column titles — clickable for sorting
- Sort indicator (▲/▼) on the active sort column
- Separator line between header and data
- Row separators using `─` (normal text)
- Column separators using `│` (dimmed text)
- Selected row highlighted with bg colour
- Scrollable when rows exceed available height

## Interaction

### Mouse

- Click header → sort by that column (toggle asc/desc)
- Click row → select it
- Scroll wheel → scroll the table body

### Keyboard

- Up/Down arrows: move selection
- Enter: confirm selection (fires `onSelect`)
- Home/End: jump to first/last row

## Implementation Notes

- Column width calculation: fixed widths first, then distribute remaining
  space among `'auto'` columns
- Header is a fixed row (not scrollable)
- Body rows scroll within the remaining viewport height
- The `format` function gives full control over cell rendering — the component
  just provides structure and interaction
- Future: cell-level rendering (returning styled text or even views), column
  resizing, horizontal scrolling for wide tables
- If the rows don't fit on screen:
  - scrollable with mouse wheel
  - we should show '↑ N more rows' and '↓ N more rows', unless you are at the top/bottom.
  - for the first and last visible.height/2 rows, the selected row moves up and down as usual
  - for the "middle" rows, the selected row should stay in place, and we move the
    rows up and down instead, creating a "moving window" effect. This means that
    given only the row-offset and total row count, we can recreate the UI.
