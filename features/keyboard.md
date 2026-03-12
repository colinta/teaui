# Keyboard Component

**Non-focusable, fallback key event listener.**

## Purpose

Keyboard wraps child views and receives key events that aren't consumed by hotkeys or a focused child. It fills the gap between HotKey (matches specific keys) and focusable views (Input, Button) — a general-purpose "catch-all" for keyboard input.

## Design Decisions

### Fallback semantics, not capture

Keyboard does **not** intercept events before children. The priority order is:

1. **HotKeys** — matched first by FocusManager
2. **Focused view** — receives the event via `receiveKey()`
3. **Keyboard fallback** — only if no hotkey matched and no view has focus

This was chosen so that Keyboard can wrap a region containing Inputs and HotKeys without interfering with their behavior. When nothing is focused, the Keyboard gets everything.

### Innermost wins

When multiple Keyboard views are nested, the innermost (last registered during render) receives the event. This follows the principle that the most specific wrapper should handle the event. Registration order is naturally determined by render traversal — parents render before children.

### Implementation

- `FocusManager` gained a `#keyboardListeners: View[]` array, reset each render cycle
- `Viewport.registerKeyboard()` → `Screen.registerKeyboard()` → `FocusManager.registerKeyboard()`
- `FocusManager.trigger()` falls through to `keyboardListeners[last]` when no hotkey matches and no focused view exists
- The component itself is a Container that calls `viewport.registerKeyboard()` in `render()` and forwards `receiveKey` to an `onKey` callback

### No "consumed" tracking

The current event system has no concept of an event being "consumed" — `receiveKey()` returns void. This means if a focused view exists, it always gets the event, even if it doesn't handle it. Keyboard fallback only fires when there is **no focused view at all**. Adding consumed/bubbling semantics would be a larger architectural change.

## Files

- `packages/core/lib/components/Keyboard.ts` — Component
- `packages/core/lib/managers/FocusManager.ts` — `registerKeyboard()`, fallback dispatch in `trigger()`
- `packages/core/lib/Viewport.ts` — `registerKeyboard()`
- `packages/core/lib/Screen.ts` — `registerKeyboard()`
- `packages/react/lib/reconciler.ts` — `keyboard` / `tui-keyboard` element
- `packages/react/lib/components.tsx` — `<Keyboard>` wrapper

## Usage

### Core

```ts
new Keyboard({
  onKey: event => {
    console.log(event.name)
  },
  children: [child1, child2],
})
```

### React

```tsx
<Keyboard onKey={event => console.log(event.name)}>{children}</Keyboard>
```
