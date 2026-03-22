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
    expect(t.terminal.textContent()).toContain('q quit')
    expect(t.terminal.textContent()).toContain('? help')
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
    const text = t.terminal.textContent()
    expect(text).toContain('⤦ select')
    expect(text).toContain('␛ cancel')
    expect(text).toContain('⇥ switch')
  })

  it('maps modifier+key arrays', () => {
    const t = testRender(
      new Legend({
        items: [{key: ['ctrl', 'C'], label: 'quit'}],
      }),
      {width: 20, height: 1},
    )
    expect(t.terminal.textContent()).toContain('⌃C quit')
  })

  it('maps Ctrl+C string syntax', () => {
    const t = testRender(
      new Legend({
        items: [{key: 'Ctrl+C', label: 'quit'}],
      }),
      {width: 20, height: 1},
    )
    expect(t.terminal.textContent()).toContain('⌃C quit')
  })

  it('maps compound keys like up/down', () => {
    const t = testRender(
      new Legend({
        items: [{key: ['up', 'down'], label: 'navigate'}],
      }),
      {width: 20, height: 1},
    )
    expect(t.terminal.textContent()).toContain('↑↓ navigate')
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
    const text = t.terminal.textContent()
    expect(text).toContain('• ')
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
    const text = t.terminal.textContent()
    // Should have content on multiple lines
    expect(text).toContain('q')
    expect(text).toContain('quit')
    expect(text).toContain('?')
    expect(text).toContain('help')
    expect(text).toContain('⤦')
    expect(text).toContain('select')
    expect(text).toContain('␛')
    expect(text).toContain('cancel')
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
    expect(t.terminal.textContent()).toContain('q quit')
  })

  it('maps cmd key', () => {
    const t = testRender(
      new Legend({
        items: [{key: ['cmd', 'S'], label: 'save'}],
      }),
      {width: 20, height: 1},
    )
    expect(t.terminal.textContent()).toContain('⌘S save')
  })
})
