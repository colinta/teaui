import {Viewport} from '../Viewport.js'
import {type Props as ViewProps, View} from '../View.js'
import {Point, Rect, Size} from '../geometry.js'
import {
  type KeyEvent,
  type MouseEvent,
  isMouseClicked,
} from '../events/index.js'
import {Style} from '../Style.js'
import {System} from '../System.js'
import {lineWidth} from '@teaui/term'

type DisplayMode = 'days' | 'months' | 'years'
type Selection = 'single' | 'range'

interface Props extends ViewProps {
  /** Selected date */
  date?: Date
  /** Displayed month/year */
  visibleDate?: Date
  /** Called when navigating months/years (day is always 1) */
  onChangeVisible?: (date: Date) => void
  /** Called when selecting a date (date2 == date1 for single selection) */
  onChange?: (date1: Date, date2: Date) => void
  /** Single date or range selection. Default: 'single' */
  selection?: Selection
  /** 0=Sunday (default), 1=Monday */
  firstDayOfWeek?: 0 | 1
  now?: Date
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const DAY_HEADERS_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const DAY_HEADERS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const CLOSE = '×'
const ARROW_UP = ' [ ↑ ] '
const ARROW_DOWN = ' [ ↓ ] '

// Width: " Su Mo Tu We Th Fr Sa " = 1 + 7*3 = 22
const CALENDAR_WIDTH = 22
const NAV_BUTTON_WIDTH = 3
const CLOSE_BUTTON_WIDTH = 3
const MONTH_LABEL_X = 3
// Height: header + weekday row + 6 week rows = 8
const CALENDAR_HEIGHT = 8

export class Calendar extends View {
  // configurable so that tests can test 'today' rendering
  #today: Date
  #date: Date
  #cursorDate: Date
  #visibleDate: Date
  #onChangeVisible?: (date: Date) => void
  #onChange?: (date1: Date, date2: Date) => void
  #selection: Selection
  #firstDayOfWeek: 0 | 1
  #displayMode: DisplayMode = 'days'
  #hasFocus = false

  // Range selection state
  #rangeStart?: Date
  #rangeEnd?: Date
  #rangeNextSelection: 'start' | 'end' = 'start'
  #shiftSelecting = false

  // Year picker state
  #yearScrollOffset = 0
  #yearSearch = ''

  // Mouse drag tracking
  #dragStartDate?: Date

  // Mouse hover tracking
  #hoverClose = false
  #hoverPrevButton = false
  #hoverNextButton = false
  #hoverMonthLabel: string | undefined
  #hoverYearLabel: string | undefined
  #hoverDate: Date | undefined

  constructor(props: Props = {}) {
    super(props)
    const now = props.now ?? new Date()
    this.#today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    )
    const date = props.date ?? this.#today
    this.#date = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    )
    this.#cursorDate = this.#date
    this.#visibleDate =
      props.visibleDate ??
      new Date(this.#today.getFullYear(), this.#today.getMonth(), 1)
    this.#onChangeVisible = props.onChangeVisible
    this.#onChange = props.onChange
    this.#selection = props.selection ?? 'single'
    this.#firstDayOfWeek = props.firstDayOfWeek ?? 0
  }

  update(props: Props) {
    if (props.date !== undefined) {
      this.#date = new Date(
        props.date.getFullYear(),
        props.date.getMonth(),
        props.date.getDate(),
        0,
        0,
        0,
        0,
      )
    }
    if (props.visibleDate !== undefined) this.#visibleDate = props.visibleDate
    if (props.onChangeVisible !== undefined)
      this.#onChangeVisible = props.onChangeVisible
    if (props.onChange !== undefined) this.#onChange = props.onChange
    if (props.selection !== undefined) this.#selection = props.selection
    if (props.firstDayOfWeek !== undefined)
      this.#firstDayOfWeek = props.firstDayOfWeek
    super.update(props)
  }

  get date() {
    return this.#date
  }
  set date(value: Date) {
    this.#date = value
    this.invalidateRender()
  }

  get cursorDate() {
    return this.#cursorDate
  }
  set cursorDate(value: Date) {
    this.#cursorDate = value
    this.invalidateRender()
  }

