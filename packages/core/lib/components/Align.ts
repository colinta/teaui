import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {type Props as ViewProps, View} from '../View.js'
import {Point, Rect, Size} from '../geometry.js'
import {Style} from '../Style.js'
import {type Direction} from '../types.js'
import {Stack} from './Stack.js'

interface Props extends ContainerProps {
  /**
   * Layout direction for rows.
   * - 'down' (default): rows stack top-to-bottom, columns go left-to-right
   * - 'up': rows stack bottom-to-top, columns go left-to-right
   * - 'left': columns stack right-to-left, rows go top-to-bottom
   * - 'right': columns stack left-to-right, rows go top-to-bottom
   * @default 'down'
   */
  direction?: Direction
  /**
   * The separator character drawn between aligned columns.
   * @default '│'
   */
  separator?: string
  /**
   * Style applied to the separator character.
   */
  separatorStyle?: Style
}

type ShorthandProps = NonNullable<Props['children']> | Omit<Props, 'direction'>

function fromShorthand(
  props: ShorthandProps,
  direction: Direction,
  extraProps: Omit<Props, 'children' | 'direction'> = {},
): Props {
  if (Array.isArray(props)) {
    return {children: props, direction, ...extraProps}
  } else {
    return {...props, direction, ...extraProps}
  }
}

/**
 * AlignRow (or AlignColumn) groups children into aligned columns.
 * When placed inside an Align container, each child occupies a column
 * that is sized to the maximum width across all rows.
 *
 * Children that are not AlignRow instances span the full width.
 */
export class AlignRow extends Container {
  constructor(props: ContainerProps = {}) {
    super(props)
  }

  update(props: ContainerProps) {
    super.update(props)
  }

  naturalSize(available: Size): Size {
    // AlignRow's natural size is the sum of its children's widths
    // (but Align overrides this during layout)
    let width = 0
    let height = 0
    for (const child of this.children) {
      if (!child.isVisible) {
        continue
      }
      const childSize = child.naturalSize(available)
      width += childSize.width
      height = Math.max(height, childSize.height)
    }
    return new Size(width, height)
  }

  render(viewport: Viewport) {
    // AlignRow doesn't render itself — Align handles the layout
    this.renderChildren(viewport)
  }
}

/**
 * Align manages columnar alignment across multiple rows.
 *
 * Each child can be an `AlignRow` (whose children become aligned columns)
 * or any other View (which spans the full width).
 *
 * ```ts
 * new Align({
 *   children: [
 *     Align.row([
 *       new Text({text: 'Actors'}),
 *       new Text({text: 'Keanu Reeves, Lori Petty'}),
 *     ]),
 *     Align.row([
 *       new Text({text: 'Released'}),
 *       new Text({text: '1991'}),
 *     ]),
 *   ],
 * })
 * ```
 */
export class Align extends Container {
  #stack: Stack
  #direction: Direction = 'down'
  #separator: string = SEPARATOR
  #separatorStyle: Style | undefined

  static down(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'direction'> = {},
  ): Align {
    return new Align(fromShorthand(props, 'down', extraProps))
  }

  static up(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'direction'> = {},
  ): Align {
    return new Align(fromShorthand(props, 'up', extraProps))
  }

  static right(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'direction'> = {},
  ): Align {
    return new Align(fromShorthand(props, 'right', extraProps))
  }

  static left(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'direction'> = {},
  ): Align {
    return new Align(fromShorthand(props, 'left', extraProps))
  }

  /** Alias for Align.right / Align.left */
  static column = Align.right

  /**
   * Creates an AlignRow with the given children.
   */
  static row(children: View[]): AlignRow {
    return new AlignRow({children})
  }

