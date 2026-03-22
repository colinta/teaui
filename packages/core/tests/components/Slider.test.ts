import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Slider} from '../../lib/components/Slider.js'
import {Scrollable} from '../../lib/components/Scrollable.js'
import {Point} from '../../lib/geometry.js'

describe('Slider', () => {
  describe('inside scrollable viewport', () => {
    it('renders horizontal slider at offset 0', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 20},
        children: [new Slider({range: [0, 100], value: 50})],
      })
      const t = testRender(scrollable, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders horizontal slider scrolled right', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 20},
        offset: new Point(10, 0),
        children: [new Slider({range: [0, 100], value: 50})],
      })
      const t = testRender(scrollable, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders horizontal slider with border in wide scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 20},
        children: [new Slider({range: [0, 100], value: 50, border: true})],
      })
      const t = testRender(scrollable, {width: 10, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders horizontal slider with buttons in wide scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 30},
        children: [
          new Slider({range: [0, 100], value: 50, buttons: true, step: 10}),
        ],
      })
      const t = testRender(scrollable, {width: 15, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders vertical slider in tall scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {height: 10},
        children: [
          new Slider({
            flex: 1,
            range: [0, 100],
            value: 50,
            direction: 'vertical',
          }),
        ],
      })
      const t = testRender(scrollable, {width: 1, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders vertical slider scrolled down', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {height: 10},
        offset: new Point(0, 5),
        children: [
          new Slider({
            flex: 1,
            range: [0, 100],
            value: 50,
            direction: 'vertical',
          }),
        ],
      })
      const t = testRender(scrollable, {width: 1, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders vertical slider with border in tall scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {height: 10},
        children: [
          new Slider({
            flex: 1,
            range: [0, 100],
            value: 50,
            direction: 'vertical',
            border: true,
          }),
        ],
      })
      const t = testRender(scrollable, {width: 3, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })
})
