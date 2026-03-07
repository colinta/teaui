# Plan: Revamp `apps/react/index.tsx` Demo for Asciinema Recording

The goal is to make the React demo showcase-worthy for an asciinema recording on the project's README home screen, with source code displayed alongside.

---

## Current State

The demo (`apps/react/index.tsx`) has been rewritten. It's a tabbed showcase of TeaUI React components:

```
╭──────────────────────────────────────╮
│          ☕ TeaUI React Demo          │
│ ┌────────────┬────────┬─────┬──────┐ │
│ │ YAML→JSON  │ Digits │ ... │ More │ │
│ ├────────────┴────────┴─────┴──────┤ │
│ │  (tab content)                   │ │
│ └──────────────────────────────────┘ │
╰──────────────────────────────────────╯
```

### Tabs implemented

1. **YAML → JSON** — `<Input multiline>` bound via `useState`, parsed with `yaml` package, output rendered as syntax-highlighted JSON using `<Style>` components (value-traversal renderer, not regex). Errors shown in red. Side-by-side layout.
2. **Digits** — Two `<Slider>` controls (width/height), a `<Dropdown>` for border style, a `<Box>` sized by the sliders, and `<Digits>` showing `w × h = area`.
3. **Styles** — `<FontStyle>` component (B/I/U/S `<ToggleGroup>`) + `<Input>` for sample text + styled preview using `<Style bold={} italic={} underline={} strikeout={}>`.
4. **Widgets** — Scrollable showcase: `<Progress>` bars with themes, `<Spinner>` + checkbox, `<H1>`–`<H6>`, `<Accordion>`, `<Collapsible>`, `<CollapsibleText>`.
5. **Drawer** — `<Drawer.left>` with `hotKey="C-o"`, accordion menu inside the drawer.
6. **More** — Border styles (`<Box>` with each border), button variants/themes, `<ConsoleLog>` toggle with log/debug/warn buttons, color palette swatches.

### New components added to `@teaui/react` and `@teaui/preact`

- `<FontStyle>` — B/I/U/S toggle group (`packages/{react,preact}/lib/components/FontStyle.tsx`)
- `<Progress>` — progress bar wrapper
- `<Spinner>` — spinner wrapper
- `<Dropdown>` — dropdown selector (React only so far)

These were added to the reconciler (`createInstance` switch), component wrappers, and JSX intrinsic element type declarations in both libraries.

### New core features

- **Drawer hotkey support** — `hotKey` prop, `receiveKey()`, `registerHotKey()` in `packages/core/lib/components/Drawer.ts`

### README

- `README.md` has a new "React Demo" section at the top with a placeholder for the asciinema embed and a link to the source file.

---

## Remaining

- ⬜ **Record asciinema** — run `asciinema rec`, navigate through each tab, demonstrate interactive features
- ⬜ **Update README.md** — replace asciinema placeholder with actual embed
- ⬜ **`<Dropdown>` for Preact** — not yet added to preact reconciler/components
- ⬜ **`<Tree>` React compatibility** — added to reconciler but doesn't work with React elements (core Tree expects View instances for `render`/`titleView`). Omitted from demo.
