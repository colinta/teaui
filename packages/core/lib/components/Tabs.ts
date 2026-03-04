import {Container, type Props as ContainerProps} from '../Container.js'
import {Point, Rect, Size} from '../geometry.js'
import {Style} from '../Style.js'
import {Text} from './Text.js'
import {View} from '../View.js'
import {Viewport} from '../Viewport.js'
import {System} from '../System.js'
import {isMouseClicked, type MouseEvent} from '../events/index.js'
import {define} from '../util.js'

interface Props extends ContainerProps {
  /**
   * Draw a border around the content.
   * @default true
   */
  border?: boolean
}

interface TabProps extends ContainerProps {
  title?: string
}

// tabs = new Tabs()
// tabs.addTab('title', tab)
// tabs.addTab(new Text({text: 'title', style: …}), tab)
//
// tabs.add()
export class Tabs extends Container {
  static Section: typeof Section
  #selectedTab = 0
  #separatorLocation: [number, number] | undefined
  #separatorWidths: number[] = []
  #border: boolean = false

  static create(
    tabs: ([string, View] | Section)[],
    extraProps: Props = {},
  ): Tabs {
    const tabsView = new Tabs(extraProps)
    for (const tab of tabs) {
      if (tab instanceof Section) {
        tabsView.addTab(tab)
      } else {
        const [title, view] = tab as [string, View]
        tabsView.addTab(title, view)
      }
    }

    return tabsView
  }

  constructor(props: Props = {}) {
    super(props)
    this.#update(props)
  }

  get tabs() {
    return this.children.filter(view => view instanceof Section)
  }
  get tabTitles() {
    return this.children.filter(view => view instanceof TabTitle)
  }

  update(props: Props) {
    super.update(props)
    this.#update(props)
  }

