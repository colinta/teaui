# Split Component

## Overview

For common index/detail applications. Typically the list of items is on the left, and detail view is on the right, but that's up to the user.

Left pane is scrollable and collapsible. If more than two children are added, the last one is considered "detail" and the rest are collapsible.

## API

The first N-1 children are the "Browsers". Each is given a draggable size. The last child is the "Detail" and takes up the remaining space.

```ts
interface Props extends ContainerProps {
  border?: boolean  // optional border
}
```

## Rendering

```
╭───────┰──────────────────────────────╮
│Item 1 ┃                              │
│Item 2 ┃                              │
│Item 3 ┃       Detail View            │
│Item 4 ┃                              │
│Item 5 ┃                              │
│Item 6 ┃                              │
╰───────┸──────────────────────────────╯
        ^ draggable and clickable

// border is optional
Item 1 ┃
Item 2 ┃
Item 3 ┃       Detail View
Item 4 ┃
Item 5 ┃
Item 6 ┃

// collapsed view
╓──────────────────────────────────────╮
║                                      │
║                                      │
║            Detail View               │
║                                      │
║                                      │
║                                      │
╙──────────────────────────────────────╯
^ collapsed
```

## Interaction

The separator can be clicked to collapse it, or dragged. It switches to "double bars" when collapsed.
