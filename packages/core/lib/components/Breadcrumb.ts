import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {Point, Size} from '../geometry.js'
import {
  type MouseEvent,
  isMouseClicked,
  isMouseEnter,
  isMouseExit,
  isMouseMove,
} from '../events/index.js'
import {type Color} from '../Color.js'
import {Style} from '../Style.js'
import {System} from '../System.js'

export interface BreadcrumbItem {
  title: string
  onPress?: () => void
}

export interface PaletteEntry {
  fg: Color
  bg: Color
  /** Foreground colour used on hover. Falls back to fg. */
  fgHover?: Color
  /** Background colour used on hover. Falls back to brightenColor(bg). */
  bgHover?: Color
}

export interface Props extends ContainerProps {
  items: BreadcrumbItem[]
  isActive?: boolean // default true — controls whether bg colours are shown
  palette?: PaletteEntry[]
}

/**
 * The measured layout of a single breadcrumb segment, computed once per render.
 */
interface SegmentRegion {
  /** Index into the items array */
  index: number
  /** X offset where the arrow starts (equal to textX for the first item) */
  arrowX: number
  /** Width of the leading arrow (0 for the first item) */
  arrowWidth: number
  /** X offset where the padded title text starts */
  textX: number
  /** Width of the padded title text (including surrounding spaces) */
  textWidth: number
}

const MAX_TITLE_WIDTH = 25

export class Breadcrumb extends Container {
  #items: BreadcrumbItem[] = []
  #isActive: boolean = true
  #palette: PaletteEntry[] = DEFAULT_PALETTE
  #segments: SegmentRegion[] = []
  #hoverIndex: number | null = null

  constructor(props: Props) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({items, isActive, palette}: Props) {
    this.#items = items ?? []
    this.#isActive = isActive ?? true
    this.#palette = palette ?? DEFAULT_PALETTE
  }

  /**
   * Given a Color, return a brighter version suitable for hover highlighting.
   * Maps standard terminal colours → their bright variants.
   */
  static brightenColor(color: Color): Color {
    if (typeof color !== 'string') {
      return color
    }
    const map: Record<string, Color> = {
      black: 'gray',
      red: 'brightRed',
      green: 'brightGreen',
      yellow: 'brightYellow',
      blue: 'brightBlue',
      magenta: 'brightMagenta',
      cyan: 'brightCyan',
      white: 'brightWhite',
      gray: 'brightWhite',
      grey: 'brightWhite',
    }
    return map[color] ?? color
  }

  /**
   * Compute the styles for a breadcrumb segment, accounting for hover state.
   *
   * Returns { segmentStyle, arrowStyle, finalArrowStyle } where arrowStyle is
   * the style for the leading arrow (left separator) and finalArrowStyle is
   * only set for the last item (the trailing arrow).
   *
   * @param colors     - fg/bg for this item
   * @param prevColors - fg/bg for the previous item (null if first)
   * @param nextColors - fg/bg for the next item (null if last — used for trailing arrow)
   * @param isHovered  - whether this item is being hovered
   * @param isFirst    - whether this is the first item
   * @param isLast     - whether this is the last item
   * @param prevHovered - whether the previous item is hovered (affects this item's left arrow)
   */
  static highlightStyles(
    colors: PaletteEntry,
    prevColors: PaletteEntry | null,
    isHovered: boolean,
    isActive: boolean,
    isFirst: boolean,
    isLast: boolean,
    prevHovered: boolean,
  ): {
    segmentStyle: Style
    arrowStyle: Style | null
    finalArrowStyle: Style | null
  } {
    const bg = isHovered ? Breadcrumb.hoverBg(colors) : colors.bg
    const fg = isHovered ? Breadcrumb.hoverFg(colors) : colors.fg

    const segmentStyle = new Style({
      foreground: fg,
      background: bg,
      underline: isHovered && !isActive,
    })

    let arrowStyle: Style | null = null
    if (!isFirst && prevColors) {
      // The left arrow's fg = previous item's bg, bg = this item's bg
      const prevBg = prevHovered
        ? Breadcrumb.hoverBg(prevColors)
        : prevColors.bg
      arrowStyle = new Style({
        foreground: prevBg,
        background: bg,
      })
    }

    let finalArrowStyle: Style | null = null
    if (isLast) {
      finalArrowStyle = new Style({
        foreground: bg,
        background: 'default',
      })
    }

    return {segmentStyle, arrowStyle, finalArrowStyle}
  }

