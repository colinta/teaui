import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import {Rect, Point, Size} from '../geometry.js'
import {Style} from '../Style.js'
import {define} from '../util.js'
import {ZStack} from './ZStack.js'

type ContainerProps = ConstructorParameters<typeof ZStack>[0] & {}

export type Border =
  | 'none'
  | 'single'
  | 'bold'
  | 'double'
  | 'rounded'
  | 'dotted'
  | 'popout'

export type BorderChars =
  // top, sides, top-left, top-right, bottom-left, bottom-right
  // '─', '│', '┌', '┐', '└', '┘'
  | [string, string, string, string, string, string]
  // top, sides, …corners…, bottom
  | [string, string, string, string, string, string, string]
  // top, left, …corners…, bottom, right
  | [string, string, string, string, string, string, string, string]

export type CalculatedBorderChars = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
]

export interface BorderSizes {
  maxTop: number // height
  maxBottom: number // height
  maxRight: number // width
  maxLeft: number // width
  topLeft: {width: number; height: number}
  topMiddle: {width: number; height: number}
  topRight: {width: number; height: number}
  leftMiddle: {width: number; height: number}
  rightMiddle: {width: number; height: number}
  bottomLeft: {width: number; height: number}
  bottomMiddle: {width: number; height: number}
  bottomRight: {width: number; height: number}
}

interface Props extends ContainerProps {
  border?: Border | BorderChars
  highlight?: boolean
}

export class Box extends ZStack {
  #border: Border | BorderChars = 'single'
  #borderChars: CalculatedBorderChars = BORDERS.single
  #borderSizes: BorderSizes = BORDER_SIZE_ZERO
  #highlight: boolean = false

  constructor(props: Props) {
    super(props)

    define(this, 'border', {enumerable: true})

    this.#update(props)
  }

