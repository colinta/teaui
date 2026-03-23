import type {Viewport} from '../Viewport.js'
import {View} from '../View.js'
import {Container, Props as ContainerProps} from '../Container.js'
import {Rect, Point, Size, type Edge} from '../geometry.js'
import {
  type MouseEvent,
  type KeyEvent,
  type HotKey,
  isMouseClicked,
  isMousePressStart,
  isMousePressExit,
  isMouseEnter,
  isMouseExit,
  toHotKeyDef,
} from '../events/index.js'
import {Style} from '../Style.js'
import {Theme} from '../Theme.js'
import {define} from '../util.js'
import {System} from '../System.js'

interface Props extends ContainerProps {
  location?: Edge
  isOpen?: boolean
  onToggle?: (isOpen: boolean) => void
  hotKey?: HotKey
  title?: string
}

interface ConstructorProps extends Props {
  drawer?: View
  content?: View
}

const DRAWER_BORDER = 2
const DRAWER_BTN_SIZE = {
  vertical: new Size(3, 8),
  horizontal: new Size(8, 3),
}

export class Drawer extends Container {
  drawerView?: View
  contentView?: View

  #drawerSize = Size.zero
  #isOpen = false
  #currentDx = 0
  #location: Edge = 'left'
  #title: string | undefined
  #onToggle: Props['onToggle']
  #hotKey?: HotKey

  constructor({content, drawer, ...props}: ConstructorProps) {
    super(props)

    if (content) {
      this.add((this.contentView = content))
    }

    if (drawer) {
      this.add((this.drawerView = drawer))
    }

    this.#update(props)

    define(this, 'location', {enumerable: true})
  }

  get location() {
    return this.#location
  }
  set location(value: Edge) {
    this.#location = value
    this.invalidateSize()
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  get title(): string | undefined {
    return this.#title
  }
  set title(value: string | undefined) {
    this.#title = value
    this.invalidateRender()
  }

  #update({isOpen, location, onToggle, hotKey, title}: Props) {
    this.#title = title
    if (isOpen !== undefined) {
      this.#setIsOpen(isOpen, false)
    }

    this.#onToggle = onToggle
    this.#hotKey = hotKey
    this.#location = location ?? 'left'
  }

  /**
   * Opens the drawer (does not trigger onToggle)
   */
  open() {
    this.#setIsOpen(true, false)
  }

  /**
   * Closes the drawer (does not trigger onToggle)
   */
  close() {
    this.#setIsOpen(false, false)
  }

  /**
   * Toggles the drawer open/closed (does not trigger onToggle)
   */
  toggle() {
    this.#setIsOpen(!this.#isOpen, false)
  }

  #setIsOpen(value: boolean, report: boolean) {
    this.#isOpen = value

