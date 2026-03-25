# React template components

Most components accept common view props: `theme`, `heading`, `x/y`, `width/height`, `min/max*`, `padding`, `isVisible`, `flex`, `pin`, `debug`. Container components also accept `children`.

## Styling

- `theme` — sets default background colours for an intent: `primary`, `secondary`, `proceed`, `cancel`, `selected`, `plain`.
- `Style` — applies ANSI styles: `bold`, `dim`, `italic`, `strikeout`, `underline`, `inverse`, `foreground`, `background`.
- Example:
  ```tsx
  <Text theme="primary">
    hello{' '}
    <Style bold foreground="yellow">
      world
    </Style>
  </Text>
  ```

## Components

- `FontStyle` — bold/italic/underline/strikethrough picker. Props: `value`, `onChange`.
- `Br` — line break inside text. Props: none.
- `Text` — text block / text context. Props: `children`, `font?`, `alignment?`, `wrap?`, inline style props/colors.
- `Style` — inline text styling only. Props: `children`, inline style props/colors.
- `H1`-`H6` — headings. Props: `text?` or string `children`.
- `Box` — bordered container. Props: `children`, `border?`, `highlight?`, `title?`.
- `Pane` — split-pane layout. Props: `children`, `border?`, `collapsible?`.
- `Stack` — linear layout. Props: `children`, `direction?`, `fill?`, `gap?`. Helpers: `.down/.up/.left/.right`.
- `ZStack` — overlay children in the same area. Props: `children`, `location?`.
- `Scrollable` — scrollable stack. Props: `children`, `direction?`, `gap?`, `scrollable?`, `showScrollbars?`, `keepAtBottom?`, `contentSize?`. Helpers: `.down/.up/.left/.right`.
- `Geometry` — reports available size. Props: `children`, `onLayout?`.
- `Modal` — modal overlay. Props: `children`, `dim?`, `dimStyle?`, `dismissOnClick?`, `dismissOnEsc?`, `onDismiss?`.
- `Drawer` — slide-out panel. Props: `content?`, `drawer?`, `children`, `location?`, `isOpen?`, `onToggle?`, `hotKey?`, `title?`. Helpers: `.top/.right/.bottom/.left`.
- `Accordion` — expandable sections. Props: `children`, `multiple?`. `Accordion.Section`: `children`, `title?`, `isOpen?`.
- `Tabs` — tabbed sections. Props: `children`, `border?`. `Tabs.Section`: `children`, `title?`.
- `Page` — full-page section switcher. Props: `children`, `activeIndex?`, `onChange?`. `Page.Section`: `children`, `title?`.
- `Alert` — notification / modal alert. Props: `children`, `title?`, `purpose?`, `direction?`, `visible?`, `dim?`, `dismissOnEsc?`, `dismissOnClick?`, `onDismiss?`.
- `Callout` — inline notification. Props: `children`, `title?`, `purpose?`, `direction?`.
- `Button` — clickable action. Props: `children`, `title?`, `align?`, `border?`, `hotKey?`, `onClick?`.
- `Checkbox` — boolean toggle. Props: `title?`, `value`, `onChange?`, `hotKey?`.
- `ToggleGroup` — one-or-many segmented toggles. Props: `titles`, `selected`, `multiple?`, `padding?`, `direction?`, `onChange?`.
- `Dropdown<T>` — popup selector. Props: `choices`, `title?`, `multiple?`, `selected?`, `onSelect?`.
- `Input` — text input. Props: `value?`, `placeholder?`, `wrap?`, `multiline?`, `font?`, `onChange?`, `onSubmit?`.
- `Slider` — ranged input. Props: `direction?`, `border?`, `buttons?`, `range?`, `value?`, `step?`, `onChange?`. Helpers: `.horizontal/.vertical`.
- `Progress` — progress bar. Props: `direction?`, `min?`, `max?`, `value?`, `showPercent?`, `location?`.
- `Spinner` — activity indicator. Props: `isAnimating?`.
- `Logo` — animated TeaUI logo. Props: `isAnimating?`, `seed?`.
- `Space` — empty spacer. Props: `background?` (+ use `width` / `height`).
- `Separator` — divider line. Props: `direction`, `padding?`, `border?`. Helpers: `.horizontal/.vertical`.
- `Breadcrumb` — clickable breadcrumb trail. Props: `items`, `isActive?`, `palette?`.
- `Legend` — key legend / shortcut help. Props: `items`, `separator?`.
- `HotKey` — catches a specific shortcut around children. Props: `children`, `hotKey`, `onPress?`.
- `Keyboard` — fallback key handler. Props: `children`, `onKey?`.
- `Mouse` — fallback mouse handler. Props: `children`, `mouse?`, `onMouse?`.
- `Calendar` — date picker. Props: `date?`, `visibleDate?`, `onChangeVisible?`, `onChange?`, `selection?`, `firstDayOfWeek?`, `now?`.
- `Tree<T>` — simple expandable tree. Props: `title`, `data`, `render`, `getChildren?`.
- `ScrollableList<T>` — virtualized list. Props: `data`, `renderItem`, `filter?`, `rowHeight?`, `selectedIndex?`, `onSelect?`, `onHighlight?`, `isSelectable?`, `showSelected?`, `onSelectionChange?`.
- `Table<T>` — tabular data. Props: `data`, `columns`, `renderItem?`, `format?`, `selectedIndex?`, `onSelect?`, `onSort?`, `sortKey?`, `sortDirection?`, `showRowNumbers?`, `isSelectable?`, `showSelected?`, `onSelectionChange?`.
- `Canvas` — pixel-style drawing surface. Props: `draw?`.
- `Digits` — big segmented text / numbers. Props: `text`, `style?`, `bold?`.
- `Collapsible` — toggles between collapsed/expanded views. Props: `collapsed?`, `expanded?`, `isCollapsed?`, `showCollapsed?`.
- `CollapsibleText` — expandable multi-line text. Props: `text`, `style?`.
- `ConsoleLog` — console/log output view. Props: common view props only.
