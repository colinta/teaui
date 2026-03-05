# @teaui/preact — Code Review

## Summary

This package implements a Preact renderer for TeaUI using a custom DOM-like abstraction (`RendererElement`) that tricks Preact into thinking it's rendering to a real DOM. While creative, this approach has significant correctness issues, a dangerous global mutation, and several gaps compared to the React sibling package.

---

## 1. Critical Issues

### 1.1 Global `document` mutation (preact.tsx line ~416)

```ts
Object.assign(global, {document: {}})
Object.assign(document, dom)
```

This **overwrites the global `document` object** with the custom renderer DOM. This means:

- Importing this module has global side effects
- It's incompatible with any other code that uses `document` (testing frameworks, other renderers, SSR utilities)
- It cannot be instantiated more than once
- The order of module imports matters — if anything reads `document` before this runs, it gets a different object

**Recommendation:** Use Preact's `options` hooks instead of faking a DOM. Preact's `options.__b` (before diff), `options.__c` (commit), `options.diffed`, `options.__r` (render), and `options.unmount` hooks allow intercepting the rendering pipeline without global mutations. Alternatively, use `preact-render-to-string`'s approach of a contained virtual DOM.

If keeping the fake-DOM approach, at minimum:
- Scope it to a module-local variable, not `global.document`
- Use `preact/compat`'s `render(vnode, container)` where `container` is your fake root element

### 1.2 No `screen.render()` call after commits (preact.tsx)

The React package calls `screen.render()` in `resetAfterCommit`:

```ts
// React reconciler.ts
resetAfterCommit() {
  rerender()  // calls screen.render()
},
```

The Preact package has **no equivalent**. After Preact commits changes to the view tree, the screen is never told to re-render. This means **UI updates don't appear on screen** unless something else triggers a render.

**Fix:** Hook into Preact's `options.diffed` or `options.__c` to call `screen.render()` after commits:

```ts
import {options} from 'preact'

const prevDiffed = options.diffed
options.diffed = (vnode) => {
  prevDiffed?.(vnode)
  screen.render()  // trigger terminal re-render
}
```

Or add it to the `_commit` method of `RendererElement`.

### 1.3 `import React from 'react'` in a Preact package (preact.tsx line 1)

```ts
import React from 'react'
```

This imports **React** into the Preact renderer. If the consumer's project doesn't have React installed (they chose Preact specifically), this will fail at import time. The JSX types should come from Preact, not React.

**Fix:** Remove the React import. Use Preact's JSX pragma:

```ts
import {h} from 'preact'
```

And ensure `tsconfig.json` has `"jsxFactory": "h"` or use `@jsxImportSource preact`.

### 1.4 `RendererElement._commit` uses microtask defer but has no batching

```ts
setAttribute(name: string, value: any) {
  if (this.node && !this.prevProps) {
    this.prevProps = Object.assign({}, this.props)
    defer(this._commit)  // Promise.resolve().then(...)
  }
  this.props[name] = value
}
```

The `defer` schedules a microtask to commit the update. But if multiple attributes are set in the same synchronous block (which Preact does), only the **first** `setAttribute` call schedules the commit — subsequent calls modify `this.props` but `this.prevProps` is already set so no new defer is needed. This is actually correct batching behavior.

**However**, the `_commit` calls `this.renderer.update(state, this.props)` which passes **all** props, not just changed ones. And the `update` renderer function does:

```ts
update(node, props) {
  if (node instanceof TextLiteral) {
    node.update(props)
    node.text = props.text ?? ''
  } else {
    node.update(props)
  }
},
```

This calls `node.update(props)` AND `node.text = props.text` for `TextLiteral`, causing a redundant double-update.

---

## 2. RendererElement Architecture Issues

### 2.1 Linked list is maintained but never traversed

`RendererElement` maintains a full doubly-linked list (`firstChild`, `lastChild`, `nextSibling`, `previousSibling`) that mirrors the DOM API. But the renderer never traverses this list — it only uses it to maintain insertion order for the `insertBefore` calls. This is unnecessary complexity.

### 2.2 `addEventListener` has a bug (preact.tsx line ~278)

```ts
addEventListener(event: any, func: any) {
  this.setAttribute(`on${event}`, (...args: any[]) =>
    (this as any).l[event + false](...args),
  )
}
```

This references `(this as any).l[event + false]` — a Preact internals hack that assumes Preact stores listeners on a `.l` property keyed by `event + false`. This is:

- Relying on Preact internal implementation details that may change between versions
- The `func` parameter is **never used** — it's captured by closure but the actual call goes through `.l`
- If Preact changes its listener storage format, all event handling silently breaks

**Recommendation:** Simplify to:

```ts
addEventListener(event: string, func: Function) {
  this.setAttribute(`on${event}`, func)
}
```

### 2.3 `removeAttribute` doesn't trigger a commit (preact.tsx line ~284)

```ts
removeAttribute(name: string) {
  delete this.props[name]
}
```

Unlike `setAttribute`, this doesn't schedule a `_commit`. Removing a prop (e.g., removing an event handler) will not propagate to the underlying TeaUI view until the next `setAttribute` call happens to trigger a commit.

**Fix:**
```ts
removeAttribute(name: string) {
  if (this.node && !this.prevProps) {
    this.prevProps = Object.assign({}, this.props)
    defer(this._commit)
  }
  delete this.props[name]
}
```

### 2.4 No `nodeType` property set correctly

```ts
nodeType = ''
```

