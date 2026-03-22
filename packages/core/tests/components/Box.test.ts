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
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders bold border', () => {
      const t = testRender(
        new Box({border: 'bold', children: [new Text({text: ''})]}),
        {width: 5, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders double border', () => {
      const t = testRender(
        new Box({border: 'double', children: [new Text({text: ''})]}),
        {width: 5, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders rounded border', () => {
      const t = testRender(
        new Box({border: 'rounded', children: [new Text({text: ''})]}),
        {width: 5, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders dotted border', () => {
      const t = testRender(
        new Box({border: 'dotted', children: [new Text({text: ''})]}),
        {width: 5, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('content', () => {
    it('renders text inside single border', () => {
      const t = testRender(
        new Box({border: 'single', children: [new Text({text: 'Hi'})]}),
        {width: 6, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders larger box', () => {
      const t = testRender(
        new Box({border: 'single', children: [new Text({text: ''})]}),
        {width: 9, height: 5},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('no border', () => {
    it('renders without border', () => {
      const t = testRender(
        new Box({border: 'none', children: [new Text({text: 'Hello'})]}),
        {width: 10, height: 1},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })
})
