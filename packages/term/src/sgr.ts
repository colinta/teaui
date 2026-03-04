/**
 * Parse blessed-style descriptor strings into ANSI escape codes.
 * Replaces BlessedProgram.prototype.style / _attr.
 *
 * Supports:
 *   Attributes: "bold", "dim", "italic", "underline", "strikeout", "blink", "inverse", "invisible"
 *   Negated:    "!bold", "!dim", etc.
 *   Named fg:   "red fg", "brightBlue fg", "gray fg", "default fg"
 *   Named bg:   "red bg", "brightBlue bg", "gray bg", "default bg"
 *   Hex fg/bg:  "#ff0000 fg", "#ff0000(196) fg", "#aabb00 bg"
 *   SGR index:  "196 fg", "232 bg"
 *   Combined:   ["bold", "red fg"] or "bold, red fg"
 *   Default:    "default"
 */

import * as colors from './colors.js'

const CSI = '\x1b['

// Attribute on/off codes
const attrOn: Record<string, string> = {
  default: `${CSI}m`,
  bold: `${CSI}1m`,
  dim: `${CSI}2m`,
  italic: `${CSI}3m`,
  underline: `${CSI}4m`,
  ul: `${CSI}4m`,
  underlined: `${CSI}4m`,
  blink: `${CSI}5m`,
  inverse: `${CSI}7m`,
  invisible: `${CSI}8m`,
  strikeout: `${CSI}9m`,
}

const attrOff: Record<string, string> = {
  default: '',
  bold: `${CSI}22m`,
  dim: `${CSI}22m`,
  italic: `${CSI}23m`,
  underline: `${CSI}24m`,
  ul: `${CSI}24m`,
  underlined: `${CSI}24m`,
  blink: `${CSI}25m`,
  inverse: `${CSI}27m`,
  invisible: `${CSI}28m`,
  strikeout: `${CSI}29m`,
}

// Named color → SGR code
const namedFg: Record<string, number> = {
  black: 30, red: 31, green: 32, yellow: 33,
  blue: 34, magenta: 35, cyan: 36, white: 37,
  brightBlack: 90, grey: 90, gray: 90, brightGrey: 37, brightGray: 37,
  brightRed: 91, brightGreen: 92, brightYellow: 93,
  brightBlue: 94, brightMagenta: 95, brightCyan: 96, brightWhite: 97,
}

const namedBg: Record<string, number> = {
  black: 40, red: 41, green: 42, yellow: 43,
  blue: 44, magenta: 45, cyan: 46, white: 47,
  brightBlack: 100, grey: 100, gray: 100, brightGrey: 47, brightGray: 47,
  brightRed: 101, brightGreen: 102, brightYellow: 103,
  brightBlue: 104, brightMagenta: 105, brightCyan: 106, brightWhite: 107,
}

function parseSingle(param: string, enabled: boolean): string {
  // Negation prefix
  if (param.startsWith('!')) {
    return parseSingle(param.slice(1), !enabled)
  }

  // Simple attributes
  if (attrOn[param] !== undefined) {
    return enabled ? attrOn[param] : (attrOff[param] ?? '')
  }

  // "default fg bg"
  if (param === 'default fg bg') {
    return enabled ? `${CSI}39;49m` : ''
  }

  // "color fg" or "color bg"
  const fgbgMatch = /^(.+)\s+(fg|bg)$/.exec(param)
  if (fgbgMatch) {
    const [, colorStr, fgbg] = fgbgMatch

    // "default fg" / "default bg"
    if (colorStr === 'default') {
      if (!enabled) return ''
      return fgbg === 'fg' ? `${CSI}39m` : `${CSI}49m`
    }

    // Named color
    const namedMap = fgbg === 'fg' ? namedFg : namedBg
    if (namedMap[colorStr] !== undefined) {
      if (!enabled) return fgbg === 'fg' ? `${CSI}39m` : `${CSI}49m`
      return `${CSI}${namedMap[colorStr]}m`
    }

    // Hex color: "#rrggbb fg" or "#rrggbb(index) fg"
    if (colorStr.startsWith('#')) {
      if (!enabled) return fgbg === 'fg' ? `${CSI}39m` : `${CSI}49m`
      const hex = colorStr.replace(/\(\d+\)$/, '')
      const [r, g, b] = colors.hexToRGB(hex)
      return fgbg === 'fg'
        ? `${CSI}38;2;${r};${g};${b}m`
        : `${CSI}48;2;${r};${g};${b}m`
    }

    // Numeric SGR index: "196 fg"
    const colorNum = parseInt(colorStr, 10)
    if (!isNaN(colorNum)) {
      if (!enabled || colorNum === -1) {
        return fgbg === 'fg' ? `${CSI}39m` : `${CSI}49m`
      }

      if (colorNum < 8) {
        return `${CSI}${colorNum + (fgbg === 'fg' ? 30 : 40)}m`
      } else if (colorNum < 16) {
        return `${CSI}${colorNum - 8 + (fgbg === 'fg' ? 90 : 100)}m`
      }
      return fgbg === 'fg'
        ? `${CSI}38;5;${colorNum}m`
        : `${CSI}48;5;${colorNum}m`
    }
  }

  // Raw numeric codes: "38;5;196"
  if (/^[\d;]*$/.test(param)) {
    return `${CSI}${param}m`
  }

  return ''
}

/**
 * Convert blessed-style descriptor(s) to ANSI escape sequence.
 *
 * @example
 *   parseStyleDescriptor('bold')              // '\x1b[1m'
 *   parseStyleDescriptor('!bold')             // '\x1b[22m'
 *   parseStyleDescriptor(['bold', 'red fg'])  // '\x1b[1;31m'
 *   parseStyleDescriptor('bold, red fg')      // '\x1b[1;31m'
 */
export function parseStyleDescriptor(param: string | string[]): string {
  let parts: string[]
  if (Array.isArray(param)) {
    parts = param
  } else {
    parts = param.split(/\s*[,;]\s*/)
  }

  if (parts.length === 0) return ''

  if (parts.length === 1) {
    return parseSingle(parts[0], true)
  }

  // Multiple parts: combine into single CSI sequence
  const used = new Set<string>()
  const codes: string[] = []
  for (const part of parts) {
    const code = parseSingle(part, true)
    // Extract the numeric portion between CSI and 'm'
    const inner = code.slice(2, -1)
    if (inner === '' || used.has(inner)) continue
    used.add(inner)
    codes.push(inner)
  }

  if (codes.length === 0) return ''
  return `${CSI}${codes.join(';')}m`
}
