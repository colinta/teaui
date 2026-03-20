# List Demo — Implementation Plan

## Summary

A demo app (not a core component) showing how to compose a filterable,
selectable list from existing TeaUI primitives: Input, ScrollableList, Stack,
Text, Keyboard. Demonstrates that the core primitives are sufficient for this
common pattern.

## Steps

```json
[
  {
    "step": 1,
    "title": "Create list demo with input and scrollable list",
    "description": "Create `apps/demos/list.ts`. Compose a vertical Stack with an Input at the top and a ScrollableList below. Populate with sample data (e.g. 50 items with names). Wire Input's onChange to filter the list items. The ScrollableList should show matching items and update as the user types. Use a Box with border around the whole thing for framing.",
    "files": ["apps/demos/list.ts"],
    "done": false
  },
  {
    "step": 2,
    "title": "Add keyboard navigation and selection",
    "description": "Add keyboard handling: arrow keys move the selected row highlight in the ScrollableList, Enter fires a selection callback (log to console or show in a detail area), Escape clears the filter input. Ensure focus flows correctly between the Input and the list — typing should go to the Input, arrow keys should navigate the list.",
    "files": ["apps/demos/list.ts"],
    "done": false
  },
  {
    "step": 3,
    "title": "Add mouse support and polish",
    "description": "Click on a list item to select it. Scroll wheel to scroll the list. Add a status bar or detail area below the list showing the selected item's details. Polish the styling — selected row gets background color, filter matches could be highlighted.",
    "files": ["apps/demos/list.ts"],
    "done": false
  },
  {
    "step": 4,
    "title": "Add documentation as a cookbook recipe",
    "description": "Add a cookbook/recipe page in `apps/docs/docs/` showing how to build this pattern. Walk through the composition step by step with code snippets. This isn't a component doc page — it's a guide showing how to compose primitives. Optionally add a React version of the demo in `apps/docs/examples/`.",
    "files": ["apps/docs/docs/cookbook/filterable-list.mdx"],
    "done": false
  }
]
```