  #update({border}: Props) {
    this.#border = border ?? true
  }

  addTab(tab: Section): void
  addTab(title: string, child: View): void
  addTab(titleOrTab: string | Section, child?: View) {
    let tabView: Section
    if (titleOrTab instanceof Section) {
      tabView = titleOrTab
    } else {
      tabView = Section.create(titleOrTab as string, child as View)
    }

    this.add(tabView)
  }

  add(child: View, at?: number) {
    if (child instanceof Section) {
      child.titleView.onClick = tab => this.#selected(tab)
      super.add(child.titleView)
    }
    super.add(child, at)
  }

  removeChild(child: View) {
    if (child instanceof Section && child.titleView) {
      super.removeChild(child.titleView)
    }

    super.removeChild(child)
  }

  #selected(tab: TabTitle) {
    const tabTitles = this.tabTitles
    const index = tabTitles.indexOf(tab)
    if (index === -1) {
      return
    }

    this.#selectedTab = index
  }

  naturalSize(available: Size) {
    const remainingSize = available.mutableCopy()
    const tabTitleSize = this.tabTitles.reduce((size, tab, index) => {
      const tabSize = tab.naturalSize(remainingSize).mutableCopy()
      size.width += tabSize.width
      size.height = Math.max(size.height, tabSize.height)
      remainingSize.width = Math.max(0, remainingSize.width - tabSize.width)

      return size
    }, Size.zero.mutableCopy())

    const childSize = Size.zero.mutableCopy()
    const availableChildSize = available.shrink(0, tabTitleSize.height)
    for (const tab of this.tabs) {
      const tabSize = tab.naturalSize(availableChildSize)
      childSize.width = Math.max(childSize.width, tabSize.width)
      childSize.height = Math.max(childSize.height, tabSize.height)
    }

    return new Size(
      Math.max(tabTitleSize.width, childSize.width) + (this.#border ? 3 : 0),
      tabTitleSize.height + childSize.height + (this.#border ? 1 : 0),
    )
  }

  receiveTick(dt: number) {
    if (
      this.#separatorLocation === undefined ||
      this.#selectedTab >= this.#separatorWidths.length
    ) {
      return false
    }

    const [start, stop] = this.#separatorWidths.reduce(
      ([start, stop, prev], width, index) =>
        index === this.#selectedTab
          ? [start, stop + width, 0]
          : index > this.#selectedTab
            ? [start, stop, 0]
            : [start + width, stop + width, width],
      [0, 0, 0] as [number, number, number],
    )
    const dx = dt / 20
    if (start < this.#separatorLocation[0]) {
      this.#separatorLocation[0] = Math.max(
        start,
        this.#separatorLocation[0] - dx,
      )
    } else if (start > this.#separatorLocation[0]) {
      this.#separatorLocation[0] = Math.min(
        start,
        this.#separatorLocation[0] + dx,
      )
    }

    if (stop > this.#separatorLocation[1]) {
      this.#separatorLocation[1] = Math.min(
        stop,
        this.#separatorLocation[1] + dx,
      )
    } else if (stop < this.#separatorLocation[1]) {
      this.#separatorLocation[1] = Math.max(
        stop,
        this.#separatorLocation[1] - dx,
      )
    } else {
      return false
    }

    if (this.#separatorLocation[1] <= this.#separatorLocation[0] + 1) {
      this.#separatorLocation[1] = Math.min(
        stop,
        this.#separatorLocation[0] + 1,
      )
    }

    return true
  }

  render(viewport: Viewport) {
    viewport.registerTick()

    const remainingSize = viewport.contentSize.mutableCopy()
    const tabInfo: [Rect, TabTitle][] = []
    const separatorWidths: number[] = []
    let x = this.#border ? 2 : 0,
      tabHeight = 0
    this.tabTitles.forEach((tab, index) => {
      const tabRect = new Rect(new Point(x, 0), tab.naturalSize(remainingSize))
      tabInfo.push([tabRect, tab])
      remainingSize.width -= tabRect.size.width

      if (
        this.#separatorLocation === undefined &&
        this.#selectedTab === index
      ) {
        this.#separatorLocation = [x, x + tabRect.size.width]
      }

      x += tabRect.size.width
      tabHeight = Math.max(
        tabHeight,
        tabRect.size.height - TAB_SEPARATOR_HEIGHT,
      )

      separatorWidths.push(tabRect.size.width)
    })

    this.#selectedTab = Math.min(separatorWidths.length - 1, this.#selectedTab)
    this.#separatorWidths = separatorWidths
    if (this.#separatorLocation) {
      this.#renderSeparator(
        viewport,
        tabHeight,
        separatorWidths,
        this.#separatorLocation,
      )
    }

    if (this.#border) {
      const borderRect = viewport.contentRect.inset(
        tabHeight + TAB_SEPARATOR_HEIGHT - 1,
        0,
        0,
      )
      viewport.clipped(borderRect, inner =>
        this.#renderBorder(inner, this.#separatorWidths),
      )
    }

    tabInfo.forEach(([tabRect, tab]) => {
      viewport.clipped(tabRect, inner => tab.render(inner))
    })

    const selectedTab = this.tabs.at(this.#selectedTab)
    if (selectedTab) {
      const childRect = viewport.contentRect.inset(
        tabHeight + TAB_SEPARATOR_HEIGHT,
        this.#border ? 1 : 0,
        this.#border ? 1 : 0,
      )
      viewport.clipped(childRect, inner => {
        selectedTab.render(inner)
      })
    }
  }

  #renderBorder(viewport: Viewport, separatorWidths: number[]) {
    const totalWidth = separatorWidths.reduce((a, b) => a + b, 2)
    for (let x = viewport.contentSize.width - 2; x > 0; x--) {
      if (x === totalWidth) {
        viewport.write('╶', new Point(x, 0))
      } else if (x > totalWidth) {
        viewport.write('─', new Point(x, 0))
      }

      viewport.write('─', new Point(x, viewport.contentSize.height - 1))
    }
    for (let y = viewport.contentSize.height - 2; y > 0; y--) {
      viewport.write('│', new Point(0, y))
      viewport.write('│', new Point(viewport.contentSize.width - 1, y))
    }
    viewport.write('┌╴', new Point(0, 0))
    viewport.write('┐', new Point(viewport.contentSize.width - 1, 0))
    viewport.write('└', new Point(0, viewport.contentSize.height - 1))
    viewport.write(
      '┘',
      new Point(
        viewport.contentSize.width - 1,
        viewport.contentSize.height - 1,
      ),
    )
  }

  #renderSeparator(
    viewport: Viewport,
    tabHeight: number,
    separatorWidths: number[],
    separatorLocation: [number, number],
  ) {
    // separatorLocation is rounded down in this function
    let xLeft = this.#border ? 2 : 0,
      xRight = 0,
      didDrawSeparator = false
    const [separatorStart, separatorStop] = [
      ~~separatorLocation[0] + xLeft,
      ~~separatorLocation[1] + xLeft,
    ]

    viewport.paint(
      new Style({
        background: this.theme.ui().background,
      }),
      new Rect(
        [separatorStart, 0],
        [separatorStop - separatorStart, tabHeight + 1],
      ),
    )

    separatorWidths.forEach((separatorWidth, index) => {
      const tab = this.tabs.at(index)
      const isHover = tab?.isHover ?? false
      xRight = xLeft + separatorWidth
      let underline
      if (xLeft >= separatorStart && xLeft <= separatorStop) {
        const xMid = Math.min(separatorStop, xRight)
        const u1 = '━'.repeat(xMid - xLeft)
        const u2 = dashesLeft(xRight - separatorStop, isHover)
        underline = u1 + u2
        didDrawSeparator = false
      } else if (xRight >= separatorStart && xLeft < separatorStop) {
        const xMid = Math.min(separatorStop, xRight)
        const u0 = dashesRight(separatorStart - xLeft, isHover)
        const u1 = '━'.repeat(xMid - separatorStart)
        const u2 = dashesLeft(xRight - separatorStop, isHover)
        underline = u0 + u1 + u2
        didDrawSeparator = xRight > separatorStop
      } else if (didDrawSeparator) {
        underline = dashesLeft(separatorWidth, isHover)
        didDrawSeparator = false
      } else if (xRight === separatorStart) {
        underline = dashesRight(separatorWidth, isHover)
      } else {
        underline = dashes(separatorWidth, isHover)
      }
      viewport.write(underline, new Point(xLeft, tabHeight))
      xLeft += separatorWidth
    })
  }
}

