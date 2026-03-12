# Page Component

## Overview

A paginated container similar to `Accordion` but shows one page at a time with
dot indicators. Follows the `Page > Page.Section` pattern (like
`Accordion > Accordion.Section` / `<Accordion.Section>` in React).

## API

```ts
// Core
interface PageProps extends ContainerProps {
  activeIndex?: number
  onChange?: (index: number) => void
}

interface SectionProps extends ContainerProps {
  title?: string // if any sections have a title, leave a space above the page selection for the title
}

// Page > Section relationship (same pattern as Accordion)
class Page extends Container {
  static Section: typeof Section
}
```

## Rendering

```


    (active page content)


    [title goes here]                // title changes on hover
        ●  ○  ○  ○
       ^^^ clickable area is 1x3
```

- Only the active section is rendered (fills available space)
- Dot indicators at the bottom: `●` for active, `○` for inactive
- Dots are clickable (mouse regions per dot, plus 1 padding on both sides)
- Optionally show the section title above or below the content

## Interaction

### Keyboard

- Space: next page
- Page Down: next page
- Page Up: previous page
- Home: first page
- End: last page
- Number keys (1-9): jump to page

### Mouse

- Click dots to jump to a page
- Scroll wheel to navigate pages (optional)

## Implementation Notes

- Follows `Accordion` pattern: `Page` is a `Container`, `Section` is a
  `Container` subclass that `Page` manages
- `addSection(title, content)` or `addSection(section)` API
- Only the active section participates in layout — others are hidden
- Dot indicator is rendered in the `render()` method after the content
- Natural size: max of all sections' natural sizes + 1 row for dots
- Animation: When navigating to a new page, animate the current page to the
  left/right and bring in the new page. During animation if another page is
  selected the new page needs to be "appended" to the animation.
  Example:
  on page 2, click page 3.
  page 2 view moves to the left, page 3 view moves in from the right
  _during the animation_
  click page 5: finish the page 3 animation then bring in page 5 (skip page 4)
  click page 1: interrupt the animation, bring in page 2 from the left (because
  it's still visible) and then bring in page 1.
