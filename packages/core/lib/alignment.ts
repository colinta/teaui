import {Point} from './geometry.js'
import type {View} from './View.js'

export type AlignmentAxis = 'x' | 'y'

/**
 * A symbolic coordinate: "the x (or y) value of an alignment point, plus an
 * offset". Coordinates are immutable, and are resolved during layout by the
 * `AlignmentScope` that contains both the `Placement` that uses them and the
 * `Alignment` that publishes the point.
 *
 * The `axis` is part of the type, so a vertical coordinate can't be assigned to
 * a horizontal edge (`right: point.top` is a type error).
 */
export class AlignmentCoordinate<A extends AlignmentAxis = AlignmentAxis> {
  // These are the only enumerable properties, so that React's prop comparison
  // (`isSame`) treats two coordinates of the same point/axis/offset as equal.
  readonly id: symbol
  readonly axis: A
  readonly offset: number
  readonly #point: AlignmentPoint

  constructor(point: AlignmentPoint, axis: A, offset: number = 0) {
    this.id = point.id
    this.axis = axis
    this.offset = checkOffset(offset)
    this.#point = point
  }

  get point(): AlignmentPoint {
    return this.#point
  }

  plus(amount: number): AlignmentCoordinate<A> {
    return new AlignmentCoordinate(
      this.#point,
      this.axis,
      this.offset + checkOffset(amount),
    )
  }

  minus(amount: number): AlignmentCoordinate<A> {
    return new AlignmentCoordinate(
      this.#point,
      this.axis,
      this.offset - checkOffset(amount),
    )
  }

  toString() {
    const offset =
      this.offset > 0
        ? ` + ${this.offset}`
        : this.offset < 0
          ? ` - ${-this.offset}`
          : ''
    return `${this.#point}.${this.axis}${offset}`
  }
}

export type HorizontalCoordinate = AlignmentCoordinate<'x'>
export type VerticalCoordinate = AlignmentCoordinate<'y'>

/**
 * A named, zero-sized location. Published by exactly one `Alignment` view, and
 * referenced by `Placement` edges via its coordinates (`point.left`, etc).
 *
 * A point has no extent, so `left`/`right`/`x` are the same coordinate, as are
 * `top`/`bottom`/`y`. The aliases are there so that layout code reads naturally:
 *
 *     new Placement({right: cards.left.minus(1), child: content})
 */
export class AlignmentPoint {
  readonly id: symbol
  readonly name: string | undefined
  #publishers = new Set<View>()

  constructor(name?: string) {
    this.id = Symbol(name ?? 'alignment')
    this.name = name
  }

  get x(): HorizontalCoordinate {
    return new AlignmentCoordinate(this, 'x')
  }

  get left(): HorizontalCoordinate {
    return this.x
  }

  get right(): HorizontalCoordinate {
    return this.x
  }

  get y(): VerticalCoordinate {
    return new AlignmentCoordinate(this, 'y')
  }

  get top(): VerticalCoordinate {
    return this.y
  }

  get bottom(): VerticalCoordinate {
    return this.y
  }

  toString() {
    return this.name === undefined
      ? 'Alignment(anonymous)'
      : `Alignment(${JSON.stringify(this.name)})`
  }

  /**
   * The mounted `Alignment` views publishing this point. More than one is an
   * error, reported by the `AlignmentScope` that tries to resolve the point.
   *
   * @internal
   */
  get _publishers(): ReadonlySet<View> {
    return this.#publishers
  }

  /** @internal */
  _attach(view: View) {
    this.#publishers.add(view)
  }

  /** @internal */
  _detach(view: View) {
    this.#publishers.delete(view)
  }
}

/**
 * Creates an alignment point that isn't (yet) attached to an `Alignment` view.
 * Use this when the point needs to exist before the view does, e.g. in React:
 *
 *     const cards = createAlignment('cards')
 *     <Alignment point={cards} />
 *     <Placement right={cards.left} />
 */
export function createAlignment(name?: string): AlignmentPoint {
  return new AlignmentPoint(name)
}

/**
 * Thrown for invalid alignment layouts: dependency cycles, points published
 * more than once, points used outside of their scope, and `Placement` views
 * that are not direct children of an `AlignmentScope`.
 */
export class AlignmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AlignmentError'
  }
}

/**
 * Collects the locations of alignment points during an `AlignmentScope` solve.
 * Created fresh for every solve, so that no coordinate outlives the layout it
 * was measured in.
 *
 * @internal
 */
export class AlignmentContext {
  // absolute location of the scope's content, points are relative to this
  readonly #origin: Point
  #collecting: ReadonlySet<AlignmentPoint> | undefined
  #resolved = new Map<AlignmentPoint, Point>()

  constructor(origin: Point) {
    this.#origin = origin
  }

  /**
   * Publications are only accepted for the given points, and only during
   * `draw`.
   */
  collect(points: ReadonlySet<AlignmentPoint>, draw: () => void) {
    const prev = this.#collecting
    this.#collecting = points
    try {
      draw()
    } finally {
      this.#collecting = prev
    }
  }

  publish(point: AlignmentPoint, absoluteOrigin: Point) {
    if (!this.#collecting?.has(point)) {
      return
    }

    this.#resolved.set(
      point,
      new Point(
        absoluteOrigin.x - this.#origin.x,
        absoluteOrigin.y - this.#origin.y,
      ),
    )
  }

  resolved(point: AlignmentPoint): Point | undefined {
    return this.#resolved.get(point)
  }
}

/**
 * Identifies `AlignmentScope` without importing it (`Placement` checks its
 * parent, and `AlignmentScope` imports `Placement`).
 *
 * @internal
 */
export const ALIGNMENT_SCOPE = Symbol('AlignmentScope')

function checkOffset(value: number): number {
  if (!Number.isInteger(value)) {
    throw new TypeError(
      `Alignment offsets must be integer terminal cells, got ${value}`,
    )
  }
  return value
}