Preact checks `nodeType` to determine if something is an element (`nodeType === 1`) or text node (`nodeType === 3`). Setting it to `''` may cause Preact to misidentify elements. `createElement` should set `nodeType = 1` and `createTextNode` should set `nodeType = 3`.

---

## 3. Comparison with React Package

### 3.1 The React package has features the Preact package lacks

| Feature | React Package | Preact Package |
|---------|--------------|----------------|
| Screen re-render after commit | ✅ `resetAfterCommit` | ❌ Missing |
| Prop diffing before update | ✅ `prepareUpdate` + `isSame` | ❌ Always full update |
| `children`/`child` prop filtering | ✅ Strips in `createInstance` | ❌ Passes through |
| Explicit reconciler API | ✅ `react-reconciler` | ❌ Fake DOM hack |

### 3.2 The Preact package has features the React package lacks

| Feature | React Package | Preact Package |
|---------|--------------|----------------|
| `TextLiteral` direct creation via type `'text'` | ❌ | ✅ `case 'text':` |
| `TextLiteral` via type `'literal'` | ❌ | ✅ `case 'literal':` |

### 3.3 Shared `TextReact.ts` is duplicated

`packages/preact/lib/components/TextReact.ts` and `packages/react/lib/components/TextReact.ts` are **identical** (442 vs 444 lines, diff would show nearly 100% overlap). This should be extracted to a shared package (e.g., `@teaui/renderer-common`) to avoid drift.

### 3.4 `components.tsx` is nearly identical

The Preact `components.tsx` is a copy of the React version with `JSX.Element` changed to `preact.JSX.Element` and types exported. The logic is identical. This should also be shared or generated.

### 3.5 Both packages have the same Drawer.bottom/left bug

Both `Drawer.bottom` and `Drawer.left` fail to destructure and pass `content` and `drawer` props, unlike `Drawer.top` and `Drawer.right`.

---

## 4. Component Binding Issues

### 4.1 `import React from 'react'` in `components.tsx` (line 1)

Same issue as in `preact.tsx` — imports React in a Preact package:

```ts
import React from 'react'
```

Should be removed or replaced with Preact's JSX source.

### 4.2 `useMemo` imported from `preact/hooks` but never used (line 2)

```ts
import {useMemo} from 'preact/hooks'
```

### 4.3 Props types are exported (good!) but JSX IntrinsicElements uses wrong module

```ts
declare module 'react' {
  namespace JSX {
```

This augments **React's** JSX namespace, not Preact's. Preact uses `preact.JSX`. The `preact.tsx` file correctly declares `preact.JSX.IntrinsicElements` but `components.tsx` also declares `react.JSX.IntrinsicElements`, creating confusion.

---

## 5. Missing Preact Features

| Feature | Status | Priority |
|---------|--------|----------|
| Screen re-render | **Missing** | 🔴 Critical |
| Signals (`@preact/signals`) | Not integrated | 🟡 Medium |
| Error Boundaries | Not tested | 🟡 Medium |
| `options` hooks integration | Not used | 🟡 Medium |
| Hydration | Not supported | 🟢 Low |
| Refs | Likely broken (no `getPublicInstance` equivalent) | 🟡 Medium |

---

## 6. API Design

### 6.1 `run()` renders before screen starts

```ts
export async function run(component, options) {
  const root = dom.createRoot()
  render(component, root as any)           // render first
  const window = root.node
  const [screen, _] = await Screen.start(window, options)  // then start screen
  return [screen, window, component]
}
```

Compare with the React package which starts the screen first, then renders. The Preact approach means the initial render happens before the screen exists, so any view that needs `screen` during mount (e.g., for size calculations) will fail.

### 6.2 No `unmount` API

Same as the React package — no way to tear down the Preact tree.

### 6.3 Return type says `Window` but returns `WrWindow`

```ts
): Promise<[Screen, Window, React.ReactNode]> {
```

The return type references `Window` (the browser global) but the actual value is `WrWindow` (TeaUI's Window class, imported as `WrWindow`). Also references `React.ReactNode` in a Preact package.

---

## 7. Performance

### 7.1 Every `setAttribute` clones props

```ts
this.prevProps = Object.assign({}, this.props)
```

This creates a shallow copy of all props on every first attribute change per commit cycle. For components with many props, this is wasteful. Consider tracking only changed prop names.

### 7.2 `_attach` creates view lazily but may be called multiple times

```ts
_attach() {
  return (this.node ||= this.renderer.create(this.localName, this.props))
}
```

This is fine for lazy creation, but if `this.props` changes between the first `_attach` call and subsequent ones, the node was created with stale props. The microtask commit will fix it, but there's a window of inconsistency.

---

## Prioritized Recommendations

1. **Remove global `document` mutation** — Use Preact's `options` hooks or scope the fake DOM locally
2. **Add screen re-render after commits** — UI updates don't display without this
3. **Remove `import React from 'react'`** — Use Preact's JSX source throughout
4. **Fix `removeAttribute` to trigger commits** — Prop removal is silently lost
5. **Fix `addEventListener`** — Don't rely on Preact internals (`.l` property)
6. **Set `nodeType` correctly** — `1` for elements, `3` for text nodes
7. **Fix `run()` order** — Start screen before rendering, matching React package
8. **Extract shared code** — `TextReact.ts` and component definitions should be in a shared package
9. **Fix Drawer.bottom/left** — Missing prop forwarding (same as React package)
10. **Fix JSX namespace declarations** — Use `preact.JSX`, not `react.JSX`
11. **Add `unmount` API** — Enable cleanup
12. **Consider migrating to Preact `options` hooks** — More robust than fake DOM approach
