import type {Viewport} from '../Viewport.js'
import {Point, Rect, Size} from '../geometry.js'
import {Style} from '../Style.js'
import {Theme} from '../Theme.js'
import {type Props as NotificationProps, Notification} from './Notification.js'

export interface Props extends NotificationProps {}

export class Callout extends Notification {
  #backgroundStyle: Style
  #barStyle: Style

  constructor(props: Props = {}) {
    super(props)

    this.#backgroundStyle = this.#makeBackgroundStyle()
    this.#barStyle = this.#makeBarStyle()
    this.contentStack.theme = this.#makeChildTheme()

    this.addDirect(this.contentStack)
  }

  update(props: Props) {
    super.update(props)
    this.#updateStyles()
  }

  #makeBackgroundStyle(): Style {
    return new Style({
      foreground: this.theme.textColor,
      background: this.theme.darkenColor,
    })
  }

  #makeBarStyle(): Style {
    return new Style({
      foreground: this.theme.highlightColor,
      background: this.theme.darkenColor,
    })
  }

  /**
   * Creates a derived theme for children where all background properties
   * match the callout's background, so Separator, Text, etc. render with
   * a consistent background color.
   */
  #makeChildTheme(): Theme {
    const t = this.theme
    return new Theme({
      text: t.textColor,
      brightText: t.brightTextColor,
      dimText: t.dimTextColor,
      dimBackground: t.darkenColor,
      background: t.darkenColor,
      textBackground: t.darkenColor,
      highlight: t.highlightColor,
      darken: t.darkenColor,
    })
  }

  #updateStyles() {
    this.#backgroundStyle = this.#makeBackgroundStyle()
    this.#barStyle = this.#makeBarStyle()
    this.contentStack.theme = this.#makeChildTheme()
  }

  naturalSize(available: Size): Size {
    const innerAvailable = available.shrink(2, 0)
    const innerSize = super.naturalSize(innerAvailable)
    return innerSize.grow(2, 0)
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    // Paint dim background with bright foreground
    viewport.paint(this.#backgroundStyle)

    // Draw left accent bar
    for (let y = 0; y < viewport.contentSize.height; y++) {
      viewport.write(LEFT_HIGHLIGHT, new Point(0, y), this.#barStyle)
    }

    // Render children offset by 2 columns (bar + space)
    viewport.clipped(
      new Rect(new Point(2, 0), viewport.contentSize.shrink(2, 0)),
      inside => super.render(inside),
    )
  }
}

const LEFT_HIGHLIGHT = '▎'
