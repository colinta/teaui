import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import type {Props as ViewProps} from '../View.js'
import {View} from '../View.js'
import {Style} from '../Style.js'
import {Point, Size} from '../geometry.js'
import {type Purpose, Palette} from '../Palette.js'

export interface Props extends ViewProps {
  text?: string
  purpose?: Purpose
}

export class Badge extends View {
  #text: string = ''

  constructor(props: Props = {}) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({text, purpose}: Props) {
    this.#text = text ?? ''
    if (purpose) {
      this.purpose = Palette[purpose]
    }
  }

  naturalSize(_available: Size): Size {
    if (this.#text === '') {
      return Size.zero
    }
    const textWidth = unicode.lineWidth(this.#text)
    // 1 char left cap + text + 1 char right cap
    return new Size(textWidth + 2, 1)
  }

  #capStyle(): Style {
    return new Style({
      foreground: this.purpose.controlBackgroundColor,
    })
  }

  #textStyle(): Style {
    return new Style({
      foreground: this.purpose.textColor,
      background: this.purpose.controlBackgroundColor,
    })
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty || this.#text === '') {
      return
    }

    const capStyle = this.#capStyle()
    const textStyle = this.#textStyle()

    viewport.write(LEFT_CAP, Point.zero, capStyle)
    viewport.write(this.#text, new Point(1, 0), textStyle)
    viewport.write(
      RIGHT_CAP,
      new Point(1 + unicode.lineWidth(this.#text), 0),
      capStyle,
    )
  }
}

const LEFT_CAP = '▐'
const RIGHT_CAP = '▌'
