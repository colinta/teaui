import {Size} from './geometry.js'
import type {Viewport} from './Viewport.js'
import {View, REMOVE_CHILD} from './View.js'
import type {Screen} from './Screen.js'
import {define} from './util.js'

/**
 * A view that is built out of child views, but owns them: the children are
 * mounted, rendered, and receive events like any other views, but only the
 * view itself can add or remove them (`add`, `removeChild`, and
 * `removeAllChildren` are protected).
 *
 * Use this for components whose subviews are an implementation detail (e.g.
 * `Slider` is built from buttons and a track). Use `Container` for views that
 * accept arbitrary children from their users.
 */
export abstract class ComposedView extends View {
  #children: View[] = []

  constructor(props: ConstructorParameters<typeof View>[0] = {}) {
    super(props)

    define(this, 'children', {enumerable: true})
  }

  get children(): readonly View[] {
    return this.#children
  }

  naturalSize(available: Size): Size {
    let width = 0
    let height = 0
    for (const child of this.#children) {
      if (!child.isVisible) {
        continue
      }
      const naturalSize = child.naturalSize(available)
      width = Math.max(width, naturalSize.width)
      height = Math.max(height, naturalSize.height)
    }
    return new Size(width, height)
  }

  render(viewport: Viewport) {
    this.renderChildren(viewport)
  }

  protected renderChildren(viewport: Viewport) {
    for (const child of this.#children) {
      if (!child.isVisible) {
        continue
      }

      child.render(viewport)
    }
  }

  protected add(child: View, at?: number) {
    // early exit for adding child at its current index
    if (
      this.#children.length &&
      this.#children[at ?? this.#children.length - 1] === child
    ) {
      return
    }

    if (child.parent === this) {
      // only changing the order - remove it from this.#children, and add it back
      // below at the correct index
      this.#children = this.#children.filter(view => view !== child)
    } else {
      child.willMoveTo(this)

      const previousParent = child.parent
      if (previousParent && #children in previousParent) {
        const index = previousParent.#children.indexOf(child)
        if (~index) {
          previousParent.#children.splice(index, 1)
          previousParent.invalidateSize()
        }
      }
    }

    this.#children.splice(at ?? this.#children.length, 0, child)

    if (child.parent !== this) {
      const parent = child.parent
      child.parent = this
      if (parent) {
        child.didMoveFrom(parent)
      }
    }
    // in theory we could call 'didReorder' in the else clause

    // takes care of didMount, noop if screen == this.screen
    child.moveToScreen(this.screen)

    this.invalidateSize()
  }

  protected removeAllChildren() {
    while (this.#children.length) {
      this.removeChild(this.#children[this.#children.length - 1])
    }
  }

  protected removeChild(child: View) {
    if (child.parent !== this) {
      return
    }

    const index = this.#children.indexOf(child)
    if (~index) {
      this.#children.splice(index, 1)

      child.parent = undefined
      child.didMoveFrom(this)
      // takes care of didUnmount
      child.moveToScreen(undefined)

      this.invalidateSize()
    }
  }

  /**
   * `view.removeFromParent()` - a view can always remove itself. Goes through
   * `removeChild()` so that subclasses can intercept it.
   */
  [REMOVE_CHILD](child: View) {
    this.removeChild(child)
  }

  moveToScreen(screen: Screen | undefined) {
    super.moveToScreen(screen)

    for (const child of this.#children) {
      child.moveToScreen(this.screen)
    }
  }
}
