import type {Viewport} from './Viewport.js'
import {type Props as ViewProps, View} from './View.js'
import {ComposedView} from './ComposedView.js'

export interface Props extends ViewProps {
  child?: View
  children?: View[]
}

/**
 * A view that accepts children from its users - via the `child`/`children`
 * props, or `add()`/`removeChild()`. For views whose children are an
 * implementation detail, extend `ComposedView` instead.
 */
export abstract class Container extends ComposedView {
  constructor({child, children, ...viewProps}: Props = {}) {
    super(viewProps)

    if (child) {
      this.add(child)
    } else if (children) {
      for (const child of children) {
        this.add(child)
      }
    }
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({child, children}: Props) {
    // Stack recreates this logic
    if (child !== undefined) {
      children = (children ?? []).concat([child])
    }

    if (children === undefined) {
      return
    }

    if (children.length) {
      const childrenSet = new Set(children)
      for (let index = this.children.length - 1; index >= 0; index--) {
        const child = this.children[index]
        if (!childrenSet.has(child)) {
          this.removeChild(child)
        }
      }

      for (const child of children) {
        this.add(child)
      }
    } else {
      this.removeAllChildren()
    }
  }

  // ComposedView's child management, made public

  renderChildren(viewport: Viewport) {
    super.renderChildren(viewport)
  }

  add(child: View, at?: number) {
    super.add(child, at)
  }

  removeAllChildren() {
    super.removeAllChildren()
  }

  removeChild(child: View) {
    super.removeChild(child)
  }
}
