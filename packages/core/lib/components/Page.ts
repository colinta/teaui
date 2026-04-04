import {Container, type Props as ContainerProps} from '../Container.js'
import {Point, Rect, Size} from '../geometry.js'
import {View} from '../View.js'
import {Viewport} from '../Viewport.js'
import {System} from '../System.js'
import {
  type MouseEvent,
  type KeyEvent,
  isMouseClicked,
  isMouseEnter,
  isMouseExit,
  isMouseWheel,
} from '../events/index.js'
import {Style} from '../Style.js'
import {define} from '../util.js'

interface Props extends ContainerProps {
  activeIndex?: number
  onChange?: (index: number) => void
}

interface SectionProps extends ContainerProps {
  title?: string
}

export class Page extends Container {
  static Section: typeof Section

  #activeIndex = 0
  #onChange: ((index: number) => void) | undefined

  // Animation state
  #animating = false
  #animationElapsed = 0 // elapsed time in ms
  #animationDirection = 0 // -1 = sliding left (going forward), +1 = sliding right (going backward)
  #outgoingIndex = -1 // section index of the outgoing page
  #incomingIndex = -1 // section index of the incoming page

  // Mouse scroll state
  #scrollDx = 0
  #scrollTimeout = 0
  #disableScrollTimeout = 0

  // Dot layout (computed during render, used for mouse hit-testing)
  #dotRects: Rect[] = []
  #hoveredDot = -1
  #dotsY = 0

  static create(
    sections: ([string, View] | Section)[],
    extraProps: Props = {},
  ): Page {
    const page = new Page(extraProps)
    for (const section of sections) {
      if (section instanceof Section) {
        page.addSection(section)
      } else {
        const [title, view] = section as [string, View]
        page.addSection(title, view)
      }
    }
    return page
  }

  constructor(props: Props = {}) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({activeIndex, onChange}: Props) {
    if (activeIndex !== undefined && activeIndex !== this.#activeIndex) {
      this.#navigateTo(activeIndex)
    }
    this.#onChange = onChange
  }

  get sections(): SectionLike[] {
    return this.children.map(view =>
      view instanceof Section ? view : new ImplicitSection(view),
    )
  }

  get activeIndex() {
    return this.#activeIndex
  }

  set activeIndex(value: number) {
    if (value === this.#activeIndex) return
    this.#navigateTo(value)
  }

  addSection(title: string, view: View): void
  addSection(section: Section): void
  addSection(titleOrSection: string | Section, view?: View) {
    let sectionView: Section
    if (titleOrSection instanceof Section) {
      sectionView = titleOrSection
    } else {
      sectionView = Section.create(titleOrSection as string, view as View)
    }
    this.add(sectionView)
  }

  #navigateTo(index: number) {
    const sections = this.sections
    if (sections.length === 0) return
    index = Math.max(0, Math.min(sections.length - 1, index))
    if (index === this.#activeIndex && !this.#animating) return

    const prevIndex = this.#animating ? this.#incomingIndex : this.#activeIndex

    if (index === prevIndex) return

    this.#outgoingIndex = prevIndex
    this.#incomingIndex = index
    this.#animationDirection = index > prevIndex ? -1 : 1
    this.#animationElapsed = 0
    this.#animating = true
    this.#activeIndex = index
    this.#onChange?.(index)
    this.invalidateSize()
  }

  #hasTitles(): boolean {
    return this.sections.some(s => s.title.length > 0)
  }

  #indicatorHeight(): number {
    return 1 + (this.#hasTitles() ? 1 : 0)
  }

  naturalSize(available: Size): Size {
    const indicatorHeight = this.#indicatorHeight()
    const childAvailable = available.shrink(0, indicatorHeight)
    let maxWidth = 0,
      maxHeight = 0
    for (const section of this.sections) {
      const size = section.naturalSize(childAvailable)
      maxWidth = Math.max(maxWidth, size.width)
      maxHeight = Math.max(maxHeight, size.height)
    }
    return new Size(maxWidth, maxHeight + indicatorHeight)
  }

