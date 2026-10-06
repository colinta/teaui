import type {Viewport} from '../Viewport.js'
import type {Screen} from '../Screen.js'
import {View} from '../View.js'
import {Size} from '../geometry.js'
import {
  type AlignmentPoint,
  type HorizontalCoordinate,
  type VerticalCoordinate,
  createAlignment,
} from '../alignment.js'

export interface Props {
  /**
   * The point to publish. Pass a point from `createAlignment()` (or React's
   * `useAlignment()`) when the point needs to exist before this view does.
   * Default: a new point.
   */
  point?: AlignmentPoint
  /**
   * Name of the new point (only used when `point` is not provided). Shown in
   * error messages.
   */
  name?: string
  isVisible?: boolean
  debug?: boolean
}

/**
 * A zero-sized, invisible marker that publishes its location as an alignment
 * point. A `Placement` in the same `AlignmentScope` can pin its edges to the
 * point's coordinates:
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
 *
 * The marker is flow-neutral in a `Stack`: it takes up no space and no gap,
 * and its location is the leading edge of the next item (or the trailing edge
 * of the last item). At the start of a `Stack.down`, that is the top-left
 * corner of the stack, whose width is that of its widest child.
 */
export class Alignment extends View {
  #point: AlignmentPoint

  constructor({point, name, isVisible, debug}: Props = {}) {
    super({isVisible, debug})
    this.#point = point ?? createAlignment(name)
  }

  update({point, isVisible, debug}: Props) {
    if (point !== undefined) {
      this.point = point
    }
    super.update({isVisible, debug})
  }

  get point(): AlignmentPoint {
    return this.#point
  }

  set point(value: AlignmentPoint) {
    if (value === this.#point) {
      return
    }

    if (this.screen) {
      this.#point._detach(this)
      value._attach(this)
    }
    this.#point = value
    this.invalidateSize()
  }

  get x(): HorizontalCoordinate {
    return this.#point.x
  }

  get left(): HorizontalCoordinate {
    return this.#point.left
  }

  get right(): HorizontalCoordinate {
    return this.#point.right
  }

  get y(): VerticalCoordinate {
    return this.#point.y
  }

  get top(): VerticalCoordinate {
    return this.#point.top
  }

  get bottom(): VerticalCoordinate {
    return this.#point.bottom
  }

  get isLayoutMarker() {
    return true
  }

  didMount(_screen: Screen) {
    this.#point._attach(this)
  }

  didUnmount(_screen: Screen) {
    this.#point._detach(this)
  }

  naturalSize(_available: Size): Size {
    return Size.zero
  }

  render(viewport: Viewport) {
    // Publishes even into an empty viewport: markers are always zero-sized.
    viewport._alignmentContext?.publish(this.#point, viewport.absoluteOrigin)
  }
}
