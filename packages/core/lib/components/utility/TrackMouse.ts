import {Style} from '../../Style.js'
import {Viewport} from '../../Viewport.js'
import {type Props as ViewProps, View} from '../../View.js'
import {Container} from '../../Container.js'
import {Point, Size, Rect} from '../../geometry.js'
import type {MouseEvent} from '../../events/index.js'

interface Props extends ViewProps {
  content: View
}

export class TrackMouse extends Container {
  #position: Point

  constructor({content, ...viewProps}: Props) {
    super(viewProps)
    this.#position = Point.zero
    this.add(content)
  }

  naturalSize(available: Size) {
    return super.naturalSize(available.shrink(1, 1)).grow(1, 1)
  }

  receiveMouse(event: MouseEvent) {
    this.#position = event.position
  }

  render(viewport: Viewport) {
    viewport.registerMouse('mouse.move')

    const maxX = viewport.contentSize.width
    const maxY = viewport.contentSize.height
    let borderStyle = new Style({foreground: 'white', background: 'default'})

    viewport.clipped(
      new Rect(new Point(1, 1), viewport.contentSize.shrink(1, 1)),
      inside => {
        super.render(inside)
      },
    )

    const highlight = new Style({inverse: true})
    viewport.usingPen(borderStyle, pen => {
      for (let x = 1; x < maxX; ++x) {
        const cx = x - 1
        pen.replacePen(x === this.#position.x ? highlight : Style.NONE)
        const char =
          cx % 10 === 0
            ? (['0', '⠁', '⠉', '⠋', '⠛', '⠟', '⠿', '⡿', '⣿'][cx / 10] ?? 'X')
            : `${cx % 10}`
        viewport.write(char, new Point(x, 0))
      }
      for (let y = 1; y < maxY; ++y) {
        const cy = y - 1
        pen.replacePen(y === this.#position.y ? highlight : Style.NONE)
        const char =
          cy % 10 === 0
            ? (['0', '⠁', '⠉', '⠋', '⠛', '⠟', '⠿', '⡿', '⣿'][cy / 10] ?? 'X')
            : `${cy % 10}`
        viewport.write(char, new Point(0, y))
      }
      pen.replacePen(Style.NONE)

      const pos = `${this.#position.x}, ${this.#position.y}`
      viewport.write(
        pos,
        new Point(
          viewport.contentSize.width - pos.length,
          viewport.contentSize.height - 1,
        ),
      )
    })
  }
}
