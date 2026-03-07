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
      // When animating, first frame is rendered
      expect(t.terminal.textContent()).toContain(FRAMES[0])
    })

    it('accepts isAnimating=false', () => {
      const spinner = new Spinner({isAnimating: false})
      const t = testRender(spinner, {width: 5, height: 1})
      // Still renders the current frame even when not animating
      expect(t.terminal.textContent()).toContain(FRAMES[0])
    })

    it('accepts isAnimating=true', () => {
      const spinner = new Spinner({isAnimating: true})
      const t = testRender(spinner, {width: 5, height: 1})
      expect(t.terminal.textContent()).toContain(FRAMES[0])
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

    it('renders in larger viewport at position 0,0', () => {
      const spinner = new Spinner()
      const t = testRender(spinner, {width: 10, height: 5})
      const content = t.terminal.textContent()
      expect(content).toContain(FRAMES[0])
    })
  })

  describe('animation via receiveTick', () => {
    it('returns true (needs render)', () => {
      const spinner = new Spinner()
      // Need to render first so frameLen is set
      testRender(spinner, {width: 1, height: 1})
      const result = spinner.receiveTick(HZ + 1)
      expect(result).toBe(true)
    })

    it('does not advance frame before HZ elapsed', () => {
      const spinner = new Spinner()
      testRender(spinner, {width: 1, height: 1})
      // Advance by less than HZ
      spinner.receiveTick(50)
      // Frame should still be 0 — re-render to check
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
      // Total: 120ms > HZ (100ms), should advance one frame
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

      // Advance through all 8 frames
      for (let i = 0; i < FRAMES.length; i++) {
        spinner.receiveTick(HZ + 1)
      }
      // Should be back to first frame
      const t = testRender(spinner, {width: 1, height: 1})
      expect(t.terminal.textContent().trim()).toBe(FRAMES[0])
    })
  })
})
