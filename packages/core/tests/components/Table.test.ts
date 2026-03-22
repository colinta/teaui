import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Table, type Column} from '../../lib/components/Table.js'

interface Row {
  name: string
  age: number
  city: string
}

const COLUMNS: Column<Row>[] = [
  {key: 'name', title: 'Name', width: 8},
  {key: 'age', title: 'Age', width: 5, align: 'right'},
  {key: 'city', title: 'City', width: 8},
]

const DATA: Row[] = [
  {name: 'Alice', age: 30, city: 'New York'},
  {name: 'Bob', age: 25, city: 'Chicago'},
  {name: 'Charlie', age: 35, city: 'Austin'},
  {name: 'Diana', age: 28, city: 'Seattle'},
  {name: 'Eve', age: 42, city: 'Denver'},
]

function format(key: string, row: Row): string {
  return String(row[key as keyof Row])
}

function makeTable(overrides: Partial<Parameters<typeof Table<Row>>[0]> = {}) {
  return new Table<Row>({
    data: DATA,
    columns: COLUMNS,
    format,
    ...overrides,
  })
}

/** Returns all rows as an array of strings (no trailing whitespace). */
function renderRows(
  table: Table<Row>,
  size: {width: number; height: number},
): string[] {
  const t = testRender(table, size)
  const rows: string[] = []
  for (let y = 0; y < size.height; y++) {
    rows.push(t.terminal.textAtRow(y))
  }
  return rows
}

