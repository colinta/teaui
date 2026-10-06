# Alignment points and relative placement

Status: implemented (v1). User docs: `apps/docs/docs/components/alignment.mdx`.

### Implementation notes

- Core: `packages/core/lib/alignment.ts` (points, coordinates, context,
  `AlignmentError`), `components/Alignment.ts`, `components/Placement.ts`, and
  `components/AlignmentScope.ts` (resolver). React: `useAlignment`,
  `<Alignment>`, `<Placement>`, `<AlignmentScope>`.
- The measurement gate was met with render-based probing: `Viewport._probe()`
  derives a layout viewport that keeps the real transforms/clipping;
  `viewport.isProbe` is public so custom views can skip side effects. `View`'s
  render wrapper restores committed geometry after a probe; `Geometry` skips
  `onLayout`. No explicit layout hook was needed.
- `Viewport._registerFocus` and `_registerKeyTap` now respect layout mode. They
  previously registered external focus/key listeners during layout passes (a
  probed key listener fired twice).
- Owners are found by walking up from a point's mounted publisher, not by
  walking the scope's tree; this also detects cross-scope use.
- `Stack.left`/`Stack.up` with `gap` placed the gap after the second child
  instead of between each child (`C BA`). Fixed, since marker flow positions
  depend on it.
- The existing text-alignment type `Alignment` (`'left' | 'right' |
'center'`) was renamed to `TextAlignment` to free the name. This is a
  breaking change for code importing that type.
- Unavailable reasons are exposed as `AlignmentScope.unavailablePoints`:
  `'unmounted'`, `'hidden'`, or `'not-rendered'`.
- Known limitation: a marker rendered into an empty viewport by a collapsed
  container that still renders its children (rather than skipping them)
  publishes that container's origin.

## Goal

Let one part of a view tree expose a position that another part can use for
layout, without `Geometry` callbacks, shared numeric state, or a frame of lag.

The motivating case is a group of differently sized, right-aligned cards. Main
content should end before the left edge of the widest card, automatically
reflowing when either card or the terminal changes size.

This is **rectangular layout relative to named points**, not text flowing around
arbitrary obstacles. The main content reserves the same width for its entire
height, as in the original example.

## Recommended API

Introduce three components:

| Component        | Responsibility                                                      |
| ---------------- | ------------------------------------------------------------------- |
| `Alignment`      | A zero-sized, nonvisual marker that publishes a point.              |
| `Placement`      | Positions and sizes children using symbolic edge coordinates.       |
| `AlignmentScope` | Owns the coordinate space and resolves dependencies before drawing. |

Use `Alignment`, rather than `Aligment`, for the public spelling.

### Core example

```ts
const alignTL = new Alignment({name: 'cards-top-left'})

const box1 = new Box({child: new Text({text: 'box1'})})
const box2 = new Box({child: new Text({text: 'box2222'})})

const boxes = Stack.down([
  alignTL,
  // Each row keeps its box right-aligned without stretching the box itself.
  Stack.left([box1]),
  Stack.left([box2]),
])

const card = Stack.down([
  new Text({
    text: 'This content wraps before the widest card.',
    wrap: true,
  }),
  // ...other main content...
])

const container = new AlignmentScope({
  children: [
    new Placement({
      left: 0,
      right: alignTL.left.minus(1),
      child: card,
    }),
    At.topRight([boxes]),
  ],
})
```

`At.topRight` is the current corner-pinning API. The existing `Align` component
aligns columns across rows and does not need to change for this feature.

`Stack.down` already measures its width as the maximum child width. Placing the
marker at the start of that stack gives the desired boundary automatically;
there is no need to explicitly compare the cards' widths.

The consumer deliberately appears before the producer above. Declaration order
controls painting, not dependency resolution.

### A single pin versus stretching

Keep the distinction explicit:

