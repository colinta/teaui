# @teaui/react

React custom renderer for [TeaUI](https://github.com/colinta/teaui). Write fullscreen terminal UIs with React components, hooks, and JSX.

## Install

```bash
pnpm install @teaui/core @teaui/react react
# TypeScript users:
pnpm install -D @types/react
```

## Usage

```tsx
import React, {useReducer} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {Box, Button, Stack, run} from '@teaui/react'

interceptConsoleLog()

function App() {
  const [bang, addBang] = useReducer(s => s + '!', '')

  return (
    <Box border="single">
      <Stack.down>
        Hello TeaUI{bang}
        <Button onClick={addBang}>Click me</Button>
      </Stack.down>
    </Box>
  )
}

run(<App />)
```

Compile and run:

```bash
pnpm tsc && node .dist/index.js
```

## API

### `run(element, options?)`

Creates a `Window` and `Screen`, renders the React element tree, and enters fullscreen mode.

```ts
const [screen, window, component, unmount] = await run(<App />)
```

Returns `[Screen, Window, ReactNode, unmount]`. Call `unmount()` to tear down the React tree.

### `render(screen, window, element)`

Lower-level alternative — mount a React element into an existing `Screen` and `Window`.

```ts
import {Screen, Window} from '@teaui/core'
import {render} from '@teaui/react'

const window = new Window()
const [screen] = await Screen.start(window)
const unmount = render(screen, window, <App />)
```

Returns an `unmount()` function.

## Components

All components are typed wrappers around TeaUI core views. They accept the same props as the core constructors, with `children` mapped to React children.

### Views (leaf nodes)

| Component             | Element                  | Description                               |
| --------------------- | ------------------------ | ----------------------------------------- |
| `<Br />`              | `<tui-br>`               | Line break in text                        |
| `<Checkbox />`        | `<tui-checkbox>`         | Toggle checkbox                           |
| `<CollapsibleText />` | `<tui-collapsible-text>` | Text that truncates with expand/collapse  |
| `<ConsoleLog />`      | `<tui-console>`          | Displays intercepted `console.*` output |
| `<Digits />`          | `<tui-digits>`           | Large-font digit display                  |
| `<H1 />`–`<H6 />`     | `<tui-h1>`–`<tui-h6>`    | Header text                               |
| `<Input />`           | `<tui-input>`            | Text input field                          |
| `<Separator />`       | `<tui-separator>`        | Horizontal or vertical line               |
| `<Slider />`          | `<tui-slider>`           | Value slider                              |
| `<Space />`           | `<tui-space>`            | Empty spacer                              |
| `<ToggleGroup />`     | `<tui-toggle-group>`     | Group of toggle options                   |

`Separator` has `.horizontal` and `.vertical` variants. `Slider` has `.horizontal` and `.vertical` variants.

### Containers

| Component         | Element             | Description                                       |
| ----------------- | ------------------- | ------------------------------------------------- |
| `<Box />`         | `<tui-box>`         | Box with optional border and padding              |
| `<Button />`      | `<tui-button>`      | Clickable button                                  |
| `<Collapsible />` | `<tui-collapsible>` | Toggle between `collapsed` and `expanded` content |
| `<Scrollable />`  | `<tui-scrollable>`  | Scrollable content region                         |
| `<Stack />`       | `<tui-stack>`       | Linear layout                                     |
| `<Text />`        | `<tui-text>`        | Text container (sets font, alignment, wrap)       |
| `<Style />`       | `<tui-style>`       | Inline text styles (bold, italic, etc.)           |

`Stack` has `.down`, `.up`, `.left`, and `.right` variants.

### Complex Containers

| Component               | Element                   | Description                       |
| ----------------------- | ------------------------- | --------------------------------- |
| `<Accordion />`         | `<tui-accordion>`         | Expandable section group          |
| `<Accordion.Section />` | `<tui-accordion-section>` | Section within an accordion       |
| `<Drawer />`            | `<tui-drawer>`            | Panel that slides in from an edge |
| `<Tabs />`              | `<tui-tabs>`              | Tabbed container                  |
| `<Tabs.Section />`      | `<tui-tabs-section>`      | Tab within tabs                   |
| `<Tree />`              | `<tui-tree>`              | Tree view with expandable nodes   |

`Drawer` has `.top`, `.right`, `.bottom`, and `.left` variants. Each accepts `content` and `drawer` props for the two panes.

### Intrinsic Elements

You can also use the `tui-` prefixed JSX elements directly:

```tsx
<tui-stack direction="down">
  <tui-box border="single" width={20}>
    <tui-text alignment="center">Hello</tui-text>
  </tui-box>
</tui-stack>
```

## Text Handling

React string literals are rendered as `TextLiteral` nodes, which are automatically grouped into `TextContainer`s for layout:

```tsx
<Stack.down>
  hello {/* TextLiteral → TextContainer #1 */}
  <Br /> {/* TextLiteral → TextContainer #1 */}
  <Box /> {/* Box breaks the text group */}
  goodbye {/* TextLiteral → TextContainer #2 */}
</Stack.down>
```

Use `<Text>` to control font, alignment, and word wrap. Use `<Style>` for inline formatting (bold, italic, etc.):

```tsx
<Text alignment="center" wrap>
  This is <Style bold>important</Style> text.
</Text>
```

## React Features

| Feature                                             | Status                                           |
| --------------------------------------------------- | ------------------------------------------------ |
| Hooks (`useState`, `useReducer`, `useEffect`, etc.) | ✅ Works                                         |
| Context (`useContext`, providers)                   | ✅ Works                                         |
| Refs (`useRef`, callback refs)                      | ✅ Works                                         |
| Suspense                                            | ✅ Supported (timeouts delegate to `setTimeout`) |
| Portals                                             | ⚠️ No-op (doesn't crash, but no portal behavior) |
| Error Boundaries                                    | Not yet supported                                |

## Tests

```bash
pnpm test          # run once
pnpm test:watch    # watch mode
```

Tests use [vitest](https://vitest.dev/) and cover:

- **`isSame.test.ts`** — Deep equality comparisons (primitives, arrays, Sets, Maps, Dates, objects, React fiber nodes)
- **`reconciler.test.ts`** — Rendering, child manipulation, text node grouping, updates, refs, unmount
- **`components.test.ts`** — All component wrappers render the correct view types; Drawer variants pass `content`/`drawer` props

## Architecture

```
@teaui/react
├── lib/
│   ├── index.ts              # Re-exports reconciler + components
│   ├── reconciler.ts         # react-reconciler host config, render(), run()
│   ├── isSame.ts             # Deep equality for prepareUpdate
│   ├── components.tsx         # Typed React wrappers + JSX IntrinsicElements
│   └── components/
│       └── TextReact.ts      # TextLiteral, TextContainer, TextProvider, TextStyle
├── tests/
│   ├── isSame.test.ts
│   ├── reconciler.test.tsx
│   └── components.test.tsx
└── vitest.config.ts
```

**`reconciler.ts`** implements the `react-reconciler` host config. It maps JSX element types to TeaUI view constructors in `createInstance`, manages the view tree via `appendChild`/`removeChild`/`insertBefore`, and applies prop updates via `commitUpdate` (which calls `view.update()`). Text string children become `TextLiteral` instances. The `prepareUpdate` function uses `isSame` to diff old and new props — if anything changed, `commitUpdate` passes the full new props to the view.

**`components/TextReact.ts`** defines the text rendering architecture. Adjacent `TextLiteral` nodes are grouped into a `TextContainer`, which handles layout. `TextProvider` (`<Text>`) sets text properties (font, alignment, wrap) for descendant text. `TextStyle` (`<Style>`) applies inline SGR styles without affecting layout properties.

## License

MIT
