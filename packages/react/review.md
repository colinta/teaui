# @teaui/react — Code Review

## Summary

This package implements a React custom renderer using `react-reconciler` to bridge React components to TeaUI's native view tree. The implementation covers the basic host config but has several correctness bugs, missing reconciler features, and API design issues.

---

## 1. Critical Bugs

### 1.1 `isSame.ts` — String literal typo causes broken object comparison (line 75)

```ts
if ('$$typeof' in lhs || '$$typeof in rhs') {
```

The second condition is a **string literal**, not a property check — `'$$typeof in rhs'` is always truthy. This means **every plain object comparison** takes the FiberNode branch, which then destructures into `lhsTrim` and `rhsTrim` (undefined variables due to wrong destructuring names):

```ts
const {_owner: _lhsOwner, lhsTrim} = lhs   // lhsTrim is always undefined
const {_owner: _rhsOwner, rhsTrim} = rhs    // rhsTrim is always undefined
return isSame(lhsTrim, rhsTrim, depth + 1)  // isSame(undefined, undefined) → true
```

**Impact:** `prepareUpdate` will report no changes for any props that are plain objects, meaning object-valued prop updates are silently dropped. This is a data-loss bug.

**Fix:**
```ts
if ('$$typeof' in lhs || '$$typeof' in rhs) {
  const {_owner: _lhsOwner, ...lhsTrim} = lhs
  const {_owner: _rhsOwner, ...rhsTrim} = rhs
  return isSame(lhsTrim, rhsTrim, depth + 1)
}
```

### 1.2 `isSame.ts` — Spurious `return false` in final loop (lines 90–95)

```ts
for (const prop in rhs) {
  if (!Object.hasOwn(rhs, prop)) {
    continue
  }
  if (!Object.hasOwn(lhs, prop)) {
    return false
  }
  return false  // ← unconditional return on first own-prop!
}
```

The final `return false` is not inside the `if` block — it fires on the **first** own-property of `rhs` that also exists on `lhs`. This makes the function return `false` for almost any object with shared properties (but the bug in 1.1 masks this since it never reaches here for plain objects).

**Fix:** Remove the stray `return false`.

### 1.3 `isSame.ts` — Functions compared by reference (line 20)

```ts
typeof lhs === 'function'  // uses ===
```

Inline arrow functions in JSX (`onClick={() => ...}`) create new references every render. Comparing by `===` means `prepareUpdate` will always report a diff when any callback prop is present, triggering `commitUpdate` on every render even when nothing meaningful changed.

**Recommendation:** This is actually the _correct_ behavior for a reconciler (React itself does reference equality), but document that users should use `useCallback` to avoid unnecessary updates, or consider a prop-name-based filter to skip `on*` handlers in `prepareUpdate`.

---

## 2. Reconciler Host Config Issues

### 2.1 `getPublicInstance` throws instead of returning the instance (line ~385)

```ts
getPublicInstance(_instance: unknown) {
  throw new Error('Function not implemented.')
},
```

This is called when a user accesses a ref (`ref={myRef}`). Throwing here means **refs are completely broken**. Every `useRef` / `createRef` attached to a TeaUI element will crash.

**Fix:**
```ts
getPublicInstance(instance: View) {
  return instance
},
```

### 2.2 `getCurrentEventPriority` throws (line ~394)

This is called by React during event processing. If any event handling triggers a state update, this will crash. It should return a valid priority:

```ts
import {DefaultEventPriority} from 'react-reconciler/constants'
// ...
getCurrentEventPriority() {
  return DefaultEventPriority
},
```

### 2.3 `scheduleTimeout` / `cancelTimeout` throw instead of delegating (lines ~389–393)

React uses these for Suspense timeouts and internal scheduling. They should delegate to `setTimeout`/`clearTimeout`:

```ts
scheduleTimeout: setTimeout,
cancelTimeout: clearTimeout,
noTimeout: -1,
```

### 2.4 `preparePortalMount` throws (line ~388)

This prevents portals from working. Even if you don't want portal support, it should be a no-op rather than a crash:

```ts
preparePortalMount() {},
```

### 2.5 Missing `supportsMutation` flag

The reconciler config should explicitly set `supportsMutation: true`. Without this, the reconciler may not correctly call mutation methods (`appendChild`, `removeChild`, `commitUpdate`, etc.). This appears to work because `react-reconciler` may default to mutation mode, but it should be explicit.

### 2.6 `commitUpdate` ignores the `updatePayload` (line ~370)

```ts
commitUpdate(
  node: View,
  _updatePayload: [PropertyKey, any][],
  _type: string,
  _oldProps: Props,
  newProps: Props,
  _internalInstanceHandle: Object,
) {
  const {children, ...updates} = newProps as any
  node.update(updates)
},
```

The `prepareUpdate` returns `[]` (empty array) as a "changed" signal, but `commitUpdate` ignores it and passes all `newProps` through. This works but is wasteful — you could compute the actual changed props in `prepareUpdate` and only apply those in `commitUpdate`.

### 2.7 `createContainer` arguments may be outdated

```ts
const fiber = reconciler.createContainer(
  window, 0, null, false, null, '', () => {}, null,
)
```

The positional arguments are fragile and may break across `react-reconciler` versions. Consider using named options if the version supports it, or at minimum add comments explaining each argument.

---

## 3. Component Binding Issues

