import type {Viewport} from '../Viewport.js'
import type {View} from '../View.js'
import {Container} from '../Container.js'
import {
  ALIGNMENT_SCOPE,
  AlignmentCoordinate,
  AlignmentError,
  type AlignmentPoint,
  type HorizontalCoordinate,
  type VerticalCoordinate,
} from '../alignment.js'

/**
 * An edge is a coordinate in the `AlignmentScope`'s content (a number), or an
 * alignment point's coordinate (`point.left.minus(1)`). Numbers are *not*
 * insets: `right: 20` means the right edge is at x=20.
 */
export type HorizontalEdge = HorizontalCoordinate | number
export type VerticalEdge = VerticalCoordinate | number

export interface Props {
  top?: VerticalEdge
  right?: HorizontalEdge
  bottom?: VerticalEdge
  left?: HorizontalEdge
  child?: View
  children?: View[]
  isVisible?: boolean
  debug?: boolean
}

/**
 * Positions and sizes its children using edge coordinates, which can refer to
 * alignment points (see `Alignment`). Must be a direct child of an
 * `AlignmentScope`, which resolves the points before anything is drawn.
 *
 * Each axis is resolved independently:
 * - no edges: at 0, natural size (bounded by the scope)
 * - leading edge only (`left`/`top`): starts at the edge, natural size
 *   (bounded by the space remaining in the scope)
 * - trailing edge only (`right`/`bottom`): ends at the edge, natural size
 *   (bounded by the space before the edge)
 * - both edges: fills the space between them (empty if they cross)
 *
 * Right and bottom edges are exclusive, so `right: point.left` is adjacent to
 * the point, and `right: point.left.minus(1)` leaves a one-cell gap.
 *
 * Size and padding props belong on the children; the placement's rectangle
 * clips them.
 */
export class Placement extends Container {
  #top: VerticalEdge | undefined
  #right: HorizontalEdge | undefined
  #bottom: VerticalEdge | undefined
  #left: HorizontalEdge | undefined

  constructor({
    top,
    right,
    bottom,
    left,
    child,
    children,
    isVisible,
    debug,
  }: Props = {}) {
    super({child, children, isVisible, debug})
    this.#update({top, right, bottom, left})
  }

  update({top, right, bottom, left, child, children, isVisible, debug}: Props) {
    this.#update({top, right, bottom, left})
    super.update({child, children, isVisible, debug})
  }

  #update({top, right, bottom, left}: Props) {
    this.#top = checkEdge(top, 'y', 'top')
    this.#right = checkEdge(right, 'x', 'right')
    this.#bottom = checkEdge(bottom, 'y', 'bottom')
    this.#left = checkEdge(left, 'x', 'left')
  }

  get top() {
    return this.#top
  }
  set top(value: VerticalEdge | undefined) {
    this.#top = checkEdge(value, 'y', 'top')
    this.invalidateSize()
  }

  get right() {
    return this.#right
  }
  set right(value: HorizontalEdge | undefined) {
    this.#right = checkEdge(value, 'x', 'right')
    this.invalidateSize()
  }

  get bottom() {
    return this.#bottom
  }
  set bottom(value: VerticalEdge | undefined) {
    this.#bottom = checkEdge(value, 'y', 'bottom')
    this.invalidateSize()
  }

  get left() {
    return this.#left
  }
  set left(value: HorizontalEdge | undefined) {
    this.#left = checkEdge(value, 'x', 'left')
    this.invalidateSize()
  }

  /**
   * The alignment points that this placement's edges refer to.
   */
  get references(): AlignmentPoint[] {
    const points = new Set<AlignmentPoint>()
    for (const edge of [this.#top, this.#right, this.#bottom, this.#left]) {
      if (edge instanceof AlignmentCoordinate) {
        points.add(edge.point)
      }
    }
    return [...points]
  }

  render(viewport: Viewport) {
    if (!(this.parent && ALIGNMENT_SCOPE in this.parent)) {
      throw new AlignmentError(
        `Placement must be a direct child of an AlignmentScope (parent is ${
          this.parent?.constructor.name ?? 'undefined'
        })`,
      )
    }

    super.render(viewport)
  }
}

function checkEdge<T extends HorizontalEdge | VerticalEdge>(
  edge: T | undefined,
  axis: 'x' | 'y',
  name: string,
): T | undefined {
  if (edge === undefined) {
    return undefined
  }

  if (typeof edge === 'number') {
    if (!Number.isInteger(edge)) {
      throw new TypeError(
        `Placement.${name} must be an integer terminal cell, got ${edge}`,
      )
    }
  } else if (!(edge instanceof AlignmentCoordinate) || edge.axis !== axis) {
    throw new TypeError(
      `Placement.${name} must be a number or an alignment ${axis}-coordinate`,
    )
  }

  return edge
}
