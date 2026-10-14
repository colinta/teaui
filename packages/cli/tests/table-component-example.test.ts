import {readFileSync} from 'node:fs'
import {Table, Text, lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {tableExample} from '../lib/examples/samples/table.js'

const SIZE = {width: 42, height: 18}

const STOCK = [
  {name: 'Cherries', quantity: 30, status: 'Ready'},
  {name: 'Apples', quantity: 10, status: 'Packed'},
  {name: 'Bananas', quantity: 2, status: 'Ready'},
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('table CLI component example', () => {
  it('documents generic rows, string keys, callbacks, and real framework differences', () => {
    expect(tableExample.name).toBe('table')
    expect(tableExample.availability).toBe('both')
    expect(tableExample.description).toContain('addRow()/removeRow()')
    expect(tableExample.description).toContain(
      'not automatic column layout or sorting',
    )
    expect(
      tableExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'data', type: 'TData[]', availability: 'both'},
      {name: 'columns', type: 'Column<TData>[]', availability: 'both'},
      {
        name: 'format',
        type: '(key: string, row: TData) => string',
        availability: 'core',
      },
      {
        name: 'format',
        type: '(key: string, row: TData) => string',
        availability: 'react',
      },
      {
        name: 'renderItem',
        type: '(item: TData, index: number) => React.ReactNode',
        availability: 'react',
      },
      {name: 'selectedIndex', type: 'number', availability: 'both'},
      {
        name: 'onSelect',
        type: '(row: TData, index: number) => void',
        availability: 'both',
      },
      {
        name: 'onSort',
        type: '(key: string, direction: SortDirection) => void',
        availability: 'both',
      },
      {name: 'sortKey', type: 'string', availability: 'both'},
      {name: 'sortDirection', type: "'asc' | 'desc'", availability: 'both'},
      {name: 'showRowNumbers', type: 'boolean', availability: 'both'},
      {name: 'isSelectable', type: 'boolean', availability: 'both'},
      {name: 'showSelected', type: 'boolean', availability: 'both'},
      {
        name: 'onSelectionChange',
        type: '(selectedItems: Set<TData>) => void',
        availability: 'both',
      },
      {name: 'childOffset', type: 'number', availability: 'core'},
      {
        name: 'width',
        type: "number | 'fill' | 'shrink' | 'natural'",
        availability: 'both',
      },
      {
        name: 'height',
        type: "number | 'fill' | 'shrink' | 'natural'",
        availability: 'both',
      },
    ])

    for (const framework of ['core', 'react'] as const) {
      const props = tableExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      const prop = (name: string) => props.find(prop => prop.name === name)!
      expect(new Set(names).size).toBe(names.length)
      expect(prop('data').description).toContain('Sorting copies the array')
      expect(prop('data').description).toContain('original item identities')
      expect(prop('columns').description).toContain(
        'not constrained to keyof TData',
      )
      expect(prop('columns').description).toContain('`${number}%`')
      expect(prop('columns').description).toContain(
        'sortable defaults to false',
      )
      expect(prop('format').description).toContain(
        'numeric-aware localeCompare',
      )
      expect(prop('selectedIndex').description).toContain(
        'not the multi-selection set',
      )
      expect(prop('onSelect').description).toContain(
        'only when isSelectable is false',
      )
      expect(prop('onSort').description).toContain(
        'not fired for initial props or update()',
      )
      expect(prop('onSort').description).toContain('key "#"')
      expect(prop('sortKey').description).toContain('preserves input order')
      expect(prop('sortDirection').description).toContain(
        'pass sortKey and sortDirection together',
      )
      expect(prop('showRowNumbers').description).toContain(
        'not original array indices',
      )
      expect(prop('showSelected').description).toContain(
        'defaults to isSelectable',
      )
      expect(prop('showSelected').description).toContain(
        'does not enable row toggling',
      )
      expect(prop('onSelectionChange').description).toContain('new Set')
      expect(prop('height').description).toContain('two header/separator lines')
      for (const name of [
        'children',
        'child',
        'ref',
        'rowHeight',
        'selectedItems',
      ]) {
        expect(names).not.toContain(name)
      }
      if (framework === 'core') {
        expect(prop('format').description).toContain('Required Core')
        expect(names).not.toContain('renderItem')
        expect(prop('childOffset').description).toContain('first addRow() view')
      } else {
        expect(prop('format').description).toContain(
          'omitted defaults to blank strings',
        )
        expect(prop('renderItem').description).toContain(
          'zero-based in the input data',
        )
        expect(prop('renderItem').description).toContain('clipped to one line')
        expect(prop('renderItem').description).toContain(
          'not laid out into columns or reordered',
        )
        expect(names).not.toContain('childOffset')
      }
    }
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures its exact deterministic public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/table.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(tableExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /createElement|captureExample|HeadlessProgram|testRender|tui-|setTimeout|setInterval|Math\.random|Date\./,
      )
      if (framework === 'core') {
        expect(source).toContain('await Screen.start(examples)')
        expect(source).toContain(
          "names.update({width: 42, height: 5, sortKey: 'name', sortDirection: 'desc'})",
        )
        expect(source).toContain('names.selectedIndex = 1')
        expect(source).toContain('custom.addRow(new Text(')
        expect(source).toContain('screen.render()')
        expect(source).not.toContain('custom.add(')
      } else {
        expect(source).toContain('await run(')
        expect(source.match(/<Table<Stock>/g)).toHaveLength(3)
        expect(source).toContain('<Stack.down width={42} height={18}>')
        expect(source).toContain('<Stack.down width={42} height={5}>')
        expect(source).toContain('renderItem={(row, index) => (')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const update = vi.spyOn(Table.prototype, 'update')
      const setCursor = vi.spyOn(Table.prototype, 'selectedIndex', 'set')
      const addRow = vi.spyOn(Table.prototype, 'addRow')
      const output = await tableExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      if (framework === 'core') {
        expect(update).toHaveBeenCalledExactlyOnceWith({
          width: 42,
          height: 5,
          sortKey: 'name',
          sortDirection: 'desc',
        })
        expect(setCursor).toHaveBeenCalledExactlyOnceWith(1)
        expect(addRow).toHaveBeenCalledTimes(3)
        expect(addRow.mock.calls.map(([view]) => (view as Text).text)).toEqual([
          '1: Cherries (30 units)',
          '2: Apples (10 units)',
          '3: Bananas (2 units)',
        ])
      }

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines[0].trimEnd()).toBe('Text cells: quantity ascending')
      expect(lines[1]).toContain('Qty▲')
      expect(
        lines
          .slice(3, 6)
          .map(line => line.match(/Bananas|Apples|Cherries/)?.[0]),
      ).toEqual(['Bananas', 'Apples', 'Cherries'])
      expect(lines.slice(3, 6).map(line => line.split('│')[2].trim())).toEqual([
        '2',
        '10',
        '30',
      ])
      expect(
        lines.slice(3, 6).map(line => line.slice(1).split('│')[0].trim()),
      ).toEqual(['1', '2', '3'])
      expect(lines[4]).toContain('▷')
      expect(lines[6].trimEnd()).toBe('Text cells: name descending + selection')
      expect(lines[7]).toContain('▼')
      expect(
        lines
          .slice(9, 12)
          .map(line => line.match(/Bananas|Apples|Cherries/)?.[0]),
      ).toEqual(['Cherries', 'Bananas', 'Apples'])
      expect(text.match(/\[ \]/g)).toHaveLength(4)
      expect(text).not.toContain('[✕]')
      expect(lines[12].trimEnd()).toBe('Custom rows: input order')
      expect(lines[13]).toContain('Stock summary')
      expect(
        lines.slice(15, 18).map(line => line.match(/\d: .*units\)/)?.[0]),
      ).toEqual([
        '1: Cherries (30 units)',
        '2: Apples (10 units)',
        '3: Bananas (2 units)',
      ])
      for (const separator of [2, 8, 14]) {
        expect(lines[separator]).toBe('─'.repeat(SIZE.width))
      }
      expect(text).toMatchSnapshot('sorted cells and public custom rows')
      expect(output).toMatchSnapshot('exact styled capture')
      expect(await tableExample.render[framework]()).toBe(output)
    },
  )

  it('renders equivalent public Core and JSX row content', async () => {
    expect(removeAnsi(await tableExample.render.react())).toBe(
      removeAnsi(await tableExample.render.core()),
    )
  })

  it('keeps checkbox visibility separate from row toggling and returns selection-set copies', () => {
    const onSelectionChange = vi.fn()
    const table = new Table({
      data: STOCK,
      columns: [{key: 'name', title: 'Name'}],
      format: (_key, row) => row.name,
      showSelected: true,
      onSelectionChange,
    })
    const space = {
      type: 'key' as const,
      char: ' ',
      name: 'space' as const,
      full: 'space' as const,
      ctrl: false,
      alt: false,
      gui: false,
      shift: false,
    }
    table.receiveKey(space)
    expect(onSelectionChange).not.toHaveBeenCalled()
    table.update({isSelectable: true, showSelected: false})
    table.receiveKey(space)
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([STOCK[0]]))
    const selected = onSelectionChange.mock.calls[0][0] as Set<
      (typeof STOCK)[number]
    >
    expect([...selected][0]).toBe(STOCK[0])
    selected.clear()
    // Clearing the notification copy cannot mutate the Table's internal set.
    table.receiveKey(space)
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set())
    expect(table.selectedIndex).toBe(0)
  })

  it('does not mutate source data while applying numeric-aware ascending and descending sorts', () => {
    const data = STOCK.map(row => ({...row}))
    const original = [...data]
    const onSelect = vi.fn()
    const onSort = vi.fn()
    const table = new Table({
      data,
      columns: [{key: 'quantity', title: 'Qty', sortable: true}],
      format: (key, row) => String(row[key as keyof typeof row]),
      sortKey: 'quantity',
      sortDirection: 'asc',
      selectedIndex: 0,
      onSelect,
      onSort,
    })
    const enter = {
      type: 'key' as const,
      char: '',
      name: 'return' as const,
      full: 'return' as const,
      ctrl: false,
      alt: false,
      gui: false,
      shift: false,
    }
    table.receiveKey(enter)
    expect(onSelect).toHaveBeenLastCalledWith(data[2], 0)
    table.update({sortKey: 'quantity', sortDirection: 'desc'})
    table.receiveKey(enter)
    expect(onSelect).toHaveBeenLastCalledWith(data[0], 0)
    expect(onSort).not.toHaveBeenCalled()
    expect(data).toEqual(original)
    expect(data.every((row, index) => row === original[index])).toBe(true)
  })
})
