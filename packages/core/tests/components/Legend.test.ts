import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Legend} from '../../lib/components/Legend.js'
import {Stack} from '../../lib/components/Stack.js'

describe('Legend', () => {
  it('renders items inline', () => {
    const t = testRender(
      new Legend({
        items: [
          {key: 'q', label: 'quit'},
          {key: '?', label: 'help'},
        ],
      }),
      {width: 30, height: 1},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('maps named keys to sigils', () => {
    const t = testRender(
      new Legend({
        items: [
          {key: 'enter', label: 'select'},
          {key: 'escape', label: 'cancel'},
          {key: 'tab', label: 'switch'},
        ],
      }),
      {width: 40, height: 1},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('maps modifier+key arrays', () => {
    const t = testRender(
      new Legend({
        items: [{key: ['ctrl', 'C'], label: 'quit'}],
      }),
      {width: 20, height: 1},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('maps compound keys like up/down', () => {
    const t = testRender(
      new Legend({
        items: [{key: ['up', 'down'], label: 'navigate'}],
      }),
      {width: 20, height: 1},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('uses custom separator', () => {
    const t = testRender(
      new Legend({
        items: [
          {key: 'q', label: 'quit'},
          {key: '?', label: 'help'},
        ],
        separator: ' • ',
      }),
      {width: 30, height: 1},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('wraps to multiple rows when items exceed width', () => {
    const t = testRender(
      new Legend({
        items: [
          {key: 'q', label: 'quit'},
          {key: '?', label: 'help'},
          {key: 'enter', label: 'select'},
          {key: 'escape', label: 'cancel'},
        ],
      }),
      {width: 30, height: 4},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders empty items without error', () => {
    const t = testRender(new Legend({items: []}), {width: 20, height: 1})
    expect(t.terminal.textContent().trim()).toBe('')
  })

  it('applies bold style to keys', () => {
    const t = testRender(
      new Legend({
        items: [{key: 'q', label: 'quit'}],
      }),
      {width: 20, height: 1},
    )
    const keyStyle = t.terminal.styleOf('q')
    expect(keyStyle?.bold).toBe(true)
  })

  it('renders in a stack', () => {
    const t = testRender(
      Stack.down({
        children: [
          [
            'natural',
            new Legend({
              items: [
                {key: 'q', label: 'quit'},
                {key: '?', label: 'help'},
              ],
            }),
          ],
        ],
      }),
      {width: 30, height: 3},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('maps cmd key', () => {
    const t = testRender(
      new Legend({
        items: [{key: ['cmd', 'S'], label: 'save'}],
      }),
      {width: 20, height: 1},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })
})
