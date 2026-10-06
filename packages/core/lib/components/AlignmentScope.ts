import type {Viewport} from '../Viewport.js'
import type {View} from '../View.js'
import {Container} from '../Container.js'
import {Point, Rect, Size} from '../geometry.js'
import {
  ALIGNMENT_SCOPE,
  AlignmentContext,
  AlignmentError,
  type AlignmentPoint,
} from '../alignment.js'
import {Placement, type HorizontalEdge, type VerticalEdge} from './Placement.js'

/**
 * Why an alignment point could not be resolved during the last render. A
 * `Placement` that depends on an unavailable point is rendered into an empty
 * viewport (it is never placed using stale or default coordinates).
 */
export type UnavailableReason = 'unmounted' | 'hidden' | 'not-rendered'

/**
 * Owns the coordinate space for alignment points (see `Alignment`), and lays
 * out `Placement` children relative to them.
 *
 * Like a `ZStack`, children are layered in the same area, later children above
 * earlier ones; ordinary children receive the entire area. `Placement` children
 * receive the rectangle resolved from their edges.
 *
 * Points are resolved before anything is drawn, so a `Placement` can be
 * declared before the `Alignment` it depends on. Each direct child that
 * publishes a needed point is measured first (without drawing, see
 * `Viewport.isProbe`), in dependency order.
 *
 * Rules:
 * - `Placement` views must be direct children of the scope. An `Alignment` can
 *   be nested anywhere inside the scope's children (but not in a nested scope).
 * - A point can only be published by one mounted `Alignment`.
 * - Dependency cycles (including a placement that depends on a point inside
 *   itself) are errors.
 *
 * ```ts
 * const cards = new Alignment({name: 'cards'})
 * new AlignmentScope({
 *   children: [
 *     new Placement({left: 0, right: cards.left.minus(1), child: content}),
 *     At.topRight([Stack.down([cards, box1, box2])]),
 *   ],
 * })
 * ```
 */
export class AlignmentScope extends Container {
  #unavailable = new Map<AlignmentPoint, UnavailableReason>()

  get [ALIGNMENT_SCOPE]() {
    return true
  }

  /**
   * Points that were referenced but could not be resolved during the last
   * render, and why. Useful for debugging layouts with conditional markers.
   */
  get unavailablePoints(): ReadonlyMap<AlignmentPoint, UnavailableReason> {
    return this.#unavailable
  }

  naturalSize(available: Size): Size {
    return available
  }

  render(viewport: Viewport) {
    // Nested views must not publish to an enclosing scope's context.
    viewport._withAlignmentContext(undefined, viewport => {
      if (viewport.isEmpty) {
        this.#unavailable = new Map()
        return super.render(viewport)
      }

      const rects = this.#solve(viewport)
      for (const child of this.children) {
        if (!child.isVisible) {
          continue
        }

        renderUnit(viewport, child, rects.get(child))
      }
    })
  }

  /**
   * Returns the rect of every Placement (`Rect.zero`-sized when unavailable).
   * Children that aren't in the map receive the entire content area.
   */
  #solve(viewport: Viewport): Map<View, Rect> {
    const units = this.children.filter(child => child.isVisible)
    const placements = units.filter(
      (child): child is Placement => child instanceof Placement,
    )
    const unavailable = new Map<AlignmentPoint, UnavailableReason>()

    // which direct child (unit) publishes each referenced point
    const owners = new Map<AlignmentPoint, View>()
    // points that each unit needs to publish
    const published = new Map<View, Set<AlignmentPoint>>()
    for (const placement of placements) {
      for (const point of placement.references) {
        if (owners.has(point) || unavailable.has(point)) {
          continue
        }

        const owner = this.#findOwner(point)
        if (typeof owner === 'string') {
          unavailable.set(point, owner)
          continue
        }

        owners.set(point, owner)
        const points = published.get(owner) ?? new Set()
        points.add(point)
        published.set(owner, points)
      }
    }

    const order = dependencyOrder(placements, owners)

    const context = new AlignmentContext(viewport.absoluteOrigin)
    const rects = new Map<View, Rect>()
    for (const unit of order) {
      let rect: Rect | undefined
      if (unit instanceof Placement) {
        const resolved = placementRect(unit, viewport.contentSize, context)
        rect = resolved ?? EMPTY_RECT
        rects.set(unit, rect)
        if (!resolved) {
          // points published by an unplaced placement are unavailable, too
          continue
        }
      }

      const points = published.get(unit)
      if (!points) {
        continue
      }

      viewport._probe(probe => {
        probe._withAlignmentContext(context, probe => {
          context.collect(points, () => renderUnit(probe, unit, rect))
        })
      })
    }

    // published by a unit that wasn't placed, or not rendered by its parent
    // (e.g. inside a collapsed view)
    for (const point of owners.keys()) {
      if (!context.resolved(point)) {
        unavailable.set(point, 'not-rendered')
      }
    }

