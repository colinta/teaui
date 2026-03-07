# TeaUI — Agent Guide

TeaUI is a terminal UI framework powered by React (or Preact). It renders
full-screen interactive applications in the terminal using a custom React
reconciler that maps JSX elements to core view components.

## Repository Structure

```
packages/
  term/          Zero-dep terminal I/O library (ANSI parsing, SGR, unicode)
  core/          Core view system (View, Container, Screen, components)
  react/         React reconciler + JSX component wrappers
  preact/        Preact reconciler + JSX component wrappers
  subprocess/    Embed terminal subprocesses as views
  cli/           CLI entry point

apps/
  react/         React demo app (tabbed showcase)
  preact/        Preact demo app
  demos/         Additional demo apps
  docs/          Docusaurus documentation site
    docs/        MDX documentation pages (components, API, reconciler)
    ARCHITECTURE.md  How the docs site builds and renders screenshots
```

## Key Architecture

### Core View System (`packages/core/`)

- **`View`** — Base class. Handles sizing (`naturalSize`), rendering (`render`),
  layout props (flex, padding, min/max size), mouse/key events, and screen
  mounting.
- **`Container`** — Extends View with child management (`add`, `removeChild`,
  `children`).
- **`Screen`** — The runtime. Owns the render loop, mouse/focus/tick managers,
  and the terminal buffer. Processes system events via `trigger()` → dispatch →
  `render()`.
- **`Viewport`** — Passed to `render()`. Provides clipped drawing surface,
  `write()`, `paint()`, `registerMouse()`, `registerFocus()`, etc.
- **`Style`** — Immutable value object for text styles (bold, italic, colors).
  Has `merge()`, `toSGR()`, `fromSGR()`.
- **Components** — `packages/core/lib/components/`: Stack, Box, Input, Tabs,
  Accordion, Drawer, ToggleGroup, etc. Each is a View or Container subclass.

### React/Preact Reconcilers (`packages/react/`, `packages/preact/`)

The reconcilers bridge React's virtual DOM to the core view tree. See
[`apps/docs/docs/reconciler.mdx`](apps/docs/docs/reconciler.mdx) for the full
architecture document covering:

- How `createInstance` maps JSX elements to core views
- How `appendChild` handles text nodes with automatic `TextContainer` wrapping
- The text system: `TextLiteral`, `TextContainer`, `TextProvider`, `TextStyle`
- Update propagation and `invalidateText()` / `invalidateNodes()` lifecycle
- Prop comparison via `isSame()` (deep structural equality)
- Differences between the React and Preact renderers

### Text System (Critical)

The text system is the most complex part of the reconciler. In brief:

- JSX string children → `TextLiteral` (data-only, no rendering)
- Adjacent text nodes are grouped into auto-created `TextContainer` nodes
- `TextContainer` flattens its nodes, calls `styledText()` on each
  `TextLiteral` (which reads styles from ancestor `TextStyle` nodes), and
  generates core `Text` views for layout
- When styles change (`<Style bold={true}>` → `<Style bold={false}>`),
  `TextStyle.update()` must notify the ancestor `TextContainer` via
  `invalidateText()` to regenerate the styled text

## Build & Test

```bash
pnpm install
pnpm -r build              # Build all packages
pnpm vitest run             # Run all tests
pnpm react                  # Run the React demo app
```

Build order matters: `term` → `core` → `react`/`preact` → apps.

The 2 test failures in `packages/subprocess/tests/` are a known issue
(missing `@teaui/core` resolution in that package's test config).

## Testing

- Core component tests: `packages/core/tests/`
- React integration tests: `packages/react/tests/`
- Use `testRender(view, {width, height})` from `@teaui/core` for headless
  rendering. It returns a test harness with `t.terminal.textContent()`,
  `t.terminal.styleOf()`, `t.sendMouse()`, `t.sendKey()`, `t.render()`.

## Common Patterns

### Adding a new core component

1. Create `packages/core/lib/components/MyComponent.ts` extending `View` or
   `Container`
2. Export from `packages/core/lib/components/index.ts`
3. Add to both reconcilers' `createInstance` switch
4. Add JSX type declarations and wrapper component in
   `packages/{react,preact}/lib/components.tsx`
5. Add tests in `packages/core/tests/components/`

### Debugging rendering

- `testRender()` + `t.terminal.textContent()` to inspect rendered text
- `t.terminal.styleOf('text')` to check if bold/italic/etc are applied
- Core views have `debug` prop — set it to inspect layout
