# Legend Component

## Overview

A hotkey legend that formats keyboard shortcuts nicely. Commonly placed at the
bottom of a screen to show available actions. 'key' accepts named keys, and maps
those to key sigils. Example 'enter' → '⤦', 'up' → '↑', 'down' → '↓', 'cmd' →
'⌘', etc.

## API

```ts
interface LegendItem {
  key: string | string[] // e.g. '⤦'|'enter', '⌘S' | ['cmd', 'S'], 'q', 'Ctrl+C' | ['ctrl', 'C']
  label: string // e.g. 'Select', 'Save', 'Quit'
}

interface Props extends ViewProps {
  items: LegendItem[]
  separator?: string // default '  ' (double space) or '│'
}
```

## Rendering

### Inline (default)

```
 ⤦ Select   ↑↓ Navigate   ⌃q Quit   ? Help   ␛ Cancel
```

- Key rendered in bold/highlighted style
- Label in normal/dim style
- Items separated by `separator`

### Wrap

Wraps as necessary, aligns columns

```
 ⤦ Select   ↑↓ Navigate  ⌃q Quit
 ? Help     ⌘S Save       ␛ Cancel
```

## Implementation Notes

- Extends `View` — no children, renders directly
- `naturalSize()`: calculate total width of all items + separators that fit in the given width, calculate height from that.
- Key styling: make the key stand out from the label

## Example

```tsx
<Stack.right padding={{left: 1, right: 1}}>
  <Style foreground="#d58684">q</Style>
  <Style foreground="gray"> quit</Style>
  <Style foreground="gray">{'   '}</Style>
  <Style foreground="#70be9b">↑↓</Style>
  <Style foreground="gray"> navigate</Style>
  <Style foreground="gray">{'   '}</Style>
  <Style foreground="#70a2d1">Tab</Style>
  <Style foreground="gray"> switch panel</Style>
  <Style foreground="gray">{'   '}</Style>
  <Style foreground="#ffa735">1-9</Style>
  <Style foreground="gray"> jump</Style>
  <Style foreground="gray">{'   '}</Style>
  <Style foreground="#d58684">d</Style>
  <Style foreground="gray"> dismiss</Style>
  <Style foreground="gray">{'   '}</Style>
  <Style foreground="gray" dim>
    Esc
  </Style>
  <Style foreground="gray" dim>
    {' '}
    list
  </Style>
</Stack.right>
```
