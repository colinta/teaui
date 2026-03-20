# Table — Implementation Plan

## Status: ✅ Implemented

The Table component is fully implemented in
`packages/core/lib/components/Table.ts` (776 lines). It has a React wrapper
(with virtualized row rendering support), documentation page, and example.

The original spec in `Table.md` has been completed:

- Generic row data with configurable columns and formatter
- Sortable headers with sort indicators
- Selectable/scrollable rows with keyboard navigation
- Column width calculation (fixed + auto)
- Row numbers and checkbox selection columns
- Mouse interaction (header click to sort, row click to select, scroll wheel)
- Selected row highlighting
- Scrolling with "moving window" effect for middle rows

### Remaining work

- Add `apps/demos/table.ts` core API demo (currently exists but may need updating)
- Add tests in `packages/core/tests/components/Table.test.ts`
- Future: cell-level rendering with styled text or views, column resizing via drag, horizontal scrolling for wide tables