    this.#unavailable = unavailable
    return rects
  }

  /**
   * Finds the direct child that contains the Alignment publishing `point`.
   */
  #findOwner(point: AlignmentPoint): View | UnavailableReason {
    const publishers = [...point._publishers].filter(
      view => view.screen === this.screen,
    )
    if (publishers.length === 0) {
      return 'unmounted'
    }

    if (publishers.length > 1) {
      throw new AlignmentError(
        `${point} is published by ${publishers.length} Alignment views; a point can only be published once`,
      )
    }

    let view = publishers[0]
    let isHidden = false
    while (view.parent !== this) {
      if (!view.isVisible) {
        isHidden = true
      }

      const parent = view.parent
      if (!parent) {
        throw new AlignmentError(
          `${point} is not published inside this AlignmentScope`,
        )
      }

      if (parent instanceof AlignmentScope) {
        throw new AlignmentError(
          `${point} is published inside a nested AlignmentScope; points can't be used across scopes`,
        )
      }

      view = parent
    }

    if (isHidden || !view.isVisible) {
      return 'hidden'
    }

    return view
  }
}

/**
 * Orders the placements (and the units they depend on) so that every unit comes
 * after the units that publish the points it uses. Throws on cycles.
 */
function dependencyOrder(
  placements: Placement[],
  owners: Map<AlignmentPoint, View>,
): View[] {
  const order: View[] = []
  const done = new Set<View>()
  // the current path, with the point that led to each unit
  const path: [View, AlignmentPoint | undefined][] = []

  const visit = (unit: View, via: AlignmentPoint | undefined) => {
    if (done.has(unit)) {
      return
    }

    const cycleStart = path.findIndex(([view]) => view === unit)
    if (~cycleStart) {
      const cycle = [...path.slice(cycleStart), [unit, via] as const]
      const description = cycle
        .map(([view, point], index) =>
          index === 0 ? describe(view) : `${point} in ${describe(view)}`,
        )
        .join(' → ')
      throw new AlignmentError(`Alignment dependency cycle: ${description}`)
    }

    path.push([unit, via])
    if (unit instanceof Placement) {
      for (const point of unit.references) {
        const owner = owners.get(point)
        if (owner) {
          visit(owner, point)
        }
      }
    }
    path.pop()

    done.add(unit)
    order.push(unit)
  }

  for (const placement of placements) {
    visit(placement, undefined)
  }

  return order
}

function describe(view: View) {
  const parent = view.parent
  const index = parent ? parent.children.indexOf(view) : -1
  return `${view.constructor.name}[${index}]`
}

/**
 * `rect`: the solved rect of a Placement; undefined for other children, which
 * receive the entire viewport.
 */
function renderUnit(viewport: Viewport, unit: View, rect: Rect | undefined) {
  if (rect) {
    viewport.clipped(rect, inside => unit.render(inside))
  } else {
    unit.render(viewport)
  }
}

/**
 * Resolves a placement's rect, or undefined if an edge refers to an unresolved
 * point. See `Placement` for the rules.
 */
function placementRect(
  placement: Placement,
  size: Size,
  context: AlignmentContext,
): Rect | undefined {
  const left = resolveEdge(placement.left, context)
  const right = resolveEdge(placement.right, context)
  const top = resolveEdge(placement.top, context)
  const bottom = resolveEdge(placement.bottom, context)
  if (
    left === UNAVAILABLE ||
    right === UNAVAILABLE ||
    top === UNAVAILABLE ||
    bottom === UNAVAILABLE
  ) {
    return undefined
  }

  const horizontal = axisBudget(left, right, size.width)
  const vertical = axisBudget(top, bottom, size.height)

  // resolve the width first, so that wrapping content measures its height
  // with the final width
  const width = horizontal.isFixed
    ? horizontal.budget
    : Math.min(
        placement.naturalSize(new Size(horizontal.budget, vertical.budget))
          .width,
        horizontal.budget,
      )
  const height = vertical.isFixed
    ? vertical.budget
    : Math.min(
        placement.naturalSize(new Size(width, vertical.budget)).height,
        vertical.budget,
      )

  return new Rect(
    new Point(horizontal.origin(width), vertical.origin(height)),
    new Size(width, height),
  )
}

function axisBudget(
  leading: number | undefined,
  trailing: number | undefined,
  extent: number,
): {budget: number; isFixed: boolean; origin: (size: number) => number} {
  if (leading !== undefined && trailing !== undefined) {
    return {
      budget: Math.max(0, trailing - leading),
      isFixed: true,
      origin: () => leading,
    }
  }

  if (leading !== undefined) {
    return {
      budget: Math.max(0, extent - leading),
      isFixed: false,
      origin: () => leading,
    }
  }

  if (trailing !== undefined) {
    return {
      budget: Math.max(0, trailing),
      isFixed: false,
      origin: size => trailing - size,
    }
  }

  return {budget: extent, isFixed: false, origin: () => 0}
}

function resolveEdge(
  edge: HorizontalEdge | VerticalEdge | undefined,
  context: AlignmentContext,
): number | undefined | typeof UNAVAILABLE {
  if (edge === undefined || typeof edge === 'number') {
    return edge
  }

  const point = context.resolved(edge.point)
  if (!point) {
    return UNAVAILABLE
  }

  return (edge.axis === 'x' ? point.x : point.y) + edge.offset
}

const UNAVAILABLE = Symbol('unavailable')
const EMPTY_RECT = new Rect(Point.zero, Size.zero)