  receiveKey(event: KeyEvent) {
    const sections = this.sections
    if (sections.length === 0) return

    switch (event.name) {
      case 'pagedown':
        this.#navigateTo(this.#activeIndex + 1)
        break
      case 'pageup':
        this.#navigateTo(this.#activeIndex - 1)
        break
      case 'home':
        this.#navigateTo(0)
        break
      case 'end':
        this.#navigateTo(sections.length - 1)
        break
    }
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (isMouseWheel(event)) {
      if (this.#disableScrollTimeout > 0) return

      if (
        event.name === 'mouse.wheel.up' ||
        event.name === 'mouse.wheel.left'
      ) {
        this.#scrollDx -= 1
      } else if (
        event.name === 'mouse.wheel.down' ||
        event.name === 'mouse.wheel.right'
      ) {
        this.#scrollDx += 1
      }

      if (this.#scrollDx <= -SCROLL_THRESHOLD) {
        this.#scrollDx = 0
        this.#scrollTimeout = 0
        this.#disableScrollTimeout = DISABLE_TIMEOUT
        this.#navigateTo(this.#activeIndex - 1)
      } else if (this.#scrollDx >= SCROLL_THRESHOLD) {
        this.#scrollDx = 0
        this.#scrollTimeout = 0
        this.#disableScrollTimeout = DISABLE_TIMEOUT
        this.#navigateTo(this.#activeIndex + 1)
      } else {
        this.#scrollTimeout = SCROLL_TIMEOUT
        this.invalidateSize()
      }
      return
    }

    // Update dot hover based on mouse position
    if (isMouseExit(event)) {
      this.#hoveredDot = -1
    } else {
      this.#hoveredDot = this.#dotIndexAt(event.position)
    }

    if (isMouseClicked(event)) {
      const dotIndex = this.#dotIndexAt(event.position)
      if (dotIndex >= 0) {
        this.#navigateTo(dotIndex)
      }
    }
  }

  #dotIndexAt(position: Point): number {
    for (let i = 0; i < this.#dotRects.length; i++) {
      if (this.#dotRects[i].includes(position)) {
        return i
      }
    }
    return -1
  }

  receiveTick(dt: number): boolean {
    if (this.#disableScrollTimeout > 0) {
      this.#disableScrollTimeout -= dt
      if (this.#disableScrollTimeout <= 0) {
        this.#disableScrollTimeout = 0
      }
    }

    if (this.#scrollDx !== 0) {
      this.#scrollTimeout -= dt
      if (this.#scrollTimeout <= 0) {
        this.#scrollDx = 0
        this.#scrollTimeout = 0
      }
    }

    this.#animationElapsed += dt

    if (this.#animationElapsed >= ANIMATION_DURATION) {
      this.#animating = false
      this.#animationElapsed = 0
      this.#outgoingIndex = -1
      this.#incomingIndex = -1
      this.invalidateSize()
      return true
    }

    this.invalidateSize()
    return true
  }

