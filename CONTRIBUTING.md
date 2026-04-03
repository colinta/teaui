# Contributing to TeaUI

TeaUI is a terminal UI framework powered by React. It renders full-screen
interactive applications in the terminal using a custom React reconciler that
maps JSX elements to core view components.

## Getting Started

```bash
pnpm install
pnpm -r build
```

Build order matters: `term` → `core` → `react` → apps. The `pnpm -r build`
command handles this automatically.

### Code Formatting

**Always run `pnpm run format` before committing.** The project uses
[oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for formatting.

## Running Things

### Core demos

When creating a new component, you'll want to test it out using the OOP/core
API. So these demos are the starting point for that work.

```bash
pnpm demo              # list available demos
pnpm demo buttons      # run a specific demo (fuzzy matching)
pnpm demo tabl         # matches "table"
```

Demos live in `apps/demos/`. Each `.ts` file is a standalone demo using the
core API.

### React demo app

```bash
pnpm react index
```

Opens a tabbed showcase of React components in the terminal.

### Documentation site

```bash
cd apps/docs/
pnpm start              # dev server at http://localhost:3000/teaui/
```

This also runs `pnpm screenshots` (generates terminal screenshots from examples)
then starts the Docusaurus dev server. See
[`apps/docs/ARCHITECTURE.md`](apps/docs/ARCHITECTURE.md) for how the docs site
builds and renders screenshots.

To regenerate screenshots without restarting the server:

```bash
cd apps/docs && pnpm screenshots
```

### Tests

```bash
pnpm vitest run        # all tests
pnpm vitest run packages/core   # just core tests
```

Use `testRender(view, {width, height})` from `@teaui/core` for headless
component testing. It returns a harness with `t.terminal.textContent()`,
`t.terminal.styleOf()`, `t.sendMouse()`, `t.sendKey()`, and `t.render()`.

## Repository Structure

```
packages/
  term/          Zero-dep terminal I/O library (ANSI parsing, SGR, unicode)
  core/          Core view system (View, Container, Screen, components)
  react/         React reconciler + JSX component wrappers
  subprocess/    Embed terminal subprocesses as views
  cli/           CLI entry point

apps/
  react/         React demo app (tabbed showcase)
  demos/         Core API demo apps
  docs/          Docusaurus documentation site
```

## Expectations

### Every component needs a demo

All components should have a demo in `apps/demos/`. Demos are standalone `.ts`
files that use the core API to show the component in action. Keep them focused —
one component per demo file.

### Every component needs documentation

Documentation lives in `apps/docs/docs/components/`. Each component has an
`.mdx` page with:

1. A description of what the component does
2. A live example (using `<Example name="..." />`)
3. A props table

Examples are `.example.tsx` files in `apps/docs/examples/`. Each file exports
its render spec and component together:

```tsx
import React from 'react'
import {Button} from '@teaui/react'

function App() {
  return <Button onClick={() => console.info('clicked!')}>Click Me</Button>
}

export default {width: 30, height: 3, title: 'Button', App}
```

The `App` component is rendered headlessly to produce a terminal screenshot.
**Example files must not have side effects** — no `run()` calls at the top
level. The build script adds `run(<App />)` automatically for the displayed
code.

### Every component needs a React wrapper

When adding a core component, also add React support:

1. Add a `case` in `packages/react/lib/reconciler.ts` `createInstance()`
2. Add the type, JSX intrinsic element, and wrapper function in
   `packages/react/lib/components.tsx`

### Tests

Core component tests go in `packages/core/tests/components/`. React integration
tests go in `packages/react/tests/`.

## Adding a New Component

1. Create `packages/core/lib/components/MyComponent.ts` extending `View` or
   `Container`
2. Export from `packages/core/lib/components/index.ts`
3. Add a `case` in `packages/react/lib/reconciler.ts`
4. Add JSX type declarations and wrapper in `packages/react/lib/components.tsx`
5. Add tests in `packages/core/tests/components/`
6. Add a demo in `apps/demos/`
7. Add documentation in `apps/docs/docs/components/` with an example in
   `apps/docs/examples/`

## Architecture Notes

### Core View System

- **`View`** — Base class. Handles sizing (`naturalSize`), rendering
  (`render`), layout props (flex, padding, min/max size), mouse/key events.
- **`Container`** — Extends `View` with child management (`add`,
  `removeChild`, `children`).
- **`Screen`** — The runtime. Owns the render loop, manages focus, mouse,
  tick, and modal managers. Processes system events via `trigger()` → dispatch →
  `render()`.
- **`Viewport`** — Passed to `render()`. Provides a clipped drawing surface
  with `write()`, `paint()`, `registerMouse()`, `registerFocus()`, etc.

### Modal System

The modal system allows views to present overlays above the main view tree.
Modals are stacked — a modal can present another modal (e.g. a form that shows
an alert).

**Key types:**

- **`Modal`** (`packages/core/lib/components/Modal.ts`) — A `Container`
  subclass that represents a modal overlay. Props control behavior:
  - `dim` — paint the screen with dimmed colors before rendering content
  - `dismissOnClick` — clicking outside content dismisses the modal
  - `dismissOnEsc` — pressing Escape dismisses the modal
  - `onDismiss` — callback fired on dismiss
  - `presentedRect` / `windowSize` — set by the modal manager before
    rendering, giving the modal the presenting view's rect and the full screen
    size for positioning

- **`ModalManager`** (`packages/core/lib/managers/ModalManager.ts`) — Manages
  a stack of modals. When a view calls `viewport.requestModal(modal)`, the
  modal is pushed onto the stack. After the main view tree renders,
  `Screen.render()` calls `modalManager.renderModals()` which drains the stack:
  each modal gets `presentedRect` and `windowSize` set, then renders with the
  full screen viewport. If a modal's render requests another modal, it's
  appended to the stack and processed in the next iteration.

- **`Viewport.requestModal(modal)`** — Called during a view's `render()` to
  present a modal. Captures the presenting view's absolute rect and forwards to
  the screen.

**Usage (core API):**

```typescript
const modal = new Modal({
  dim: true,
  dismissOnClick: true,
  dismissOnEsc: true,
  onDismiss: () => {
    this.showModal = false
  },
  child: new Box({border: 'rounded', child: content}),
})

// Inside render():
viewport.requestModal(modal)
```

**Usage (React):**

```tsx
<Modal dim dismissOnEsc onDismiss={() => setShow(false)}>
  <Box border="rounded">
    <Text>Are you sure?</Text>
  </Box>
</Modal>
```

The `Dropdown` component uses `Modal` internally with `dim: false` and
`dismissOnClick: true` to show its picker as a popover positioned relative to
the dropdown button.

### Buffer and Differential Rendering

The `Buffer` (`packages/core/lib/Buffer.ts`) sits between the view tree and the
terminal. Views never write directly to the terminal — they write to the buffer
via `Viewport`, and the buffer flushes to a terminal at the end of each render
cycle.

**How it works:**

1. During render, views call `viewport.write(char, point, style)` or
   `viewport.paint(style)`. These calls go through clipping logic in `Viewport`
   and land in `Buffer.writeChar(char, x, y, style)`.

2. The buffer stores each cell as a `{char, width, style}` object in a sparse
   `Map<y, Map<x, Char>>`. Styles are stored as `Style` value objects (bold,
   italic, foreground/background colors, etc.) directly on each cell.

3. At the end of the render cycle, `Buffer.flush(terminal)` diffs the current
   canvas against the previous frame (`#prev`). Only cells that changed are
   written to the terminal. Unchanged cells are skipped entirely — no cursor
   move, no write. This makes rendering efficient even for large screens.

4. After flushing, the current canvas becomes the previous frame and the canvas
   is cleared for the next render.

**Special characters:**

- **`BG_DRAW` (`\x14`)** — A sentinel character used by `viewport.paint()`. It
  represents "painted background" — a cell that has foreground/background colors
  set but no visible character. When a view later writes a real character to a
  cell that was painted with `BG_DRAW`, the buffer inherits the painted
  foreground and background colors if the writing style doesn't specify them.
  During flush, `BG_DRAW` is replaced with a space character.

- **Wide characters** — CJK and emoji characters occupy 2 cells. The buffer
  tracks this with `width: 2` and handles overlap: if a 1-width character is
  written over the right half of a 2-width character, the left half is replaced
  with a space. The `hiding` field on `Char` records what was overwritten so it
  can be restored if needed. This happens when a 2-width wide character is written
  over, for example, a box drawing character. The "left" character wins in this
  scenario.
  ```
   |
  🙂 <-- occludes the '|'
   |
  ```

### Render Targets

The buffer doesn't write directly to `stdout` — it writes to an `SGRTerminal`
interface:

```typescript
interface SGRTerminal {
  cols: number
  rows: number
  move(x: number, y: number): void
  write(str: string): void
  flush(): void
}
```

Different implementations of this interface enable different output modes:

- **`TerminalProgram`** (`packages/core/lib/Screen.ts`) — Wraps `@teaui/term`'s
  `Terminal` for real terminal output. Used by `Screen.start()` for interactive
  applications.

- **`TestTerminal`** (`packages/core/lib/TestTerminal.ts`) — A headless
  terminal for tests. Stores characters and parsed `Style` objects in a 2D grid.
  Provides query methods like `textContent()`, `charAt(x, y)`,
  `styleAt(x, y)`, `styleOf('text')`, and `textRect(x, y, w, h)` for
  assertions. Used by `testRender()`.

- **`StringTerminal`** (`packages/core/lib/StringTerminal.ts`) — Captures all
  output as a single ANSI string. Used by `renderToAnsi()` for headless
  rendering (documentation screenshots, static HTML generation). The output
  preserves SGR escape codes but strips cursor positioning — the grid handles
  that internally.

This separation means the entire view system is terminal-independent. The same
component renders identically whether it's running in a real terminal, being
tested headlessly, or being converted to HTML for documentation.
