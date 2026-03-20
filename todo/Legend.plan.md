# Legend — Implementation Plan

## Summary

A hotkey legend bar that formats keyboard shortcuts with key sigils (⤦, ↑↓, ⌃,
⌘, ␛, etc.) and labels. Placed at the bottom of a screen to show available
actions. Supports inline and wrapping layouts.

## Steps

```json
[
  {
    "step": 1,
    "title": "Create Legend core component with inline rendering",
    "description": "Create `packages/core/lib/components/Legend.ts` extending `View`. Accept `items: LegendItem[]` (each with `key: string | string[]` and `label: string`) and `separator: string` (default '  '). Implement a key-to-sigil mapping: 'enter' → '⤦', 'up' → '↑', 'down' → '↓', 'cmd' → '⌘', 'ctrl' → '⌃', 'escape' → '␛', 'tab' → '⇥', 'space' → '␣', 'shift' → '⇧', etc. For string arrays like ['ctrl', 'C'], join the mapped sigils. Render keys in bold/highlighted style, labels in normal/dim style, separated by the separator string. `naturalSize` calculates total width of all items + separators, height 1.",
    "files": ["packages/core/lib/components/Legend.ts"],
    "done": false
  },
  {
    "step": 2,
    "title": "Add wrapping layout",
    "description": "When items don't fit on one line, wrap to multiple lines with column alignment. Calculate how many items fit per row given the available width, then align columns across rows so keys and labels line up vertically. Update `naturalSize` to return the correct height based on wrapping.",
    "files": ["packages/core/lib/components/Legend.ts"],
    "done": false
  },
  {
    "step": 3,
    "title": "Export, reconciler, React wrapper, and tests",
    "description": "Export from `packages/core/lib/components/index.ts`. Add `case 'legend'` / `case 'tui-legend'` in reconciler. Add LegendProps type, JSX intrinsic, and wrapper function in components.tsx. Add tests in `packages/core/tests/components/Legend.test.ts` covering: key sigil mapping, inline rendering, wrapping at various widths, separator customization.",
    "files": [
      "packages/core/lib/components/index.ts",
      "packages/react/lib/reconciler.ts",
      "packages/react/lib/components.tsx",
      "packages/core/tests/components/Legend.test.ts"
    ],
    "done": false
  },
  {
    "step": 4,
    "title": "Demo and documentation",
    "description": "Add `apps/demos/legend.ts` demo using the core API. Add `apps/docs/examples/legend.example.tsx` with render spec. Add `apps/docs/docs/components/legend.mdx` documentation page with Example, props table, key sigil reference, and inline vs wrapping examples.",
    "files": [
      "apps/demos/legend.ts",
      "apps/docs/examples/legend.example.tsx",
      "apps/docs/docs/components/legend.mdx"
    ],
    "done": false
  }
]
```
