import {colors} from '@teaui/term'

export type Color =
  // 'default' background will fallback to either the pen color, or if the
  // background has been assigned previously, that will be preserved.
  | 'default' // -1
  | 'black' // 0
  | 'red' // 1
  | 'green' // 2
  | 'yellow' // 3
  | 'blue' // 4
  | 'magenta' // 5
  | 'cyan' // 6
  | 'white' // 7
  | 'gray' // 8
  | 'grey' // 9
  | 'brightRed' // 10
  | 'brightGreen' // 11
  | 'brightYellow' // 12
  | 'brightBlue' // 13
  | 'brightMagenta' // 14
  | 'brightCyan' // 15
  | 'brightWhite' // 16
  // SGR color 0-255
  // fg: 38;5;0-255
  // bg: 48;5;0-255
  // 0-15 are "classic" terminal colors
  // 16-231 are RGB colors
  // r: 0-5, g: 0-5, b: 0-5
  // sgr = 16 + r * 36 + g * 6 + b
  // 232-255 are grayscale (232=black, 255=white)
  | {sgr: string | number}
  // 0-255, these get mapped to 232-255
  | {grayscale: number}
  // 0 - 255, these get mapped to the closest SGR color
  | [r: number, g: number, b: number]
  // 00-FF, also get mapped to the closest SGR color
  | `#${string}`

export function colorToHex(color: Color): `#${string}` {
  if (Array.isArray(color)) {
    return colors.RGBtoHex(color)
  } else if (typeof color === 'string' && color.startsWith('#')) {
    return color as `#${string}`
  } else if (typeof color === 'object' && 'sgr' in color) {
    return colors.indexToHex(+color.sgr)
  } else if (typeof color === 'object' && 'grayscale' in color) {
    return colors.RGBtoHex(color.grayscale, color.grayscale, color.grayscale)
  } else {
    const index = colors.nameToIndex(color)
    return index === -1 ? '#ffffff' : colors.indexToHex(index)
  }
}

export function colorToSGR(color: Color, fgbg: 'fg' | 'bg'): string {
  if (typeof color === 'object' && 'sgr' in color) {
    return `${color.sgr} ${fgbg}`
  } else if (Array.isArray(color)) {
    return `${colorToHex(color)} ${fgbg}`
  } else if (typeof color === 'object' && 'grayscale' in color) {
    const gray = 232 + Math.round((color.grayscale / 255) * 23)
    return `${colorToHex(color)}(${gray}) ${fgbg}`
  } else {
    return `${color} ${fgbg}`
  }
}
