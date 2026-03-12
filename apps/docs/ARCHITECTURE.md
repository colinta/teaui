# Docs Architecture

The TeaUI documentation site is a [Docusaurus](https://docusaurus.io/) app that
renders live terminal screenshots from the actual TeaUI components at build time.

Hosted at: **https://colinta.github.io/teaui/**
Deployed via: **GitHub Actions** (`.github/workflows/docs.yml`)

## Directory Structure

```
apps/docs/
├── docs/                     # MDX documentation pages
│   ├── intro.mdx
│   ├── getting-started.mdx
│   ├── core-api.mdx
│   ├── themes.mdx
│   └── components/           # One .mdx per component
├── examples/                 # ★ Source of truth for React examples
│   ├── specs.ts              # Render size config for each example
│   ├── button.example.tsx    # React component (displayed + rendered)
│   ├── stack.example.tsx
│   └── ...
├── screenshots/              # Legacy core-API-only screenshot specs
│   ├── types.ts              # ScreenshotSpec & ExampleSpec types
│   ├── renderReact.tsx       # Headless React rendering helper
│   ├── progress.screenshot.ts
│   └── tree.screenshot.ts
├── scripts/
│   └── build-screenshots.ts  # Build script: renders everything to HTML
├── src/
│   ├── components/
│   │   ├── Example.tsx           # Shows code + rendered output together
│   │   └── TerminalScreenshot.tsx # Shows just the rendered terminal output
│   ├── css/
│   │   ├── custom.css        # Global Zenburn theme
│   │   ├── index.css         # Landing page styles
│   │   └── terminal.css      # Terminal frame + example styles
│   └── pages/
│       └── index.tsx          # Landing page
├── static/
│   ├── examples/             # ★ Generated: {name}.html + {name}.tsx
│   └── screenshots/          # ★ Generated: {name}.html
├── docusaurus.config.ts
├── sidebars.ts
└── package.json
```

Directories marked with ★ are generated at build time and gitignored.

## How Examples Work (Single Source of Truth)

Each React example file (e.g. `examples/button.example.tsx`) serves as the
**single source of truth** for both the displayed code and the rendered terminal
output on a component's documentation page.

### Example file format

```tsx
// examples/button.example.tsx
import React from 'react'
import {Button} from '@teaui/react'

export default function App() {
  return <Button onClick={() => console.log('clicked!')}>Click Me</Button>
}
```

Each example exports a default `App` component. **Example files must not have
side effects** — no `run()` or `interceptConsoleLog()` calls at the top level,
since the build script imports the file to get the component. The `run()` import
and call are added automatically for display (see below).

Render sizes are configured separately in `examples/specs.ts`:

```ts
export const exampleSpecs = {
  button: {width: 30, height: 3, title: 'Button'},
  // ...
}
```

### Build pipeline

The `scripts/build-screenshots.ts` script runs before every build (`prebuild`)
and `start`:

1. **Import** the example's default export (the `App` component)
2. **Render** it headlessly using the React reconciler into a `Window` view tree
3. **Convert** the view tree to ANSI via `renderToAnsi()` from `@teaui/core`
4. **Convert** ANSI escape codes to styled HTML (supports 16/256/24-bit color,
   bold, italic, underline, dim, inverse)
5. **Write** `static/examples/{name}.html` (the rendered screenshot)
6. **Transform** the source for display and write to `static/examples/{name}.tsx`:
   - Strip `export default` from the component declaration
   - Add `run` to the `@teaui/react` import if not already present
   - Append `run(<App />)` at the end

This way the displayed code looks like a complete runnable example, while the
actual file is a safe-to-import module with no side effects.

### Headless React rendering

The key to rendering React components without a terminal is in
`screenshots/renderReact.tsx`:

```tsx
import {Window, createHeadlessScreen} from '@teaui/core'
import {render} from '@teaui/react'

export function renderReact(element: ReactNode): Window {
  const window = new Window()
  const screen = createHeadlessScreen()
  render(screen, window, element)
  window.moveToScreen(screen) // triggers didMount on all views
  return window
}
```

The `createHeadlessScreen()` (exported from `@teaui/core`) provides a minimal
`Screen` object with no-op methods for `render()`, `needsRender()`,
`registerHotKey()`, `registerFocus()`, `registerMouse()`, `registerTick()`, and
`checkMouse()`.

The critical step is `window.moveToScreen(screen)` — this triggers `didMount()`
on all views in the tree, which is required for `TextContainer` nodes (used by
the React reconciler for inline text) to convert their `TextLiteral` children
into actual `Text` views for layout.

### Docusaurus components

**`<Example name="button" title="Button" />`** — Fetches both
`/examples/button.tsx` (source) and `/examples/button.html` (screenshot), then
renders the source in a syntax-highlighted `CodeBlock` with the terminal
screenshot below it.

**`<TerminalScreenshot name="progress" />`** — Fetches just
`/screenshots/progress.html` and renders it in a terminal window frame. Supports
a `dir` prop to read from `/examples/` instead (used on the landing page).

## Legacy Screenshot Specs

Components without React wrappers (currently `Progress` and `Tree`) use the
older core-API screenshot system. These are `.screenshot.ts` files in the
`screenshots/` directory that export a `ScreenshotSpec`:

```ts
export default {
  size: {width: 30, height: 1},
  component: () => new Progress({value: 65, max: 100, showPercent: true}),
} satisfies ScreenshotSpec
```

These are rendered using the core `renderToAnsi()` directly (no React involved).

## Theme

The site uses a **Zenburn** color palette, forced dark mode only, with
**Fira Code** as the monospace font everywhere. Key design decisions:

- Dark mode only (`disableSwitch: true`) — it's a terminal UI framework
- All text is monospace (Fira Code) for a terminal aesthetic
- Navbar and sidebar styled to evoke a DOS-era file manager
- Box-drawing characters used in sidebar labels (`│ Components │`)
- Terminal screenshots use Zenburn's 16-color palette for ANSI rendering
- Prism theme: `vsDark` for code blocks

## CI/CD

The GitHub Actions workflow (`.github/workflows/docs.yml`) runs on push to
`main` or manual trigger:

1. Install dependencies (`pnpm install --frozen-lockfile`)
2. Build `@teaui/term` (zero-dep terminal library)
3. Build `@teaui/core` (depends on term)
4. Build `@teaui/react` (depends on core)
5. Build docs: runs `build-screenshots.ts` then `docusaurus build`
6. Upload to GitHub Pages via `actions/deploy-pages`

## Adding a New Example

1. Create `examples/{name}.example.tsx` with a default-exported `App` component
2. Add the render size to `examples/specs.ts`
3. Use `<Example name="{name}" />` in the component's `.mdx` file
4. Run `pnpm docs` to verify locally
