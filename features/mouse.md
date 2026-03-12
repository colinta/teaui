# Mouse Component

**Non-focusable, fallback mouse event listener.**

## Purpose

Mouse wraps child views and receives mouse events for its visible area. Children that register for mouse events on the same pixels take priority, making this a natural fallback for unhandled regions.

## Design Decisions

### Uses existing mouse registration — no new infrastructure needed

Unlike Keyboard (which required a new fallback mechanism in FocusManager), Mouse works entirely with the existing `MouseManager.registerMouse()` system. The key insight: `registerMouse` overwrites previous registrations for the same pixel. Since render is recursive (parent before children), a parent's registration is overwritten by any child that claims the same pixel. Mouse simply registers on its entire visible area, and children naturally take priority.

### Default event set

By default, Mouse listens for `mouse.button.all`, `mouse.wheel`, and `mouse.move`. The `mouse` prop can restrict this to specific event types.

### Callback receives both MouseEvent and System

The `onMouse` callback receives `(event, system)` matching the signature of `View.receiveMouse()`. The `system` object provides access to focus management, which some mouse handlers need.

## Files

- `packages/core/lib/components/Mouse.ts` — Component
- `packages/react/lib/reconciler.ts` — `mouse` / `tui-mouse` element
- `packages/react/lib/components.tsx` — `<Mouse>` wrapper

## Usage

### Core

```ts
new Mouse({
  onMouse: (event, system) => {
    console.log(event.name, event.position)
  },
  children: [child1, child2],
})

// Listen only for wheel events
new Mouse({
  mouse: 'mouse.wheel',
  onMouse: event => {
    /* scroll handling */
  },
  children: [content],
})
```

### React

```tsx
<Mouse onMouse={(event, system) => console.log(event.name)}>
  {children}
</Mouse>

<Mouse mouse={['mouse.button.left', 'mouse.wheel']} onMouse={handler}>
  {children}
</Mouse>
```