```ts
// Natural width, capped by the space before the point, then right-aligned.
new Placement({right: alignTL.left.minus(1), child: card})

// Allocate the whole interval from x=0 to one column before the point.
new Placement({left: 0, right: alignTL.left.minus(1), child: card})
```

The first form preserves the original proposal's natural-size behavior. The
second is preferable when the main content should occupy all the available width.
A child with an explicit smaller width can still render smaller within that
allocation.

### Symbolic coordinates

An alignment point exposes:

```ts
point.x // same coordinate as point.left and point.right
point.y // same coordinate as point.top and point.bottom

point.left.minus(1)
point.top.plus(2)
```

These are immutable expressions, **not the previous frame's numeric coordinates**.
Creating or passing an expression does not require the marker to have rendered.

Horizontal and vertical expressions have distinct TypeScript types, preventing
`right: point.top`. Offsets are finite integer terminal cells; invalid numeric
inputs are rejected. `plus` and `minus` return new expressions.

A point has no extent: `left === right` and `top === bottom` conceptually. These
aliases do not expose its parent's or its siblings' bounding rectangle.

Each `Placement` edge accepts either a coordinate expression or an integer.
Numbers are scope-local coordinates, **not CSS-style insets**: `right: 20` means
that the trailing edge is at x=20, not 20 cells from the scope's right edge.

## Placement semantics

Resolve the two axes independently within the scope's content rectangle:

| Pins on an axis | Position                 | Allocated size                                                    |
| --------------- | ------------------------ | ----------------------------------------------------------------- |
| Neither         | Start at 0               | Natural size, bounded by the scope's extent.                      |
| Leading only    | Start at the pin         | Natural size, bounded by remaining space to the scope's end.      |
| Trailing only   | End at the pin           | Natural size, bounded by space from the scope's start to the pin. |
| Both            | Start at the leading pin | `max(0, trailing - leading)`.                                     |

For a trailing-only horizontal pin at R, width is bounded by `max(0, R)` and
x is `R - width`. A pair of pins at L and R produces x=L and width=`max(0, R-L)`.
The same rules apply to top/bottom and height.

Additional rules:

- Right and bottom edges are exclusive. `right: marker.left` is adjacent;
  `.minus(1)` leaves exactly one empty column.
- Resolve the horizontal budget before measuring wrapping content. Measure with
  the final allocated width when determining natural height; do not merely crop
  content measured at the full scope width.
- Explicit child dimensions and minimum sizes must not expand the allocated
  placement rectangle. Oversized content is clipped by that rectangle.
- Coordinates may lie outside the scope; normal ancestor clipping still applies.
  Do not clamp a point to the visible viewport or change its identity when clipped.
- If opposing pins cross, the allocation becomes empty at the leading pin. This
  is a valid small-terminal condition, not a dependency error.
- `Placement` itself should not accept competing `x`, `y`, width/height,
  min/max dimensions, padding, or flex props in v1. Put sizing/padding on its
  children and spacing in the expressions. Its children share the solved area,
  following the normal `Container` overlay convention.
- Support both `update(props)` and Core/OOP setters for the four edge properties;
  changing them invalidates layout.

## Scope and supported composition

`AlignmentScope` is a layering container, similar to `ZStack`, not a sequential
stack. It fills its available content area. It does not shrink-wrap the result
of its own constraints, avoiding another source of circular sizing.

Ordinary direct children receive the full scope content area and perform their
usual internal layout. Direct `Placement` children receive their solved rect.
Later children paint above earlier children, regardless of resolution order.

**Recommended v1 boundary: `Placement` must be a direct child of its scope.**
An `Alignment` may be nested inside ordinary layout containers in any of those
children, including inside an already-resolved placement. A placement's child
can be an arbitrarily complex layout.

This is a deliberate adjustment to the original `Stack.right([Placement(...)])`
sketch. A normal stack measures children before their final positions exist.
Allowing an anchor-dependent child to determine stack sizing can feed back into
the position of its own anchor. Supporting that generally requires a broader
layout protocol, not just an extra render callback. In v1, put the stack
**inside** the placement, or put an entire scope inside the stack.

