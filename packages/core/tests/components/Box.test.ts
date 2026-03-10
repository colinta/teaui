import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Box} from '../../lib/components/Box.js'
import {Text} from '../../lib/components/Text.js'

describe('Box', () => {
  describe('border styles', () => {
    it('renders single border', () => {
      const t = testRender(
        new Box({border: 'single', children: [new Text({text: ''})]}),
        {width: 5, height: 3},
      )
      expect(t.terminal.textRect(0, 0, 5, 3)).toBe(
        '┌───┐\n' + '│   │\n' + '└───┘',
      )
    })

    it('renders bold border', () => {
      const t = testRender(
        new Box({border: 'bold', children: [new Text({text: ''})]}),
        {width: 5, height: 3},
      )
      expect(t.terminal.textRect(0, 0, 5, 3)).toBe(
        '┏━━━┓\n' + '┃   ┃\n' + '┗━━━┛',
      )
    })

    it('renders double border', () => {
      const t = testRender(
        new Box({border: 'double', children: [new Text({text: ''})]}),
        {width: 5, height: 3},
      )
      expect(t.terminal.textRect(0, 0, 5, 3)).toBe(
        '╔═══╗\n' + '║   ║\n' + '╚═══╝',
      )
    })

    it('renders rounded border', () => {
      const t = testRender(
        new Box({border: 'rounded', children: [new Text({text: ''})]}),
        {width: 5, height: 3},
      )
      expect(t.terminal.textRect(0, 0, 5, 3)).toBe(
        '╭───╮\n' + '│   │\n' + '╰───╯',
      )
    })

    it('renders dotted border', () => {
      const t = testRender(
        new Box({border: 'dotted', children: [new Text({text: ''})]}),
        {width: 5, height: 3},
      )
      expect(t.terminal.textRect(0, 0, 5, 3)).toBe(
        '⡖⠒⠒⠒⢲\n' + '⡇   ⢸\n' + '⠧⠤⠤⠤⠼',
      )
    })
  })

  describe('content', () => {
    it('renders text inside single border', () => {
      const t = testRender(
        new Box({border: 'single', children: [new Text({text: 'Hi'})]}),
        {width: 6, height: 3},
      )
      expect(t.terminal.textRect(0, 0, 6, 3)).toBe(
        '┌────┐\n' + '│Hi  │\n' + '└────┘',
      )
    })

    it('content fills available space', () => {
      const t = testRender(
        new Box({border: 'single', children: [new Text({text: 'ABCDE'})]}),
        {width: 7, height: 3},
      )
      // Interior is 5 chars wide
      expect(t.terminal.textRect(1, 1, 5, 1)).toBe('ABCDE')
    })

    it('renders larger box', () => {
      const t = testRender(
        new Box({border: 'single', children: [new Text({text: ''})]}),
        {width: 9, height: 5},
      )
      expect(t.terminal.textRect(0, 0, 9, 5)).toBe(
        '┌───────┐\n' +
          '│       │\n' +
          '│       │\n' +
          '│       │\n' +
          '└───────┘',
      )
    })
  })

  describe('no border', () => {
    it('renders without border', () => {
      const t = testRender(
        new Box({border: 'none', children: [new Text({text: 'Hello'})]}),
        {width: 10, height: 1},
      )
      expect(t.terminal.textContent()).toBe('Hello')
    })
  })
})
