# Pane (Split) — Implementation Plan

## Summary

A split-pane container for index/detail layouts. The first N-1 children are
collapsible "browser" panes with draggable separators. The last child is the
"detail" pane that takes remaining space. Supports optional border.

## Steps

```json
[
  {
    "step": 1,
    "title": "Create Pane core component with horizontal split rendering",
    "description": "Create `packages/core/lib/components/Pane.ts` extending `Container`. Accept `border` prop (optional). The last child is the detail pane, all others are browser panes. Render browser panes on the left with fixed widths, a vertical separator (`┃`), and the detail pane filling the remaining space. Each browser pane has a stored width (default based on naturalSize or a reasonable minimum). Implement `naturalSize` and `render` to lay out panes side by side with separators between them.",
    "files": ["packages/core/lib/components/Pane.ts"],
    "done": true
  },
  {
    "step": 2,
    "title": "Add draggable separators",
    "description": "Register mouse regions on each separator (1 char wide, full height). On mouse drag, resize the adjacent browser pane — update its stored width and re-render. Clamp to a minimum width (e.g. 5 chars) and maximum (half the available width). Change the separator style on hover to indicate it's draggable.",
    "files": ["packages/core/lib/components/Pane.ts"],
    "done": true
  },
  {
    "step": 3,
    "title": "Add collapsible browser panes",
    "description": "Clicking a separator (not dragging) collapses/expands its browser pane. When collapsed, the pane width is 0 and the separator renders as a double-line (`║`) to indicate the collapsed state. The detail pane expands to fill the freed space. Store collapsed state per browser pane. When a border is enabled, render the outer box with `╭╮╰╯` corners and the separators connect to the top/bottom borders (`┰` / `┸` for expanded, `╓` / `╙` for collapsed).",
    "files": ["packages/core/lib/components/Pane.ts"],
    "done": true
  },
  {
    "step": 4,
    "title": "Export, reconciler, React wrapper, and tests",
    "description": "Export from `packages/core/lib/components/index.ts`. Add `case 'pane'` / `case 'tui-pane'` in reconciler. Add PaneProps type, JSX intrinsic, and wrapper function in components.tsx. Add tests covering: layout with multiple panes, separator positioning, collapse/expand, drag resize.",
    "files": [
      "packages/core/lib/components/index.ts",
      "packages/react/lib/reconciler.ts",
      "packages/react/lib/components.tsx",
      "packages/core/tests/components/Pane.test.ts"
    ],
    "done": true
  },
  {
    "step": 5,
    "title": "Demo and documentation",
    "description": "Add `apps/demos/pane.ts` demo showing a typical index/detail layout (list of items on the left, detail view on the right). Add `apps/docs/examples/pane.example.tsx` with render spec. Add `apps/docs/docs/components/pane.mdx` documentation page with Example, props table, and interaction description.",
    "files": [
      "apps/demos/pane.ts",
      "apps/docs/examples/pane.example.tsx",
      "apps/docs/docs/components/pane.mdx"
    ],
    "done": true
  }
]
```
