import type {Viewport} from '../Viewport.js'
import {Point, Rect, Size} from '../geometry.js'
import {Style} from '../Style.js'
import {Palette} from '../Palette.js'
import {type Props as NotificationProps, Notification} from './Notification.js'

export interface Props extends NotificationProps {}

export class Callout extends Notification {
  constructor(props: Props = {}) {
    super(props)

    this.contentStack.purpose = this.#childPalette()

    this.addDirect(this.contentStack)
  }

  update(props: Props) {
    super.update(props)
    this.#updateStyles()
    this.invalidateRender()
  }

  #backgroundStyle(): Style {
    return new Style({
      foreground: this.purpose.textColor,
      background: this.purpose.darkenColor,
    })
  }

  #barStyle(): Style {
    return new Style({
      foreground: this.purpose.highlightColor,
      background: this.purpose.darkenColor,
    })
  }

  #topBottomBarStyle(): Style {
    return new Style({
      foreground: this.purpose.highlightColor,
      background: 'default',
    })
  }

  /**
   * Creates a derived purpose for children where all background properties match the
   * callout's background, so Separator, Text, etc. render with a consistent
   * background color.
   */
  #childPalette(): Palette {
    const t = this.purpose
    return new Palette({
      text: t.textColor,
      contrastText: t.contrastTextColor,
      dimText: t.dimTextColor,
      dimBackground: t.darkenColor,
      controlBackground: t.darkenColor,
      textBackground: t.textBackgroundColor,
      highlight: t.highlightColor,
      darken: t.darkenColor,
      tableChecked: t.tableCheckedColor,
      tableCheckedHighlight: t.tableCheckedHighlightColor,
    })
  }

  #updateStyles() {
    this.contentStack.purpose = this.#childPalette()
  }

  naturalSize(available: Size): Size {
    const innerAvailable = available.shrink(2, 0)
    const innerSize = super.naturalSize(innerAvailable)
    return innerSize.grow(2, 2)
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    // Paint dim background with bright foreground
    viewport.paint(this.#backgroundStyle())

    // Draw left accent bar
    for (let y = 0; y < viewport.contentSize.height; y++) {
      viewport.write(LEFT_HIGHLIGHT, new Point(0, y), this.#barStyle())
    }
    const repeatCount = viewport.contentSize.width
    viewport.write(
      TOP_HIGHLIGHT.repeat(repeatCount),
      new Point(0, 0),
      this.#topBottomBarStyle(),
    )
    viewport.write(
      BOTTOM_HIGHLIGHT.repeat(repeatCount),
      new Point(0, viewport.contentSize.height - 1),
      this.#topBottomBarStyle(),
    )

    // Render children offset by 2 columns (bar + space)
    viewport.clipped(
      new Rect(new Point(2, 1), viewport.contentSize.shrink(2, 2)),
      inside => super.render(inside),
    )
  }
}

const TOP_HIGHLIGHT = '▄'
const BOTTOM_HIGHLIGHT = '▀'
const LEFT_HIGHLIGHT = '▌'