  render(viewport: Viewport) {
    const sections = this.sections
    if (sections.length === 0) return

    viewport.registerFocus()
    viewport.registerMouse(['mouse.button.left', 'mouse.move', 'mouse.wheel'])

    if (
      this.#animating ||
      this.#scrollDx !== 0 ||
      this.#disableScrollTimeout > 0
    ) {
      viewport.registerTick()
    }

    const indicatorHeight = this.#indicatorHeight()
    const contentHeight = viewport.contentSize.height - indicatorHeight
    const contentWidth = viewport.contentSize.width

    if (contentHeight > 0) {
      const contentRect = new Rect([0, 0], [contentWidth, contentHeight])

      if (this.#animating && this.#outgoingIndex >= 0) {
        const t = Math.min(1, this.#animationElapsed / ANIMATION_DURATION)
        const eased = easeInOut(t)
        const offset = Math.round(eased * contentWidth)
        // Both pages slide in the same direction:
        //   forward  (direction = -1): both slide left
        //   backward (direction = +1): both slide right
        const outX = this.#animationDirection * offset
        const inX = this.#animationDirection * (offset - contentWidth)

        const outgoing = sections[this.#outgoingIndex]
        const incoming = sections[this.#incomingIndex]

        viewport.clipped(contentRect, inner => {
          if (outgoing) {
            inner.clipped(
              new Rect([outX, 0], [contentWidth, contentHeight]),
              inner2 => outgoing.render(inner2),
            )
          }
          if (incoming) {
            inner.clipped(
              new Rect([inX, 0], [contentWidth, contentHeight]),
              inner2 => incoming.render(inner2),
            )
          }
        })
      } else {
        const active = sections[this.#activeIndex]
        if (active) {
          viewport.clipped(contentRect, inner => {
            active.render(inner)
          })
        }
      }
    }

    // Render indicator area
    this.#renderIndicator(viewport, sections, contentHeight)
  }

  #renderIndicator(
    viewport: Viewport,
    sections: SectionLike[],
    contentY: number,
  ) {
    const textStyle = this.theme.text()
    const totalDotsWidth = sections.length * DOT_WIDTH
    const startX = Math.max(
      0,
      Math.floor((viewport.contentSize.width - totalDotsWidth) / 2),
    )

    const hasTitles = this.#hasTitles()
    const indicatorHeight = this.#indicatorHeight()
    const dotsY = contentY + (hasTitles ? 1 : 0)

    // Paint subtle background across the indicator area
    const bgStyle = this.#controlsBackground()
    viewport.paint(
      bgStyle,
      new Rect([0, contentY], [viewport.contentSize.width, indicatorHeight]),
    )

    // Render title if any section has a title
    if (hasTitles) {
      const titleY = contentY
      // Show hovered dot's title, or active section's title
      const titleIndex =
        this.#hoveredDot >= 0 ? this.#hoveredDot : this.#activeIndex
      const title = sections[titleIndex]?.title ?? ''
      if (title.length > 0) {
        const titleX = Math.max(
          0,
          Math.floor((viewport.contentSize.width - title.length) / 2),
        )
        viewport.write(
          title,
          new Point(titleX, titleY),
          textStyle.merge(bgStyle),
        )
      }
    }

    // Render dots and store rects for hit-testing
    this.#dotRects = []
    this.#dotsY = dotsY
    for (let i = 0; i < sections.length; i++) {
      const dotX = startX + i * DOT_WIDTH
      const dotChar = i === this.#activeIndex ? DOT_ACTIVE : DOT_INACTIVE
      // DOT_WIDTH = 3: [pad] [dot] [pad]
      const dotRect = new Rect([dotX, dotsY], [DOT_WIDTH, 1])
      this.#dotRects.push(dotRect)

      const isHover = this.#hoveredDot === i
      const style = this.#dotStyle(i === this.#activeIndex, isHover)

      if (isHover) {
        viewport.paint(style, dotRect)
      }
      viewport.write(dotChar, new Point(dotX + 1, dotsY), style)
    }
  }

  #controlsBackground(): Style {
    return new Style({background: this.theme.ui().background})
  }

  #dotStyle(isActive: boolean, isHover: boolean): Style {
    if (isHover) {
      const {foreground, background} = this.theme.ui({isHover: true})
      return new Style({bold: true, foreground, background})
    }
    const background = this.theme.ui().background
    if (isActive) {
      return new Style({bold: true, background})
    }
    return new Style({dim: true, background})
  }
}

class Section extends Container {
  #title: string | undefined

  static create(
    title: string,
    child: View,
    extraProps: Omit<SectionProps, 'title'> = {},
  ) {
    return new Section({title, child, ...extraProps})
  }

  constructor({title, ...props}: SectionProps) {
    super(props)
    this.#title = title
    define(this, 'title', {enumerable: true})
  }

  /**
   * Returns the explicit title if set, otherwise falls back to the first
   * child's `heading` property.
   */
  get title() {
    return this.#title ?? this.children[0]?.heading ?? ''
  }
  set title(value: string) {
    this.#title = value
    this.invalidateSize()
  }

  update({title, ...props}: SectionProps) {
    if (title !== undefined) {
      this.title = title
    }
    super.update(props)
  }
}

/**
 * Lightweight wrapper so non-Section children can be treated uniformly.
 * Delegates rendering and sizing to the underlying view.
 */
class ImplicitSection {
  readonly #view: View

  constructor(view: View) {
    this.#view = view
  }

  get title(): string {
    return this.#view.heading ?? ''
  }

  naturalSize(available: Size): Size {
    return this.#view.naturalSize(available)
  }

  render(viewport: Viewport): void {
    this.#view.render(viewport)
  }
}

type SectionLike = Section | ImplicitSection

Page.Section = Section

const DOT_ACTIVE = '●'
const DOT_INACTIVE = '○'
const DOT_WIDTH = 3
const SCROLL_THRESHOLD = 3
const SCROLL_TIMEOUT = 3000 // ms to accrue scroll events before resetting
const DISABLE_TIMEOUT = 300 // ms to ignore scroll events after a page change
const ANIMATION_DURATION = 400 // ms

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}