### 3.1 Header components (H1–H6) create non-updatable views (reconciler.ts lines 59–80)

```ts
case 'h1':
case 'tui-h1':
  return H1(((props as any).text as string) ?? '')
```

`H1()` etc. are factory functions that return a pre-built view. If the `text` prop changes, `commitUpdate` calls `node.update(updates)` — but the returned view may not support updating its text content. This means **header text cannot be dynamically updated after initial render**.

**Recommendation:** Either make `H1`–`H6` return views that support `.update({text})`, or create dedicated wrapper classes.

### 3.2 `useMemo` imported but unused (components.tsx line 1)

```ts
import React, {useMemo} from 'react'
```

`useMemo` is imported but never used anywhere in the file.

### 3.3 No `React.memo` on wrapper components

None of the exported component wrappers use `React.memo`. Since they're all simple pass-through components, wrapping them with `React.memo` would skip re-renders when props haven't changed:

```ts
export const Checkbox = React.memo(function Checkbox(reactProps: CheckboxProps) {
  return <tui-checkbox {...reactProps} />
})
```

### 3.4 No ref forwarding

None of the wrapper components use `forwardRef`. Users cannot get refs to the underlying TeaUI views (compounded by `getPublicInstance` throwing — see 2.1).

### 3.5 Drawer.bottom and Drawer.left don't pass `content`/`drawer` props (components.tsx)

```ts
Drawer.bottom = function DrawerLeft(reactProps) {
  const {children, ...props} = reactProps  // missing content, drawer destructuring
  return <tui-drawer location="bottom" {...props}>{children}</tui-drawer>
}
```

Compare with `Drawer.top` and `Drawer.right` which correctly destructure `content` and `drawer`. This is likely a copy-paste bug.

---

## 4. TextContainer / TextLiteral Architecture

### 4.1 TextContainer insertion heuristic is fragile

The `appendChild` function creates `TextContainer` wrappers implicitly:

```ts
let lastChild: View | undefined = parentInstance.children.at(-1)
// ...
if (lastChild instanceof TextContainer) {
  textContainer = lastChild
} else {
  textContainer = new TextContainer()
  parentInstance.add(textContainer)
}
```

This means the grouping of text nodes depends on insertion order. If React reorders children (e.g., via key changes), text nodes may end up in unexpected `TextContainer` groups. Consider tracking which `TextContainer` owns which logical group more explicitly.

### 4.2 `removeFromTextContainer` searches linearly

```ts
for (const node of container.children) {
  if (node instanceof TextContainer && node.children.includes(child)) {
```

This is O(n × m) where n = children count and m = TextContainer children count. For large text-heavy UIs, consider storing a back-reference from `TextLiteral` to its owning `TextContainer`.

---

## 5. Missing React Features

| Feature | Status | Priority |
|---------|--------|----------|
| Refs (`useRef`, `createRef`) | **Broken** (throws) | 🔴 Critical |
| Error Boundaries | Not supported | 🟡 Medium |
| Suspense | Crashes (timeout throws) | 🟡 Medium |
| Portals | Crashes (throws) | 🟢 Low |
| Concurrent Mode | Not tested | 🟢 Low |
| Context | Works (React-level, no host config needed) | ✅ |
| Hooks | Work (React-level) | ✅ |

---

## 6. API Design

### 6.1 `run()` returns before rendering completes

```ts
export async function run(component, options) {
  const window = new Window()
  const [screen, _] = await Screen.start(window, options)
  render(screen, window, component)
  return [screen, window, component]
}
```

The `render` call is synchronous but React's reconciliation is async. The returned `screen` may not reflect the initial render. Consider returning a promise that resolves after the first commit.

### 6.2 No `unmount` / cleanup API

There's no way to tear down the React tree. The reconciler should expose an unmount function:

```ts
export function unmount(fiber: FiberRoot) {
  reconciler.updateContainer(null, fiber, null, null)
}
```

### 6.3 Dual element names are undocumented

The reconciler accepts both `'box'` and `'tui-box'` for every element, but this isn't documented and the intrinsic elements only declare `tui-*` names. Either drop the short names or document them.

---

## 7. Type Safety

### 7.1 Pervasive `as any` casts

The `createInstance` function casts all props to `any`:

```ts
return new Checkbox(props as any)
```

This defeats TypeScript's type checking. The props should be properly typed per component, or at minimum validated at runtime.

### 7.2 `Props = {}` type is meaningless

```ts
type Props = {}
```

This empty type provides no type safety. Consider using `Record<string, unknown>` or component-specific prop types.

---

## Prioritized Recommendations

1. **Fix `isSame.ts` bugs** — The string literal typo and stray `return false` are correctness bugs that silently drop updates
2. **Implement `getPublicInstance`** — Refs are completely broken
3. **Implement `getCurrentEventPriority`** — Events will crash without this
4. **Delegate `scheduleTimeout`/`cancelTimeout`** — Needed for Suspense and internal React scheduling
5. **Fix Drawer.bottom/left** — Missing prop forwarding
6. **Add `forwardRef` to wrapper components** — Enable ref access to native views
7. **Add `unmount` API** — Enable cleanup
8. **Add `React.memo` to wrappers** — Reduce unnecessary re-renders
9. **Improve type safety** — Remove `as any` casts
10. **Document the `TextContainer` architecture** — The implicit text grouping is non-obvious