  /**
   * Resolve the hover foreground for a palette entry.
   * Uses the explicit `fgHover` colour if provided, otherwise falls back to `fg`.
   */
  static hoverFg(entry: PaletteEntry): Color {
    return entry.fgHover ?? entry.fg
  }

  /**
   * Resolve the hover background for a palette entry.
   * Uses the explicit `bgHover` colour if provided, otherwise falls back to
   * `brightenColor(bg)`.
   */
  static hoverBg(entry: PaletteEntry): Color {
    return entry.bgHover ?? Breadcrumb.brightenColor(entry.bg)
  }

  /**
   * Build a clipped title string: truncates to MAX_TITLE_WIDTH and adds "…" if needed.
   */
  static clippedTitle(title: string): string {
    const width = unicode.lineWidth(title)
    if (width <= MAX_TITLE_WIDTH) {
      return title
    }
    // Truncate by characters until we fit (accounting for wide chars)
    let result = ''
    let w = 0
    for (const ch of title) {
      const cw = unicode.lineWidth(ch)
      if (w + cw > MAX_TITLE_WIDTH - 1) {
        break
      }
      result += ch
      w += cw
    }
    return result + '…'
  }

  /**
   * Measure the segments for the current items. This builds the SegmentRegion
   * array so that mouse hit-testing works correctly.
   */
  static measureSegments(items: BreadcrumbItem[]): SegmentRegion[] {
    const segments: SegmentRegion[] = []
    let x = 0

    for (let i = 0; i < items.length; i++) {
      const title = Breadcrumb.clippedTitle(items[i].title)
      const isFirst = i === 0

      if (isFirst) {
        // " 🏠 {title} " — no leading arrow
        const text = ` 🏠 ${title} `
        const textWidth = unicode.lineWidth(text)
        segments.push({
          index: i,
          arrowX: x,
          arrowWidth: 0,
          textX: x,
          textWidth,
        })
        x += textWidth
      } else {
        // Leading arrow (1 cell) then " {title} "
        const arrowX = x
        const arrowWidth = 1
        const textX = x + arrowWidth
        const text = ` ${title} `
        const textWidth = unicode.lineWidth(text)
        segments.push({
          index: i,
          arrowX,
          arrowWidth,
          textX,
          textWidth,
        })
        x += arrowWidth + textWidth
      }
    }

    return segments
  }

  naturalSize(available: Size): Size {
    if (this.#items.length === 0) {
      return new Size(0, 1)
    }

    const segments = Breadcrumb.measureSegments(this.#items)
    const last = segments[segments.length - 1]
    // Total width = end of last segment + 1 for the trailing arrow
    const width = last.textX + last.textWidth + 1

    return new Size(width, 1)
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (isMouseExit(event)) {
      this.#hoverIndex = null
    } else if (isMouseEnter(event) || isMouseMove(event)) {
      this.#hoverIndex = this.#indexAtX(event.position.x)
    }

    if (isMouseClicked(event)) {
      const index = this.#indexAtX(event.position.x)
      if (index !== null) {
        this.#items[index]?.onPress?.()
      }
    }
  }

  #indexAtX(x: number): number | null {
    for (const seg of this.#segments) {
      // Hit test against the full segment area (arrow + text)
      const segStart = seg.arrowX
      const segEnd = seg.textX + seg.textWidth
      if (x >= segStart && x < segEnd) {
        return seg.index
      }
    }
    return null
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty || this.#items.length === 0) {
      return super.render(viewport)
    }

    viewport.registerMouse(['mouse.button.left', 'mouse.move'])

