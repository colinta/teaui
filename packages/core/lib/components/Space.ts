import type {Viewport} from '../Viewport.js'
import type {Dimension, Props as ViewProps} from '../View.js'
import type {Color} from '../Color.js'
import {Style} from '../Style.js'
import {View} from '../View.js'
import {Size} from '../geometry.js'

interface Props extends ViewProps {}

export class Space extends View {
  static horizontal(value: Dimension, extraProps: Props = {}) {
    return new Space({width: value, ...extraProps})
  }

  static vertical(value: Dimension, extraProps: Props = {}) {
    return new Space({height: value, ...extraProps})
  }

  constructor(props: Props = {}) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({background}: Props) {
    this.background = background
  }

  naturalSize(): Size {
    return Size.zero
  }

  #prev = this.background
  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    if (!this.background) {
      return
    }

    if (this.#prev !== this.background) {
      this.#prev = this.background
    }
    const style = new Style({background: this.background})
    viewport.paint(style)
  }
}
