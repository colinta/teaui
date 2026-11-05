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
  /**
   * When false, the Pressable is drawn dimmed and doesn't respond to clicks or
   * Return. It keeps focus, but doesn't draw the focus style. Default: true.
   */
  isEnabled?: boolean
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
 * when it belongs to a larger control that handles keyboard focus. Set
 * `isEnabled: false` to disable it.
 */
export class Pressable extends Container {
  #foreground?: Color
  #onClick?: Props['onClick']
  #focusable: boolean = true
  #isEnabled: boolean = true
  #hasFocus: boolean = false

  constructor(props: Props = {}) {
    super(props)

    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({foreground, onClick, focusable, isEnabled}: Props) {
    this.#foreground = foreground
    this.#onClick = onClick
    this.#focusable = focusable ?? true
    this.isEnabled = isEnabled ?? true
  }

  get isEnabled() {
    return this.#isEnabled
  }
  set isEnabled(value: boolean) {
    if (value === this.#isEnabled) {
      return
    }

    this.#isEnabled = value
    this.invalidateRender()
  }

  /**
   * Whether the Pressable responds to clicks, and draws its hover, pressed, and
   * focus styles. Subclasses can add their own conditions.
   */
  protected get isInteractive(): boolean {
    return this.#isEnabled
  }

  childPalette(view: View) {
    const isInteractive = this.isInteractive
    return childPalette(
      super.childPalette(view),
      isInteractive && this.isPressed,
      isInteractive && (this.isHover || this.#hasFocus),
    )
  }

  /**
   * Called for a mouse click or Return. Subclasses can call this for their own
   * triggers (a hotkey, for example). Does nothing when the Pressable isn't
   * interactive.
   */
  protected click() {
    if (!this.isInteractive) {
      return
    }

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

    const isInteractive = this.isInteractive
    // a disabled Pressable keeps its focus, but doesn't draw the focus style
    const styles = this.#styles(isInteractive, hasFocus && isInteractive)
    this.#paint(viewport, styles)
    this.renderContent(viewport, styles)

    if (!isInteractive) {
      viewport.restyle(this.#disabledStyle(), undefined, {merge: true})
    }
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

  #styles(isInteractive: boolean, hasFocus: boolean): PressableStyles {
    const isPressed = isInteractive && this.isPressed
    const isHover = isInteractive && this.isHover
    let text = this.purpose.ui({
      variant: 'raised',
      isPressed,
      isHover,
      hasFocus,
    })
    let ornament = this.purpose.ui({
      variant: 'raised',
      isPressed,
      isHover,
      hasFocus,
      isOrnament: true,
    })
    if (this.#foreground) {
      text = text.merge({foreground: this.#foreground})
      ornament = ornament.merge({foreground: this.#foreground})
    }
    if (this.background && !(isHover || hasFocus)) {
      text = text.merge({background: this.background})
      ornament = ornament.merge({background: this.background})
    }

    return {text, ornament, hasFocus}
  }

  #disabledStyle(): Style {
    return new Style({dim: true})
  }

  #paint(viewport: Viewport, {text}: PressableStyles) {
    viewport.visibleRect.forEachPoint(pt => {
      viewport.write(' ', pt, text)
    })
  }
}