describe('Table', () => {
  describe('header rendering', () => {
    it('renders header, separator, and data rows', () => {
      const t = testRender(makeTable(), {width: 30, height: 8})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('shows ascending sort indicator after column title', () => {
      const t = testRender(makeTable({sortKey: 'name', sortDirection: 'asc'}), {
        width: 30,
        height: 4,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('shows descending sort indicator', () => {
      const t = testRender(
        makeTable({sortKey: 'city', sortDirection: 'desc'}),
        {width: 30, height: 4},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('selection', () => {
    it('shows ▶ on selected row', () => {
      const t = testRender(makeTable({selectedIndex: 2}), {
        width: 30,
        height: 8,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('moves selection with arrow keys', () => {
      const t = testRender(makeTable(), {width: 30, height: 8})
      expect(t.terminal.textAtRow(2)).toBe('▶Alice    │    30 │ New York')

      t.sendKey('down')
      expect(t.terminal.textAtRow(2)).toBe(' Alice    │    30 │ New York')
      expect(t.terminal.textAtRow(3)).toBe('▶Bob      │    25 │ Chicago')
    })

    it('clamps selection at top', () => {
      const t = testRender(makeTable({selectedIndex: 0}), {
        width: 30,
        height: 8,
      })
      t.sendKey('up')
      expect(t.terminal.textAtRow(2)).toBe('▶Alice    │    30 │ New York')
    })

    it('clamps selection at bottom', () => {
      const t = testRender(makeTable({selectedIndex: 4}), {
        width: 30,
        height: 8,
      })
      t.sendKey('down')
      expect(t.terminal.textAtRow(6)).toBe('▶Eve      │    42 │ Denver')
    })

    it('Home/End jump to first/last row', () => {
      const t = testRender(makeTable({selectedIndex: 2}), {
        width: 30,
        height: 8,
      })
      t.sendKey('home')
      expect(t.terminal.textAtRow(2)).toBe('▶Alice    │    30 │ New York')

      t.sendKey('end')
      expect(t.terminal.textAtRow(6)).toBe('▶Eve      │    42 │ Denver')
    })

    it('fires onSelect on Enter', () => {
      let selected: Row | null = null
      let selectedIdx = -1
      const t = testRender(
        makeTable({
          selectedIndex: 1,
          onSelect(row, index) {
            selected = row
            selectedIdx = index
          },
        }),
        {width: 30, height: 8},
      )
      t.sendKey('return')
      expect(selected).toEqual(DATA[1])
      expect(selectedIdx).toBe(1)
    })
  })

  describe('scroll indicators', () => {
    it('↓ indicator overlaid on dimmed last row', () => {
      const t = testRender(makeTable({selectedIndex: 0}), {
        width: 30,
        height: 5,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('both indicators overlaid on dimmed rows', () => {
      const t = testRender(makeTable({selectedIndex: 2}), {
        width: 30,
        height: 5,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('no ↑ when scrollOffset is 0', () => {
      const t = testRender(makeTable({selectedIndex: 1}), {
        width: 30,
        height: 5,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('no indicators when all rows fit', () => {
      const t = testRender(makeTable({selectedIndex: 0}), {
        width: 30,
        height: 9,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('selected row is never hidden by bottom indicator (height=16)', () => {
      const bigData: Row[] = Array.from({length: 20}, (_, i) => ({
        name: 'Row' + String(i).padStart(2, '0'),
        age: 20 + i,
        city: 'City' + String(i).padStart(2, '0'),
      }))
      const bigColumns: Column<Row>[] = [
        {key: 'name', title: 'Name', width: 8},
        {key: 'age', title: 'Age', width: 5, align: 'right'},
        {key: 'city', title: 'City', width: 8},
      ]
      const rows = renderRows(
        new Table<Row>({
          data: bigData,
          columns: bigColumns,
          format,
          selectedIndex: 13,
        }),
        {width: 30, height: 16},
      )
      const selectedRow = rows.find(r => r.includes('Row13'))
      expect(selectedRow).toBeDefined()
      expect(selectedRow).toContain('▶')
    })

    it('selected row is never hidden by bottom indicator (height=14)', () => {
      const bigData: Row[] = Array.from({length: 20}, (_, i) => ({
        name: 'Row' + String(i).padStart(2, '0'),
        age: 20 + i,
        city: 'City' + String(i).padStart(2, '0'),
      }))
      const bigColumns: Column<Row>[] = [
        {key: 'name', title: 'Name', width: 8},
        {key: 'age', title: 'Age', width: 5, align: 'right'},
        {key: 'city', title: 'City', width: 8},
      ]
      const rows = renderRows(
        new Table<Row>({
          data: bigData,
          columns: bigColumns,
          format,
          selectedIndex: 11,
        }),
        {width: 30, height: 14},
      )
      const selectedRow = rows.find(r => r.includes('Row11'))
      expect(selectedRow).toBeDefined()
      expect(selectedRow).toContain('▶')
    })
  })

  describe('row numbers', () => {
    it('renders row number column with # header', () => {
      const t = testRender(makeTable({showRowNumbers: true, sortKey: 'name'}), {
        width: 35,
        height: 8,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('shows sort arrow on # when sorting by original order', () => {
      const t = testRender(makeTable({showRowNumbers: true}), {
        width: 35,
        height: 4,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('does not show row numbers when disabled', () => {
      const t = testRender(makeTable({showRowNumbers: false}), {
        width: 30,
        height: 4,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('widens row number column for 2-digit counts', () => {
      const bigData: Row[] = Array.from({length: 12}, (_, i) => ({
        name: 'Row' + i,
        age: i,
        city: 'City' + i,
      }))
      const t = testRender(
        new Table<Row>({
          data: bigData,
          columns: COLUMNS,
          format,
          selectedIndex: 0,
          showRowNumbers: true,
          sortKey: 'name',
        }),
        {width: 35, height: 14},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('widens row number column for 3-digit counts', () => {
      const bigData: Row[] = Array.from({length: 150}, (_, i) => ({
        name: 'R' + i,
        age: i,
        city: 'C' + i,
      }))
      const t = testRender(
        new Table<Row>({
          data: bigData,
          columns: COLUMNS,
          format,
          selectedIndex: 149,
          showRowNumbers: true,
          sortKey: 'name',
        }),
        {width: 40, height: 6},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('selection (multi-select)', () => {
    it('renders checkbox column with showSelected', () => {
      const t = testRender(
        makeTable({isSelectable: true, showSelected: true, selectedIndex: 0}),
        {width: 35, height: 8},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('space bar toggles selection', () => {
      const t = testRender(
        makeTable({isSelectable: true, showSelected: true, selectedIndex: 0}),
        {width: 35, height: 8},
      )
      expect(t.terminal.textAtRow(2)).toBe('▶[ ] │ Alice    │    30 │ New York')

      t.sendKey('space')
      expect(t.terminal.textAtRow(2)).toBe('▶[⨉] │ Alice    │    30 │ New York')

      // Toggle off
      t.sendKey('space')
      expect(t.terminal.textAtRow(2)).toBe('▶[ ] │ Alice    │    30 │ New York')
    })

    it('multiple rows can be selected', () => {
      const t = testRender(
        makeTable({isSelectable: true, showSelected: true, selectedIndex: 0}),
        {width: 35, height: 8},
      )
      t.sendKey('space') // select Alice
      t.sendKey('down')
      t.sendKey('space') // select Bob
      expect(t.terminal.textAtRow(2)).toBe(' [⨉] │ Alice    │    30 │ New York')
      expect(t.terminal.textAtRow(3)).toBe('▶[⨉] │ Bob      │    25 │ Chicago')
      expect(t.terminal.textAtRow(4)).toBe(' [ ] │ Charlie  │    35 │ Austin')
    })

    it('fires onSelectionChange callback', () => {
      let lastSelection: Set<Row> | null = null
      const t = testRender(
        makeTable({
          isSelectable: true,
          showSelected: true,
          selectedIndex: 0,
          onSelectionChange(items) {
            lastSelection = items
          },
        }),
        {width: 35, height: 8},
      )
      t.sendKey('space')
      expect(lastSelection).not.toBeNull()
      expect(lastSelection!.size).toBe(1)
      expect([...lastSelection!][0].name).toBe('Alice')

      t.sendKey('down')
      t.sendKey('space')
      expect(lastSelection!.size).toBe(2)
    })

    it('header shows [·] when some items checked', () => {
      const t = testRender(
        makeTable({isSelectable: true, showSelected: true, selectedIndex: 0}),
        {width: 35, height: 8},
      )
      expect(t.terminal.textAtRow(0)).toContain('[ ]')
      t.sendKey('space') // check Alice
      expect(t.terminal.textAtRow(0)).toContain('[·]')
    })

    it('header shows [⨉] when all items checked', () => {
      const t = testRender(
        makeTable({isSelectable: true, showSelected: true, selectedIndex: 0}),
        {width: 35, height: 8},
      )
      // Check all 5 rows
      for (let i = 0; i < 5; i++) {
        t.sendKey('space')
        t.sendKey('down')
      }
      expect(t.terminal.textAtRow(0)).toContain('[⨉]')
    })

    it('isSelectable shows checkbox column by default', () => {
      const t = testRender(makeTable({isSelectable: true, selectedIndex: 0}), {
        width: 35,
        height: 4,
      })
      expect(t.terminal.textAtRow(0)).toContain('[ ]')
    })

    it('isSelectable with showSelected=false hides checkbox column', () => {
      let lastSelection: Set<Row> | null = null
      const t = testRender(
        makeTable({
          isSelectable: true,
          showSelected: false,
          selectedIndex: 0,
          onSelectionChange(items) {
            lastSelection = items
          },
        }),
        {width: 30, height: 8},
      )
      expect(t.terminal.textAtRow(0)).not.toContain('[ ]')
      t.sendKey('space')
      expect(lastSelection!.size).toBe(1)
    })
  })

  describe('column layout', () => {
    it('right-aligns values in right-aligned columns', () => {
      const rows = renderRows(makeTable(), {width: 30, height: 4})
      expect(rows[2]).toContain('│    30 │')
    })

    it('uses fixed widths for specified columns', () => {
      const t = testRender(
        makeTable({
          columns: [
            {key: 'name', title: 'Name', width: 10},
            {key: 'age', title: 'Age', width: 5},
          ],
        }),
        {width: 20, height: 4},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })
})
