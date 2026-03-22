import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Spinner} from '../../lib/components/Spinner.js'
import {Size} from '../../lib/geometry.js'

const FRAMES = ['⣾', '⣷', '⣯', '⣟', '⡿', '⢿', '⣻', '⣽']
const HZ = 1000 / 10 // 100ms per frame

describe('Spinner', () => {
  describe('construction', () => {
    it('defaults to animating', () => {
      const spinner = new Spinner()
      const t = testRender(spinner, {width: 5, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('accepts isAnimating=false', () => {
      const spinner = new Spinner({isAnimating: false})
      const t = testRender(spinner, {width: 5, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('naturalSize', () => {
    it('is 1x1', () => {
      const spinner = new Spinner()
      const size = spinner.naturalSize(new Size(80, 24))
      expect(size.width).toBe(1)
      expect(size.height).toBe(1)
    })

    it('is 1x1 regardless of available space', () => {
      const spinner = new Spinner()
      expect(spinner.naturalSize(new Size(1, 1))).toEqual(new Size(1, 1))
      expect(spinner.naturalSize(new Size(100, 50))).toEqual(new Size(1, 1))
    })
  })

  describe('rendering', () => {
    it('renders first frame at origin', () => {
      const spinner = new Spinner()
      const t = testRender(spinner, {width: 1, height: 1})
      expect(t.terminal.textContent().trim()).toBe(FRAMES[0])
    })
  })

  describe('animation via receiveTick', () => {
    it('returns true (needs render)', () => {
      const spinner = new Spinner()
      testRender(spinner, {width: 1, height: 1})
      const result = spinner.receiveTick(HZ + 1)
      expect(result).toBe(true)
    })

    it('does not advance frame before HZ elapsed', () => {
      const spinner = new Spinner()
      testRender(spinner, {width: 1, height: 1})
      spinner.receiveTick(50)
      const t2 = testRender(spinner, {width: 1, height: 1})
      expect(t2.terminal.textContent().trim()).toBe(FRAMES[0])
    })

    it('advances frame after HZ elapsed', () => {
      const spinner = new Spinner()
      testRender(spinner, {width: 1, height: 1})
      spinner.receiveTick(HZ + 1)
      const t2 = testRender(spinner, {width: 1, height: 1})
      expect(t2.terminal.textContent().trim()).toBe(FRAMES[1])
    })

    it('accumulates ticks across multiple calls', () => {
      const spinner = new Spinner()
      testRender(spinner, {width: 1, height: 1})
      spinner.receiveTick(60)
      spinner.receiveTick(60)
      const t2 = testRender(spinner, {width: 1, height: 1})
      expect(t2.terminal.textContent().trim()).toBe(FRAMES[1])
    })

    it('cycles through all 8 frames', () => {
      const spinner = new Spinner()
      testRender(spinner, {width: 1, height: 1})

      for (let i = 0; i < FRAMES.length; i++) {
        const t = testRender(spinner, {width: 1, height: 1})
        expect(t.terminal.textContent().trim()).toBe(FRAMES[i])
        spinner.receiveTick(HZ + 1)
      }
    })

    it('wraps around after all frames', () => {
      const spinner = new Spinner()
      testRender(spinner, {width: 1, height: 1})

      for (let i = 0; i < FRAMES.length; i++) {
        spinner.receiveTick(HZ + 1)
      }
      const t = testRender(spinner, {width: 1, height: 1})
      expect(t.terminal.textContent().trim()).toBe(FRAMES[0])
    })
  })
})
