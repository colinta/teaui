import {readFileSync} from 'node:fs'
import {ScrollableList, lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {scrollableListExample} from '../lib/examples/samples/scrollable-list.js'

const SIZE = {width: 36, height: 13}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('scrollable-list CLI component example', () => {
  it('documents generic row renderers and only the supported framework props', () => {
    expect(scrollableListExample.name).toBe('scrollable-list')
    expect(scrollableListExample.availability).toBe('both')
    expect(scrollableListExample.description).toContain('not a selectable list')
    expect(
      scrollableListExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'data', type: 'T[]', availability: 'both'},
      {
        name: 'renderItem',
        type: '(item: T, row: number) => View',
        availability: 'core',
      },
      {
        name: 'renderItem',
        type: '(item: T, index: number) => React.ReactNode',
        availability: 'react',
      },
      {
        name: 'filter',
        type: '(item: T) => boolean',
        availability: 'both',
      },
      {name: 'showScrollbars', type: 'boolean', availability: 'core'},
      {name: 'keepAtBottom', type: 'boolean', availability: 'core'},
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
      const props = scrollableListExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(new Set(names).size).toBe(names.length)
      const prop = (name: string) => props.find(prop => prop.name === name)!
      expect(prop('data').description).toContain('Required item array')
      expect(prop('data').description).toContain('updateData()')
      expect(prop('renderItem').description).toContain('zero-based filtered')
      expect(prop('filter').description).toContain('Keep items returning true')
      expect(prop('width').description).toContain('terminal columns')
      expect(prop('height').description).toContain(
        'not the number of data items',
      )
      expect(prop('height').description).toContain('initial layout')
      // The React wrapper declares selection/rowHeight options but does not
      // implement them in the Core ScrollableList it mounts; no forwarded ref.
      for (const name of [
        'rowHeight',
        'selectedIndex',
        'ref',
        'children',
        'onSelect',
        'onHighlight',
        'isSelectable',
        'showSelected',
        'onSelectionChange',
      ]) {
        expect(names).not.toContain(name)
      }
      if (framework === 'core') {
        expect(prop('renderItem').description).toContain(
          'Optional Core renderer',
        )
        expect(prop('renderItem').description).toContain('invalidateItem')
        expect(prop('showScrollbars').description).toContain('defaults to true')
        expect(prop('showScrollbars').description).toContain('one column')
        expect(prop('keepAtBottom').description).toContain('defaults to false')
        expect(prop('keepAtBottom').description).toContain('while already')
      } else {
        expect(prop('renderItem').description).toContain(
          'Required JSX renderer',
        )
        expect(prop('renderItem').description).toContain('every filtered item')
        expect(names).not.toContain('showScrollbars')
        expect(names).not.toContain('keepAtBottom')
      }
    }
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures its exact deterministic public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/scrollable-list.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(scrollableListExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /createElement|captureExample|HeadlessProgram|testRender|tui-|setTimeout|setInterval|Math\.random|Date\./,
      )
      if (framework === 'core') {
        expect(source).toContain('await Screen.start(examples)')
        expect(source).toContain('showScrollbars: true')
        expect(source).toContain('showScrollbars: false')
        expect(source).toContain('keepAtBottom: true')
        expect(source).toContain('screen.render()')
      } else {
        expect(source).toContain('await run(')
        expect(source).toContain('<ScrollableList<Task>')
        expect(source).toContain('<ScrollableList<string>')
        expect(source).toContain('<Stack.down width={36} height={13}>')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const scrollToRow = vi.spyOn(ScrollableList.prototype, 'scrollToRow')
      const advancePage = vi.spyOn(ScrollableList.prototype, 'advancePage')
      const scrollBy = vi.spyOn(ScrollableList.prototype, 'scrollBy')
      const updateData = vi.spyOn(ScrollableList.prototype, 'updateData')
      const output = await scrollableListExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(await captureSpy.mock.results[0].value).toBe(output)

      if (framework === 'core') {
        expect(scrollToRow).toHaveBeenCalledExactlyOnceWith(4)
        expect(advancePage).toHaveBeenCalledExactlyOnceWith(1)
        expect(scrollBy.mock.calls).toEqual([[1], [4]])
        expect(updateData).toHaveBeenCalledExactlyOnceWith([
          'Queued',
          'Started',
          'Reviewed',
          'Tested',
          'Published',
          'Complete',
        ])
        for (const view of scrollBy.mock.contexts) {
          if (!(view instanceof ScrollableList)) {
            throw new Error('Scrolling must target a mounted ScrollableList')
          }
          expect(view.contentSize.width).toBeGreaterThan(0)
          expect(view.contentSize.height).toBe(4)
        }
      } else {
        expect(scrollToRow).not.toHaveBeenCalled()
        expect(advancePage).not.toHaveBeenCalled()
        expect(scrollBy).not.toHaveBeenCalled()
        expect(updateData).not.toHaveBeenCalled()
      }

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(text).not.toMatch(
        /Archive|Pause|Store old notes|Wait for approval/,
      )
      expect(lines[0].trimEnd()).toBe('Active tasks: filtered row indices')
      const withoutBar = (line: string) => line.replace(/█$/, '').trimEnd()
      if (framework === 'core') {
        expect(lines.slice(1, 5).map(withoutBar)).toEqual([
          '2. Review',
          '3. Build',
          '4. Test',
          '5. Ship',
        ])
        expect(lines.slice(6, 10).map(line => line.trimEnd())).toEqual([
          'Build',
          '  Implement the plan',
          'Test',
          '  Check the result',
        ])
        expect(lines.slice(6, 10).join('\n')).not.toContain('█')
        expect(lines.slice(11).map(withoutBar)).toEqual([
          'Published',
          'Complete',
        ])
      } else {
        expect(lines.slice(1, 5).map(withoutBar)).toEqual([
          '1. Draft',
          '2. Review',
          '3. Build',
          '4. Test',
        ])
        expect(lines.slice(6, 10).map(withoutBar)).toEqual([
          'Draft',
          '  Write the proposal',
          'Review',
          '  Collect feedback',
        ])
        expect(lines.slice(11).map(withoutBar)).toEqual(['Queued', 'Started'])
      }
      expect(text).toContain('█')
      expect(text).toMatchSnapshot('rows and scrollbars')
      expect(output).toMatchSnapshot('exact styled capture')
      expect(await scrollableListExample.render[framework]()).toBe(output)
    },
  )
})
