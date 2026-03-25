# Core API components

Most components use `new Component(props)`. Common view props: `theme`, `heading`, `x/y`, `width/height`, `min/max*`, `padding`, `isVisible`, `flex`, `pin`, `debug`. Container components also accept `child?` / `children?`.

## Styling

- `theme` — sets default background colours for an intent: `primary`, `secondary`, `proceed`, `cancel`, `selected`, `plain`.
- `Style` — ANSI styling is done with `new Style({...})`: `bold`, `dim`, `italic`, `strikeout`, `underline`, `inverse`, `foreground`, `background`.
- Example:
  ```ts
  new Text({
    text: 'hello world',
    theme: 'primary',
    style: new Style({bold: true, foreground: 'yellow'}),
  })
  ```

## Components

- `Text` — renders text. Props: `text?` or `lines`, `style?`, `alignment?`, `wrap?`, `font?`.
- `Header` — boxed section heading. Props: `text`, `border`, `font?`, `bold?`, `dim?`.
- `Box` — bordered container. Props: `child?`/`children?`, `border?`, `highlight?`, `title?`.
- `Window` — fill-the-screen root container. Props: `child?`/`children?`.
- `Pane` — split-pane layout. Props: `child?`/`children?`, `border?`, `collapsible?`.
- `Stack` — linear layout. Props: `child?`/`children?`, `direction?`, `fill?`, `gap?`. Helpers: `Stack.down/up/left/right(...)`.
- `ZStack` — overlays children. Props: `child?`/`children?`, `location?`.
- `Scrollable` — scrollable stack. Props: `child?`/`children?`, `direction?`, `gap?`, `scrollable?`, `showScrollbars?`, `keepAtBottom?`, `contentSize?`. Helpers: `Scrollable.down/up/left/right(...)`.
- `Geometry` — reports available size. Props: `child?`/`children?`, `onLayout?`.
- `Modal` — modal overlay. Props: `child?`/`children?`, `dim?`, `dimStyle?`, `dismissOnClick?`, `dismissOnEsc?`, `onDismiss?`.
- `Drawer` — slide-out panel. Props: `content?`, `drawer?`, `child?`/`children?`, `location?`, `isOpen?`, `onToggle?`, `hotKey?`, `title?`.
- `Accordion` — expandable sections. Props: `child?`/`children?`, `multiple?`. `Accordion.Section`: `title?`, `isOpen?`, `child?`/`children?`.
- `Tabs` — tabbed sections. Props: `child?`/`children?`, `border?`. `Tabs.Section`: `title?`, `child?`/`children?`.
- `Page` — animated page/section switcher. Props: `child?`/`children?`, `activeIndex?`, `onChange?`. `Page.Section`: `title?`, `child?`/`children?`.
- `Alert` — notification / modal alert. Props: `child?`/`children?`, `title?`, `purpose?`, `direction?`, `visible?`, `dim?`, `dismissOnEsc?`, `dismissOnClick?`, `onDismiss?`.
- `Callout` — inline notification. Props: `child?`/`children?`, `title?`, `purpose?`, `direction?`.
- `Button` — clickable action. Props: `child?`/`children?`, `title?`, `align?`, `border?`, `hotKey?`, `onClick?`.
- `Checkbox` — boolean toggle. Props: `title?`, `value`, `onChange?`, `hotKey?`.
- `ToggleGroup` — one-or-many segmented toggles. Props: `titles`, `selected`, `multiple?`, `padding?`, `direction?`, `onChange?`.
- `Dropdown<T>` — popup selector. Props: `choices`, `title?`, `multiple?`, `selected?`, `onSelect?`.
- `Input` — text input. Props: `value?`, `placeholder?`, `wrap?`, `multiline?`, `font?`, `onChange?`, `onSubmit?`.
- `Slider` — ranged input. Props: `direction?`, `border?`, `buttons?`, `range?`, `value?`, `step?`, `onChange?`. Helpers: `Slider.horizontal/vertical(...)`.
- `Progress` — progress bar. Props: `direction?`, `min?`, `max?`, `value?`, `showPercent?`, `location?`.
- `Spinner` — activity indicator. Props: `isAnimating?`.
- `Logo` — animated TeaUI logo. Props: `isAnimating?`, `seed?`.
- `Space` — empty spacer. Props: `background?` (+ usually `width` / `height`). Helpers: `Space.horizontal(...)`, `Space.vertical(...)`.
- `Separator` — divider line. Props: `direction`, `padding?`, `border?`. Helpers: `Separator.horizontal(...)`, `Separator.vertical(...)`.
- `Breadcrumb` — clickable breadcrumb trail. Props: `items`, `isActive?`, `palette?`.
- `Legend` — key legend / shortcut help. Props: `items`, `separator?`.
- `HotKey` — catches a specific shortcut around children. Props: `child?`/`children?`, `hotKey`, `onPress?`.
- `Keyboard` — fallback key handler. Props: `child?`/`children?`, `onKey?`.
- `Mouse` — fallback mouse handler. Props: `child?`/`children?`, `mouse?`, `onMouse?`.
- `Calendar` — date picker. Props: `date?`, `visibleDate?`, `onChangeVisible?`, `onChange?`, `selection?`, `firstDayOfWeek?`, `now?`.
- `Tree<T>` — expandable tree. Props: `titleView`, `data`, `render`, `getChildren?`.
- `ScrollableList<T>` — virtualized list. Props: `data`, `renderItem?`, `filter?`, `showScrollbars?`, `keepAtBottom?`.
- `Table<T>` — sortable/selectable table. Props: `data`, `columns`, `format`, `selectedIndex?`, `onSelect?`, `onSort?`, `sortKey?`, `sortDirection?`, `showRowNumbers?`, `isSelectable?`, `showSelected?`, `onSelectionChange?`.
- `Canvas` — pixel-style drawing surface. Props: `draw?`.
- `Digits` — big segmented text / numbers. Props: `text`, `style?`, `bold?`.
- `Collapsible` — toggles between collapsed/expanded views. Props: `collapsed?`, `expanded?`, `isCollapsed?`, `showCollapsed?`.
- `CollapsibleText` — expandable multi-line text. Props: `text`, `style?`.
- `Log` — log viewer container. Props: common view props only.
- `ConsoleLog` — live console/log output view. Props: common view props only.
- `Plot` — chart host; add/remove `Chart` instances. Props: `title?`, `xAxisLabels?`, `yAxisLabels?`, `showAxes?`.
- `Chart<T>` — abstract plot series base. Constructor: `new Subclass(data, {style?, ...viewProps})`.
- `LineChart<T>` — line series for `Plot`. Constructor: `new LineChart(data, {extract, xLabels?, yLabels?, style?, ...viewProps})`.
- `BarChart<T>` — bar series for `Plot`. Constructor: `new BarChart(data, {extract, xLabels?, yLabels?, barWidth?, gap?, style?, ...viewProps})`.
- `TrackMouse` — utility wrapper that shows mouse coordinates around content. Props: `content`.
