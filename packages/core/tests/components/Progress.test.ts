import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Progress} from '../../lib/components/Progress.js'

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
})
