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
  #title: string | undefined
  #titleStyle: Style
  #titleView: Text | undefined
  #separator: Separator | undefined

  constructor({title, purpose, direction, children, child, ...props}: Props) {
    super(props)

    this.#title = title
    this.#titleStyle = new Style({bold: true})
    this.#stack = new Stack({direction: direction ?? 'down'})

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

    // Resolve title after children are added so we can fall back to child heading
    this.#syncTitle()
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
    this.#title = title
    this.#stack.direction = direction ?? 'down'
    this.#syncTitle()

    if (purpose) {
      this.theme = Theme[purpose]
    }
  }

  /**
   * The resolved title: explicit `title` prop, or the first user child's
   * `heading`.
   */
  #resolvedTitle(): string | undefined {
    if (this.#title !== undefined) return this.#title
    return this.#firstUserChild()?.heading
  }

  /**
   * Returns the first child that isn't the internal title/separator views.
   */
  #firstUserChild(): View | undefined {
    for (const child of this.#stack.children) {
      if (child !== this.#titleView && child !== this.#separator) {
        return child
      }
    }
    return undefined
  }

  /**
   * Syncs the title view in the stack with the resolved title.
   */
  #syncTitle() {
    const resolved = this.#resolvedTitle()

    if (resolved) {
      if (this.#titleView) {
        this.#titleView.text = resolved
      } else if (!this.#titleView) {
        this.#titleView = new Text({
          text: resolved,
          style: this.#titleStyle,
          wrap: true,
        })
        this.#separator = Separator.horizontal()
        this.#stack.add(this.#titleView, 0)
        this.#stack.add(this.#separator!, 1)
      }
    } else if (!resolved && this.#titleView) {
      this.#stack.removeChild(this.#titleView)
      this.#stack.removeChild(this.#separator!)
      this.#titleView = undefined
      this.#separator = undefined
    }
  }

  add(child: View, at?: number) {
    this.#stack.add(child, at)
  }

  removeChild(child: View) {
    this.#stack.removeChild(child)
  }
}
