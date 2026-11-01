export type InOut = 'in' | 'out' | 'in-out'
export type EaseCurve = 'cubic' | 'expo' | 'spring' | 'elastic' | 'bounce'
export type EasingName = 'none' | `ease-${InOut}` | `ease-${InOut}-${EaseCurve}`
export type EasingFunction = (progress: number) => number
export type Easing = EasingName | EasingFunction

/** Resolve a named or custom easing to its interpolation function. */
export function getEasingFunction(easing: Easing): EasingFunction {
  if (typeof easing === 'function') {
    return easing
  }
  if (easing === 'none') {
    return linear
  }
  return NAMED_EASINGS[easing]
}

function linear(progress: number): number {
  return progress
}

/** Evaluate a CSS-style cubic-bezier curve, solving x(t) = progress. */
function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): EasingFunction {
  const sampleX = curve(x1, x2)
  const sampleY = curve(y1, y2)

  return progress => {
    if (progress === 0 || progress === 1) {
      return progress
    }

    let lower = 0
    let upper = 1
    let t = progress
    for (let iteration = 0; iteration < 20; iteration++) {
      const x = sampleX(t)
      if (Math.abs(x - progress) < 0.0000001) {
        break
      }
      if (x < progress) {
        lower = t
      } else {
        upper = t
      }
      t = (lower + upper) / 2
    }
    return sampleY(t)
  }
}

function curve(first: number, second: number): (t: number) => number {
  const a = 1 - 3 * second + 3 * first
  const b = 3 * second - 6 * first
  const c = 3 * first
  return t => ((a * t + b) * t + c) * t
}

function easeInElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3

  return x === 0
    ? 0
    : x === 1
      ? 1
      : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4)
}

function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3

  return x === 0
    ? 0
    : x === 1
      ? 1
      : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1
}

function easeInOutElastic(x: number): number {
  const c5 = (2 * Math.PI) / 4.5

  return x === 0
    ? 0
    : x === 1
      ? 1
      : x < 0.5
        ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1
}

function easeOutBounce(x: number): number {
  const n1 = 7.5625
  const d1 = 2.75

  if (x < 1 / d1) {
    return n1 * x * x
  } else if (x < 2 / d1) {
    const value = x - 1.5 / d1
    return n1 * value * value + 0.75
  } else if (x < 2.5 / d1) {
    const value = x - 2.25 / d1
    return n1 * value * value + 0.9375
  } else {
    const value = x - 2.625 / d1
    return n1 * value * value + 0.984375
  }
}

function easeInBounce(x: number): number {
  return 1 - easeOutBounce(1 - x)
}

function easeInOutBounce(x: number): number {
  return x < 0.5
    ? (1 - easeOutBounce(1 - 2 * x)) / 2
    : (1 + easeOutBounce(2 * x - 1)) / 2
}

const easeInCubic = cubicBezier(0.68, -0.6, 0.32, 1.6)
const easeOutCubic = cubicBezier(0.33, 1, 0.68, 1)
const easeInOutCubic = cubicBezier(0.65, 0, 0.35, 1)

const NAMED_EASINGS: Record<Exclude<EasingName, 'none'>, EasingFunction> = {
  'ease-in': easeInCubic,
  'ease-out': easeOutCubic,
  'ease-in-out': easeInOutCubic,
  'ease-in-cubic': easeInCubic,
  'ease-out-cubic': easeOutCubic,
  'ease-in-out-cubic': easeInOutCubic,
  'ease-in-expo': cubicBezier(0.7, 0, 0.84, 0),
  'ease-out-expo': cubicBezier(0.16, 1, 0.3, 1),
  'ease-in-out-expo': cubicBezier(0.87, 0, 0.13, 1),
  'ease-in-spring': cubicBezier(0.36, 0, 0.66, -0.56),
  'ease-out-spring': cubicBezier(0.34, 1.56, 0.64, 1),
  'ease-in-out-spring': cubicBezier(0.68, -0.6, 0.32, 1.6),
  'ease-in-elastic': easeInElastic,
  'ease-out-elastic': easeOutElastic,
  'ease-in-out-elastic': easeInOutElastic,
  'ease-in-bounce': easeInBounce,
  'ease-out-bounce': easeOutBounce,
  'ease-in-out-bounce': easeInOutBounce,
}
