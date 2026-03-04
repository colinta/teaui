import type {Viewport} from '../Viewport.js'
import type {Props as ViewProps} from '../View.js'
import {View} from '../View.js'
import {Point, Size} from '../geometry.js'
import {type Orientation} from './types.js'

type Border =
  | 'single'
  | 'leading'
  | 'trailing'
  | 'bold'
  | 'dash'
  | 'dash2'
  | 'dash3'
  | 'dash4'
  | 'double'

interface Props extends ViewProps {
  direction: Orientation
  padding?: number
  border?: Border
}

export class Separator extends View {
  #direction: Orientation = 'vertical'
  #padding: number = 0
  #border: Border = 'single'

  static horizontal(props: Omit<Props, 'direction'> = {}): Separator {
    return new Separator({direction: 'horizontal', ...props})
  }

  static vertical(props: Omit<Props, 'direction'> = {}): Separator {
    return new Separator({direction: 'vertical', ...props})
  }

  constructor(props: Props) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({direction, padding, border}: Props) {
    this.#direction = direction
    this.#padding = padding ?? 0
    this.#border = border ?? 'single'
  }

  naturalSize(available: Size): Size {
    if (this.#direction === 'vertical') {
      return new Size(1 + 2 * this.#padding, available.height)
    } else {
      return new Size(available.width, 1 + 2 * this.#padding)
    }
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    const style = this.theme.text()

    if (this.#direction === 'vertical') {
      const [char] = BORDERS[this.#border],
        minY = viewport.visibleRect.minY(),
        maxY = viewport.visibleRect.maxY()
      for (let y = minY; y < maxY; ++y) {
        viewport.write(char, new Point(this.#padding, y), style)
      }
    } else {
      const [, char] = BORDERS[this.#border]
      const pt = viewport.visibleRect.origin.offset(0, this.#padding)
      viewport.write(char.repeat(viewport.visibleRect.size.width), pt, style)
    }
  }
}

const BORDERS: Record<Border, [string, string]> = {
  single: ['│', '─'],
  leading: ['▏', '▔'],
  trailing: ['▕', '▁'],
  bold: ['┃', '━'],
  dash: ['╵', '╴'],
  dash2: ['╎', '╌'],
  dash3: ['┆', '┄'],
  dash4: ['┊', '┈'],
  double: ['║', '═'],
}
