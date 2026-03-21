import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps, View} from '../View.js'
import {Point, Size, Rect} from '../geometry.js'
import {
  type KeyEvent,
  type MouseEvent,
  isMouseClicked,
} from '../events/index.js'
import {Style} from '../Style.js'
import {System} from '../System.js'

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

// Width: " Su Mo Tu We Th Fr Sa " = 1 + 7*3 = 22
const CALENDAR_WIDTH = 22
// Height: header + weekday row + 6 week rows = 8
const CALENDAR_HEIGHT = 8

export class Calendar extends View {
  #date: Date
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

  // Year picker state
  #yearScrollOffset = 0
  #yearSearch = ''

  // Mouse hover tracking
  #hoverPrevMonth = false
  #hoverNextMonth = false
  #hoverMonthLabel = false
  #hoverYearLabel = false

  constructor(props: Props = {}) {
    super(props)
    const now = new Date()
    this.#date = props.date ?? now
    this.#visibleDate =
      props.visibleDate ?? new Date(now.getFullYear(), now.getMonth(), 1)
    this.#onChangeVisible = props.onChangeVisible
    this.#onChange = props.onChange
    this.#selection = props.selection ?? 'single'
    this.#firstDayOfWeek = props.firstDayOfWeek ?? 0
  }

  update(props: Props) {
    if (props.date !== undefined) this.#date = props.date
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

  #today(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
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

  #selectDate(date: Date) {
    if (this.#selection === 'range') {
      if (!this.#rangeStart || this.#rangeEnd) {
        // Start new range
        this.#rangeStart = date
        this.#rangeEnd = undefined
        this.#date = date
      } else {
        // Complete range
        this.#rangeEnd = date
        const start =
          this.#rangeStart.getTime() <= date.getTime() ? this.#rangeStart : date
        const end =
          this.#rangeStart.getTime() <= date.getTime() ? date : this.#rangeStart
        this.#date = date
        this.#onChange?.(start, end)
      }
    } else {
      this.#date = date
      this.#onChange?.(date, date)
    }

    // If selected date is in a different month, navigate to it
    if (
      date.getMonth() !== this.#visibleDate.getMonth() ||
      date.getFullYear() !== this.#visibleDate.getFullYear()
    ) {
      const d = new Date(date.getFullYear(), date.getMonth(), 1)
      this.#visibleDate = d
      this.#onChangeVisible?.(d)
    }

    this.invalidateRender()
  }

  #selectMonth(month: number) {
    const d = new Date(this.#visibleDate.getFullYear(), month, 1)
    this.#visibleDate = d
    this.#displayMode = 'days'
    this.#onChangeVisible?.(d)
    this.invalidateRender()
  }

  #selectYear(year: number) {
    const d = new Date(year, this.#visibleDate.getMonth(), 1)
    this.#visibleDate = d
    this.#displayMode = 'days'
    this.#onChangeVisible?.(d)
    this.invalidateRender()
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

    if (this.#displayMode === 'days') {
      this.#receiveMouseDays(event)
    } else if (this.#displayMode === 'months') {
      this.#receiveMouseMonths(event)
    } else {
      this.#receiveMouseYears(event)
    }
  }

  #receiveMouseDays(event: MouseEvent) {
    const x = event.position.x
    const y = event.position.y

    // Reset hover states
    this.#hoverPrevMonth = false
    this.#hoverNextMonth = false
    this.#hoverMonthLabel = false
    this.#hoverYearLabel = false

    if (y === 0) {
      // Header row: "◂ June      2026 ▸"
      // ◂ at x=0, month name, year, ▸ at x=21
      if (x <= 1) {
        this.#hoverPrevMonth = true
        if (isMouseClicked(event)) {
          this.#navigateMonth(-1)
        }
      } else if (x >= CALENDAR_WIDTH - 2) {
        this.#hoverNextMonth = true
        if (isMouseClicked(event)) {
          this.#navigateMonth(1)
        }
      } else {
        // Determine if clicking on month name or year
        const monthName = MONTH_NAMES[this.#visibleDate.getMonth()]
        const yearStr = String(this.#visibleDate.getFullYear())
        // Layout: "◂ {monthName}  {year} ▸"
        const monthStart = 2
        const monthEnd = monthStart + monthName.length
        const yearStart = CALENDAR_WIDTH - 2 - yearStr.length
        if (x >= monthStart && x < monthEnd) {
          this.#hoverMonthLabel = true
          if (isMouseClicked(event)) {
            this.#displayMode = 'months'
          }
        } else if (x >= yearStart && x < yearStart + yearStr.length) {
          this.#hoverYearLabel = true
          if (isMouseClicked(event)) {
            this.#displayMode = 'years'
            this.#yearScrollOffset = 0
            this.#yearSearch = ''
          }
        }
      }
    } else if (y >= 2 && y <= 7) {
      // Day grid rows
      const col = Math.floor(x / 3)
      if (col >= 0 && col < 7) {
        const weekRow = y - 2
        const grid = this.#getDayGrid()
        if (weekRow < grid.length) {
          const date = grid[weekRow][col]
          if (isMouseClicked(event)) {
            this.#selectDate(date)
          }
        }
      }
    }
  }

  #receiveMouseMonths(event: MouseEvent) {
    const x = event.position.x
    const y = event.position.y

    if (isMouseClicked(event)) {
      if (y === 0 && x >= CALENDAR_WIDTH - 2) {
        // Close button
        this.#displayMode = 'days'
        this.invalidateRender()
        return
      }

      // Month grid: 4 rows × 3 columns, starting at y=2
      if (y >= 2 && y <= 5) {
        const col = Math.floor(x / 7)
        const row = y - 2
        if (col >= 0 && col < 3 && row >= 0 && row < 4) {
          const month = row * 3 + col
          this.#selectMonth(month)
        }
      }
    }
  }