Nested scopes are independent. Points cannot be referenced across scope
boundaries. A scope can itself be padded, offset, boxed, or placed inside another
container; all expressions remain relative to that scope's content origin.

The initial guarantee covers nonvirtualized layout within a scope. A scope may
move as a whole inside a scrollable, but exporting a point from an independently
scrolling or virtualized descendant to another scope branch is deferred. A view
that has not been laid out cannot provide a reliable point.

## Marker behavior

`Alignment` extends `View`, returns `Size.zero`, draws nothing, and registers no
input or tick events. It publishes its origin even when given a zero-sized
viewport; the normal empty-view early exit must not skip publication.

It must also be **flow-neutral**, which is stronger than having a zero size:

- It contributes no flex weight or cross-axis size.
- In `Stack`, it does not introduce or consume an extra gap.
- A leading marker publishes the stack's initial flow position.
- Between ordinary items, it publishes the next item's starting flow position,
  after the one normal inter-item gap. Consecutive markers share that position.
- A trailing marker publishes the previous item's ending flow position, without
  a trailing gap. An all-marker stack has zero natural size.
- Define and test the equivalent flow positions for `up` and `left`; these use
  the leading edge in the stacking direction, rather than always top-left.

Implement this as a narrow layout-marker capability, rather than changing how
all zero-sized views behave. Existing zero-sized components may intentionally
participate in spacing.

## Resolution model

### Dependency graph

Treat each direct child of `AlignmentScope` as a layout unit.

1. Walk the current child tree, stopping at nested scopes, and associate each
   marker identity with its owning layout unit.
2. Inspect each placement's expressions. A reference creates an edge from the
   marker's owning unit to the consuming placement.
3. Topologically order the units.
4. Lay out each required producer after its dependencies have resolved. Capture
   its marker positions in the current scope's coordinate system.
5. Resolve each placement rectangle and measure its children under that budget.
   If it also provides markers, lay it out before resolving its consumers.
6. Paint all children in their original order using the solved rectangles.

A marker inside placement A can therefore position placement B. Self-dependencies
and cycles are rejected with an error naming the points/units involved. Do not
attempt fixed-point iteration or silently use previous-frame positions.

Only branches needed to publish referenced points require a preliminary layout
traversal. Ordinary painting remains one traversal in declaration order. Layout
work should be bounded by one producer traversal per required unit, not repeated
whole-scope passes until positions appear stable.

### Coordinates and per-frame state

Store resolved coordinates on a short-lived layout context, keyed by marker
identity, not as public mutable numbers on the marker.

Capture positions through the viewport transform:

```text
scope-local point = marker absolute origin - scope content absolute origin
```

A preliminary viewport must preserve the real origin, ancestor clipping,
`availableRect`, and relevant layout state. A new origin-zero viewport with only
the same width/height is not sufficient for nested or offset scopes.

`View.origin` is parent-relative and represents the last render; do not use it as
a cross-branch source of current-frame coordinates.

Create a fresh context for each solve. A resize, text change, child insertion,
visibility change, or changed constraint must not reuse stale point values.
Avoid cross-frame resolution caching initially. Existing natural-size caches
must not cache anchor-dependent results solely by available `Size`; keep solved
placement sizing in the scope/context instead.

### Unavailable points and errors

- Unmounted, hidden, or otherwise unlaid-out marker: the dependent placement
  receives an empty viewport for that frame. Never reuse an old coordinate or
  default it to zero. Propagate unavailability to dependent producers, too.
- Keep an unavailability reason for debug inspection; an absent marker is not
  necessarily a programming error during conditional rendering.
- Duplicate publication identities, references to a marker bound to a different
  scope, unsupported nested placements, and dependency cycles are errors.
- An empty scope skips solving but still uses the existing empty-container
  render path, preserving child hotkey/focus bookkeeping without publishing
  invented points.