    if (report) {
      this.#onToggle?.(value)
    }
  }

  add(child: View, at?: number) {
    super.add(child, at)
    this.contentView = this.children[0]
    this.drawerView = this.children[1]
  }

  naturalSize(available: Size): Size {
    const [drawerSize, contentSize] = this.#saveDrawerSize(available)

    switch (this.#location) {
      case 'top':
      case 'bottom':
        return new Size(
          Math.max(drawerSize.width + DRAWER_BORDER, contentSize.width),
          Math.max(drawerSize.height, contentSize.height) +
            DRAWER_BTN_SIZE.horizontal.height,
        )
      case 'left':
      case 'right':
        return new Size(
          Math.max(drawerSize.width, contentSize.width) +
            DRAWER_BTN_SIZE.vertical.width,
          Math.max(drawerSize.height + DRAWER_BORDER, contentSize.height),
        )
    }
  }

  #targetDx(): number {
    switch (this.#isOpen ? this.#location : '') {
      case 'top':
      case 'bottom':
        return this.#drawerSize.height
      case 'left':
      case 'right':
        return this.#drawerSize.width
      default:
        return 0
    }
  }

  receiveTick(dt: number): boolean {
    const targetDx = this.#targetDx()
    let delta: number
    switch (this.#location) {
      case 'top':
      case 'bottom':
        delta = (targetDx > this.#currentDx ? 0.05 : -0.05) * dt
        break
      case 'left':
      case 'right':
        delta = (targetDx > this.#currentDx ? 0.2 : -0.2) * dt
        break
    }
    let target: number
    switch (this.#location) {
      case 'top':
      case 'bottom':
        target = this.#drawerSize.height
        break
      case 'left':
      case 'right':
        target = this.#drawerSize.width
        break
    }

    const nextDx = Math.max(0, Math.min(target, this.#currentDx + delta))
    if (nextDx !== this.#currentDx) {
      this.#currentDx = nextDx
      return true
    }

    return false
  }

  receiveKey(_: KeyEvent) {
    this.#setIsOpen(!this.#isOpen, true)
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (isMouseClicked(event)) {
      this.#setIsOpen(!this.#isOpen, true)
    }
  }

  #saveDrawerSize(available: Size) {
    let remainingSize: Size
    switch (this.#location) {
      case 'top':
      case 'bottom':
        remainingSize = available.shrink(0, DRAWER_BTN_SIZE.horizontal.height)
        break
      case 'left':
      case 'right':
        remainingSize = available.shrink(DRAWER_BTN_SIZE.vertical.width, 0)
        break
    }

    const drawerSize = this.drawerView?.naturalSize(remainingSize) ?? Size.zero
    const contentSize =
      this.contentView?.naturalSize(remainingSize) ?? Size.zero
    this.#drawerSize = drawerSize
    return [drawerSize, contentSize]
  }

  childTheme(view: View) {
    if (view === this.drawerView) {
      return this.theme
    }

    return this.parent?.childTheme(this) ?? Theme.plain
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    if (this.#hotKey) {
      viewport.registerHotKey(toHotKeyDef(this.#hotKey))
    }

    if (this.#currentDx !== this.#targetDx()) {
      viewport.registerTick()
    }

    const [drawerSize] = this.#saveDrawerSize(viewport.contentSize)

    const _uiStyle = this.theme.ui({
      isHover: this.isHover,
      isPressed: this.isPressed,
    })
    const textStyle = this.theme
      .text({
        isHover: this.isHover,
        isPressed: this.isPressed,
      })
      .merge({foreground: _uiStyle.foreground})
    const uiStyle =
      this.isHover || this.isPressed
        ? _uiStyle
        : _uiStyle.merge({
            background: textStyle.background,
          })

    switch (this.#location) {
      case 'top':
        this.#renderTop(viewport, drawerSize, uiStyle, textStyle)
        break
      case 'right':
        this.#renderRight(viewport, drawerSize, uiStyle, textStyle)
        break
      case 'bottom':
        this.#renderBottom(viewport, drawerSize, uiStyle, textStyle)
        break
      case 'left':
        this.#renderLeft(viewport, drawerSize, uiStyle, textStyle)
        break
    }
  }

  #renderTop(
    viewport: Viewport,
    drawerSize: Size,
    uiStyle: Style,
    textStyle: Style,
  ) {
    const drawerButtonRect = new Rect(
      new Point(0, ~~this.#currentDx),
      new Size(viewport.contentSize.width, DRAWER_BTN_SIZE.horizontal.height),
    )

    const contentRect = new Rect(
      new Point(0, DRAWER_BTN_SIZE.horizontal.height - 1),
      viewport.contentSize.shrink(0, DRAWER_BTN_SIZE.horizontal.height - 1),
    )

    const drawerRect = new Rect(
      new Point(1, ~~this.#currentDx - this.#drawerSize.height),
      new Size(
        drawerButtonRect.size.width - DRAWER_BORDER,
        this.#drawerSize.height,
      ),
    )

    this.#renderContent(viewport, drawerButtonRect, contentRect, drawerRect)
    this.#renderDrawerTop(viewport, drawerButtonRect, uiStyle, textStyle)
    this.#maybeRenderDrawerHeading(viewport, drawerRect)
  }

  #renderBottom(
    viewport: Viewport,
    drawerSize: Size,
    uiStyle: Style,
    textStyle: Style,
  ) {
    const drawerButtonRect = new Rect(
      new Point(
        0,
        viewport.contentSize.height -
          ~~this.#currentDx -
          DRAWER_BTN_SIZE.horizontal.height,
      ),
      new Size(viewport.contentSize.width, DRAWER_BTN_SIZE.horizontal.height),
    )

    const contentRect = new Rect(
      new Point(0, 0),
      viewport.contentSize.shrink(0, DRAWER_BTN_SIZE.horizontal.height - 1),
    )

    const drawerRect = new Rect(
      new Point(1, viewport.contentSize.height - this.#currentDx),
      new Size(
        drawerButtonRect.size.width - DRAWER_BORDER,
        this.#drawerSize.height,
      ),
    )
    this.#renderContent(viewport, drawerButtonRect, contentRect, drawerRect)
    this.#renderDrawerBottom(viewport, drawerButtonRect, uiStyle, textStyle)
    this.#maybeRenderDrawerHeading(viewport, drawerRect)
  }

  #renderRight(
    viewport: Viewport,
    drawerSize: Size,
    uiStyle: Style,
    textStyle: Style,
  ) {
    const drawerButtonRect = new Rect(
      new Point(
        viewport.contentSize.width -
          ~~this.#currentDx -
          DRAWER_BTN_SIZE.vertical.width,
        0,
      ),
      new Size(DRAWER_BTN_SIZE.vertical.width, viewport.contentSize.height),
    )

    const contentRect = new Rect(
      new Point(0, 0),
      viewport.contentSize.shrink(DRAWER_BTN_SIZE.vertical.width - 1, 0),
    )

    const drawerRect = new Rect(
      new Point(viewport.contentSize.width - this.#currentDx, 1),
      new Size(
        this.#drawerSize.width,
        drawerButtonRect.size.height - DRAWER_BORDER,
      ),
    )
    this.#renderContent(viewport, drawerButtonRect, contentRect, drawerRect)
    this.#renderDrawerRight(viewport, drawerButtonRect, uiStyle, textStyle)
    this.#maybeRenderDrawerHeading(viewport, drawerRect)
  }

  #renderLeft(
    viewport: Viewport,
    drawerSize: Size,
    uiStyle: Style,
    textStyle: Style,
  ) {
    const drawerButtonRect = new Rect(
      new Point(~~this.#currentDx, 0),
      new Size(DRAWER_BTN_SIZE.vertical.width, viewport.contentSize.height),
    )

    const contentRect = new Rect(
      new Point(DRAWER_BTN_SIZE.vertical.width - 1, 0),
      viewport.contentSize.shrink(DRAWER_BTN_SIZE.vertical.width - 1, 0),
    )

    const drawerRect = new Rect(
      new Point(this.#currentDx - this.#drawerSize.width, 1),
      new Size(
        this.#drawerSize.width,
        drawerButtonRect.size.height - DRAWER_BORDER,
      ),
    )

    this.#renderContent(viewport, drawerButtonRect, contentRect, drawerRect)
    this.#renderDrawerLeft(viewport, drawerButtonRect, uiStyle, textStyle)
    this.#maybeRenderDrawerHeading(viewport, drawerRect)
  }

  #renderContent(
    viewport: Viewport,
    drawerButtonRect: Rect,
    contentRect: Rect,
    drawerRect: Rect,
  ) {
    // contentView renders before registerMouse so the drawer can be "on top"
    const contentView = this.contentView
    const drawerView = this.drawerView
    if (!contentView || !drawerView) {
      return
    }

    viewport.clipped(contentRect, inside => {
      contentView.render(inside)
    })

    if (this.isHover) {
      viewport.registerMouse(
        ['mouse.move', 'mouse.button.left'],
        drawerButtonRect,
      )
    } else {
      let inset: Edge
      switch (this.#location) {
        case 'top':
          inset = 'bottom'
          break
        case 'right':
          inset = 'left'
          break
        case 'bottom':
          inset = 'top'
          break
        case 'left':
          inset = 'right'
          break
      }
      viewport.registerMouse(
        ['mouse.move', 'mouse.button.left'],
        drawerButtonRect.inset({[inset]: 1}),
      )
    }

    if (this.#currentDx > 0) {
      const resolvedTitle = this.#resolvedDrawerTitle()
      const hasHeading = resolvedTitle !== undefined && resolvedTitle.length > 0
      const isVertical = this.#location === 'top' || this.#location === 'bottom'

      // For top/bottom drawers, shrink drawerRect to make room for a heading row
      const contentDrawerRect =
        hasHeading && isVertical
          ? new Rect(
              drawerRect.origin.offset(0, 1),
              drawerRect.size.shrink(0, 1),
            )
          : drawerRect

      viewport.paint(this.theme.text(), drawerRect)
      viewport.clipped(contentDrawerRect, inside => {
        drawerView.render(inside)
      })
    }
  }

  #resolvedDrawerTitle(): string | undefined {
    if (this.#title !== undefined) return this.#title
    return this.drawerView?.heading
  }

  #maybeRenderDrawerHeading(viewport: Viewport, drawerRect: Rect) {
    const title = this.#resolvedDrawerTitle()
    if (!title || this.#currentDx <= 0) {
      return
    }
    this.#renderDrawerHeading(viewport, title, drawerRect)
  }

  #renderDrawerHeading(viewport: Viewport, heading: string, drawerRect: Rect) {
    const headingStyle = new Style({
      bold: true,
      background: this.theme.text().background,
    })

    let headingX: number
    let headingY: number
    let maxWidth: number

    switch (this.#location) {
      case 'left':
        // Heading on the ─ top border at y=0
        headingX = DRAWER_HEADING_X
        headingY = 0
        maxWidth = drawerRect.maxX() - DRAWER_HEADING_X - DRAWER_HEADING_PAD
        break
      case 'right':
        // Heading on the ─ top border at y=0, in the drawer area
        headingX = drawerRect.minX() + DRAWER_HEADING_X
        headingY = 0
        maxWidth = viewport.contentSize.width - headingX - DRAWER_HEADING_PAD
        break
      case 'top':
      case 'bottom':
        // Heading on the reserved first row of the drawer area
        headingX = drawerRect.minX() + DRAWER_HEADING_X
        headingY = drawerRect.minY()
        maxWidth = drawerRect.size.width - DRAWER_HEADING_X - DRAWER_HEADING_PAD
        break
    }

    if (maxWidth > 0) {
      const text = heading.slice(0, maxWidth)
      viewport.write(text, new Point(headingX, headingY), headingStyle)
    }
  }

  #renderDrawerTop(
    viewport: Viewport,
    drawerButtonRect: Rect,
    uiStyle: Style,
    textStyle: Style,
  ) {
    const drawerY = drawerButtonRect.minY(),
      minX = drawerButtonRect.minX(),
      maxX = drawerButtonRect.maxX() - 1,
      point = new Point(0, 0).mutableCopy()

    viewport.usingPen(textStyle, () => {
      for (; point.y < drawerY; point.y++) {
        point.x = minX
        viewport.write('│', point)
        point.x = maxX
        viewport.write('│', point)
      }
    })

    viewport.usingPen(uiStyle, () => {
      point.y = drawerButtonRect.minY()
      for (point.x = minX; point.x <= maxX; point.x++) {
        let drawer: [string, string, string]
        if (point.x === 0) {
          if (this.isHover) {
            drawer = ['╮', '│', '│']
          } else {
            drawer = ['╮', '│', '']
          }
        } else if (point.x === maxX) {
          if (this.isHover) {
            drawer = ['╭', '│', '│']
          } else {
            drawer = ['╭', '│', '']
          }
        } else {
          let chevron: string
          if (point.x % 2 === 0) {
            chevron = ' '
          } else if (this.#isOpen) {
            chevron = '∧'
          } else {
            chevron = '∨'
          }
          let c1: string, c2: string, c3: string
          if (this.isHover) {
            c1 = ' '
            c2 = chevron
            c3 = '─'
          } else {
            c1 = chevron
            c2 = '─'
            c3 = ''
          }
          drawer = [c1, c2, c3]
        }

        viewport.write(drawer[0], point.offset(0, 0))
        viewport.write(drawer[1], point.offset(0, 1))
        if (drawer[2] !== '') {
          viewport.write(drawer[2], point.offset(0, 2))
        }
      }
    })
  }

  #renderDrawerBottom(
    viewport: Viewport,
    drawerButtonRect: Rect,
    uiStyle: Style,
    textStyle: Style,
  ) {
    const drawerY = drawerButtonRect.maxY(),
      minX = drawerButtonRect.minX(),
      maxX = drawerButtonRect.maxX() - 1,
      point = new Point(0, drawerY).mutableCopy()

    viewport.usingPen(textStyle, () => {
      for (; point.y < viewport.contentSize.height; point.y++) {
        point.x = minX
        viewport.write('│', point)
        point.x = maxX
        viewport.write('│', point)
      }
    })

    viewport.usingPen(uiStyle, () => {
      point.y = drawerButtonRect.minY()
      for (point.x = minX; point.x <= maxX; point.x++) {
        let drawer: [string, string, string]
        if (point.x === 0) {
          if (this.isHover) {
            drawer = ['╭', '│', '│']
          } else {
            drawer = ['', '╭', '│']
          }
        } else if (point.x === maxX) {
          if (this.isHover) {
            drawer = ['╮', '│', '│']
          } else {
            drawer = ['', '╮', '│']
          }
        } else {
          let chevron: string
          if (point.x % 2 === 0) {
            chevron = ' '
          } else if (this.#isOpen) {
            chevron = '∨'
          } else {
            chevron = '∧'
          }
          let c1: string, c2: string, c3: string
          if (this.isHover) {
            c1 = '─'
            c2 = chevron
            c3 = ' '
          } else {
            c1 = ''
            c2 = '─'
            c3 = chevron
          }
          drawer = [c1, c2, c3]
        }

        if (drawer[0] !== '') {
          viewport.write(drawer[0], point.offset(0, 0))
        }
        viewport.write(drawer[1], point.offset(0, 1))
        viewport.write(drawer[2], point.offset(0, 2))
      }
    })
  }

  #renderDrawerRight(
    viewport: Viewport,
    drawerButtonRect: Rect,
    uiStyle: Style,
    textStyle: Style,
  ) {
    const drawerX = drawerButtonRect.maxX(),
      minY = drawerButtonRect.minY(),
      maxY = drawerButtonRect.maxY() - 1,
      point = new Point(drawerX, 0).mutableCopy()

    viewport.usingPen(textStyle, () => {
      for (; point.x < viewport.contentSize.width; point.x++) {
        point.y = minY
        viewport.write('─', point)
        point.y = maxY
        viewport.write('─', point)
      }
    })

    viewport.usingPen(uiStyle, () => {
      for (point.y = minY; point.y <= maxY; point.y++) {
        point.x = drawerButtonRect.minX()
        let drawer: string
        if (point.y === 0) {
          if (this.isHover) {
            drawer = '╭──'
          } else {
            drawer = '╭─'
            point.x += 1
          }
        } else if (point.y === maxY) {
          if (this.isHover) {
            drawer = '╰──'
          } else {
            drawer = '╰─'
            point.x += 1
          }
        } else {
          drawer = ''
          if (!this.isHover) {
            point.x += 1
          }
          drawer += '│'
          drawer += this.#isOpen ? '›' : '‹'
        }

        viewport.write(drawer, point)
      }
    })
  }

  #renderDrawerLeft(
    viewport: Viewport,
    drawerButtonRect: Rect,
    uiStyle: Style,
    textStyle: Style,
  ) {
    const drawerX = drawerButtonRect.minX(),
      minY = drawerButtonRect.minY(),
      maxY = drawerButtonRect.maxY() - 1,
      point = new Point(0, 0).mutableCopy()

    viewport.usingPen(textStyle, () => {
      for (; point.x < drawerX; point.x++) {
        point.y = minY
        viewport.write('─', point)
        point.y = maxY
        viewport.write('─', point)
      }
    })

    viewport.usingPen(uiStyle, () => {
      point.x = drawerX
      for (point.y = minY; point.y <= maxY; point.y++) {
        let drawer: string
        if (point.y === 0) {
          drawer = '─' + (this.isHover ? '─' : '') + '╮'
        } else if (point.y === maxY) {
          drawer = '─' + (this.isHover ? '─' : '') + '╯'
        } else {
          drawer = ''
          drawer += this.isHover ? ' ' : ''
          drawer += this.#isOpen ? '‹' : '›'
          drawer += '│'
        }

        viewport.write(drawer, point)
      }
    })
  }
}

const DRAWER_HEADING_X = 2
const DRAWER_HEADING_PAD = 1
