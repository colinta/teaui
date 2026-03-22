import {type Props as ContainerProps, Container} from '../Container.js'
import {Style} from '../Style.js'
import {Theme, type Purpose} from '../Theme.js'
import type {View} from '../View.js'
import {Stack} from './Stack.js'
import {Separator} from './Separator.js'
import {Text} from './Text.js'
import {type Direction} from './types.js'

export interface Props extends ContainerProps {
  title?: string
  purpose?: Purpose
  direction?: Direction
}

/**
 * Internal base class for Alert and Callout. Not exported.
 *
 * Owns a managed Stack for child layout. Subclasses must call
 * `this.addDirect(view)` to add views to the Container directly
 * (bypassing the stack-forwarding `add()` override), and use
 * `this.contentStack` to place the stack in their view hierarchy.
 */
export class Notification extends Container {
  #stack: Stack
  #titleStyle: Style
  #titleView: Text | undefined
  #separator: Separator | undefined

  constructor({title, purpose, direction, children, child, ...props}: Props) {
    super(props)

    this.#titleStyle = new Style({bold: true})
    this.#stack = new Stack({direction: direction ?? 'down'})

    if (title) {
      this.#titleView = new Text({
        text: title,
        style: this.#titleStyle,
        wrap: true,
      })
      this.#stack.add(this.#titleView)
      this.#separator = Separator.horizontal()
      this.#stack.add(this.#separator)
    }

    if (purpose) {
      this.theme = Theme[purpose]
    }

    if (child) {
      this.add(child)
    } else if (children) {
      for (const c of children) {
        this.add(c)
      }
    }
  }

  /**
   * The managed Stack that holds title + children.
   * Subclasses use this to place the stack in their view hierarchy.
   */
  protected get contentStack(): Stack {
    return this.#stack
  }

  /**
   * Add a view directly to the Container, bypassing the stack-forwarding
   * `add()` override. Used by subclasses to set up their view hierarchy.
   */
  protected addDirect(child: View, at?: number) {
    super.add(child, at)
  }

  update(props: Props) {
    this.#updateNotification(props)
    super.update(props)
  }

  #updateNotification({title, purpose, direction}: Props) {
    this.#stack.direction = direction ?? 'down'

    if (title && this.#titleView) {
      this.#titleView.text = title
    } else if (title && !this.#titleView) {
      this.#titleView = new Text({
        text: title,
        style: this.#titleStyle,
        wrap: true,
      })
      this.#separator = Separator.horizontal()
      this.#stack.add(this.#titleView, 0)
      this.#stack.add(this.#separator!, 1)
    } else if (!title && this.#titleView) {
      this.#stack.removeChild(this.#titleView)
      this.#stack.removeChild(this.#separator!)
      this.#titleView = undefined
      this.#separator = undefined
    }

    if (purpose) {
      this.theme = Theme[purpose]
    }
  }

  add(child: View, at?: number) {
    this.#stack.add(child, at)
  }

  removeChild(child: View) {
    this.#stack.removeChild(child)
  }
}