class TabTitle extends Container {
  #textView: Text
  onClick: ((tab: TabTitle) => void) | undefined

  constructor(title: string) {
    super({})

    this.#textView = new Text({
      text: title ?? '',
      style: this.titleStyle,
    })
    this.add(this.#textView)
  }

  get title() {
    return this.#textView.text
  }
  set title(value: string) {
    this.#textView.text = value
  }

  get titleStyle() {
    return new Style({bold: this.isHover})
  }

  naturalSize(available: Size) {
    return this.#textView
      .naturalSize(available)
      .grow(TAB_TITLE_PAD, TAB_SEPARATOR_HEIGHT)
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (isMouseClicked(event)) {
      this.onClick?.(this)
    }

    this.#textView.style = this.titleStyle
  }

  render(viewport: Viewport) {
    viewport.registerMouse(['mouse.button.left', 'mouse.move'])

    viewport.clipped(
      new Rect([1, 0], viewport.contentSize.shrink(TAB_TITLE_PAD, 0)),
      inner => {
        this.#textView.render(inner)
      },
    )
  }
}

class Section extends Container {
  readonly titleView: TabTitle = new TabTitle('')

  static create(
    title: string,
    child: View,
    extraProps: Omit<TabProps, 'title' | 'view'> = {},
  ) {
    return new Section({title, child, ...extraProps})
  }

  constructor({title, ...props}: TabProps) {
    super(props)

    this.titleView.title = title ?? ''

    define(this, 'title', {enumerable: true})
  }

  get title() {
    return this.titleView.title
  }
  set title(value: string) {
    this.titleView.title = value
  }
}

function dashesLeft(w: number, isHover: boolean) {
  if (w <= 0) {
    return ''
  }

  return (isHover ? '╺' : '╶') + dashes(w - 1, isHover)
}

function dashesRight(w: number, isHover: boolean) {
  if (w <= 0) {
    return ''
  }

  return dashes(w - 1, isHover) + (isHover ? '╸' : '╴')
}

function dashes(w: number, isHover: boolean) {
  if (w <= 0) {
    return ''
  }

  return (isHover ? '━' : '─').repeat(w)
}

Tabs.Section = Section

const TAB_TITLE_PAD = 2
const TAB_SEPARATOR_HEIGHT = 1
