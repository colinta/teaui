# Writing TeaUI applications

TeaUI builds fullscreen terminal applications with either React/JSX or the direct object-oriented Core API. Read the [concepts](https://colinta.github.io/teaui/docs/concepts) before making architectural changes, and use the [Core API guide](https://colinta.github.io/teaui/docs/core-api) or [React reconciler guide](https://colinta.github.io/teaui/docs/reconciler) for the chosen API.

## Create an application

Prefer `@teaui/cli`; do not hand-build project scaffolding unless the application must be added to an existing project.

### React application (preferred)

```bash
pnpm dlx @teaui/cli create my-app --framework react
cd my-app
pnpm install
pnpm start
```

The generated project includes React, TypeScript, `@teaui/core`, and `@teaui/react`. Build the interface with components from `@teaui/react`, keep application state in normal React hooks, and call `run(<App />)` once at the entry point. Call `interceptConsoleLog()` before `run()` so writes to stdout do not corrupt the fullscreen UI.

### Core/OOP application

Use the non-React template only when direct ownership of the view tree is useful:

```bash
pnpm dlx @teaui/cli create my-app --framework none
cd my-app
pnpm install
pnpm start
```

Create `View` instances from `@teaui/core`, compose them under a `Window`, and start the application with `Screen.start()`.

### Add React TeaUI to an existing project

Install the runtime packages and React types:

```bash
pnpm add @teaui/core @teaui/react react
pnpm add -D @types/react typescript
```

Use a TypeScript configuration with JSX enabled and an entry point like this:

```tsx
import React from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {Box, Button, Stack, Text, run} from '@teaui/react'

interceptConsoleLog()

function App() {
  return (
    <Box border="single" padding={1}>
      <Stack.down gap={1}>
        <Text>Hello, TeaUI!</Text>
        <Button onClick={() => console.info('Clicked')}>Continue</Button>
      </Stack.down>
    </Box>
  )
}

run(<App />)
```

Import extension React components from their `/react` subpath; importing that module also registers the component with the reconciler. For example, use `import {Image} from '@teaui/image/react'`, not `@teaui/image`.

## Application conventions

- Use `Stack` for primary layout, `Box` for borders and insets, and `Text`/`Style` for text rather than manually positioning terminal characters.
- Use React props and state to update React applications; do not mutate the underlying Core view tree behind the reconciler.
- Use refs only for imperative component APIs such as focus or selection.
- Give flexible content `flex="flex1"` and set explicit dimensions only when the design requires them.
- Use component callbacks for keyboard and mouse interactions before adding raw `Keyboard`, `Mouse`, or screen-level handlers.
- Keep ordinary `console.*` output intercepted while the screen is active.

## Component catalog

Core/OOP components are exported by `@teaui/core`. Most have React wrappers with the same name in `@teaui/react`; exceptions such as charts and low-level utilities are documented on their component pages.

### Layout and positioning

- [Align](https://colinta.github.io/teaui/docs/components/align) — Use for column-aligned rows such as labels paired with values.
- [Align.Row](https://colinta.github.io/teaui/docs/components/align) — Use to define one row whose cells align with sibling rows.
- [At](https://colinta.github.io/teaui/docs/components/at) — Use to anchor content to an edge, corner, or center of available space.
- [Box](https://colinta.github.io/teaui/docs/components/box) — Use to wrap content with a border, title, background, or padding.
- [Geometry](https://colinta.github.io/teaui/docs/components/geometry) — Use when rendering decisions depend on the available terminal dimensions.
- [Pane](https://colinta.github.io/teaui/docs/components/pane) — Use for resizable and collapsible index/detail split panes.
- [Scrollable](https://colinta.github.io/teaui/docs/components/scrollable) — Use when content can exceed its visible region and should scroll.
- [Space](https://colinta.github.io/teaui/docs/components/space) — Use for fixed or flexible empty space between components.
- [Stack](https://colinta.github.io/teaui/docs/components/stack) — Use for the primary horizontal or vertical layout of children.
- [Window](https://colinta.github.io/teaui/docs/components/window) — Use as the root container for a Core/OOP application.
- [ZStack](https://colinta.github.io/teaui/docs/components/zstack) — Use to overlay children in the same region.

### Text, status, and display

- [Badge](https://colinta.github.io/teaui/docs/components/badge) — Use for compact status, tag, or category labels.
- [Callout](https://colinta.github.io/teaui/docs/components/callout) — Use for an inline notification that should remain in the layout.
- [CollapsibleText](https://colinta.github.io/teaui/docs/components/collapsible-text) — Use for long text that users can expand from a one-line summary.
- [Digits](https://colinta.github.io/teaui/docs/components/digits) — Use for prominent large-format numbers or short text.
- [H1–H6 / Header](https://colinta.github.io/teaui/docs/components/header) — Use for section headings with level-appropriate emphasis.
- [Legend](https://colinta.github.io/teaui/docs/components/legend) — Use for a manually supplied list of available keyboard shortcuts.
- [AutoLegend](https://colinta.github.io/teaui/docs/components/legend) — Use for a shortcut legend derived automatically from active hotkeys.
- [Logo](https://colinta.github.io/teaui/docs/components/logo) — Use when the animated TeaUI logo belongs in branding or an introduction.
- [Progress](https://colinta.github.io/teaui/docs/components/progress) — Use to show determinate completion toward a known total.
- [Separator](https://colinta.github.io/teaui/docs/components/separator) — Use to divide adjacent regions visually.
- [Spinner](https://colinta.github.io/teaui/docs/components/spinner) — Use to show indeterminate work in progress.
- [Text](https://colinta.github.io/teaui/docs/components/text) — Use for styled, aligned, or wrapped text content.

### Input and interaction

- [Breadcrumb](https://colinta.github.io/teaui/docs/components/breadcrumb) — Use for clickable navigation through a hierarchical location.
- [Button](https://colinta.github.io/teaui/docs/components/button) — Use to trigger an explicit user action.
- [Calendar](https://colinta.github.io/teaui/docs/components/calendar) — Use to select a date or date range.
- [Checkbox](https://colinta.github.io/teaui/docs/components/checkbox) — Use for an independently selectable boolean option.
- [Dropdown](https://colinta.github.io/teaui/docs/components/dropdown) — Use to choose one or more values from a compact popup list.
- [FontStyle](https://colinta.github.io/teaui/docs/components/font-style) — Use to let users choose bold, italic, underline, and strikethrough styles.
- [HotKey](https://colinta.github.io/teaui/docs/components/hotkey) — Use to register a focused-independent keyboard shortcut.
- [Input](https://colinta.github.io/teaui/docs/components/input) — Use to edit single-line or multiline text.
- [Keyboard](https://colinta.github.io/teaui/docs/components/keyboard) — Use for fallback raw key handling around child content.
- [Mouse](https://colinta.github.io/teaui/docs/components/mouse) — Use for fallback raw mouse handling around child content.
- [Radio](https://colinta.github.io/teaui/docs/components/radio) — Use for a boolean choice presented with radio-style marks.
- [Slider](https://colinta.github.io/teaui/docs/components/slider) — Use to choose a numeric value from a bounded range.
- [Toggle](https://colinta.github.io/teaui/docs/components/toggle) — Use for an immediately applied on/off setting.
- [ToggleGroup](https://colinta.github.io/teaui/docs/components/toggle-group) — Use for one-or-many selection among a small visible set of options.

### Organization, navigation, and overlays

- [Accordion](https://colinta.github.io/teaui/docs/components/accordion) — Use to organize content into expandable sections.
- [Accordion.Section](https://colinta.github.io/teaui/docs/components/accordion) — Use for one titled region inside an accordion.
- [Alert](https://colinta.github.io/teaui/docs/components/alert) — Use for a modal message requiring immediate attention.
- [Collapsible](https://colinta.github.io/teaui/docs/components/collapsible) — Use to switch between compact and expanded representations of content.
- [Drawer](https://colinta.github.io/teaui/docs/components/drawer) — Use for a panel that opens from an edge over or beside primary content.
- [Modal](https://colinta.github.io/teaui/docs/components/modal) — Use for custom blocking dialogs and temporary overlays.
- [Page](https://colinta.github.io/teaui/docs/components/page) — Use for sequential full-region sections with page indicators.
- [Page.Section](https://colinta.github.io/teaui/docs/components/page) — Use for one view within a paginated page container.
- [ScrollableList](https://colinta.github.io/teaui/docs/components/scrollable-list) — Use for efficient navigation and selection in a large list.
- [Table](https://colinta.github.io/teaui/docs/components/table) — Use for sortable, navigable rows of columnar data.
- [Tabs](https://colinta.github.io/teaui/docs/components/tabs) — Use to switch among a small set of peer views.
- [Tabs.Section](https://colinta.github.io/teaui/docs/components/tabs) — Use for one titled view within a tab set.
- [Tree](https://colinta.github.io/teaui/docs/components/tree) — Use to browse expandable hierarchical data.

### Drawing and charts

- [BarChart](https://colinta.github.io/teaui/docs/components/charts) — Use to compare discrete values with bars.
- [Canvas](https://colinta.github.io/teaui/docs/components/canvas) — Use for custom pixel-level drawings with Braille resolution.
- [LineChart](https://colinta.github.io/teaui/docs/components/charts) — Use to show trends across ordered numeric points.
- [Plot](https://colinta.github.io/teaui/docs/components/charts) — Use to compose charts with shared axes, labels, and a title.

### Debugging

- [ConsoleLog](https://colinta.github.io/teaui/docs/components/log) — Use to display intercepted `console.*` output inside the application.
- [Log](https://colinta.github.io/teaui/docs/components/log) — Use to display structured log entries supplied by the application.
- [TrackMouse](https://colinta.github.io/teaui/docs/components/track-mouse) — Use while debugging layout bounds, terminal coordinates, and mouse movement.

### React-only helpers

- [Br](https://colinta.github.io/teaui/docs/components/text) — Use to insert an explicit line break among React text children.
- [Style](https://colinta.github.io/teaui/docs/components/text) — Use to apply inline color and emphasis within React text.

### Extension packages

Install extension packages separately. For React use their `/react` exports; for the Core/OOP API use the view class from the package root.

- [Code](https://colinta.github.io/teaui/docs/components/code) — Use to display syntax-highlighted source code.
- [Image](https://colinta.github.io/teaui/docs/components/image) — Use to render an image file or buffer as colored terminal cells.
- [Subprocess](https://colinta.github.io/teaui/docs/components/subprocess) — Use to embed an interactive terminal subprocess inside the application.
