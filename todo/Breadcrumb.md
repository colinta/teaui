# Breadcrumb Component

## Overview

A breadcrumb navigation component using ` ` powerline characters with
foreground/background colour tricks to create a polished breadcrumb trail.

## API

```ts
interface BreadcrumbItem {
  title: string
  onPress?: () => void
}

interface Props extends ContainerProps {
  items: BreadcrumbItem[]
  isActive?: boolean // default true — controls whether bg colours are shown and whether to use  (isActive) or  (inactive)
  palette?: {fg: Color, bg: Color}[]
}
```

## Rendering

### Active (default: `isActive: true`)

```
 🏠  Blog  Post Title 
 ^^^ background: bg-color1, foreground: fg-color1
    ^^^^^^^ background: bg-color2 - foreground of arrow is bg-color1, title is fg-color2
           ^^^^^^^^^^^^^ background: bg-color3 - foreground of arrow is bg-color2, title is fg-color3
```

- The `` separator uses the *previous* segment's bg as its **foreground** and the
  *next* segment's bg as its **background** — this creates the seamless arrow effect
- The final `` uses the last segment's bg as foreground and the default bg as background
- Colour palette should cycle through a set of harmonious terminal colours

### Inactive (`isActive: false`)

```
 🏠  Blog  Post Title
```

- No background colours — plain text with `` separators rendered in a muted style
- Useful for disabled/read-only states
- toggle with `isActive: true/false`

## Implementation Notes

- Extends `View` (no children — renders items directly)
- `naturalSize()` calculates total width from item titles + separator chars + padding
- Height is always 1
- Each item can have an `onPress` callback — register mouse regions per segment
- hover effect will need to be careful about the arrow, because it "overlaps"
- Colour assignment: use a default palette (configurable via props) that assigns
  colours to segments in order
- Consider accessibility: ensure sufficient contrast for text and separators
