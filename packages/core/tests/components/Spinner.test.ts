import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Spinner, type SpinnerStyle} from '../../lib/components/Spinner.js'
import {Size} from '../../lib/geometry.js'

const FRAMES = ['⣾', '⣷', '⣯', '⣟', '⡿', '⢿', '⣻', '⣽']
const KITT_FRAME_COUNT = 30
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

    it.each([
      ['dots', 1, 1],
      ['bounce', 5, 2],
      ['loop', 5, 1],
      ['kitt', 7, 1],
    ] as const)('renders the %s style', (style, width, height) => {
      const spinner = new Spinner({style})
      const t = testRender(spinner, {width, height})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('naturalSize', () => {
    it.each<[SpinnerStyle, Size]>([
      ['dots', new Size(1, 1)],
      ['bounce', new Size(5, 2)],
      ['loop', new Size(5, 1)],
      ['kitt', new Size(7, 1)],
    ])('uses the size of the %s style', (style, expected) => {
      const spinner = new Spinner({style})
      expect(spinner.naturalSize(new Size(80, 24))).toEqual(expected)
    })

    it('is independent of available space', () => {
      const spinner = new Spinner()
      expect(spinner.naturalSize(new Size(1, 1))).toEqual(new Size(1, 1))
      expect(spinner.naturalSize(new Size(100, 50))).toEqual(new Size(1, 1))
    })

    it('updates when style is assigned', () => {
      const spinner = new Spinner()
      const available = new Size(80, 24)
      expect(spinner.naturalSize(available)).toEqual(new Size(1, 1))

      spinner.style = 'bounce'

      expect(spinner.style).toBe('bounce')
      expect(spinner.naturalSize(available)).toEqual(new Size(5, 2))
    })
  })

  describe('rendering', () => {
    it('renders first frame at origin', () => {
      const spinner = new Spinner()
      const t = testRender(spinner, {width: 1, height: 1})
      expect(t.terminal.textContent().trim()).toBe(FRAMES[0])
    })

    it('renders both rows of the bounce style', () => {
      const spinner = new Spinner({style: 'bounce'})
      spinner.receiveTick(HZ + 1)
      spinner.receiveTick(HZ + 1)
      const t = testRender(spinner, {width: 5, height: 2})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('resets to the first frame when style changes', () => {
      const spinner = new Spinner({style: 'loop'})
      spinner.receiveTick(HZ + 1)
      spinner.style = 'dots'
      const t = testRender(spinner, {width: 1, height: 1})
      expect(t.terminal.textContent()).toBe(FRAMES[0])
    })

    it('animates the KITT scanner in both directions', () => {
      const spinner = new Spinner({style: 'kitt'})
      const frames: string[] = []

      for (let i = 0; i < KITT_FRAME_COUNT; i++) {
        const t = testRender(spinner, {width: 7, height: 1})
        frames.push(t.terminal.textContent())
        spinner.receiveTick(HZ + 1)
      }

      expect(frames).toMatchSnapshot()
      const wrapped = testRender(spinner, {width: 7, height: 1})
      expect(wrapped.terminal.textContent()).toBe(frames[0])
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
