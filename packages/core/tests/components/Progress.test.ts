import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Progress} from '../../lib/components/Progress.js'
import {Scrollable} from '../../lib/components/Scrollable.js'
import {Point} from '../../lib/geometry.js'

describe('Progress', () => {
  it('renders empty progress bar', () => {
    const t = testRender(new Progress({value: 0}), {width: 20, height: 1})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders full progress bar', () => {
    const t = testRender(new Progress({value: 100}), {width: 20, height: 1})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders half progress bar', () => {
    const t = testRender(new Progress({value: 50}), {width: 20, height: 1})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  describe('showPercent', () => {
    it('shows percent centered by default', () => {
      const t = testRender(new Progress({value: 50, showPercent: true}), {
        width: 20,
        height: 1,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('shows percent centered explicitly', () => {
      const t = testRender(
        new Progress({value: 50, showPercent: true, location: 'center'}),
        {width: 20, height: 1},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    describe('location: right', () => {
      it('shows 5% on the right', () => {
        const t = testRender(
          new Progress({value: 5, showPercent: true, location: 'right'}),
          {width: 20, height: 1},
        )
        expect(t.terminal.textContent()).toMatchSnapshot()
      })

      it('shows 50% on the right', () => {
        const t = testRender(
          new Progress({value: 50, showPercent: true, location: 'right'}),
          {width: 20, height: 1},
        )
        expect(t.terminal.textContent()).toMatchSnapshot()
      })

      it('shows 0% on the right', () => {
        const t = testRender(
          new Progress({value: 0, showPercent: true, location: 'right'}),
          {width: 20, height: 1},
        )
        expect(t.terminal.textContent()).toMatchSnapshot()
      })

      it('shows 100% on the right', () => {
        const t = testRender(
          new Progress({value: 100, showPercent: true, location: 'right'}),
          {width: 20, height: 1},
        )
        expect(t.terminal.textContent()).toMatchSnapshot()
      })
    })

    describe('location: left', () => {
      it('shows 5% on the left', () => {
        const t = testRender(
          new Progress({value: 5, showPercent: true, location: 'left'}),
          {width: 20, height: 1},
        )
        expect(t.terminal.textContent()).toMatchSnapshot()
      })

      it('shows 50% on the left', () => {
        const t = testRender(
          new Progress({value: 50, showPercent: true, location: 'left'}),
          {width: 20, height: 1},
        )
        expect(t.terminal.textContent()).toMatchSnapshot()
      })

      it('shows 0% on the left', () => {
        const t = testRender(
          new Progress({value: 0, showPercent: true, location: 'left'}),
          {width: 20, height: 1},
        )
        expect(t.terminal.textContent()).toMatchSnapshot()
      })

      it('shows 100% on the left', () => {
        const t = testRender(
          new Progress({value: 100, showPercent: true, location: 'left'}),
          {width: 20, height: 1},
        )
        expect(t.terminal.textContent()).toMatchSnapshot()
      })
    })
  })

  describe('multi-line', () => {
    it('renders half progress bar at height 3', () => {
      const t = testRender(new Progress({value: 50}), {width: 20, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('shows percent right at height 3', () => {
      const t = testRender(
        new Progress({value: 50, showPercent: true, location: 'right'}),
        {width: 20, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('shows percent left at height 3', () => {
      const t = testRender(
        new Progress({value: 50, showPercent: true, location: 'left'}),
        {width: 20, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('inside scrollable viewport', () => {
    it('renders full width at offset 0', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 20},
        children: [new Progress({value: 50})],
      })
      const t = testRender(scrollable, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders scrolled portion at offset 10', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 20},
        offset: new Point(10, 0),
        children: [new Progress({value: 50})],
      })
      const t = testRender(scrollable, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders 0% in wide scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 20},
        children: [new Progress({value: 0})],
      })
      const t = testRender(scrollable, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders 100% in wide scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 20},
        children: [new Progress({value: 100})],
      })
      const t = testRender(scrollable, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders 100% scrolled to end', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 20},
        offset: new Point(10, 0),
        children: [new Progress({value: 100})],
      })
      const t = testRender(scrollable, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders with showPercent in wide scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 30},
        children: [new Progress({value: 50, showPercent: true})],
      })
      const t = testRender(scrollable, {width: 15, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders multi-line progress in wide scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 20},
        children: [new Progress({value: 50})],
      })
      const t = testRender(scrollable, {width: 10, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders vertical progress in tall scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {height: 10},
        children: [new Progress({value: 50, direction: 'vertical'})],
      })
      const t = testRender(scrollable, {width: 3, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders vertical progress scrolled down', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {height: 10},
        offset: new Point(0, 5),
        children: [new Progress({value: 50, direction: 'vertical'})],
      })
      const t = testRender(scrollable, {width: 3, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })
})
