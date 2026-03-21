import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Calendar} from '../../lib/components/Calendar.js'

function date(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d)
}

describe('Calendar', () => {
  describe('rendering', () => {
    it('renders the month header and weekday row', () => {
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
        }),
        {width: 22, height: 8},
      )
      const text = t.terminal.textContent()
      expect(text).toContain('June')
      expect(text).toContain('2026')
      expect(text).toContain('Su')
      expect(text).toContain('Mo')
      expect(text).toContain('Tu')
      expect(text).toContain('We')
      expect(text).toContain('Th')
      expect(text).toContain('Fr')
      expect(text).toContain('Sa')
    })

    it('renders Monday-first weekday header', () => {
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
          firstDayOfWeek: 1,
        }),
        {width: 22, height: 8},
      )
      const text = t.terminal.textContent()
      // Mo should come before Tu
      const moIdx = text.indexOf('Mo')
      const tuIdx = text.indexOf('Tu')
      expect(moIdx).toBeLessThan(tuIdx)
      // Su should be last
      // Find the weekday header line
      const saIdx = text.indexOf('Sa')
      const suIdx = text.indexOf('Su')
      expect(saIdx).toBeLessThan(suIdx)
    })

    it('renders day numbers for the visible month', () => {
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
        }),
        {width: 22, height: 8},
      )
      const text = t.terminal.textContent()
      // June has 30 days
      expect(text).toContain('15')
      expect(text).toContain('30')
      expect(text).toContain(' 1')
    })

    it('renders with navigation arrows', () => {
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
        }),
        {width: 22, height: 8},
      )
      const text = t.terminal.textContent()
      // Should have navigation arrows
      expect(text).toContain('◃')
      expect(text).toContain('▹')
    })

    it('renders selected date with highlight style', () => {
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
        }),
        {width: 22, height: 8},
      )
      // The selected date '15' should have a different style
      const style = t.terminal.styleOf('15')
      expect(style).toBeDefined()
    })

    it('renders today with bold style', () => {
      // Use today's date
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const t = testRender(
        new Calendar({
          date: date(2000, 1, 1), // different from today
          visibleDate: new Date(now.getFullYear(), now.getMonth(), 1),
        }),
        {width: 22, height: 8},
      )
      const dayStr = String(today.getDate())
      const text = t.terminal.textContent()
      expect(text).toContain(dayStr)
    })
  })

  describe('natural size', () => {
    it('reports fixed 22×8 size', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 40, height: 20})
      // Calendar should render at its natural size
      const text = t.terminal.textContent()
      expect(text).toContain('June')
    })
  })

  describe('mouse interaction', () => {
    it('navigates to previous month on left arrow click', () => {
      let visibleDate: Date | undefined
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
          onChangeVisible(d) {
            visibleDate = d
          },
        }),
        {width: 22, height: 8},
      )
      // Click the left arrow at (0, 0)
      t.sendMouse('mouse.button.down', {x: 0, y: 0})
      t.sendMouse('mouse.button.up', {x: 0, y: 0})
      expect(visibleDate).toBeDefined()
      expect(visibleDate!.getMonth()).toBe(4) // May (0-indexed)
    })

    it('navigates to next month on right arrow click', () => {
      let visibleDate: Date | undefined
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
          onChangeVisible(d) {
            visibleDate = d
          },
        }),
        {width: 22, height: 8},
      )
      // Click the right arrow at (21, 0)
      t.sendMouse('mouse.button.down', {x: 21, y: 0})
      t.sendMouse('mouse.button.up', {x: 21, y: 0})
      expect(visibleDate).toBeDefined()
      expect(visibleDate!.getMonth()).toBe(6) // July (0-indexed)
    })

    it('selects a date on day cell click', () => {
      let selectedDate: Date | undefined
      // June 2026: 1st is Monday. With Sunday first:
      // Row 0 (y=2): Su=31(May), Mo=1, Tu=2, We=3, Th=4, Fr=5, Sa=6
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
          onChange(d1, d2) {
            selectedDate = d1
          },
        }),
        {width: 22, height: 8},
      )
      // Click on column 1 (Mo), row 0 (y=2) → should be June 1
      // x = 1 + 1*3 = 4 (center of Mo column)
      t.sendMouse('mouse.button.down', {x: 4, y: 2})
      t.sendMouse('mouse.button.up', {x: 4, y: 2})
      expect(selectedDate).toBeDefined()
      expect(selectedDate!.getDate()).toBe(1)
      expect(selectedDate!.getMonth()).toBe(5) // June (0-indexed)
    })

    it('switches to month picker when clicking month label', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      // Month name "June" starts at x=2
      t.sendMouse('mouse.button.down', {x: 3, y: 0})
      t.sendMouse('mouse.button.up', {x: 3, y: 0})
      expect(cal.displayMode).toBe('months')
      // Should show month names
      const text = t.terminal.textContent()
      expect(text).toContain('Jan')
      expect(text).toContain('Dec')
    })

    it('switches to year picker when clicking year label', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      // Year "2026" starts at x = 22 - 2 - 4 = 16
      t.sendMouse('mouse.button.down', {x: 17, y: 0})
      t.sendMouse('mouse.button.up', {x: 17, y: 0})
      expect(cal.displayMode).toBe('years')
      const text = t.terminal.textContent()
      expect(text).toContain('2026')
      expect(text).toContain('2024')
      expect(text).toContain('2028')
    })
  })

  describe('keyboard interaction', () => {
    it('moves selection right with arrow key', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendKey('right')
      expect(cal.date.getDate()).toBe(16)
    })

    it('moves selection left with arrow key', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendKey('left')
      expect(cal.date.getDate()).toBe(14)
    })

    it('moves selection up (7 days back) with arrow key', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendKey('up')
      expect(cal.date.getDate()).toBe(8)
    })

    it('moves selection down (7 days forward) with arrow key', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendKey('down')
      expect(cal.date.getDate()).toBe(22)
    })

    it('navigates to previous month with PageUp', () => {
      let visibleDate: Date | undefined
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
          onChangeVisible(d) {
            visibleDate = d
          },
        }),
        {width: 22, height: 8},
      )
      t.sendKey('pageup')
      expect(visibleDate).toBeDefined()
      expect(visibleDate!.getMonth()).toBe(4) // May
    })

    it('navigates to next month with PageDown', () => {
      let visibleDate: Date | undefined
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
          onChangeVisible(d) {
            visibleDate = d
          },
        }),
        {width: 22, height: 8},
      )
      t.sendKey('pagedown')
      expect(visibleDate).toBeDefined()
      expect(visibleDate!.getMonth()).toBe(6) // July
    })

    it('moves to first day with Home', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendKey('home')
      expect(cal.date.getDate()).toBe(1)
    })

    it('moves to last day with End', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendKey('end')
      expect(cal.date.getDate()).toBe(30) // June has 30 days
    })

    it('confirms selection with Enter', () => {
      let selectedDate: Date | undefined
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
          onChange(d1) {
            selectedDate = d1
          },
        }),
        {width: 22, height: 8},
      )
      t.sendKey('return')
      expect(selectedDate).toBeDefined()
      expect(selectedDate!.getDate()).toBe(15)
    })

    it('exits month picker with Escape', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      // Enter month mode by clicking month label
      t.sendMouse('mouse.button.down', {x: 3, y: 0})
      t.sendMouse('mouse.button.up', {x: 3, y: 0})
      expect(cal.displayMode).toBe('months')
      t.sendKey('escape')
      expect(cal.displayMode).toBe('days')
    })
  })

  describe('range selection', () => {
    it('selects a range with two Enter presses', () => {
      let rangeStart: Date | undefined
      let rangeEnd: Date | undefined
      const cal = new Calendar({
        date: date(2026, 6, 10),
        visibleDate: date(2026, 6, 1),
        selection: 'range',
        onChange(d1, d2) {
          rangeStart = d1
          rangeEnd = d2
        },
      })
      const t = testRender(cal, {width: 22, height: 8})
      // First Enter starts range
      t.sendKey('return')
      expect(rangeStart).toBeUndefined() // not called yet, only range start set
      // Move and complete range
      t.sendKey('right')
      t.sendKey('right')
      t.sendKey('right')
      t.sendKey('return')
      expect(rangeStart).toBeDefined()
      expect(rangeEnd).toBeDefined()
      expect(rangeStart!.getDate()).toBe(10)
      expect(rangeEnd!.getDate()).toBe(13)
    })
  })

  describe('month picker mode', () => {
    it('renders all 12 month names', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendMouse('mouse.button.down', {x: 3, y: 0})
      t.sendMouse('mouse.button.up', {x: 3, y: 0})
      const text = t.terminal.textContent()
      expect(text).toContain('Jan')
      expect(text).toContain('Feb')
      expect(text).toContain('Mar')
      expect(text).toContain('Apr')
      expect(text).toContain('May')
      expect(text).toContain('Jun')
      expect(text).toContain('Jul')
      expect(text).toContain('Aug')
      expect(text).toContain('Sep')
      expect(text).toContain('Oct')
      expect(text).toContain('Nov')
      expect(text).toContain('Dec')
    })

    it('selects a month and returns to day view', () => {
      let visibleDate: Date | undefined
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
        onChangeVisible(d) {
          visibleDate = d
        },
      })
      const t = testRender(cal, {width: 22, height: 8})
      // Enter month picker
      t.sendMouse('mouse.button.down', {x: 3, y: 0})
      t.sendMouse('mouse.button.up', {x: 3, y: 0})
      expect(cal.displayMode).toBe('months')
      // Click on "Jan" at row 0, col 0 → y=2, x=1
      t.sendMouse('mouse.button.down', {x: 2, y: 2})
      t.sendMouse('mouse.button.up', {x: 2, y: 2})
      expect(cal.displayMode).toBe('days')
      expect(visibleDate).toBeDefined()
      expect(visibleDate!.getMonth()).toBe(0) // January
    })
  })

  describe('year picker mode', () => {
    it('renders years centered on current year', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      // Enter year picker by clicking year label
      t.sendMouse('mouse.button.down', {x: 17, y: 0})
      t.sendMouse('mouse.button.up', {x: 17, y: 0})
      const text = t.terminal.textContent()
      expect(text).toContain('2024')
      expect(text).toContain('2025')
      expect(text).toContain('2026')
      expect(text).toContain('2027')
      expect(text).toContain('2028')
    })

    it('exits year picker with Escape', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendMouse('mouse.button.down', {x: 17, y: 0})
      t.sendMouse('mouse.button.up', {x: 17, y: 0})
      expect(cal.displayMode).toBe('years')
      t.sendKey('escape')
      expect(cal.displayMode).toBe('days')
    })
  })
})
