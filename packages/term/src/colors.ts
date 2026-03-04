/**
 * Color utility functions for terminal 256-color palette.
 * Ported from blessed's colors.js.
 */

// --- Color name → index mapping ---

const colorNames: Record<string, number> = {
  default: -1,
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7,
  grey: 8,
  gray: 8,
  brightRed: 9,
  brightGreen: 10,
  brightYellow: 11,
  brightBlue: 12,
  brightMagenta: 13,
  brightCyan: 14,
  brightWhite: 15,
}

export function nameToIndex(name: string): number {
  return colorNames[name] ?? -1
}

export function toHex(n: number): string {
  const s = n.toString(16)
  return s.length < 2 ? '0' + s : s
}

// --- Seed all 256 colors (xterm defaults) ---

const indexToRGB_table: [number, number, number][] = []
const indexToHex_table: string[] = []

;(function () {
  const xtermColors = [
    '#000000', '#800000', '#008000', '#808000',
    '#000080', '#800080', '#008080', '#c0c0c0',
    '#808080', '#ff0000', '#00ff00', '#ffff00',
    '#0000ff', '#ff00ff', '#00ffff', '#ffffff',
  ]

  function set(i: number, r: number, g: number, b: number) {
    indexToRGB_table[i] = [r, g, b]
    indexToHex_table[i] = '#' + toHex(r) + toHex(g) + toHex(b)
  }

  // 0 - 15
  xtermColors.forEach((c, i) => {
    const v = parseInt(c.substring(1), 16)
    set(i, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff)
  })

  // 16 - 231: 6×6×6 color cube
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        const i = 16 + r * 36 + g * 6 + b
        set(i, r ? r * 40 + 55 : 0, g ? g * 40 + 55 : 0, b ? b * 40 + 55 : 0)
      }
    }
  }

  // 232 - 255: grayscale
  for (let g = 0; g < 24; g++) {
    const l = g * 10 + 8
    set(232 + g, l, l, l)
  }
})()

export function indexToRGB(index: number): [number, number, number] {
  return indexToRGB_table[~~index % 255]
}

export function indexToHex(index: number): string {
  return indexToHex_table[~~index % 255]
}

// --- Color matching ---

const _cache: Record<number, number> = {}

/**
 * Find the closest 256-color index for a given color.
 * Accepts: hex string (#rrggbb), color name, r/g/b numbers, or [r,g,b] array.
 */
export function match(r1: string): number
export function match(r1: number, g1: number, b1: number): number
export function match(r1: [number, number, number]): number
export function match(r1: string | number | [number, number, number], g1?: any, b1?: any, lookup?: [number, number, number][]): number
export function match(
  r1: string | number | [number, number, number],
  g1?: any,
  b1?: any,
  lookup?: [number, number, number][] | undefined,
): number {
  if (typeof r1 === 'string') {
    const colorName = r1.replace(/[\- ]/g, '').toLowerCase()
    if (colorNames[colorName] != null) {
      return colorNames[colorName]
    }

    if (r1[0] !== '#') {
      return -1
    }

    const m = /^#([a-zA-Z0-9]+)\((\d+)\)$/.exec(r1)
    if (m) {
      return +m[2]
    }

    ;[r1, g1, b1] = hexToRGB(r1)
  } else if (Array.isArray(r1)) {
    b1 = r1[2]; g1 = r1[1]; r1 = r1[0]
  }

  const hash = ((r1 as number) << 16) | ((g1 as number) << 8) | (b1 as number)

  if (_cache[hash] !== undefined) {
    return _cache[hash]
  }

  let setCache = false
  let lookupEntries: [number, [number, number, number]][]
  if (!lookup) {
    setCache = true
    if (r1 === g1 && g1 === b1) {
      lookupEntries = indexToRGB_table
        .slice(231, 256)
        .map((rgb, index) => [231 + index, rgb] as [number, [number, number, number]])
      lookupEntries.push([16, [0, 0, 0]])
      lookupEntries.push([59, [95, 95, 95]])
      lookupEntries.push([102, [135, 135, 135]])
      lookupEntries.push([139, [175, 135, 175]])
      lookupEntries.push([145, [175, 175, 175]])
      lookupEntries.push([188, [215, 215, 215]])
    } else {
      lookupEntries = indexToRGB_table
        .slice(16)
        .map((rgb, index) => [16 + index, rgb] as [number, [number, number, number]])
    }
  } else {
    lookupEntries = lookup.map((rgb, index) => [index, rgb] as [number, [number, number, number]])
  }

  let ldiff = Infinity
  let li = lookupEntries[0][0]

  for (const [index, rgb] of lookupEntries) {
    const diff = colorDistance(r1 as number, g1 as number, b1 as number, rgb[0], rgb[1], rgb[2])

    if (diff === 0) {
      li = index
      break
    }

    if (diff < ldiff) {
      ldiff = diff
      li = index
    }
  }

  if (setCache) {
    _cache[hash] = li
  }
  return li
}