  get visibleDate() {
    return this.#visibleDate
  }
  set visibleDate(value: Date) {
    this.#visibleDate = value
    this.invalidateRender()
  }

  get displayMode() {
    return this.#displayMode
  }

  naturalSize(): Size {
    return new Size(CALENDAR_WIDTH, CALENDAR_HEIGHT)
  }

  get #hoverStyle(): Style {
    return new Style({
      foreground: this.theme.text().foreground,
      background: this.theme.darkenColor,
    })
  }

  get #buttonHoverStyle(): Style {
    return this.theme.ui({isHover: true})
  }

  get #rangeGapStyle(): Style {
    return new Style({background: this.theme.darkenColor})
  }

  get #weekdayStyle(): Style {
    return new Style({
      bold: true,
      foreground: this.theme.highlightColor,
      background: this.theme.text().background,
    })
  }

  get #rangeEndpointStyle(): Style {
    return new Style({
      bold: true,
      foreground: this.theme.textColor,
      background: this.theme.darkenColor,
    })
  }

  get #inRangeStyle(): Style {
    return new Style({
      foreground: this.theme.highlightColor,
      background: this.theme.darkenColor,
    })
  }

  get #todayStyle(): Style {
    return new Style({
      bold: true,
      foreground: this.theme.brightTextColor,
      background: this.theme.text().background,
    })
  }

  get #cursorStyle(): Style {
    return new Style({
      bold: true,
      foreground: this.theme.text().foreground,
      background: this.theme.darkenColor,
    })
  }

  get #selectedStyle(): Style {
    return new Style({
      bold: true,
      foreground: this.theme.textColor,
      background: this.theme.highlightColor,
    })
  }

  #widgetRect(viewport: Viewport): Rect {
    return new Rect(Point.zero, [
      Math.min(CALENDAR_WIDTH, viewport.contentSize.width),
      Math.min(CALENDAR_HEIGHT, viewport.contentSize.height),
    ])
  }

  #isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  #isInRange(date: Date): boolean {
    if (!this.#rangeStart || !this.#rangeEnd) return false
    const time = date.getTime()
    const start = Math.min(this.#rangeStart.getTime(), this.#rangeEnd.getTime())
    const end = Math.max(this.#rangeStart.getTime(), this.#rangeEnd.getTime())
    return time >= start && time <= end
  }

  #navigateMonth(delta: number) {
    const d = new Date(
      this.#visibleDate.getFullYear(),
      this.#visibleDate.getMonth() + delta,
      1,
    )
    this.#visibleDate = d
    this.#onChangeVisible?.(d)
    this.invalidateRender()
  }

  #navigateYear(delta: number) {
    const d = new Date(
      this.#visibleDate.getFullYear() + delta,
      this.#visibleDate.getMonth(),
      1,
    )
    this.#visibleDate = d
    this.#onChangeVisible?.(d)
    this.invalidateRender()
  }

  #syncVisibleDate(date: Date) {
    if (
      date.getMonth() !== this.#visibleDate.getMonth() ||
      date.getFullYear() !== this.#visibleDate.getFullYear()
    ) {
      const d = new Date(date.getFullYear(), date.getMonth(), 1)
      this.#visibleDate = d
      this.#onChangeVisible?.(d)
    }
  }

  #startRangeSelection(date: Date, syncVisibleDate = true) {
    this.#rangeStart = date
    this.#rangeEnd = date
    this.#rangeNextSelection = 'end'
    this.#date = date
    this.#cursorDate = date
    if (syncVisibleDate) {
      this.#syncVisibleDate(date)
    }
    this.invalidateRender()
  }

  #finishRangeSelection(date: Date, syncVisibleDate = true) {
    if (!this.#rangeStart) {
      this.#startRangeSelection(date, syncVisibleDate)
      return
    }

    this.#rangeEnd = date
    this.#rangeNextSelection = 'start'
    this.#date = date
    this.#cursorDate = date
    if (syncVisibleDate) {
      this.#syncVisibleDate(date)
    }

    const start =
      this.#rangeStart.getTime() <= date.getTime() ? this.#rangeStart : date
    const end =
      this.#rangeStart.getTime() <= date.getTime() ? date : this.#rangeStart
    this.#onChange?.(start, end)
    this.invalidateRender()
  }

  #selectDate(date: Date) {
    if (this.#selection === 'range') {
      if (this.#rangeNextSelection === 'start') {
        this.#startRangeSelection(date)
      } else {
        this.#finishRangeSelection(date)
      }
      return
    }

    this.#date = date
    this.#cursorDate = date
    this.#onChange?.(date, date)
    this.#syncVisibleDate(date)
    this.invalidateRender()
  }

  #selectCursorDate(date: Date) {
    this.#cursorDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    )
    this.#syncVisibleDate(date)
    this.invalidateRender()
  }

  #moveCursorDateBy(days: number) {
    this.#shiftSelecting = false

    const nextDate = new Date(this.#cursorDate)
    nextDate.setDate(nextDate.getDate() + days)
    this.#cursorDate = nextDate

    // Navigate months if needed
    if (
      nextDate.getMonth() !== this.#visibleDate.getMonth() ||
      nextDate.getFullYear() !== this.#visibleDate.getFullYear()
    ) {
      const vis = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1)
      this.#visibleDate = vis
      this.#onChangeVisible?.(vis)
    }

    this.invalidateRender()
  }

  #shiftSelectBy(days: number) {
    if (!this.#shiftSelecting) {
      this.#rangeStart = new Date(this.#cursorDate)
    }

    this.#moveCursorDateBy(days)
    this.#shiftSelecting = true
    this.#rangeEnd = new Date(this.#cursorDate)
    this.#rangeNextSelection = 'start'
  }

  #selectMonth(month: number) {
    const d = new Date(this.#visibleDate.getFullYear(), month, 1)
    this.#visibleDate = d
    this.#selectDisplayMode('days')
    this.#onChangeVisible?.(d)
    this.invalidateRender()
  }

  #selectYear(year: number) {
    const d = new Date(year, this.#visibleDate.getMonth(), 1)
    this.#visibleDate = d
    this.#selectDisplayMode('days')
    this.#onChangeVisible?.(d)
    this.invalidateRender()
  }

  #selectDisplayMode(mode: DisplayMode) {
    this.#displayMode = mode
    this.#hoverClose = false
    this.#hoverMonthLabel = undefined
    this.#hoverYearLabel = undefined
  }

  #getDateAtPosition(x: number, y: number): Date | undefined {
    if (y < 2 || y > 7) return undefined

    const col = Math.floor(x / 3)
    const weekRow = y - 2
    const grid = this.#getDayGrid()
    if (col < 0 || col >= 7 || weekRow < 0 || weekRow >= grid.length) {
      return undefined
    }

    return grid[weekRow][col]
  }

  /** Get all day cells for the current visible month grid */
  #getDayGrid(): Date[][] {
    const year = this.#visibleDate.getFullYear()
    const month = this.#visibleDate.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    let startDow = firstOfMonth.getDay() // 0=Sun
    if (this.#firstDayOfWeek === 1) {
      startDow = (startDow + 6) % 7 // Convert to Mon=0
    }

    const weeks: Date[][] = []
    // Start from the first day shown in the grid
    const startDate = new Date(year, month, 1 - startDow)

    for (let week = 0; week < 6; week++) {
      const row: Date[] = []
      for (let day = 0; day < 7; day++) {
        const d = new Date(startDate)
        d.setDate(startDate.getDate() + week * 7 + day)
        row.push(d)
      }
      weeks.push(row)
    }

    return weeks
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (event.name === 'mouse.button.down') {
      system.requestFocus()
    }

    if (this.#displayMode === 'days') {
      this.#receiveMouseDays(event)
    } else if (this.#displayMode === 'months') {
      this.#receiveMouseMonths(event)
    } else {
      this.#receiveMouseYears(event)
    }
  }

  #formatMonthTitle(date: Date) {
    const totalWidth = 10
    const textWidth = lineWidth(MONTH_NAMES[date.getMonth()])
    const pad = Math.max(0, totalWidth - textWidth)
    return (
      ' '.repeat(Math.floor(pad / 2)) +
      MONTH_NAMES[date.getMonth()] +
      ' '.repeat(Math.ceil(pad / 2))
    )
  }

  #formatYearTitle(date: Date) {
    return ` ${String(date.getFullYear())} `
  }

  #yearLabelX(yearStr: string): number {
    return CALENDAR_WIDTH - NAV_BUTTON_WIDTH - lineWidth(yearStr)
  }

  #receiveMouseDays(event: MouseEvent) {
    const x = event.position.x
    const y = event.position.y

    // Reset hover states
    this.#hoverPrevButton = false
    this.#hoverNextButton = false
    this.#hoverMonthLabel = undefined
    this.#hoverYearLabel = undefined

    if (y === 0) {
      const monthName = this.#formatMonthTitle(this.#visibleDate)
      const yearStr = this.#formatYearTitle(this.#visibleDate)
      const yearStart = this.#yearLabelX(yearStr)

      if (x < NAV_BUTTON_WIDTH) {
        this.#hoverPrevButton = true
        if (isMouseClicked(event)) {
          this.#navigateMonth(-1)
        }
      } else if (x >= CALENDAR_WIDTH - NAV_BUTTON_WIDTH) {
        this.#hoverNextButton = true
        if (isMouseClicked(event)) {
          this.#navigateMonth(1)
        }
      } else if (
        x >= MONTH_LABEL_X &&
        x < MONTH_LABEL_X + lineWidth(monthName)
      ) {
        this.#hoverMonthLabel = 'true'
        if (isMouseClicked(event)) {
          this.#selectDisplayMode('months')
        }
      } else if (x >= yearStart && x < yearStart + lineWidth(yearStr)) {
        this.#hoverYearLabel = 'true'
        if (isMouseClicked(event)) {
          this.#selectDisplayMode('years')
          this.#yearScrollOffset = 0
          this.#yearSearch = ''
        }
      }
      return
    }

    const date = this.#getDateAtPosition(x, y)
    this.#hoverDate = date
    if (!date) {
      if (
        event.name === 'mouse.button.cancel' ||
        event.name === 'mouse.button.up'
      ) {
        this.#dragStartDate = undefined
      }
      return
    }

    if (this.#selection === 'range') {
      switch (event.name) {
        case 'mouse.button.down':
          if (this.#rangeNextSelection === 'end' && this.#rangeStart) {
            this.#dragStartDate = undefined
            this.#finishRangeSelection(date)
          } else {
            this.#dragStartDate = date
            this.#startRangeSelection(date, false)
          }
          break
        case 'mouse.button.dragInside':
        case 'mouse.button.enter':
          if (this.#dragStartDate) {
            this.#rangeStart = this.#dragStartDate
            this.#rangeEnd = date
            this.#date = date
            this.#cursorDate = date
            this.invalidateRender()
          }
          break
        case 'mouse.button.up':
          if (
            this.#dragStartDate &&
            !this.#isSameDay(this.#dragStartDate, date)
          ) {
            this.#rangeStart = this.#dragStartDate
            this.#finishRangeSelection(date)
          }
          this.#dragStartDate = undefined
          break
        case 'mouse.button.cancel':
          this.#dragStartDate = undefined
          this.invalidateRender()
          break
      }
      return
    }

    if (event.name === 'mouse.button.down') {
      this.#selectDate(date)
    }
  }

  #receiveMouseMonths(event: MouseEvent) {
    const x = event.position.x
    const y = event.position.y

    // Reset hover states
    this.#hoverClose = false
    this.#hoverMonthLabel = undefined

    if (y === 0 && x >= CALENDAR_WIDTH - CLOSE_BUTTON_WIDTH) {
      this.#hoverClose = true
      if (isMouseClicked(event)) {
        this.#selectDisplayMode('days')
        this.invalidateRender()
        return
      }
    }

    // Month grid: 4 rows × 3 columns, starting at y=2
    if (y >= 2 && y <= 5) {
      const col = Math.floor(x / 7)
      const row = y - 2
      if (col >= 0 && col < 3 && row >= 0 && row < 4) {
        const month = row * 3 + col
        this.#hoverMonthLabel = MONTH_SHORT[month]
        if (isMouseClicked(event)) {
          this.#selectMonth(month)
        }
      }
    }

    this.invalidateRender()
  }

  #receiveMouseYears(event: MouseEvent) {
    const x = event.position.x
    const y = event.position.y

    // Reset hover states
    this.#hoverClose = false
    this.#hoverPrevButton = false
    this.#hoverNextButton = false
    this.#hoverYearLabel = undefined

    if (y === 0 && x >= CALENDAR_WIDTH - CLOSE_BUTTON_WIDTH) {
      this.#hoverClose = true
      if (isMouseClicked(event)) {
        this.#selectDisplayMode('days')
        this.invalidateRender()
        return
      }
    }

    // Scroll arrows
    if (y === 1) {
      this.#hoverPrevButton = true
      if (isMouseClicked(event)) {
        this.#yearScrollOffset -= 5
        this.invalidateRender()
      }
    } else if (y === 7) {
      this.#hoverNextButton = true
      if (isMouseClicked(event)) {
        this.#yearScrollOffset += 5
        this.invalidateRender()
      }
    }

    // Year rows at y=2..6 (5 visible years)
    if (y >= 2 && y <= 6) {
      const yearIndex = y - 2
      const baseYear =
        this.#visibleDate.getFullYear() - 2 + this.#yearScrollOffset
      const year = baseYear + yearIndex
      this.#hoverYearLabel = String(year)
      if (isMouseClicked(event)) {
        this.#selectYear(year)
      }
    }

    // Scroll wheel
    if (event.name === 'mouse.wheel.up') {
      this.#yearScrollOffset -= 1
      this.invalidateRender()
    } else if (event.name === 'mouse.wheel.down') {
      this.#yearScrollOffset += 1
      this.invalidateRender()
    }

    this.invalidateRender()
  }

  receiveKey(event: KeyEvent) {
    if (this.#displayMode === 'days') {
      this.#receiveKeyDays(event)
    } else if (this.#displayMode === 'months') {
      this.#receiveKeyMonths(event)
    } else {
      this.#receiveKeyYears(event)
    }
  }

  #receiveKeyDays(event: KeyEvent) {
    switch (event.name) {
      case 't':
        this.#selectCursorDate(new Date())
        break
      case 'left':
        if (event.shift) {
          this.#shiftSelectBy(-1)
        } else {
          this.#moveCursorDateBy(-1)
        }
        break
      case 'right':
        if (event.shift) {
          this.#shiftSelectBy(1)
        } else {
          this.#moveCursorDateBy(1)
        }
        break
      case 'up':
        if (event.shift) {
          this.#shiftSelectBy(-7)
        } else {
          this.#moveCursorDateBy(-7)
        }
        break
      case 'down':
        if (event.shift) {
          this.#shiftSelectBy(7)
        } else {
          this.#moveCursorDateBy(7)
        }
        break
      case 'return':
        this.#selectDate(this.#cursorDate)
        break
      case 'escape':
        // Do nothing in day view
        break
      case 'pageup':
        this.#navigateMonth(-1)
        break
      case 'pagedown':
        this.#navigateMonth(1)
        break
      case 'home': {
        const nextDate = new Date(
          this.#visibleDate.getFullYear(),
          this.#visibleDate.getMonth(),
          1,
        )
        this.#cursorDate = nextDate
        this.invalidateRender()
        break
      }
      case 'end': {
        const nextDate = new Date(
          this.#visibleDate.getFullYear(),
          this.#visibleDate.getMonth() + 1,
          0,
        )
        this.#cursorDate = nextDate
        this.invalidateRender()
        break
      }
    }
  }

  #receiveKeyMonths(event: KeyEvent) {
    switch (event.name) {
      case 'escape':
        this.#selectDisplayMode('days')
        this.invalidateRender()
        break
      case 'return':
        this.#selectMonth(this.#visibleDate.getMonth())
        break
      case 'left': {
        const m = this.#visibleDate.getMonth() - 1
        if (m >= 0) {
          this.#visibleDate = new Date(this.#visibleDate.getFullYear(), m, 1)
          this.invalidateRender()
        }
        break
      }
      case 'right': {
        const m = this.#visibleDate.getMonth() + 1
        if (m <= 11) {
          this.#visibleDate = new Date(this.#visibleDate.getFullYear(), m, 1)
          this.invalidateRender()
        }
        break
      }
      case 'up': {
        const m = this.#visibleDate.getMonth() - 3
        if (m >= 0) {
          this.#visibleDate = new Date(this.#visibleDate.getFullYear(), m, 1)
          this.invalidateRender()
        }
        break
      }
      case 'down': {
        const m = this.#visibleDate.getMonth() + 3
        if (m <= 11) {
          this.#visibleDate = new Date(this.#visibleDate.getFullYear(), m, 1)
          this.invalidateRender()
        }
        break
      }
    }
  }

  #receiveKeyYears(event: KeyEvent) {
    switch (event.name) {
      case 'escape':
        this.#selectDisplayMode('days')
        this.#yearSearch = ''
        this.invalidateRender()
        break
      case 'return': {
        if (this.#yearSearch) {
          const year = parseInt(this.#yearSearch, 10)
          if (!isNaN(year)) {
            this.#selectYear(year)
            this.#yearSearch = ''
          }
        } else {
          this.#selectYear(this.#visibleDate.getFullYear())
        }
        break
      }
      case 'up':
        this.#yearScrollOffset -= 1
        this.invalidateRender()
        break
      case 'down':
        this.#yearScrollOffset += 1
        this.invalidateRender()
        break
      case 'backspace':
        this.#yearSearch = this.#yearSearch.slice(0, -1)
        this.#updateYearFromSearch()
        break
      default: {
        // Accept digit input for year search
        const char = event.char
        if (char && char >= '0' && char <= '9') {
          this.#yearSearch += char
          this.#updateYearFromSearch()
        }
        break
      }
    }
  }

  #updateYearFromSearch() {
    if (this.#yearSearch) {
      const year = parseInt(this.#yearSearch, 10)
      if (!isNaN(year)) {
        this.#yearScrollOffset = year - this.#visibleDate.getFullYear()
      }
    }
    this.invalidateRender()
  }

  render(viewport: Viewport) {
    const hasFocus = viewport.registerFocus()
    this.#hasFocus = hasFocus
    if (viewport.isEmpty) {
      return
    }

    viewport.registerMouse(
      ['mouse.button.left', 'mouse.move', 'mouse.wheel'],
      this.#widgetRect(viewport),
    )

    switch (this.#displayMode) {
      case 'days':
        this.#renderDays(viewport)
        break
      case 'months':
        this.#renderMonths(viewport)
        break
      case 'years':
        this.#renderYears(viewport)
        break
    }
  }

  #renderDays(viewport: Viewport) {
    const today = this.#today
    const month = this.#visibleDate.getMonth()
    const monthName = this.#formatMonthTitle(this.#visibleDate)
    const yearStr = this.#formatYearTitle(this.#visibleDate)

    const textStyle = this.theme.text()
    const dimStyle = this.theme.text({isPlaceholder: true})
    const hoverStyle = this.#hoverStyle
    const headerStyle = this.theme.ui({isHover: false})
    const selectedStyle = this.#selectedStyle
    const todayStyle = this.#todayStyle
    const inRangeStyle = this.#inRangeStyle
    const rangeEndpointStyle = this.#rangeEndpointStyle

    viewport.paint(textStyle, this.#widgetRect(viewport))

    // Header: "◃  June     2026  ▹"
    const prevArrow = this.#hoverPrevButton ? ' ◂ ' : ' ◃ '
    const nextArrow = this.#hoverNextButton ? ' ▸ ' : ' ▹ '
    const monthLabelStyle = this.#hoverMonthLabel
      ? this.#buttonHoverStyle
      : headerStyle
    const yearLabelStyle = this.#hoverYearLabel
      ? this.#buttonHoverStyle
      : headerStyle
    const yearStart = this.#yearLabelX(yearStr)

    viewport.write(
      prevArrow,
      new Point(0, 0),
      this.#hoverPrevButton ? this.#buttonHoverStyle : headerStyle,
    )
    viewport.write(monthName, new Point(MONTH_LABEL_X, 0), monthLabelStyle)
    viewport.write(yearStr, new Point(yearStart, 0), yearLabelStyle)
    viewport.write(
      nextArrow,
      new Point(CALENDAR_WIDTH - NAV_BUTTON_WIDTH, 0),
      this.#hoverNextButton ? this.#buttonHoverStyle : headerStyle,
    )

    // Weekday headers
    const dayHeaders =
      this.#firstDayOfWeek === 1 ? DAY_HEADERS_MON : DAY_HEADERS_SUN
    const weekdayStyle = this.#weekdayStyle
    for (let i = 0; i < 7; i++) {
      viewport.write(dayHeaders[i], new Point(1 + i * 3, 1), weekdayStyle)
    }

    // Day grid
    const grid = this.#getDayGrid()
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const date = grid[week][day]
        const isHover =
          this.#hoverDate && this.#isSameDay(date, this.#hoverDate)
        const isCurrentMonth = date.getMonth() === month
        const isToday = this.#isSameDay(date, today)
        const isSelected =
          this.#isSameDay(date, this.#date) && this.#selection === 'single'
        const isCursor =
          !this.#isSameDay(this.#cursorDate, this.#date) &&
          this.#isSameDay(date, this.#cursorDate)
        const isInRange = this.#isInRange(date)
        const dayNum = String(date.getDate()).padStart(2, ' ')

        const isRangeEndpoint =
          this.#rangeStart &&
          this.#rangeEnd &&
          (this.#isSameDay(date, this.#rangeStart) ||
            this.#isSameDay(date, this.#rangeEnd))

        let style: Style
        if (isRangeEndpoint) {
          style = rangeEndpointStyle
        } else if (isSelected) {
          style = selectedStyle
        } else if (isCursor) {
          style = this.#cursorStyle
        } else if (isInRange) {
          style = inRangeStyle
        } else if (isToday) {
          style = todayStyle
        } else if (!isCurrentMonth) {
          style = dimStyle
        } else if (isHover) {
          style = hoverStyle
        } else {
          style = textStyle
        }

        viewport.write(dayNum, new Point(1 + day * 3, 2 + week), style)

        // Paint the gap between consecutive in-range days
        if (day < 6) {
          const nextDate = grid[week][day + 1]
          const thisInRange = isSelected || isInRange
          const nextInRange =
            this.#isSameDay(nextDate, this.#date) || this.#isInRange(nextDate)
          if (thisInRange && nextInRange) {
            const gapStyle = this.#rangeGapStyle
            viewport.write(' ', new Point(1 + day * 3 + 2, 2 + week), gapStyle)
          }
        }
      }

      if (
        this.#selection === 'range' &&
        this.#rangeStart &&
        this.#rangeEnd &&
        !this.#isSameDay(this.#rangeStart, this.#rangeEnd)
      ) {
        // Paint the leading gap before the first in-range day of each row
        // (the space at position 0 on the row, before the first day column)
        const firstDate = grid[week][0]
        const firstInRange =
          this.#isSameDay(firstDate, this.#date) || this.#isInRange(firstDate)
        if (firstInRange) {
          const gapStyle = this.#rangeGapStyle
          viewport.write(' ', new Point(0, 2 + week), gapStyle)
        }

        // Paint the trailing gap after the last in-range day of each row
        const lastDate = grid[week][6]
        const lastInRange =
          this.#isSameDay(lastDate, this.#date) || this.#isInRange(lastDate)
        if (lastInRange) {
          const gapStyle = this.#rangeGapStyle
          viewport.write(' ', new Point(1 + 6 * 3 + 2, 2 + week), gapStyle)
        }
      }
    }

    // Focus border
    if (this.#hasFocus) {
      const borderStyle = weekdayStyle

      // Top row (weekday header row): ╭...╮ with ─ between headers
      viewport.write('╭', new Point(0, 1), borderStyle)
      viewport.write('╮', new Point(CALENDAR_WIDTH - 1, 1), borderStyle)
      for (let i = 0; i < 6; i++) {
        viewport.write('─', new Point(3 + i * 3, 1), borderStyle)
      }

      // Middle rows: │...│
      for (let week = 0; week < 5; week++) {
        viewport.write('│', new Point(0, 2 + week), borderStyle)
        viewport.write(
          '│',
          new Point(CALENDAR_WIDTH - 1, 2 + week),
          borderStyle,
        )
      }

      // Bottom row (last week row): ╰...╯ with ─ between days
      viewport.write('╰', new Point(0, 7), borderStyle)
      viewport.write('╯', new Point(CALENDAR_WIDTH - 1, 7), borderStyle)
      for (let i = 0; i < 6; i++) {
        viewport.write('─', new Point(3 + i * 3, 7), borderStyle)
      }
    }
  }

  #renderMonths(viewport: Viewport) {
    const textStyle = this.theme.text()
    const headerStyle = this.theme.ui({isHover: false})
    const currentMonth = this.#visibleDate.getMonth()

    viewport.paint(textStyle, this.#widgetRect(viewport))

    // Header
    const monthName = this.#formatMonthTitle(this.#visibleDate)
    const headerText = monthName
    const headerX = Math.max(
      0,
      Math.floor(
        (CALENDAR_WIDTH - CLOSE_BUTTON_WIDTH - lineWidth(headerText)) / 2,
      ) + 1,
    )
    viewport.write(headerText, new Point(headerX, 0), headerStyle)
    const closeStyle = this.#hoverClose ? this.#buttonHoverStyle : headerStyle
    viewport.write(
      ` ${CLOSE} `,
      new Point(CALENDAR_WIDTH - CLOSE_BUTTON_WIDTH, 0),
      closeStyle,
    )

    // Month grid: 4 rows × 3 columns
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const m = row * 3 + col
        const name = MONTH_SHORT[m]
        const isSelected = m === currentMonth
        const isHover = this.#hoverMonthLabel === name
        let style: Style
        if (isSelected) {
          style = this.#selectedStyle
        } else if (isHover) {
          style = this.#hoverStyle
        } else {
          style = textStyle
        }
        // Each column is ~7 chars wide (fits in 22 width: 7*3=21 + 1 padding)
        const x = 1 + col * 7
        const y = 2 + row
        const label = ` ${name} `
        viewport.write(label, new Point(x, y), style)
      }
    }
  }

  #renderYears(viewport: Viewport) {
    const textStyle = this.theme.text()
    const headerStyle = this.theme.ui({isHover: false})
    const currentYear = this.#visibleDate.getFullYear()

    viewport.paint(textStyle, this.#widgetRect(viewport))

    // Header
    const headerText = 'Year'
    const headerX = Math.max(
      0,
      Math.floor(
        (CALENDAR_WIDTH - CLOSE_BUTTON_WIDTH - lineWidth(headerText)) / 2,
      ) + 1,
    )
    viewport.write(headerText, new Point(headerX, 0), headerStyle)
    const closeStyle = this.#hoverClose ? this.#buttonHoverStyle : headerStyle
    viewport.write(
      ` ${CLOSE} `,
      new Point(CALENDAR_WIDTH - CLOSE_BUTTON_WIDTH, 0),
      closeStyle,
    )

    // Scroll indicator
    const prevStyle = this.#hoverPrevButton
      ? this.#buttonHoverStyle
      : headerStyle
    viewport.write(
      ARROW_UP,
      new Point(Math.floor((CALENDAR_WIDTH - lineWidth(ARROW_UP)) / 2), 1),
      prevStyle,
    )

    // 5 visible years
    const baseYear = currentYear - 2 + this.#yearScrollOffset
    for (let i = 0; i < 5; i++) {
      const year = baseYear + i
      const yearStr = String(year)
      const isSelected = year === currentYear
      const isHover = this.#hoverYearLabel === yearStr
      let style: Style
      if (isSelected) {
        style = this.#selectedStyle
      } else if (isHover) {
        style = this.#hoverStyle
      } else {
        style = textStyle
      }
      const x = Math.floor((CALENDAR_WIDTH - lineWidth(yearStr)) / 2)
      viewport.write(yearStr, new Point(x, 2 + i), style)
    }

    // Down arrow
    const nextStyle = this.#hoverNextButton
      ? this.#buttonHoverStyle
      : headerStyle
    viewport.write(
      ARROW_DOWN,
      new Point(Math.floor((CALENDAR_WIDTH - lineWidth(ARROW_DOWN)) / 2), 7),
      nextStyle,
    )

    // Search line (if searching)
    if (this.#yearSearch) {
      const searchLabel = `Search: ${this.#yearSearch}`
      viewport.write(searchLabel, new Point(0, 7), textStyle.merge({dim: true}))
    }
  }
}
