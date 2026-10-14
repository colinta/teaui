# React Demo

Interactive demo showcasing all `@teaui/react` components in a single terminal application.

## Running

```bash
cd apps/react
pnpm demo index
```

This builds (if needed) and launches the demo in fullscreen mode. Press **Ctrl-C** to exit.

## Vite hot reload

```bash
cd apps/react
pnpm dev index
```

This starts a Vite-powered dev runner that keeps the terminal screen alive and remounts the selected demo when `apps/react/`, `packages/core/`, `packages/react/`, or `packages/term/` source files change.

## What's Demonstrated

The demo renders a `Drawer.bottom` layout with a component showcase on top and a centered text footer. It exercises:

- **Layout** — `Stack.down`, `Stack.right`, `Drawer.bottom`, `Box` with borders
- **Text** — `H1`–`H6` headers, `Text` with alignment/wrap, `Style` (bold, italic, underline, strikeout), `Br` line breaks
- **Inputs** — `Input` fields, `Checkbox` toggles, `Slider` (horizontal/vertical), `ToggleGroup`, `Button` with click handlers
- **Containers** — `Scrollable` content, `Collapsible` / `CollapsibleText`, `Accordion` with multiple sections, `Tabs`
- **Data display** — combined `BarChart` and `LineChart` plots, `Digits` large-font numbers, `Separator` lines, `Space` spacers
- **Debug** — `ConsoleLog` component (toggled at runtime) showing intercepted `console.info` output
- **React features** — `useState`, `useReducer` for interactive state, conditional rendering

## Structure

```
apps/react/
├── index.tsx       # Tabbed demo application
├── charts.tsx      # Combined BarChart and LineChart example
├── *.tsx           # Additional component tabs and standalone demos
├── package.json
└── tsconfig.json
```

`index.tsx` assembles the component tabs into the main demo. Each tab can also run independently; for example, `pnpm demo charts` launches the chart example directly.