  constructor({
    children,
    child,
    direction,
    separator,
    separatorStyle,
    ...props
  }: Props) {
    super(props)

    this.#direction = direction ?? 'down'
    this.#separator = separator ?? SEPARATOR
    this.#separatorStyle = separatorStyle
    this.#stack = new Stack({direction: this.#direction})
    super.add(this.#stack)

    if (child) {
      this.#stack.add(child)
    }
    if (children) {
      for (const c of children) {
        this.#stack.add(c)
      }
    }
  }

  update({
    children,
    child,
    direction,
    separator,
    separatorStyle,
    ...props
  }: Props) {
    if (direction !== undefined) {
      this.#direction = direction
      this.#stack.direction = direction
    }
    if (separator !== undefined) {
      this.#separator = separator
    }
    if (separatorStyle !== undefined) {
      this.#separatorStyle = separatorStyle
    }

    if (child !== undefined || children !== undefined) {
      const allChildren: View[] = []
      if (children) {
        allChildren.push(...children)
      }
      if (child) {
        allChildren.push(child)
      }
      this.#stack.update({
        direction: this.#direction,
        children: allChildren,
      })
    }

    super.update(props)
  }

  add(child: View, at?: number) {
    this.#stack.add(child, at)
  }

  removeChild(child: View) {
    this.#stack.removeChild(child)
  }

  removeAllChildren() {
    this.#stack.removeAllChildren()
  }

  get children(): View[] {
    return this.#stack.children
  }

  get #isRows(): boolean {
    return this.#direction === 'down' || this.#direction === 'up'
  }

  /**
   * Compute the maximum width of each column across all AlignRow children.
   */
  #columnWidths(available: Size): number[] {
    const widths: number[] = []
    for (const child of this.children) {
      if (!child.isVisible || !(child instanceof AlignRow)) {
        continue
      }
      let col = 0
      for (const cell of child.children) {
        if (!cell.isVisible) {
          continue
        }
        const cellSize = cell.naturalSize(available)
        const dim = this.#isRows ? cellSize.width : cellSize.height
        widths[col] = Math.max(widths[col] ?? 0, dim)
        col++
      }
    }
    return widths
  }

  /**
   * Width of a separator including surrounding spaces: ` │ ` = 3
   */
  get #separatorWidth(): number {
    return (
      SEPARATOR_PADDING + unicode.lineWidth(this.#separator) + SEPARATOR_PADDING
    )
  }

  naturalSize(available: Size): Size {
    if (this.#isRows) {
      return this.#naturalSizeRows(available)
    } else {
      return this.#naturalSizeColumns(available)
    }
  }

  #naturalSizeRows(available: Size): Size {
    const colWidths = this.#columnWidths(available)
    const sepWidth = this.#separatorWidth

    let width = 0
    let height = 0
    for (const child of this.children) {
      if (!child.isVisible) {
        continue
      }

      if (child instanceof AlignRow) {
        // Row width = sum of column widths + separators
        let rowWidth = 0
        for (let i = 0; i < colWidths.length; i++) {
          if (i > 0) {
            rowWidth += sepWidth
          }
          rowWidth += colWidths[i]
        }
        // Row height = max of cells
        let rowHeight = 0
        for (const cell of child.children) {
          if (!cell.isVisible) {
            continue
          }
          const cellSize = cell.naturalSize(available)
          rowHeight = Math.max(rowHeight, cellSize.height)
        }
        width = Math.max(width, rowWidth)
        height += rowHeight
      } else {
        const childSize = child.naturalSize(available)
        width = Math.max(width, childSize.width)
        height += childSize.height
      }
    }
    return new Size(width, height)
  }

  #naturalSizeColumns(available: Size): Size {
    const colWidths = this.#columnWidths(available)
    const sepWidth = this.#separatorWidth

    let width = 0
    let height = 0
    for (const child of this.children) {
      if (!child.isVisible) {
        continue
      }

      if (child instanceof AlignRow) {
        // In column mode, the "row" is rendered as a column
        // Height = sum of column heights + separators
        let colHeight = 0
        for (let i = 0; i < colWidths.length; i++) {
          if (i > 0) {
            colHeight += 1 // separator takes 1 row in column mode
          }
          colHeight += colWidths[i]
        }
        // Width = max of cells
        let colWidth = 0
        for (const cell of child.children) {
          if (!cell.isVisible) {
            continue
          }
          const cellSize = cell.naturalSize(available)
          colWidth = Math.max(colWidth, cellSize.width)
        }
        height = Math.max(height, colHeight)
        width += colWidth
      } else {
        const childSize = child.naturalSize(available)
        height = Math.max(height, childSize.height)
        width += childSize.width
      }
    }
    return new Size(width, height)
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    if (this.#isRows) {
      this.#renderRows(viewport)
    } else {
      this.#renderColumns(viewport)
    }
  }

  #renderRows(viewport: Viewport) {
    const available = viewport.contentSize
    const colWidths = this.#columnWidths(available)
    const sepWidth = this.#separatorWidth
    const separatorPad = ' '.repeat(SEPARATOR_PADDING)

    let y = 0
    const children =
      this.#direction === 'up' ? [...this.children].reverse() : this.children

    for (const child of children) {
      if (!child.isVisible) {
        continue
      }

      if (child instanceof AlignRow) {
        let rowHeight = 0
        // First pass: compute row height
        for (const cell of child.children) {
          if (!cell.isVisible) {
            continue
          }
          const cellSize = cell.naturalSize(available)
          rowHeight = Math.max(rowHeight, cellSize.height)
        }

        // Second pass: render cells at aligned positions
        let x = 0
        let col = 0
        for (const cell of child.children) {
          if (!cell.isVisible) {
            continue
          }

          if (col > 0) {
            // Draw separator
            const sepText = `${separatorPad}${this.#separator}${separatorPad}`
            for (let sy = 0; sy < rowHeight; sy++) {
              viewport.write(
                sepText,
                new Point(x, y + sy),
                this.#separatorStyle,
              )
            }
            x += sepWidth
          }

          const cellWidth = colWidths[col] ?? 0
          viewport.clipped(
            new Rect(new Point(x, y), new Size(cellWidth, rowHeight)),
            inside => {
              cell.render(inside)
            },
          )

          x += cellWidth
          col++
        }

        y += rowHeight
      } else {
        // Non-AlignRow child spans the full width
        const childSize = child.naturalSize(available)
        viewport.clipped(
          new Rect(
            new Point(0, y),
            new Size(available.width, childSize.height),
          ),
          inside => {
            child.render(inside)
          },
        )
        y += childSize.height
      }
    }
  }

  #renderColumns(viewport: Viewport) {
    const available = viewport.contentSize
    const colWidths = this.#columnWidths(available)
    const separatorPad = ' '.repeat(SEPARATOR_PADDING)

    let x = 0
    const children =
      this.#direction === 'left' ? [...this.children].reverse() : this.children

    for (const child of children) {
      if (!child.isVisible) {
        continue
      }

      if (child instanceof AlignRow) {
        let colWidth = 0
        // First pass: compute column width
        for (const cell of child.children) {
          if (!cell.isVisible) {
            continue
          }
          const cellSize = cell.naturalSize(available)
          colWidth = Math.max(colWidth, cellSize.width)
        }

        // Second pass: render cells at aligned positions
        let y = 0
        let col = 0
        for (const cell of child.children) {
          if (!cell.isVisible) {
            continue
          }

          if (col > 0) {
            // Draw separator line across the column width
            const sepText = `${separatorPad}${this.#separator}${separatorPad}`
            viewport.write(sepText, new Point(x, y), this.#separatorStyle)
            y += 1
          }

          const cellHeight = colWidths[col] ?? 0
          viewport.clipped(
            new Rect(new Point(x, y), new Size(colWidth, cellHeight)),
            inside => {
              cell.render(inside)
            },
          )

          y += cellHeight
          col++
        }

        x += colWidth
      } else {
        // Non-AlignRow child spans the full height
        const childSize = child.naturalSize(available)
        viewport.clipped(
          new Rect(
            new Point(x, 0),
            new Size(childSize.width, available.height),
          ),
          inside => {
            child.render(inside)
          },
        )
        x += childSize.width
      }
    }
  }
}

const SEPARATOR = '│'
const SEPARATOR_PADDING = 1
