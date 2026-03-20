# Page — Implementation Plan

## Summary

A paginated container that shows one page at a time with dot indicators and
optional page titles. Follows the `Page > Page.Section` pattern (like
Accordion). Supports animated transitions between pages.

## Steps

```json
[
  {
    "step": 1,
    "title": "Create Page and Page.Section core components",
    "description": "Create `packages/core/lib/components/Page.ts`. `Page` extends `Container`, `Page.Section` extends `Container` with an optional `title` prop. Page accepts `activeIndex` and `onChange` props. Only the active section participates in layout and rendering — others are hidden. `naturalSize` returns the max of all sections' natural sizes + 1 row for the dot indicator (+ 1 row for the title if any section has a title).",
    "files": ["packages/core/lib/components/Page.ts"],
    "done": false
  },
  {
    "step": 2,
    "title": "Render dot indicators and section title",
    "description": "Render dot indicators at the bottom: `●` for active, `○` for inactive, centered horizontally. If any section has a title, render the active section's title above the dots (centered). Register mouse regions for each dot (3 chars wide: padding + dot + padding). Clicking a dot calls `onChange` with that index.",
    "files": ["packages/core/lib/components/Page.ts"],
    "done": false
  },
  {
    "step": 3,
    "title": "Add keyboard navigation",
    "description": "Register focus. Handle Space and Page Down (next page), Page Up (previous page), Home (first page), End (last page), number keys 1-9 (jump to page). On hover over a dot, show that section's title.",
    "files": ["packages/core/lib/components/Page.ts"],
    "done": false
  },
  {
    "step": 4,
    "title": "Add page transition animations",
    "description": "When navigating to a new page, animate the transition: current page slides out left/right, new page slides in from the opposite direction. Use `receiveTick` for animation timing. Handle interruptions: if a new page is selected during animation, the in-progress page completes quickly and the new target page animates in. Direction is based on index comparison (lower index = slide from left, higher = from right). During animation, render both the outgoing and incoming sections in clipped viewports that shift each tick.",
    "files": ["packages/core/lib/components/Page.ts"],
    "done": false
  },
  {
    "step": 5,
    "title": "Export, reconciler, React wrapper, and tests",
    "description": "Export from `packages/core/lib/components/index.ts`. Add `case 'page'` / `case 'tui-page'` and `case 'page-section'` / `case 'tui-page-section'` in reconciler. Add PageProps and PageSectionProps types, JSX intrinsics, and wrapper functions in components.tsx. Add tests covering: rendering active section, dot indicators, page switching, keyboard navigation.",
    "files": [
      "packages/core/lib/components/index.ts",
      "packages/react/lib/reconciler.ts",
      "packages/react/lib/components.tsx",
      "packages/core/tests/components/Page.test.ts"
    ],
    "done": false
  },
  {
    "step": 6,
    "title": "Demo and documentation",
    "description": "Add `apps/demos/page.ts` demo using the core API. Add `apps/docs/examples/page.example.tsx` with render spec. Add `apps/docs/docs/components/page.mdx` documentation page with Example, props table, and keyboard shortcuts.",
    "files": [
      "apps/demos/page.ts",
      "apps/docs/examples/page.example.tsx",
      "apps/docs/docs/components/page.mdx"
    ],
    "done": false
  }
]
```
