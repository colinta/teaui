import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Calendar} from '../../lib/components/Calendar.js'

function date(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d)
}

function openMonthPicker(t: ReturnType<typeof testRender>) {
  t.sendMouse('mouse.button.down', {x: 4, y: 0})
  t.sendMouse('mouse.button.up', {x: 4, y: 0})
}

function openYearPicker(t: ReturnType<typeof testRender>) {
  t.sendMouse('mouse.button.down', {x: 17, y: 0})
  t.sendMouse('mouse.button.up', {x: 17, y: 0})
}

describe('Calendar', () => {
  describe('rendering', () => {
    it('renders the month header and weekday row', () => {
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
        }),
        {width: 22, height: 8, isFocused: false},
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

    it('matches the fixed grid for a 31-day month starting on friday', () => {
      const t = testRender(
        new Calendar({
          date: date(2021, 10, 15),
          visibleDate: date(2021, 10, 1),
        }),
        {width: 22, height: 8, isFocused: false},
      )

      expect(t.terminal.textContent()).toMatchInlineSnapshot(`
        " ◃  October   2021  ▹
         Su Mo Tu We Th Fr Sa
         26 27 28 29 30  1  2
          3  4  5  6  7  8  9
         10 11 12 13 14 15 16
         17 18 19 20 21 22 23
         24 25 26 27 28 29 30
         31  1  2  3  4  5  6"
      `)
    })

    it('renders with focus', () => {
      const t = testRender(
        new Calendar({
          date: date(2021, 10, 15),
          visibleDate: date(2021, 10, 1),
        }),
        {width: 22, height: 8, isFocused: true},
      )

      expect(t.terminal.textContent()).toMatchInlineSnapshot(`
        " ◃  October   2021  ▹
        ╭Su─Mo─Tu─We─Th─Fr─Sa╮
        │26 27 28 29 30  1  2│
        │ 3  4  5  6  7  8  9│
        │10 11 12 13 14 15 16│
        │17 18 19 20 21 22 23│
        │24 25 26 27 28 29 30│
        ╰31─ 1─ 2─ 3─ 4─ 5─ 6╯"
      `)
    })

    it('matches the fixed grid for a february starting on monday', () => {
      const t = testRender(
        new Calendar({
          date: date(2021, 2, 15),
          visibleDate: date(2021, 2, 1),
        }),
        {width: 22, height: 8, isFocused: false},
      )

      expect(t.terminal.textContent()).toMatchInlineSnapshot(`
        " ◃  February  2021  ▹
         Su Mo Tu We Th Fr Sa
         31  1  2  3  4  5  6
          7  8  9 10 11 12 13
         14 15 16 17 18 19 20
         21 22 23 24 25 26 27
         28  1  2  3  4  5  6
          7  8  9 10 11 12 13"
      `)
    })

    it('matches the fixed grid for monday-first rendering', () => {
      const t = testRender(
        new Calendar({
          date: date(2021, 2, 15),
          visibleDate: date(2021, 2, 1),
          firstDayOfWeek: 1,
        }),
        {width: 22, height: 8, isFocused: false},
      )

      expect(t.terminal.textContent()).toMatchInlineSnapshot(`
        " ◃  February  2021  ▹
         Mo Tu We Th Fr Sa Su
          1  2  3  4  5  6  7
          8  9 10 11 12 13 14
         15 16 17 18 19 20 21
         22 23 24 25 26 27 28
          1  2  3  4  5  6  7
          8  9 10 11 12 13 14"
      `)
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
      expect(text).toContain('◃')
      expect(text).toContain('▹')
    })

    it('renders selected date with highlight style', () => {
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
          theme: 'blue',
        }),
        {width: 22, height: 8},
      )
      const selectedStyle = t.terminal.styleAt(4, 4)
      const normalStyle = t.terminal.styleAt(7, 4)
      expect(selectedStyle.bold).toBe(true)
      expect(normalStyle.bold).toBe(false)
    })

    it('renders today with bold style', () => {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const t = testRender(
        new Calendar({
          date: date(2000, 1, 1),
          visibleDate: new Date(now.getFullYear(), now.getMonth(), 1),
        }),
        {width: 22, height: 8},
      )
      expect(t.terminal.textContent()).toContain(String(today.getDate()))
    })
  })

  describe('natural size', () => {
    it('reports fixed 22×8 size', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 40, height: 20})
      expect(t.terminal.textContent()).toContain('June')
    })

    it('only paints the calendar background inside its fixed bounds', () => {
      const t = testRender(
        new Calendar({
          date: date(2026, 6, 15),
          visibleDate: date(2026, 6, 1),
          theme: 'blue',
        }),
        {width: 40, height: 20},
      )

      expect(t.terminal.find('June')).toBeTruthy()
      expect(t.terminal.styleAt(30, 0).background).toBe('default')
      expect(t.terminal.styleAt(0, 10).background).toBe('default')
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
      t.sendMouse('mouse.button.down', {x: 0, y: 0})
      t.sendMouse('mouse.button.up', {x: 0, y: 0})
      expect(visibleDate).toBeDefined()
      expect(visibleDate!.getMonth()).toBe(4)
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
      t.sendMouse('mouse.button.down', {x: 21, y: 0})
      t.sendMouse('mouse.button.up', {x: 21, y: 0})
      expect(visibleDate).toBeDefined()
      expect(visibleDate!.getMonth()).toBe(6)
    })

    it('selects a date on mouse down', () => {
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
      t.sendMouse('mouse.button.down', {x: 4, y: 2})
      expect(selectedDate).toBeDefined()
      expect(selectedDate!.getDate()).toBe(1)
      expect(selectedDate!.getMonth()).toBe(5)
    })

    it('switches to month picker when clicking month label', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      openMonthPicker(t)
      expect(cal.displayMode).toBe('months')
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
      openYearPicker(t)
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
      expect(cal.cursorDate.getDate()).toBe(16)
    })

    it('moves selection left with arrow key', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendKey('left')
      expect(cal.cursorDate.getDate()).toBe(14)
    })

    it('moves cursor up (7 days back) with arrow key', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendKey('up')
      expect(cal.cursorDate.getDate()).toBe(8)
    })

    it('moves cursor down (7 days forward) with arrow key', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendKey('down')
      expect(cal.cursorDate.getDate()).toBe(22)
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
      expect(visibleDate!.getMonth()).toBe(4)
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
      expect(visibleDate!.getMonth()).toBe(6)
    })

    it('moves cursor to first day with Home', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendKey('home')
      expect(cal.cursorDate.getDate()).toBe(1)
    })

    it('moves cursor to last day with End', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      t.sendKey('end')
      expect(cal.cursorDate.getDate()).toBe(30)
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
      openMonthPicker(t)
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
      t.sendKey('return')
      expect(rangeStart).toBeUndefined()
      t.sendKey('right')
      t.sendKey('right')
      t.sendKey('right')
      t.sendKey('return')
      expect(rangeStart).toBeDefined()
      expect(rangeEnd).toBeDefined()
      expect(rangeStart!.getDate()).toBe(10)
      expect(rangeEnd!.getDate()).toBe(13)
    })

    it('keeps a single selected date after the first click', () => {
      const cal = new Calendar({
        date: date(2026, 6, 10),
        visibleDate: date(2026, 6, 1),
        selection: 'range',
      })
      const t = testRender(cal, {width: 22, height: 8})

      t.sendMouse('mouse.button.down', {x: 4, y: 2})
      t.sendMouse('mouse.button.up', {x: 4, y: 2})

      expect(cal.date.getDate()).toBe(1)
      expect(cal.displayMode).toBe('days')
    })

    it('supports selecting a range with two clicks', () => {
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

      t.sendMouse('mouse.button.down', {x: 4, y: 2})
      t.sendMouse('mouse.button.up', {x: 4, y: 2})
      t.sendMouse('mouse.button.down', {x: 13, y: 2})
      t.sendMouse('mouse.button.up', {x: 13, y: 2})

      expect(rangeStart).toBeDefined()
      expect(rangeEnd).toBeDefined()
      expect(rangeStart!.getDate()).toBe(1)
      expect(rangeEnd!.getDate()).toBe(4)
    })

    it('supports drag selection with the mouse', () => {
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

      t.sendMouse('mouse.button.down', {x: 4, y: 2})
      expect(cal.date.getDate()).toBe(1)
      t.sendMouse('mouse.button.down', {x: 13, y: 2})
      expect(cal.date.getDate()).toBe(4)
      t.sendMouse('mouse.button.up', {x: 13, y: 2})

      expect(rangeStart).toBeDefined()
      expect(rangeEnd).toBeDefined()
      expect(rangeStart!.getDate()).toBe(1)
      expect(rangeEnd!.getDate()).toBe(4)
    })
  })

  describe('month picker mode', () => {
    it('matches the month picker snapshot', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      openMonthPicker(t)

      expect(t.terminal.textContent()).toMatchInlineSnapshot(`
        "        June        ×
        
          Jan    Feb    Mar
          Apr    May    Jun
          Jul    Aug    Sep
          Oct    Nov    Dec"
      `)
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
      openMonthPicker(t)
      expect(cal.displayMode).toBe('months')
      t.sendMouse('mouse.button.down', {x: 2, y: 2})
      t.sendMouse('mouse.button.up', {x: 2, y: 2})
      expect(cal.displayMode).toBe('days')
      expect(visibleDate).toBeDefined()
      expect(visibleDate!.getMonth()).toBe(0)
    })
  })

  describe('year picker mode', () => {
    it('matches the year picker snapshot', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      openYearPicker(t)

      expect(t.terminal.textContent()).toMatchInlineSnapshot(`
        "        Year        ×
                [ ↑ ]
                 2024
                 2025
                 2026
                 2027
                 2028
                [ ↓ ]"
      `)
    })

    it('renders years centered on current year', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      openYearPicker(t)
      const text = t.terminal.textContent()
      expect(text).toContain('2024')
      expect(text).toContain('2025')
      expect(text).toContain('2026')
      expect(text).toContain('2027')
      expect(text).toContain('2028')
      expect(text.split('\n')[0]).not.toContain('↑')
    })

    it('scrolls up only from the second arrow row', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      openYearPicker(t)

      t.sendMouse('mouse.button.down', {x: 11, y: 0})
      t.sendMouse('mouse.button.up', {x: 11, y: 0})
      expect(t.terminal.textContent()).toContain('2024')

      t.sendMouse('mouse.button.down', {x: 11, y: 1})
      t.sendMouse('mouse.button.up', {x: 11, y: 1})
      expect(t.terminal.textContent()).toContain('2019')
    })

    it('exits year picker with Escape', () => {
      const cal = new Calendar({
        date: date(2026, 6, 15),
        visibleDate: date(2026, 6, 1),
      })
      const t = testRender(cal, {width: 22, height: 8})
      openYearPicker(t)
      expect(cal.displayMode).toBe('years')
      t.sendKey('escape')
      expect(cal.displayMode).toBe('days')
    })
  })
})