    this.#segments = Breadcrumb.measureSegments(this.#items)

    for (const seg of this.#segments) {
      const i = seg.index
      const item = this.#items[i]
      const isFirst = i === 0
      const isLast = i === this.#items.length - 1
      const title = Breadcrumb.clippedTitle(item.title)
      const isHovered = this.#hoverIndex === i
      const prevHovered = this.#hoverIndex === i - 1

      if (this.#isActive) {
        const colorIndex = i % this.#palette.length
        const colors = this.#palette[colorIndex]
        const prevColors = !isFirst
          ? this.#palette[(i - 1) % this.#palette.length]
          : null

        const {segmentStyle, arrowStyle, finalArrowStyle} =
          Breadcrumb.highlightStyles(
            colors,
            prevColors,
            isHovered,
            this.#isActive,
            isFirst,
            isLast,
            prevHovered,
          )

        // Draw leading arrow
        if (!isFirst && arrowStyle) {
          viewport.write(ACTIVE_ARROW, new Point(seg.arrowX, 0), arrowStyle)
        }

        // Draw padded text
        const text = isFirst ? ` 🏠 ${title} ` : ` ${title} `
        let x = seg.textX
        for (const ch of text) {
          if (x < viewport.contentSize.width) {
            viewport.write(ch, new Point(x, 0), segmentStyle)
          }
          x += unicode.lineWidth(ch)
        }

        // Draw trailing arrow for last item
        if (isLast && finalArrowStyle) {
          const trailX = seg.textX + seg.textWidth
          if (trailX < viewport.contentSize.width) {
            viewport.write(ACTIVE_ARROW, new Point(trailX, 0), finalArrowStyle)
          }
        }
      } else {
        // Inactive rendering — plain text with muted separators
        if (!isFirst) {
          const mutedStyle = new Style({foreground: 'gray'})
          viewport.write(INACTIVE_ARROW, new Point(seg.arrowX, 0), mutedStyle)
        }

        const plainStyle = isHovered
          ? new Style({underline: true})
          : this.theme.ui({})
        const text = isFirst ? ` 🏠 ${title} ` : ` ${title} `
        let x = seg.textX
        for (const ch of text) {
          if (x < viewport.contentSize.width) {
            viewport.write(ch, new Point(x, 0), plainStyle)
          }
          x += unicode.lineWidth(ch)
        }
      }
    }

    super.render(viewport)
  }
}

// Default colour palette — 12-bit colours with pre-computed hover variants
const DEFAULT_PALETTE: PaletteEntry[] = [
  {fg: '#333', fgHover: '#333', bg: '#817', bgHover: '#c256ad'},
  {fg: '#333', fgHover: '#333', bg: '#a35', bgHover: '#e76d87'},
  {fg: '#333', fgHover: '#333', bg: '#c66', bgHover: '#ff9d9a'},
  {fg: '#333', fgHover: '#333', bg: '#e94', bgHover: '#ffd281'},
  {fg: '#333', fgHover: '#333', bg: '#ed0', bgHover: '#ffff77'},
  {fg: '#333', fgHover: '#333', bg: '#9d5', bgHover: '#d2ff93'},
  {fg: '#333', fgHover: '#333', bg: '#4d8', bgHover: '#8bffc0'},
  {fg: '#333', fgHover: '#333', bg: '#2cb', bgHover: '#79fff4'},
  {fg: '#333', fgHover: '#333', bg: '#0bc', bgHover: '#71f5ff'},
  {fg: '#333', fgHover: '#333', bg: '#09c', bgHover: '#66d2ff'},
  {fg: '#333', fgHover: '#333', bg: '#36b', bgHover: '#679df7'},
  {fg: '#333', fgHover: '#333', bg: '#639', bgHover: '#996ad3'},
]

// Arrow constants for breadcrumb separators
const INACTIVE_ARROW = '' // For inactive/muted breadcrumbs
const ACTIVE_ARROW = '' // For active breadcrumbs (Powerline right triangle)
