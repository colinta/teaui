import * as unicode from '@teaui/term'
import type {Viewport} from '../Viewport.js'

import {type Props as ViewProps, View} from '../View.js'
import {Container} from '../Container.js'
import {Rect, Point, Size} from '../geometry.js'
import {
  type MouseEvent,
  isMouseClicked,
  isMouseEnter,
  isMouseExit,
  isMouseMove,
} from '../events/index.js'
import {System} from '../System.js'
import {type Orientation} from '../types.js'

interface Props extends ViewProps {
  multiple?: boolean
  padding?: number
  direction?: Orientation
  titles: string[]
  selected: number[]
  onChange?: (changed: number, selected: number[]) => void
}

// [lines, width]
type TitleCache = [string, {width: number; height: number}]

export class ToggleGroup extends Container {
  #multiple = false
  #padding = 1
  #offAxisPadding = 0
  #direction: Orientation = 'horizontal'
  #titles: string[] = []
  #titlesCache: TitleCache[] = []
  #sizeCache: Size = Size.zero
  #selected: Set<number> = new Set()
  #hover?: number
  #onChange?: (changed: number, selected: number[]) => void

  constructor(props: Props) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    super.update(props)
    this.#update(props)
  }

  get titles() {
    return this.#titles
  }

  set titles(value: string[]) {
    this.#titles = value
    this.#updateTitles(value)
    this.invalidateSize()
  }

  #update({multiple, padding, direction, titles, selected, onChange}: Props) {
    this.#multiple = multiple ?? false
    this.#padding = Math.max(0, padding ?? 1)
    this.#offAxisPadding = Math.max(0, this.#padding - 1)
    this.#direction = direction ?? 'horizontal'
    this.#selected = new Set(selected)
    this.#onChange = onChange
    this.#updateTitles(titles)
  }

  #updateTitles(titles: string[]) {
    if (titles.length == 0) {
      this.#titlesCache = []
      return
    }

    const sizeCache = Size.zero.mutableCopy()
    this.#titlesCache = titles.map(title => {
      const size = unicode.stringSize(title)

      if (this.#direction === 'horizontal') {
        const textWidth = size.width + 2 * this.#padding
        sizeCache.width += BORDER.size + textWidth
        sizeCache.height = Math.max(sizeCache.height, size.height)
      } else {
        const textHeight = size.height + 2 * this.#padding
        sizeCache.width = Math.max(sizeCache.width, size.width)
        sizeCache.height += BORDER.size + textHeight
      }

      return [title, size] as const
    })

    if (this.#direction === 'horizontal') {
      sizeCache.width += BORDER.size
      sizeCache.height += BORDER.size * 2 + 2 * this.#offAxisPadding
    } else {
      sizeCache.width += BORDER.size * 2 + 2 * this.#offAxisPadding
      sizeCache.height += BORDER.size
    }

    this.#sizeCache = sizeCache
  }

  naturalSize() {
    return this.#sizeCache
  }

  receiveMouse(event: MouseEvent, system: System) {
    let x = 0
    if (this.#direction === 'horizontal') {
      if (event.position.y >= this.#sizeCache.height) {
        this.#hover = undefined
        return
      }

      let hoverIndex = undefined
      for (const [index, [_, size]] of this.#titlesCache.entries()) {
        const textWidth = size.width + 2 * this.#padding
        x += 2 * BORDER.size + textWidth
        if (event.position.x < x) {
          hoverIndex = index
          break
        }
        x -= BORDER.size
      }

      if (isMouseExit(event)) {
        this.#hover = undefined
      } else if (isMouseEnter(event) || isMouseMove(event)) {
        this.#hover = hoverIndex
      } else if (isMouseClicked(event) && hoverIndex !== undefined) {
        if (this.#selected.has(hoverIndex)) {
          this.#selected.delete(hoverIndex)
        } else if (this.#multiple) {
          this.#selected.add(hoverIndex)
        } else {
          this.#selected = new Set([hoverIndex])
        }
        this.#onChange?.(hoverIndex, [...this.#selected])
      }
    }
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    viewport.registerMouse(['mouse.button.left', 'mouse.move'])

    if (this.#direction === 'horizontal') {
      let x = 0
      for (const [index, [text, size]] of this.#titlesCache.entries()) {
        const rect = new Rect(
          [x, 0],
          [size.width + 2 + 2 * this.#padding, this.#sizeCache.height],
        )
        viewport.clipped(rect, inner => {
          this.#renderGroupHorizontal(inner, text, size, index)
        })
        x += rect.size.width - 1
      }
    } else {
      let y = 0
      for (const [index, [text, size]] of this.#titlesCache.entries()) {
        const rect = new Rect(
          [0, y],
          [this.#sizeCache.width, size.height + 2 + 2 * this.#padding],
        ).offset(BORDER.size, 0)
        viewport.clipped(rect, inner => {
          // this.#renderGroupVertical(
          //   inner,
          //   text,
          //   size,
          //   index,
          // )
        })
      }
    }
  }

  #renderGroupHorizontal(
    viewport: Viewport,
    text: string,
    size: {width: number; height: number},
    index: number,
  ) {
    const maxIndex = this.#titlesCache.length - 1
    const isFirst = index === 0
    const isLast = index === maxIndex
    const isSelected = this.#selected.has(index)
    const isHovered = this.#hover === index

    const textWidth = size.width + 2 * this.#padding
    const bottomPoint = Point.zero.offset(0, this.#sizeCache.height - 1)

    let border: Border
    if (this.#selected.has(index - 1) && this.#selected.has(index)) {
      border = BORDER_BOTH
    } else if (this.#selected.has(index - 1)) {
      border = BORDER_PREV
    } else if (this.#selected.has(index)) {
      border = BORDER_CURR
    } else {
      border = BORDER
    }

    if (isHovered && isSelected) {
      border = {
        ...border,
        top: '━',
        bottom: '━',
        left: '┃',
        right: '┃',
        joinerHorizTop: '┏',
        joinerHorizBottom: '┗',
      }
    } else if (isHovered) {
      border = {
        ...border,
        top: '─',
        bottom: '─',
        left: '│',
        right: '│',
        joinerHorizTop: '┌',
        joinerHorizBottom: '└',
      }
    } else if (this.#hover === index - 1 && this.#selected.has(index - 1)) {
      border = {
        ...border,
        joinerHorizTop: '┓',
        joinerHorizBottom: '┛',
      }
    } else if (this.#hover === index - 1) {
      border = {
        ...border,
        left: '│',
        joinerHorizTop: '┐',
        joinerHorizBottom: '┘',
      }
    }

    if (isFirst && isLast) {
      const top = border.tl + border.bottom.repeat(textWidth) + border.tr
      const bottom = border.bl + border.bottom.repeat(textWidth) + border.br
      viewport.write(top, Point.zero)
      viewport.write(bottom, bottomPoint)
    } else if (isFirst) {
      const top = border.tl + border.bottom.repeat(textWidth)
      const bottom = border.bl + border.bottom.repeat(textWidth)
      viewport.write(top, Point.zero)
      viewport.write(bottom, bottomPoint)
    } else if (isLast) {
      const top =
        border.joinerHorizTop + border.bottom.repeat(textWidth) + border.tr
      const bottom =
        border.joinerHorizBottom + border.bottom.repeat(textWidth) + border.br
      viewport.write(top, Point.zero)
      viewport.write(bottom, bottomPoint)
    } else {
      const top = border.joinerHorizTop + border.bottom.repeat(textWidth)
      const bottom = border.joinerHorizBottom + border.bottom.repeat(textWidth)
      viewport.write(top, Point.zero)
      viewport.write(bottom, bottomPoint)
    }

    let offsetY = 1
    const line = border.left + ' '.repeat(textWidth) + border.right
    for (let i = this.#sizeCache.height - 2 * BORDER.size; i-- > 0; ) {
      viewport.write(line, Point.zero.offset(0, offsetY))
      offsetY += 1
    }

    viewport.clipped(
      viewport.contentRect.offset(
        BORDER.size + this.#padding,
        BORDER.size + this.#offAxisPadding,
      ),
      inner => {
        inner.write(text, Point.zero, this.theme.text())
      },
    )
  }
}

const BORDER = {
  size: 1,
  top: '─',
  bottom: '─',
  left: '│',
  right: '│',
  joinerHorizTop: '┬',
  joinerHorizBottom: '┴',
  joinerVertRight: '┤',
  joinerVertLeft: '├',
  tl: '╭',
  tr: '╮',
  bl: '╰',
  br: '╯',
}
type Border = typeof BORDER
const BORDER_BOTH: Border = {
  ...BORDER,
  top: '━',
  bottom: '━',
  left: '┃',
  right: '┃',
  joinerHorizTop: '┳',
  joinerHorizBottom: '┻',
  joinerVertRight: '┫',
  joinerVertLeft: '┣',
  tl: '┏',
  tr: '┓',
  bl: '┗',
  br: '┛',
}
const BORDER_PREV: Border = {
  ...BORDER,
  top: '━',
  left: '┃',
  joinerHorizTop: '┱',
  joinerHorizBottom: '┹',
  joinerVertRight: '┩',
  joinerVertLeft: '┡',
}
const BORDER_CURR: Border = {
  ...BORDER_BOTH,
  joinerHorizTop: '┲',
  joinerHorizBottom: '┺',
  joinerVertRight: '┪',
  joinerVertLeft: '┢',
}