## Integration with the existing render architecture

TeaUI currently combines layout and drawing in `render(viewport)`. It already
has `Viewport.layout()` for `Scrollable.scrollTo()`: drawing is discarded and
viewport event registration is suppressed. This is a useful starting point,
**not yet a side-effect-free measurement API**.

Examples that need attention before using it for every alignment frame:

- `Geometry.render()` calls `onLayout` and updates its previous-size state.
- `View`'s render wrapper changes recorded geometry and invalidates sizing when
  the viewport changes, potentially scheduling another render.
- Virtualized containers can create, mount, and remove children during rendering.
- A custom view may invoke callbacks or mutate external state in `render()`.

### Proposed implementation approach

1. Expose a read-only viewport layout/probe mode and add a scoped layout context.
   Provide a way to derive a measurement viewport from the current viewport,
   preserving its transforms and clipping while suppressing output/events.
2. Make built-in callbacks and external effects probe-aware. In particular,
   `Geometry` must neither deliver `onLayout` nor consume its change notification
   during a probe. Do not change `Scrollable.scrollTo()` semantics accidentally;
   distinguish probe mode from the existing geometry-recording mode if necessary.
3. Separate transient probe geometry from committed last-render geometry, and
   prevent measurement-only size changes from scheduling endless redraws.
4. Restore temporary viewport/context state with `try/finally`, including when
   dependency validation or a child render throws.
5. Document that custom views participating in measurement must respect probe
   mode. Suppressing terminal writes does not suppress arbitrary user callbacks.
6. Audit containers that mutate their child trees while rendering. Dynamic or
   virtualized producer branches are outside v1's supported source layout; do
   not silently claim they are safe. Geometry-driven structural changes during
   the real draw follow the existing invalidation lifecycle and require a new
   solve, rather than continuing with a stale dependency graph.

**Implementation gate:** prove the measurement contract with callbacks, focus,
and invalidation tests before building on it. If render-based probing cannot
meet that contract without broad behavioral changes, extract an explicit
layout-only hook for participating containers instead. Do not ship a two-pass
renderer that merely hides its first pass's terminal output.

## React API and identity

React needs a stable point handle before host views mount. Separate the handle
from the marker view internally:

```tsx
const cardsTL = useAlignment('cards-top-left')

return (
  <AlignmentScope>
    <Placement left={0} right={cardsTL.left.minus(1)}>
      <Text wrap>{content}</Text>
    </Placement>
    <At.topRight>
      <Stack.down>
        <Alignment point={cardsTL} />
        <Stack.left>
          <Box>box1</Box>
        </Stack.left>
        <Stack.left>
          <Box>box2222</Box>
        </Stack.left>
      </Stack.down>
    </At.topRight>
  </AlignmentScope>
)
```

- `createAlignment(name?)` creates a non-view point handle; `useAlignment` keeps
  one stable handle for the component's lifetime.
- Core `new Alignment()` creates its own handle and delegates coordinate getters
  to it, preserving the concise OOP example.
- Core `new Alignment({point})` and React `<Alignment point={point} />` bind an
  existing handle. A handle has at most one mounted publisher.
- References contain an enumerable unique symbol identity, an axis, and offset,
  not an enumerable `View`/parent graph. This matters because
  `packages/react/lib/isSame.ts` deep-compares enumerable properties: two objects
  containing only private fields could otherwise appear equal.
- Recreating `.minus(1)` on each React render should compare equal when the point,
  axis, and offset are unchanged. Changing the point must compare unequal.
- Do not use refs plus React state updates to publish coordinates after mounting;
  that would reintroduce the extra-render glue this feature is replacing.

## Implementation plan

### 1. Lock down semantics and measurement feasibility

- Confirm the single-pin/natural-size and opposing-pins/stretch rules above.
- Prototype a marker nested under `At` + `Stack`, observed by a consumer declared
  first, using a derived measurement viewport.
