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
      const rows = renderRows(makeTable(), {width: 30, height: 8})
      expect(rows).toEqual([
        ' Name     │   Age │ City',
        '──────────────────────────────',
        '▶Alice    │    30 │ New York',
        ' Bob      │    25 │ Chicago',
        ' Charlie  │    35 │ Austin',
        ' Diana    │    28 │ Seattle',
        ' Eve      │    42 │ Denver',
        '',
      ])
    })

    it('shows ascending sort indicator after column title', () => {
      const rows = renderRows(
        makeTable({sortKey: 'name', sortDirection: 'asc'}),
        {width: 30, height: 4},
      )
      expect(rows[0]).toBe(' Name ▲   │   Age │ City')
    })

    it('shows descending sort indicator', () => {
      const rows = renderRows(
        makeTable({sortKey: 'city', sortDirection: 'desc'}),
        {width: 30, height: 4},
      )
      expect(rows[0]).toBe(' Name     │   Age │ City ▼')
    })
  })

  describe('selection', () => {
    it('shows ▶ on selected row', () => {
      const rows = renderRows(makeTable({selectedIndex: 2}), {
        width: 30,
        height: 8,
      })
      expect(rows).toEqual([
        ' Name     │   Age │ City',
        '──────────────────────────────',
        ' Alice    │    30 │ New York',
        ' Bob      │    25 │ Chicago',
        '▶Charlie  │    35 │ Austin',
        ' Diana    │    28 │ Seattle',
        ' Eve      │    42 │ Denver',
        '',
      ])
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
      const rows = renderRows(makeTable({selectedIndex: 0}), {
        width: 30,
        height: 5,
      })
      expect(rows).toEqual([
        ' Name     │   Age │ City',
        '──────────────────────────────',
        '▶Alice    │    30 │ New York',
        ' Bob      │    25 │ Chicago',
        ' Char [ ↓ 3 more rows ] in',
      ])
    })

    it('both indicators overlaid on dimmed rows', () => {
      const rows = renderRows(makeTable({selectedIndex: 2}), {
        width: 30,
        height: 5,
      })
      expect(rows).toEqual([
        ' Name     │   Age │ City',
        '──────────────────────────────',
        ' Bob  [ ↑ 2 more rows ] ago',
        '▶Charlie  │    35 │ Austin',
        ' Dian [ ↓ 2 more rows ] tle',
      ])
    })

    it('no ↑ when scrollOffset is 0', () => {
      const rows = renderRows(makeTable({selectedIndex: 1}), {
        width: 30,
        height: 5,
      })
      expect(rows).toEqual([
        ' Name     │   Age │ City',
        '──────────────────────────────',
        ' Alice    │    30 │ New York',
        '▶Bob      │    25 │ Chicago',
        ' Char [ ↓ 3 more rows ] in',
      ])
    })

    it('no indicators when all rows fit', () => {
      const rows = renderRows(makeTable({selectedIndex: 0}), {
        width: 30,
        height: 9,
      })
      expect(rows).toEqual([
        ' Name     │   Age │ City',
        '──────────────────────────────',
        '▶Alice    │    30 │ New York',
        ' Bob      │    25 │ Chicago',
        ' Charlie  │    35 │ Austin',
        ' Diana    │    28 │ Seattle',
        ' Eve      │    42 │ Denver',
        '',
        '',
      ])
    })

    it('selected row is never hidden by bottom indicator (height=16)', () => {
      // 20 data rows, bodyHeight=14, halfHeight=7.
      // selectedIndex=13: data.length - halfHeight = 13, so moving window
      // condition (13 < 13) is false. The selected row must NOT land on
      // the indicator row — it must be visible with ▶.
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
      // The selected row must be visible with ▶ (not covered by indicator)
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
      const rows = renderRows(
        makeTable({showRowNumbers: true, sortKey: 'name'}),
        {width: 35, height: 8},
      )
      expect(rows).toEqual([
        ' # │ Name ▲   │   Age │ City',
        '───────────────────────────────────',
        '▶1 │ Alice    │    30 │ New York',
        ' 2 │ Bob      │    25 │ Chicago',
        ' 3 │ Charlie  │    35 │ Austin',
        ' 4 │ Diana    │    28 │ Seattle',
        ' 5 │ Eve      │    42 │ Denver',
        '',
      ])
    })

    it('shows sort arrow on # when sorting by original order', () => {
      const rows = renderRows(makeTable({showRowNumbers: true}), {
        width: 35,
        height: 4,
      })
      // No sortKey → sorting by original order, arrow replaces #
      expect(rows[0]).toBe(' ▲ │ Name     │   Age │ City')
    })

    it('does not show row numbers when disabled', () => {
      const rows = renderRows(makeTable({showRowNumbers: false}), {
        width: 30,
        height: 4,
      })
      expect(rows[0]).toBe(' Name     │   Age │ City')
      expect(rows[0]).not.toContain('#')
    })

    it('widens row number column for 2-digit counts', () => {
      const bigData: Row[] = Array.from({length: 12}, (_, i) => ({
        name: 'Row' + i,
        age: i,
        city: 'City' + i,
      }))
      const rows = renderRows(
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
      // 2-digit column: header is ' #', single digits are right-aligned
      expect(rows[0]).toBe('  # │ Name ▲   │   Age │ City')
      expect(rows[2]).toBe('▶ 1 │ Row0     │     0 │ City0')
      expect(rows[11]).toBe(' 10 │ Row9     │     9 │ City9')
      expect(rows[13]).toBe(' 12 │ Row11    │    11 │ City11')
    })

    it('widens row number column for 3-digit counts', () => {
      const bigData: Row[] = Array.from({length: 150}, (_, i) => ({
        name: 'R' + i,
        age: i,
        city: 'C' + i,
      }))
      const rows = renderRows(
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
      // 3-digit column: header is '  #', numbers are right-aligned
      expect(rows).toEqual([
        '   # │ Name ▲   │   Age │ City',
        '────────────────────────────────────────',
        ' 147 │ R1 [ ↑ 147 more rows ]',
        ' 148 │ R147     │   147 │ C147',
        ' 149 │ R148     │   148 │ C148',
        '▶150 │ R149     │   149 │ C149',
      ])
    })
  })

  describe('column layout', () => {
    it('right-aligns values in right-aligned columns', () => {
      const rows = renderRows(makeTable(), {width: 30, height: 4})
      expect(rows[2]).toContain('│    30 │')
    })

    it('uses fixed widths for specified columns', () => {
      const rows = renderRows(
        makeTable({
          columns: [
            {key: 'name', title: 'Name', width: 10},
            {key: 'age', title: 'Age', width: 5},
          ],
        }),
        {width: 20, height: 4},
      )
      expect(rows[0]).toBe(' Name       │ Age')
    })
  })
})
