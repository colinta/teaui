# @teaui/preact

Preact renderer for [TeaUI](https://github.com/colinta/teaui). Write fullscreen terminal UIs with Preact components, hooks, signals, and JSX.

## Install

```bash
pnpm install @teaui/core @teaui/preact preact
```

## Usage

```tsx
import {useReducer} from 'preact/hooks'
import {interceptConsoleLog} from '@teaui/core'
import {Box, Button, Stack, run} from '@teaui/preact'

interceptConsoleLog()

function App() {
  const [bang, addBang] = useReducer((s: string) => s + '!', '')

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

Creates a `Window` and `Screen`, renders the Preact element tree, and enters fullscreen mode.

```ts
const [screen, window, component, unmount] = await run(<App />)
```

Returns `[Screen, Window, ComponentChildren, unmount]`. Call `unmount()` to tear down the Preact tree.

### `render(screen, window, element)`

Lower-level alternative — mount a Preact element into an existing `Screen` and `Window`.

```ts
import {Screen, Window} from '@teaui/core'
import {render} from '@teaui/preact'

const window = new Window()
const [screen] = await Screen.start(window)
const unmount = render(screen, window, <App />)
```

Returns an `unmount()` function.

## Components

All components are typed wrappers around TeaUI core views. They accept the same props as the core constructors, with `children` mapped to Preact children.

### Views (leaf nodes)

| Component             | Element                  | Description                               |
| --------------------- | ------------------------ | ----------------------------------------- |
| `<Br />`              | `<tui-br>`               | Line break in text                        |
| `<Checkbox />`        | `<tui-checkbox>`         | Toggle checkbox                           |
| `<CollapsibleText />` | `<tui-collapsible-text>` | Text that truncates with expand/collapse  |
| `<ConsoleLog />`      | `<tui-console>`          | Displays intercepted `console.log` output |
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

String literals are rendered as `TextLiteral` nodes, which are automatically grouped into `TextContainer`s for layout:

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

## Preact Features

| Feature                                             | Status         |
| --------------------------------------------------- | -------------- |
| Hooks (`useState`, `useReducer`, `useEffect`, etc.) | ✅ Works       |
| Context (`useContext`, providers)                   | ✅ Works       |
| Refs (`useRef`, callback refs)                      | ✅ Works       |
| Signals (`@preact/signals`)                         | ✅ Compatible  |
| Error Boundaries                                    | Not yet tested |

## TypeScript Configuration

The package uses Preact's JSX transform. Your `tsconfig.json` should include:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

## Architecture

```
@teaui/preact
├── lib/
│   ├── index.ts              # Re-exports renderer + components
│   ├── preact.tsx             # Fake-DOM renderer, render(), run()
│   ├── components.tsx         # Typed Preact wrappers + JSX IntrinsicElements
│   └── components/
│       └── TextReact.ts      # TextLiteral, TextContainer, TextProvider, TextStyle
└── tsconfig.json
```

**`preact.tsx`** implements a custom DOM-like abstraction (`RendererElement`) that Preact renders into. Each `RendererElement` lazily creates its corresponding TeaUI view on first attach. Attribute changes are batched via microtask deferral — multiple `setAttribute` calls in the same synchronous block are committed together. Preact's `options.diffed` hook triggers `screen.render()` after each commit so updates appear on screen.

**`components.tsx`** provides typed Preact component wrappers for all TeaUI views. Each component maps its props to the corresponding `tui-` intrinsic element. The file also declares `preact.JSX.IntrinsicElements` so `tui-` elements can be used directly in JSX.

**`components/TextReact.ts`** defines the text rendering architecture. Adjacent `TextLiteral` nodes are grouped into a `TextContainer`, which handles layout. `TextProvider` (`<Text>`) sets text properties (font, alignment, wrap) for descendant text. `TextStyle` (`<Style>`) applies inline SGR styles without affecting layout properties.

## License

MIT