// --- Conversions ---

export function RGBtoHex(r: number, g: number, b: number): `#${string}`
export function RGBtoHex(rgb: [number, number, number]): `#${string}`
export function RGBtoHex(
  r: number | [number, number, number],
  g?: number,
  b?: number,
): `#${string}` {
  if (Array.isArray(r)) {
    b = r[2]; g = r[1]; r = r[0]
  }
  return `#${toHex(r)}${toHex(g!)}${toHex(b!)}` as `#${string}`
}

/**
 * RGB (0–255) to HSB (0–1 each).
 */
export function RGBtoHSB(r: number, g: number, b: number): [number, number, number]
export function RGBtoHSB(rgb: [number, number, number]): [number, number, number]
export function RGBtoHSB(
  r: number | [number, number, number],
  g?: number,
  b?: number,
): [number, number, number] {
  if (Array.isArray(r)) {
    b = r[2]; g = r[1]; r = r[0]
  }

  const max = Math.max(r, g!, b!)
  const min = Math.min(r, g!, b!)
  const d = max - min
  const s = max === 0 ? 0 : d / max
  const v = max / 255

  let h: number
  switch (max) {
    case min:
      h = 0
      break
    case r:
      h = (g! - b! + d * (g! < b! ? 6 : 0)) / (6 * d)
      break
    case g:
      h = (b! - r + d * 2) / (6 * d)
      break
    case b:
      h = (r - g! + d * 4) / (6 * d)
      break
    default:
      h = 0
  }

  return [h, s, v]
}

/**
 * HSB (0–1 each) to RGB (0–255).
 */
export function HSBtoRGB(h: number, s: number, v: number): [number, number, number]
export function HSBtoRGB(hsv: [number, number, number]): [number, number, number]
export function HSBtoRGB(
  h: number | [number, number, number],
  s?: number,
  v?: number,
): [number, number, number] {
  if (Array.isArray(h)) {
    v = h[2]; s = h[1]; h = h[0]
  }

  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v! * (1 - s!)
  const q = v! * (1 - f * s!)
  const t = v! * (1 - (1 - f) * s!)
  let r: number, g: number, b: number

  switch (i % 6) {
    case 0: r = v!; g = t; b = p; break
    case 1: r = q; g = v!; b = p; break
    case 2: r = p; g = v!; b = t; break
    case 3: r = p; g = q; b = v!; break
    case 4: r = t; g = p; b = v!; break
    case 5: r = v!; g = p; b = q; break
    default: r = 0; g = 0; b = 0
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

export function hexToRGB(hex: string): [number, number, number] {
  if (hex[0] !== '#') {
    hex = '#' + hex
  }

  // #rgb → #rrggbb
  if (hex.length === 4) {
    hex = hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
  }

  const col = parseInt(hex.substring(1), 16)
  return [(col >> 16) & 0xff, (col >> 8) & 0xff, col & 0xff]
}

// --- Color distance ---

function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
): number {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2
}

// --- Reduce colors for low-color terminals ---

const fourBitColors: number[] = indexToHex_table.map(color =>
  match(color, undefined as any, undefined as any, indexToRGB_table.slice(0, 16)),
)

const threeBitColors: number[] = indexToHex_table.map(color =>
  match(color, undefined as any, undefined as any, indexToRGB_table.slice(0, 8)),
)

export function reduce(color: number, total: number): number {
  if (total <= 16) {
    return color >= 16 ? fourBitColors[color] : color
  } else if (total <= 8) {
    return color >= 8 ? threeBitColors[color] : color
  } else if (total <= 2) {
    return color % 2
  }

  return color
}
