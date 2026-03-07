# Plan: Revamp `apps/react/index.tsx` Demo for Asciinema Recording

The goal is to make the React demo showcase-worthy for an asciinema recording on the project's README home screen, with source code displayed alongside.

---

## 1. Restructure: Tabs at the Top

Move `<Tabs>` to be the outermost layout element (below a title bar). Each tab showcases a different feature category. Remove the Drawer wrapper (or move it to its own tab).

### Tab Layout

```
┌─────────────────────────────────────────────┐
│  TeaUI React Demo                           │
│ ┌──────┬────────┬────────┬─────────┬──────┐ │
│ │ YAML │ Digits │ Styles │ Widgets │ More │ │
│ ├──────┴────────┴────────┴─────────┴──────┤ │
│ │                                         │ │
│ │  (tab content)                          │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 2. Tab: YAML → JSON (Text Input Demo)

- `<Input>` with `multiline` and `wrap` for YAML input
- `useState` to bind the input value
- Parse the input as YAML (use `js-yaml` or `yaml` package)
- Pretty-print & syntax-highlight the result as JSON → output to a `<Text>` element with ANSI color using `<Style>` components
- Show parse errors inline in red
- Layout: side-by-side (`<Stack.right>`) — input on left, colored JSON output on right

---

## 3. Tab: Digits (Width × Height = Area)

- Two `<Slider>` controls: one for width, one for height
- `<Digits>` displays `{w} x {h} = {w*h}`
- Clean layout with labels

---

## 4. Tab: Text Styles (Bold/Italic/Underline/Strikethrough)

### 4a. Add `<TextStyle>` component to `@teaui/react` and `@teaui/preact`

The core `ToggleGroup` is already wrapped in both libraries. The demo in `apps/demos/components.ts` uses `bold()`, `italic()`, `underline()`, `strikeout()` from `@teaui/core` to create the B/I/U/S toggle labels.

**New feature**: Create a convenience component (or just use the pattern in the demo) that:
- Renders a `<ToggleGroup>` with B/I/U/S labels
- Exposes `selected` state as `{bold, italic, underline, strikethrough}` booleans
- Applies those styles to a companion `<Text>` or `<Style>` element

For the React and Preact libraries, add a `<FontStyle>` component:
- File: `packages/react/lib/components/FontStyle.tsx` (and preact equivalent)
- Props: `value: {bold?: boolean, italic?: boolean, underline?: boolean, strikethrough?: boolean}`, `onChange: (value) => void`
- Renders a `<ToggleGroup>` with styled B/I/U/S labels
- Export from `packages/react/lib/components.tsx` and `packages/preact/lib/components.tsx`

### 4b. Demo Tab

- `<FontStyle>` toggle group at top
- `<Input>` for sample text
- `<Text>` below showing the sample text with applied styles via `<Style bold={...} italic={...} ...>`

---

## 5. Tab: Widgets Showcase

A scrollable collection of existing components that don't have their own tab:
- `<Accordion>` with multiple sections
- `<Collapsible>` / `<CollapsibleText>`
- `<Progress>` bars at various values/themes
- `<Spinner>`
- `<Tree>` with nested data
- `<Checkbox>` group controlling visibility of progress bars
- Headers (`<H1>` through `<H6>`)

---

## 6. Tab: Drawer & Overlay Demo

- Preserve the existing left-side drawer/overlay demo
- Simple content with a button to toggle the drawer open/closed
- Demonstrates `<Drawer.left>` (or `.bottom`)

---

## 7. Additional Demo Ideas (Tab: More)

Pick 2-3 of these to fill out the demo:

- **Color Palette**: Show foreground/background color grid using `<Style foreground={color}>` — a miniature version of the colors demo
- **Buttons & Themes**: Grid of `<Button>` components with different themes (`primary`, `secondary`, etc.) and sizes
- **Scrollable List**: A `<Scrollable>` with many items, demonstrating scroll behavior
- **Console Log**: Toggle `<ConsoleLog>` visibility, with buttons that `console.log()` / `console.debug()` / `console.warn()` to show the intercepted output
- **Border Showcase**: `<Box>` components with each border style (`single`, `double`, `rounded`, `bold`, `dotted`, custom)

---

## 8. README Changes

- Add asciinema player embed (or gif) to the top of `README.md`
- Add source code snippet of `apps/react/index.tsx` (or link to it) below the recording
- Keep existing demos/screenshots below

---

## 9. Implementation Order

1. ✅ **Add `<FontStyle>` to `@teaui/react`** (`packages/react/lib/components/FontStyle.tsx`, export from `components.tsx`)
2. ✅ **Add `<FontStyle>` to `@teaui/preact`** (same pattern)
3. ✅ **Add `<Spinner>` and `<Progress>` to `@teaui/react` and `@teaui/preact`** (reconciler + component wrappers + JSX types)
4. ✅ **Add `<Tree>` to React reconciler** (note: Tree render/children don't work correctly with React elements yet — omitted from demo)
5. ✅ **Add `yaml` dependency** to `apps/react/package.json`
6. ✅ **Rewrite `apps/react/index.tsx`**:
   - Top-level Tabs structure
   - Tab 1: YAML → JSON (with syntax-highlighted output)
   - Tab 2: Digits (w × h = area)
   - Tab 3: Text Styles with `<FontStyle>`
   - Tab 4: Widgets showcase (Progress, Spinner, Headers, Accordion, Collapsible)
   - Tab 5: Drawer demo
   - Tab 6: More (borders, buttons, console log, color palette)
7. ✅ **Update `README.md`** with placeholder for asciinema embed and source link
8. ⬜ **Record asciinema** (manual step — run `asciinema rec` then navigate through tabs)

---

## 10. Files to Create/Modify

| File | Action |
|------|--------|
| `packages/react/lib/components/FontStyle.tsx` | **Create** — new `<FontStyle>` component |
| `packages/react/lib/components.tsx` | **Modify** — export `FontStyle` |
| `packages/react/lib/index.ts` | **Modify** — export `FontStyle` if needed |
| `packages/preact/lib/components/FontStyle.tsx` | **Create** — preact version |
| `packages/preact/lib/components.tsx` | **Modify** — export `FontStyle` |
| `apps/react/package.json` | **Modify** — add `yaml` dependency |
| `apps/react/index.tsx` | **Rewrite** — full demo revamp |
| `README.md` | **Modify** — add asciinema embed + source |