  #receiveMouseYears(event: MouseEvent) {
    const x = event.position.x
    const y = event.position.y

    if (isMouseClicked(event)) {
      if (y === 0 && x >= CALENDAR_WIDTH - 2) {
        // Close button
        this.#displayMode = 'days'
        this.invalidateRender()
        return
      }

      // Year rows at y=2..6 (5 visible years)
      if (y >= 2 && y <= 6) {
        const yearIndex = y - 2
        const baseYear =
          this.#visibleDate.getFullYear() - 2 + this.#yearScrollOffset
        this.#selectYear(baseYear + yearIndex)
      }

      // Scroll arrows
      if (y === 1) {
        this.#yearScrollOffset -= 5
        this.invalidateRender()
      } else if (y === 7) {
        this.#yearScrollOffset += 5
        this.invalidateRender()
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
      case 'left':
        this.#moveDateBy(-1)
        break
      case 'right':
        this.#moveDateBy(1)
        break
      case 'up':
        this.#moveDateBy(-7)
        break
      case 'down':
        this.#moveDateBy(7)
        break
      case 'return':
        this.#selectDate(this.#date)
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
        const d = new Date(
          this.#visibleDate.getFullYear(),
          this.#visibleDate.getMonth(),
          1,
        )
        this.#date = d
        this.invalidateRender()
        break
      }
      case 'end': {
        const d = new Date(
          this.#visibleDate.getFullYear(),
          this.#visibleDate.getMonth() + 1,
          0,
        )
        this.#date = d
        this.invalidateRender()
        break
      }
    }
  }

  #receiveKeyMonths(event: KeyEvent) {
    switch (event.name) {
      case 'escape':
        this.#displayMode = 'days'
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
        this.#displayMode = 'days'
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

  #moveDateBy(days: number) {
    const d = new Date(this.#date)
    d.setDate(d.getDate() + days)
    this.#date = d

    // Navigate months if needed
    if (
      d.getMonth() !== this.#visibleDate.getMonth() ||
      d.getFullYear() !== this.#visibleDate.getFullYear()
    ) {
      const vis = new Date(d.getFullYear(), d.getMonth(), 1)
      this.#visibleDate = vis
      this.#onChangeVisible?.(vis)
    }

    this.invalidateRender()
  }

  render(viewport: Viewport) {
    const hasFocus = viewport.registerFocus()
    this.#hasFocus = hasFocus
    if (viewport.isEmpty) {
      return
    }

    viewport.registerMouse(['mouse.button.left', 'mouse.move', 'mouse.wheel'])

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
    const today = this.#today()
    const year = this.#visibleDate.getFullYear()
    const month = this.#visibleDate.getMonth()
    const monthName = MONTH_NAMES[month]
    const yearStr = String(year)

    const textStyle = this.theme.text()
    const dimStyle = this.theme.text({isPlaceholder: true})
    const headerStyle = this.theme.ui({isHover: false})
    const selectedStyle = this.theme.text({
      isSelected: true,
      hasFocus: this.#hasFocus,
    })
    const todayStyle = new Style({
      bold: true,
      foreground: this.theme.brightTextColor,
      background: textStyle.background,
    })
    const rangeStyle = new Style({
      foreground: this.theme.highlightColor,
      background: textStyle.background,
    })

    viewport.paint(textStyle)

    // Header: "◂ {month}    {year} ▸"
    const prevArrow = this.#hoverPrevMonth ? '◂' : '◃'
    const nextArrow = this.#hoverNextMonth ? '▸' : '▹'
    const monthLabelStyle = this.#hoverMonthLabel
      ? this.theme.ui({isHover: true})
      : headerStyle
    const yearLabelStyle = this.#hoverYearLabel
      ? this.theme.ui({isHover: true})
      : headerStyle

    viewport.write(prevArrow, new Point(0, 0), headerStyle)
    viewport.write(monthName, new Point(2, 0), monthLabelStyle)
    const yearX = CALENDAR_WIDTH - 2 - yearStr.length
    viewport.write(yearStr, new Point(yearX, 0), yearLabelStyle)
    viewport.write(nextArrow, new Point(CALENDAR_WIDTH - 1, 0), headerStyle)

    // Weekday headers
    const dayHeaders =
      this.#firstDayOfWeek === 1 ? DAY_HEADERS_MON : DAY_HEADERS_SUN
    const weekdayStyle = new Style({
      bold: true,
      foreground: this.theme.highlightColor,
      background: textStyle.background,
    })
    for (let i = 0; i < 7; i++) {
      viewport.write(dayHeaders[i], new Point(1 + i * 3, 1), weekdayStyle)
    }

    // Day grid
    const grid = this.#getDayGrid()
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const date = grid[week][day]
        const isCurrentMonth = date.getMonth() === month
        const isToday = this.#isSameDay(date, today)
        const isSelected = this.#isSameDay(date, this.#date)
        const isInRange = this.#isInRange(date)
        const dayNum = String(date.getDate()).padStart(2, ' ')

        let style: Style
        if (isSelected) {
          style = selectedStyle
        } else if (isInRange) {
          style = rangeStyle
        } else if (isToday) {
          style = todayStyle
        } else if (!isCurrentMonth) {
          style = dimStyle
        } else {
          style = textStyle
        }

        viewport.write(dayNum, new Point(1 + day * 3, 2 + week), style)
      }
    }
  }

  #renderMonths(viewport: Viewport) {
    const textStyle = this.theme.text()
    const headerStyle = this.theme.ui({isHover: false})
    const selectedStyle = this.theme.text({
      isSelected: true,
      hasFocus: this.#hasFocus,
    })
    const currentMonth = this.#visibleDate.getMonth()

    viewport.paint(textStyle)

    // Header
    const monthName = MONTH_NAMES[currentMonth]
    const headerText = monthName
    const headerX = Math.max(
      0,
      Math.floor((CALENDAR_WIDTH - 2 - headerText.length) / 2) + 1,
    )
    viewport.write(headerText, new Point(headerX, 0), headerStyle)
    viewport.write('×', new Point(CALENDAR_WIDTH - 1, 0), headerStyle)

    // Month grid: 4 rows × 3 columns
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const m = row * 3 + col
        const name = MONTH_SHORT[m]
        const isSelected = m === currentMonth
        const style = isSelected ? selectedStyle : textStyle
        // Each column is ~7 chars wide (fits in 22 width: 7*3=21 + 1 padding)
        const x = 1 + col * 7
        const y = 2 + row
        const label = ` ${name} `
        viewport.write(label, new Point(x, y), style)
      }
    }

    // Search line
    viewport.write(
      MONTH_SHORT[currentMonth],
      new Point(0, 7),
      new Style({
        dim: true,
        foreground: textStyle.foreground,
        background: textStyle.background,
      }),
    )
  }

  #renderYears(viewport: Viewport) {
    const textStyle = this.theme.text()
    const headerStyle = this.theme.ui({isHover: false})
    const selectedStyle = this.theme.text({
      isSelected: true,
      hasFocus: this.#hasFocus,
    })
    const currentYear = this.#visibleDate.getFullYear()

    viewport.paint(textStyle)

    // Header
    viewport.write(
      '↑',
      new Point(Math.floor(CALENDAR_WIDTH / 2), 0),
      headerStyle,
    )
    viewport.write('×', new Point(CALENDAR_WIDTH - 1, 0), headerStyle)

    // Scroll indicator
    viewport.write(
      '↑',
      new Point(Math.floor(CALENDAR_WIDTH / 2), 1),
      headerStyle,
    )

    // 5 visible years
    const baseYear = currentYear - 2 + this.#yearScrollOffset
    for (let i = 0; i < 5; i++) {
      const year = baseYear + i
      const isSelected = year === currentYear
      const style = isSelected ? selectedStyle : textStyle
      const yearStr = String(year)
      const x = Math.floor((CALENDAR_WIDTH - yearStr.length) / 2)
      viewport.write(yearStr, new Point(x, 2 + i), style)
    }

    // Down arrow
    viewport.write(
      '↓',
      new Point(Math.floor(CALENDAR_WIDTH / 2), 7),
      headerStyle,
    )

    // Search line (if searching)
    if (this.#yearSearch) {
      const searchLabel = `Search: ${this.#yearSearch}`
      viewport.write(
        searchLabel,
        new Point(0, 7),
        new Style({
          dim: true,
          foreground: textStyle.foreground,
          background: textStyle.background,
        }),
      )
    }
  }
}