  get border() {
    return this.#border
  }
  set border(value: Border | BorderChars) {
    this.#border = value
    ;[this.#borderChars, this.#borderSizes] = calculateBorder(value)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({highlight, border}: Props) {
    this.#highlight = highlight ?? false
    this.border = border ?? 'single'
  }

  naturalSize(available: Size): Size {
    const naturalSize = super.naturalSize(
      available.shrink(
        this.#borderSizes.maxLeft + this.#borderSizes.maxRight,
        this.#borderSizes.maxTop + this.#borderSizes.maxBottom,
      ),
    )

    return naturalSize.grow(
      this.#borderSizes.maxLeft + this.#borderSizes.maxRight,
      this.#borderSizes.maxTop + this.#borderSizes.maxBottom,
    )
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    if (this.#highlight) {
      viewport.registerMouse('mouse.move')
    }

    const [top, left, tl, tr, bl, br, bottom, right] = this.#borderChars

    const maxX = viewport.contentSize.width
    const maxY = viewport.contentSize.height
    const innerTopWidth = Math.max(
      0,
      maxX - this.#borderSizes.topLeft.width - this.#borderSizes.topRight.width,
    )
    const innerBottomWidth = Math.max(
      0,
      maxX -
        this.#borderSizes.bottomLeft.width -
        this.#borderSizes.bottomRight.width,
    )
    const innerMiddleWidth = Math.max(
      0,
      maxX - this.#borderSizes.maxLeft - this.#borderSizes.maxRight,
    )
    const innerHeight = Math.max(
      0,
      maxY - this.#borderSizes.maxTop - this.#borderSizes.maxBottom,
    )
    const leftMaxX = this.#borderSizes.maxLeft
    const topRightX = this.#borderSizes.topLeft.width + innerTopWidth
    const bottomRightX = this.#borderSizes.bottomLeft.width + innerBottomWidth
    const middleRightX = this.#borderSizes.maxLeft + innerMiddleWidth
    const topInnerY = this.#borderSizes.maxTop
    const bottomInnerY = this.#borderSizes.maxTop + innerHeight

    const borderStyle = this.theme.text({isHover: this.isHover})

    const innerStyle = new Style({background: borderStyle.background})
    const innerOrigin = new Point(
      this.#borderSizes.maxLeft,
      this.#borderSizes.maxTop,
    )
    if (innerHeight && innerMiddleWidth) {
      for (let y = 0; y < innerHeight; ++y) {
        const spaces = ' '.repeat(innerMiddleWidth)
        viewport.write(spaces, innerOrigin.offset(0, y), innerStyle)
      }
    }

    viewport.clipped(
      new Rect(innerOrigin, [innerMiddleWidth, innerHeight]),
      inside => super.render(inside),
    )

    viewport.usingPen(borderStyle, () => {
      const [tlLines, topLines, trLines] = [
        tl.split('\n'),
        top.split('\n'),
        tr.split('\n'),
      ]
      for (let lineY = 0; lineY < topInnerY; ++lineY) {
        const [lineTL, lineTop, lineTR] = [
          tlLines[lineY] ?? '',
          topLines[lineY] ?? '',
          trLines[lineY] ?? '',
        ]
        viewport.write(lineTL, new Point(0, lineY))
        if (lineTop.length) {
          viewport.write(
            lineTop
              .repeat(
                Math.ceil(innerTopWidth / this.#borderSizes.topMiddle.width),
              )
              .slice(0, innerTopWidth),
            new Point(leftMaxX, lineY),
          )
        }
        viewport.write(lineTR, new Point(topRightX, lineY))
      }

      const [leftLines, rightLines] = [left.split('\n'), right.split('\n')]
      for (let lineY = topInnerY; lineY < bottomInnerY; ++lineY) {
        const [lineL, lineR] = [
          leftLines[(lineY - topInnerY) % leftLines.length] ?? '',
          rightLines[(lineY - topInnerY) % rightLines.length] ?? '',
        ]
        viewport.write(lineL, new Point(0, lineY))
        viewport.write(lineR, new Point(middleRightX, lineY))
      }

      const [blLines, bottomLines, brLines] = [
        bl.split('\n'),
        bottom.split('\n'),
        br.split('\n'),
      ]
      for (let lineY = bottomInnerY; lineY < maxY; ++lineY) {
        const [lineBL, lineBottom, lineBR] = [
          blLines[lineY - bottomInnerY] ?? '',
          bottomLines[lineY - bottomInnerY] ?? '',
          brLines[lineY - bottomInnerY] ?? '',
        ]
        viewport.write(lineBL, new Point(0, lineY))
        if (lineBottom.length) {
          viewport.write(
            lineBottom
              .repeat(
                Math.ceil(innerBottomWidth / this.#borderSizes.topMiddle.width),
              )
              .slice(0, innerBottomWidth),
            new Point(leftMaxX, lineY),
          )
        }
        viewport.write(lineBR, new Point(bottomRightX, lineY))
      }
    })
  }
}

function calculateBorder(
  border: Border | BorderChars,
): [CalculatedBorderChars, BorderSizes] {
  let chars: CalculatedBorderChars
  if (typeof border === 'string') {
    chars = BORDERS[border]
  } else if (border.length === 8) {
    chars = border
  } else if (border.length === 7) {
    chars = [...border, border[1]]
  } else {
    chars = [...border, border[0], border[1]]
  }

  // TLTL\n| TOP TOP\n|TRTR\n
  // TL   2| TOP     0|TR  3
  // ------+----------+----
  // LEFT\n|          |RIGHT\n
  // LEFT 1|          |RIGHT 7
  // ------+----------+----
  // BLBL\n| BOTTOM\n |BRBR\n
  // BL  5 | BOTTOM  6|BR  4

  const topLeft = borderSize(chars[2])
  const topMiddle = borderSize(chars[0])
  const topRight = borderSize(chars[3])
  const leftMiddle = borderSize(chars[1])
  const bottomLeft = borderSize(chars[4])
  const bottomMiddle = chars[6] !== undefined ? borderSize(chars[6]) : topMiddle
  const bottomRight = borderSize(chars[5])
  const rightMiddle = chars[7] !== undefined ? borderSize(chars[7]) : leftMiddle

  return [
    chars,
    {
      maxLeft: leftMiddle.width,
      maxRight: rightMiddle.width,
      // if leftMiddle and rightMiddle are the same width as topLeft and topRight
      // corners, use topMiddle.height as maxTop.
      // Otherwise, use the max of the corners and middle.
      maxTop:
        leftMiddle.width === topLeft.width &&
        rightMiddle.width === topRight.width
          ? topMiddle.height
          : Math.max(topLeft.height, topMiddle.height, topRight.height),
      // if leftMiddle and rightMiddle are the same width as bottomLeft and bottomRight
      // corners, use bottomMiddle.height as maxBottom.
      // Otherwise, use the max of the corners and middle.
      maxBottom:
        leftMiddle.width === topLeft.width &&
        rightMiddle.width === topRight.width
          ? bottomMiddle.height
          : Math.max(
              bottomLeft.height,
              bottomMiddle.height,
              bottomRight.height,
            ),
      topLeft,
      topMiddle,
      topRight,
      leftMiddle,
      rightMiddle,
      bottomLeft,
      bottomMiddle,
      bottomRight,
    },
  ]
}

function borderSize(str: string) {
  if (str === '') {
    return {width: 0, height: 0}
  }
  return unicode.stringSize(str)
}

const BORDERS: Record<Border, CalculatedBorderChars> = {
  none: ['', '', '', '', '', '', '', ''],
  single: ['─', '│', '┌', '┐', '└', '┘', '─', '│'],
  bold: ['━', '┃', '┏', '┓', '┗', '┛', '━', '┃'],
  double: ['═', '║', '╔', '╗', '╚', '╝', '═', '║'],
  rounded: ['─', '│', '╭', '╮', '╰', '╯', '─', '│'],
  dotted: ['⠒', '⡇', '⡖', '⢲', '⠧', '⠼', '⠤', '⢸'],
  popout: [' \n─', '│', ' \n┌', ' /\\   \n/  \\─┐', '└', '┘', '─', '│'],
}

const BORDER_SIZE_ZERO: BorderSizes = {
  maxTop: 0,
  maxRight: 0,
  maxBottom: 0,
  maxLeft: 0,
  topMiddle: new Size(0, 0),
  topLeft: new Size(0, 0),
  topRight: new Size(0, 0),
  leftMiddle: new Size(0, 0),
  rightMiddle: new Size(0, 0),
  bottomMiddle: new Size(0, 0),
  bottomLeft: new Size(0, 0),
  bottomRight: new Size(0, 0),
}