- Prove no duplicate callbacks/event registration or perpetual invalidation.
- Decide whether viewport probing passes the implementation gate or needs an
  explicit layout hook. Keep this decision separate from the public API.

### 2. Add point expressions and flow-neutral markers

- Add point identity and typed immutable coordinate expressions in
  `packages/core/lib/`.
- Add `packages/core/lib/components/Alignment.ts`.
- Update `packages/core/lib/components/Stack.ts` to handle layout markers in both
  natural measurement and placement, without changing ordinary zero-sized views.
- Add unit tests for expressions, identity, zero size, all directions, and gaps.

### 3. Add scope resolution and placement

- Add `AlignmentScope.ts`, `Placement.ts`, and an internal dependency resolver.
- Integrate the validated measurement/context support in `Viewport.ts` and
  `View.ts`; update `Geometry.ts` and other audited components as required.
- Add deterministic ordering, rect solving, unavailable-point propagation,
  diagnostics, and OOP setters/update support.
- Export the public API from `packages/core/lib/components/index.ts` and the
  appropriate core entry point.

### 4. Add React integration

- Register the three host components in `packages/react/lib/reconciler.ts`.
- Add JSX declarations, wrappers, and `useAlignment` in
  `packages/react/lib/components.tsx`, with exports through its entry point.
- Test stable handles, changed identities/offsets, conditional markers, reordering,
  and the existing `isSame` behavior.

### 5. Document and demonstrate

- Add component docs and a live example to `apps/docs/` showing the motivating
  layout while both card widths change.
- Include natural-width versus stretched placement examples and a vertical pin.
- Document direct-child scope rules, errors, probe-safe custom views, and limits.
- Run `pnpm run build`, `pnpm run test`, and `pnpm run format`; inspect formatting
  changes before any commit.

## Acceptance tests

Use `testRender()` and snapshots for visible behavior, plus explicit rect,
callback-count, and input assertions where snapshots are insufficient.

- Two unequal right-aligned cards; main content avoids the wider card by one cell.
- Either card becomes the wider one; growing and shrinking updates in the same
  render, including text wrapping and the dependent content's natural height.
- Terminal resize, including no remaining width and crossed pins.
- Producer declared before and after consumer: identical layout; paint order is
  still declaration order where views intentionally overlap.
- All four pins, single-pin natural sizing, opposing-pin stretch, and no-pin
  natural sizing; exact adjacency and positive/negative offsets.
- Padded/boxed/offset scopes and markers inside nested ordinary containers.
- Marker-only stacks, consecutive markers, leading/trailing markers, gaps, and
  all stack directions; no added flex allocation or spacing.
- Dependency chains, self-cycles, multi-unit cycles, duplicate handles, and
  scope-boundary violations.
- Hidden/unmounted/remounted points and zero-sized viewports: no stale coordinates
  or stale hit regions; empty-view hotkey/focus behavior remains intact.
- Oversized/fixed-size children cannot draw or receive mouse events outside the
  placement's clip; verify mouse coordinates after placement.
- `Geometry` notifications, focus, hotkeys, ticks, and modal requests are not
  duplicated or lost to a preliminary pass; no redraw loop after settling.
- Existing `Scrollable.scrollTo()` layout behavior is unchanged.
- React rerenders, changed point identities, and mount/unmount cleanup.

## Deferred extensions

- `min`/`max` coordinate expressions for independently positioned obstacles.
  For example, the minimum of two left-edge points would replace the shared
  card stack when the cards live in unrelated layout branches.
- Binding a point to a chosen corner/center of an arbitrary view without inserting
  a flow marker.
- General `Placement` participation inside stacks or other intrinsic-size
  parents, after a layout protocol can account for those sizing dependencies.
- Cross-scroll-space or virtualized marker publication.
- Exported points across nested scopes, constraint priorities, and general
  equation solving.
- Per-row exclusion regions/text flowing around obstacles.

The first version should solve named-point dependencies deterministically, not
become a general constraint solver.
