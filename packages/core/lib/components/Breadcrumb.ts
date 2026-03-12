import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {Point, Size} from '../geometry.js'
import {type MouseEvent, isMouseClicked} from '../events/index.js'
import {type Color} from '../Color.js'
import {Style} from '../Style.js'
import {System} from '../System.js'

export interface BreadcrumbItem {
  title: string
  onPress?: () => void
}

export interface Props extends ContainerProps {
  items: BreadcrumbItem[]
  isActive?: boolean // default true — controls whether bg colours are shown
  palette?: {fg: Color; bg: Color}[]
}

export class Breadcrumb extends Container {
  #items: BreadcrumbItem[] = []
  #isActive: boolean = true
  #palette: {fg: Color; bg: Color}[] = DEFAULT_PALETTE
  #mouseRegions: Array<{item: BreadcrumbItem; startX: number; width: number}> =
    []

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

  naturalSize(available: Size): Size {
    if (this.#items.length === 0) {
      return new Size(0, 1)
    }

    let width = 0

    for (let i = 0; i < this.#items.length; i++) {
      const item = this.#items[i]
      // Add padding around text (space before and after)
      width += 2 + unicode.lineWidth(item.title)

      // Add separator width (except for the first item which gets home icon)
      if (i === 0) {
        width += 2 // " 🏠 "
      } else {
        width += 1 // "" arrow separator
      }
    }

    // Add final arrow separator
    width += 1 // ""

    return new Size(width, 1)
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (isMouseClicked(event)) {
      // Find which breadcrumb item was clicked
      for (const region of this.#mouseRegions) {
        if (
          event.position.x >= region.startX &&
          event.position.x < region.startX + region.width
        ) {
          region.item.onPress?.()
          break
        }
      }
    }
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty || this.#items.length === 0) {
      return super.render(viewport)
    }

    viewport.registerMouse(['mouse.button.left', 'mouse.move'])

    this.#mouseRegions = []
    let currentX = 0

    for (let i = 0; i < this.#items.length; i++) {
      const item = this.#items[i]
      const isFirst = i === 0
      const isLast = i === this.#items.length - 1
      const colorIndex = i % this.#palette.length
      const colors = this.#palette[colorIndex]
      const nextColors = !isLast
        ? this.#palette[(i + 1) % this.#palette.length]
        : null

      let segmentText = ''
      let segmentWidth = 0

      if (isFirst) {
        // First item gets home icon
        segmentText = ` 🏠 ${item.title} `
        segmentWidth = unicode.lineWidth(segmentText)
      } else {
        // Other items get arrow separator
        segmentText = ` ${item.title} `
        segmentWidth = 1 + unicode.lineWidth(segmentText) // +1 for arrow
      }

      // Register mouse region for this segment
      this.#mouseRegions.push({
        item,
        startX: currentX + (isFirst ? 0 : 1), // Skip the arrow for click detection
        width: segmentWidth - (isFirst ? 0 : 1),
      })

      if (this.#isActive) {
        // Active rendering with colors and powerline arrows
        if (!isFirst) {
          // Render arrow separator with previous bg as fg, current bg as bg
          const prevColors = this.#palette[(i - 1) % this.#palette.length]
          const arrowStyle = new Style({
            foreground: prevColors.bg,
            background: colors.bg,
          })
          viewport.write('', new Point(currentX, 0), arrowStyle)
          currentX += 1
        }

        // Render segment with colors
        const segmentStyle = new Style({
          foreground: colors.fg,
          background: colors.bg,
        })

        const content = isFirst ? segmentText : segmentText
        for (let j = 0; j < content.length; j++) {
          if (currentX + j < viewport.contentSize.width) {
            viewport.write(content[j], new Point(currentX + j, 0), segmentStyle)
          }
        }
        currentX += content.length
      } else {
        // Inactive rendering - plain text with muted separators
        if (!isFirst) {
          // Render muted arrow
          const mutedStyle = new Style({
            foreground: 'gray',
          })
          viewport.write('', new Point(currentX, 0), mutedStyle)
          currentX += 1
        }

        // Render plain text
        const plainStyle = this.theme.ui({})
        const content = isFirst ? segmentText : segmentText
        for (let j = 0; j < content.length; j++) {
          if (currentX + j < viewport.contentSize.width) {
            viewport.write(content[j], new Point(currentX + j, 0), plainStyle)
          }
        }
        currentX += content.length
      }
    }

    // Render final arrow for active state
    if (this.#isActive && this.#items.length > 0) {
      const lastColors =
        this.#palette[(this.#items.length - 1) % this.#palette.length]
      const finalArrowStyle = new Style({
        foreground: lastColors.bg,
        background: 'default',
      })
      if (currentX < viewport.contentSize.width) {
        viewport.write('', new Point(currentX, 0), finalArrowStyle)
      }
    }

    super.render(viewport)
  }
}

// Default color palette - harmonious terminal colors
const DEFAULT_PALETTE: {fg: Color; bg: Color}[] = [
  {fg: 'white', bg: 'blue'},
  {fg: 'white', bg: 'green'},
  {fg: 'white', bg: 'magenta'},
  {fg: 'white', bg: 'cyan'},
  {fg: 'white', bg: 'yellow'},
  {fg: 'white', bg: 'red'},
]
