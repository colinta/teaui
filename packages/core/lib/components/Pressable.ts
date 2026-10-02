import type {Viewport} from '../Viewport.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import type {View} from '../View.js'
import {Style} from '../Style.js'
import {Color} from '../Color.js'
import {childPalette} from '../UI.js'
import {
  type KeyEvent,
  type MouseEvent,
  isMouseClicked,
} from '../events/index.js'

export interface Props extends ContainerProps {
  /**
   * Text color, merged on top of the palette's (hover, pressed, focus) style.
   */
  foreground?: Color
  onClick?: () => void
  /**
   * Whether the Pressable joins the focus ring, and responds to Return when it
   * has focus. Default: true. Pass `false` for a Pressable that is part of a
   * larger focusable view.
   */
  focusable?: boolean
}

/**
 * The styles a Pressable computed for the current render, passed to
 * `renderContent`.
 */
export interface PressableStyles {
  /** Style of the surface; also the default style for the content. */
  text: Style
  /**
   * The palette's style for decorations (the colors inverted for the current
   * state). Pressable doesn't draw any; it's here for subclasses that do.
   */
  ornament: Style
  hasFocus: boolean
}

/**
 * Makes custom content actionable without imposing a Button's title or
 * decorations. Use it for clickable cards, icons, or custom controls that need
 * hover, pressed, and keyboard-focus feedback.
 *
 * Calls `onClick` on a mouse click or Return while focused. Set `focusable: false`
 * when it belongs to a larger control that handles keyboard focus.
 */
export class Pressable extends Container {
  #foreground?: Color
  #onClick?: Props['onClick']
  #focusable: boolean = true
  #hasFocus: boolean = false

  constructor(props: Props = {}) {
    super(props)

    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({foreground, onClick, focusable}: Props) {
    this.#foreground = foreground
    this.#onClick = onClick
    this.#focusable = focusable ?? true
  }

  childPalette(view: View) {
    return childPalette(
      super.childPalette(view),
      this.isPressed,
      this.isHover || this.#hasFocus,
    )
  }

  /**
   * Called for a mouse click or Return. Subclasses can call this for their own
   * triggers (a hotkey, for example).
   */
  protected click() {
    this.#onClick?.()
  }

  receiveMouse(event: MouseEvent) {
    if (isMouseClicked(event)) {
      this.click()
    }
  }

  receiveKey(event: KeyEvent) {
    if (event.name === 'return') {
      this.click()
    }
  }

  render(viewport: Viewport) {
    const hasFocus =
      this.#focusable && viewport.registerFocus({isDefault: false})
    this.#hasFocus = hasFocus
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    viewport.registerMouse(['mouse.button.left', 'mouse.move'])

    const styles = this.#styles(hasFocus)
    this.#paint(viewport, styles)
    this.renderContent(viewport, styles)
  }

  /**
   * Draws the content, after the background has been painted. The default draws
   * the children over the full area.
   */
  protected renderContent(viewport: Viewport, styles: PressableStyles) {
    viewport.clipped(viewport.contentRect, styles.text, inside => {
      this.renderChildren(inside)
    })
  }

  #styles(hasFocus: boolean): PressableStyles {
    let text = this.purpose.ui({
      variant: 'raised',
      isPressed: this.isPressed,
      isHover: this.isHover,
      hasFocus,
    })
    let ornament = this.purpose.ui({
      variant: 'raised',
      isPressed: this.isPressed,
      isHover: this.isHover,
      hasFocus,
      isOrnament: true,
    })
    if (this.#foreground) {
      text = text.merge({foreground: this.#foreground})
      ornament = ornament.merge({foreground: this.#foreground})
    }
    if (this.background && !(this.isHover || hasFocus)) {
      text = text.merge({background: this.background})
      ornament = ornament.merge({background: this.background})
    }

    return {text, ornament, hasFocus}
  }

  #paint(viewport: Viewport, {text}: PressableStyles) {
    viewport.visibleRect.forEachPoint(pt => {
      viewport.write(' ', pt, text)
    })
  }
}
