# Preact Demo

Interactive demo showcasing all `@teaui/preact` components in a single terminal application.

## Running

```bash
cd apps/preact
pnpm demo index
```

This builds (if needed) and launches the demo in fullscreen mode. Press **Ctrl-C** to exit.

## What's Demonstrated

The demo renders a `Drawer.bottom` layout with a component showcase on top and a centered text footer. It exercises:

- **Layout** — `Stack.down`, `Stack.right`, `Drawer.bottom`, `Box` with borders
- **Text** — `H1`–`H6` headers, `Text` with alignment/wrap, `Style` (bold, italic, underline, strikeout), `Br` line breaks
- **Inputs** — `Input` fields, `Checkbox` toggles, `Slider` (horizontal/vertical), `ToggleGroup`, `Button` with click handlers
- **Containers** — `Scrollable` content, `Collapsible` / `CollapsibleText`, `Accordion` with multiple sections, `Tabs`
- **Data display** — `Digits` large-font numbers, `Separator` lines, `Space` spacers
- **Debug** — `ConsoleLog` component (toggled at runtime) showing intercepted `console.log` output
- **Preact features** — `useState`, `useReducer` for interactive state, conditional rendering

## Structure

```
apps/preact/
├── index.tsx       # Demo application (single-file)
├── package.json
└── tsconfig.json
```

The entire demo is a single `<Demo />` component in `index.tsx` that uses Preact hooks for all interactive state. It calls `run(<Demo />)` from `@teaui/preact` to mount and enter fullscreen.
