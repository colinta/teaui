import {describe, expect, it} from 'vitest'
import {getEasingFunction, type EasingName} from '../lib/Easing.js'

const NAMED_EASINGS = [
  'ease-in',
  'ease-out',
  'ease-in-out',
  'ease-in-cubic',
  'ease-out-cubic',
  'ease-in-out-cubic',
  'ease-in-expo',
  'ease-out-expo',
  'ease-in-out-expo',
  'ease-in-spring',
  'ease-out-spring',
  'ease-in-out-spring',
  'ease-in-elastic',
  'ease-out-elastic',
  'ease-in-out-elastic',
  'ease-in-bounce',
  'ease-out-bounce',
  'ease-in-out-bounce',
] as const satisfies readonly Exclude<EasingName, 'none'>[]

describe('named easings', () => {
  it.each(NAMED_EASINGS)(
    '%s has exact endpoints and finite intermediate values',
    name => {
      const easing = getEasingFunction(name)

      expect(easing(0)).toBe(0)
      expect(easing(1)).toBe(1)
      expect(Number.isFinite(easing(0.25))).toBe(true)
      expect(Number.isFinite(easing(0.5))).toBe(true)
      expect(Number.isFinite(easing(0.75))).toBe(true)
    },
  )

  it('uses cubic curves for the short names', () => {
    expect(getEasingFunction('ease-in')).toBe(
      getEasingFunction('ease-in-cubic'),
    )
    expect(getEasingFunction('ease-out')).toBe(
      getEasingFunction('ease-out-cubic'),
    )
    expect(getEasingFunction('ease-in-out')).toBe(
      getEasingFunction('ease-in-out-cubic'),
    )
  })

  it('supports overshooting cubic spring curves', () => {
    expect(getEasingFunction('ease-in-spring')(0.6)).toBeLessThan(0)
    expect(getEasingFunction('ease-out-spring')(0.8)).toBeGreaterThan(1)
  })

  it('implements elastic curves', () => {
    expect(getEasingFunction('ease-in-elastic')(0.5)).toBeCloseTo(-0.015625)
    expect(getEasingFunction('ease-out-elastic')(0.5)).toBeCloseTo(1.015625)
    expect(getEasingFunction('ease-in-out-elastic')(0.5)).toBeCloseTo(0.5)
  })

  it('implements bounce curves', () => {
    expect(getEasingFunction('ease-in-bounce')(0.5)).toBeCloseTo(0.234375)
    expect(getEasingFunction('ease-out-bounce')(0.5)).toBeCloseTo(0.765625)
    expect(getEasingFunction('ease-in-out-bounce')(0.5)).toBeCloseTo(0.5)
  })

  it('returns linear and custom functions', () => {
    expect(getEasingFunction('none')(0.25)).toBe(0.25)
    const custom = (progress: number) => progress * progress
    expect(getEasingFunction(custom)).toBe(custom)
  })
})
