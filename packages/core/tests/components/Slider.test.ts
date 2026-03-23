import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Slider} from '../../lib/components/Slider.js'
import {Scrollable} from '../../lib/components/Scrollable.js'
import {Point} from '../../lib/geometry.js'

describe('Slider', () => {
  describe('focus', () => {
    it('does not receive focus by default', () => {
      const slider = new Slider({range: [0, 100], value: 50})
      testRender(slider, {width: 20, height: 1})
      expect(slider.hasFocus).toBe(false)
    })

    it('receives focus via tab', () => {
      const slider = new Slider({range: [0, 100], value: 50})
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      expect(slider.hasFocus).toBe(true)
    })

    it('renders with focus border when focused', () => {
      const slider = new Slider({range: [0, 100], value: 50, border: true})
      const t = testRender(slider, {width: 20, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot('unfocused')
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot('focused')
    })

    it('renders vertical with focus border when focused', () => {
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        direction: 'vertical',
        border: true,
        height: 10,
      })
      const t = testRender(slider, {width: 3, height: 10})
      expect(t.terminal.textContent()).toMatchSnapshot('unfocused')
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot('focused')
    })

    it('renders borderless buttons with focus brackets', () => {
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        buttons: true,
        step: 10,
      })
      const t = testRender(slider, {width: 20, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot('unfocused')
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot('focused')
    })

    it('renders horizontal with buttons and focus border', () => {
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        border: true,
        buttons: true,
        step: 10,
      })
      const t = testRender(slider, {width: 20, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot('unfocused')
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot('focused')
    })

    it('renders vertical with buttons and focus border', () => {
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        direction: 'vertical',
        border: true,
        buttons: true,
        step: 10,
        height: 16,
      })
      const t = testRender(slider, {width: 3, height: 16})
      expect(t.terminal.textContent()).toMatchSnapshot('unfocused')
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot('focused')
    })
  })

  describe('keyboard interaction', () => {
    it('right arrow increases value', () => {
      let value = 50
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('right')
      expect(value).toBe(60)
    })

    it('left arrow decreases value', () => {
      let value = 50
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('left')
      expect(value).toBe(40)
    })

    it('does not go below minimum', () => {
      let value = 0
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('left')
      expect(value).toBe(0)
    })

    it('does not go above maximum', () => {
      let value = 100
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('right')
      expect(value).toBe(100)
    })

    it('home moves to minimum', () => {
      let value = 50
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('home')
      expect(value).toBe(0)
    })

    it('end moves to maximum', () => {
      let value = 50
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('end')
      expect(value).toBe(100)
    })

    it('up/down arrows work for vertical slider', () => {
      let value = 50
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        direction: 'vertical',
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 1, height: 10})
      t.sendKey('tab')
      t.sendKey('down')
      expect(value).toBe(60)
      t.sendKey('up')
      expect(value).toBe(50)
    })
  })

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
