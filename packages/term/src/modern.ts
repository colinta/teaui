import type { Color, Color256, RGBColor, UnderlineStyle } from './types.js'
import { OSC, CSI, ST } from './ansi.js'

// --- Hyperlinks (OSC 8) ---

export interface HyperlinkOptions {
  id?: string
}

export function hyperlink(
  url: string,
  text: string,
  options: HyperlinkOptions = {},
): string {
  const params = options.id ? `id=${options.id}` : ''
  return `${OSC}8;${params};${url}${ST}${text}${OSC}8;;${ST}`
}

// --- Styled Underlines ---

const underlineStyleMap: Record<UnderlineStyle, number> = {
  single: 1,
  double: 2,
  curly: 3,
  dotted: 4,
  dashed: 5,
}

export function styledUnderline(style: UnderlineStyle): string {
  return `${CSI}4:${underlineStyleMap[style]}m`
}

// Named color to approximate RGB for underline color
const namedColorRGB: Record<string, [number, number, number]> = {
  black: [0, 0, 0],
  red: [204, 0, 0],
  green: [0, 204, 0],
  yellow: [204, 204, 0],
  blue: [0, 0, 204],
  magenta: [204, 0, 204],
  cyan: [0, 204, 204],
  white: [229, 229, 229],
  brightBlack: [127, 127, 127],
  brightRed: [255, 0, 0],
  brightGreen: [0, 255, 0],
  brightYellow: [255, 255, 0],
  brightBlue: [0, 0, 255],
  brightMagenta: [255, 0, 255],
  brightCyan: [0, 255, 255],
  brightWhite: [255, 255, 255],
}

function isRGB(c: Color): c is RGBColor {
  return typeof c === 'object' && 'r' in c
}

function is256(c: Color): c is Color256 {
  return typeof c === 'object' && 'index' in c
}

export function underlineColor(color: Color): string {
  if (typeof color === 'string') {
    const rgb = namedColorRGB[color]
    if (rgb) {
      return `${CSI}58:2::${rgb[0]}:${rgb[1]}:${rgb[2]}m`
    }
    return ''
  }
  if (isRGB(color)) {
    return `${CSI}58:2::${color.r}:${color.g}:${color.b}m`
  }
  if (is256(color)) {
    return `${CSI}58:5:${color.index}m`
  }
  return ''
}

// --- Window Title ---

export function setTitle(title: string): string {
  return `${OSC}2;${title}${ST}`
}

// --- Notifications ---

export function notification(title: string, body?: string): string {
  if (body !== undefined) {
    return `${OSC}777;notify;${title};${body}${ST}`
  }
  return `${OSC}9;${title}${ST}`
}

// --- Bracketed Paste ---

export function bracketedPasteEnable(): string {
  return `${CSI}?2004h`
}

export function bracketedPasteDisable(): string {
  return `${CSI}?2004l`
}

// --- Keyboard Enhancement (CSI u / Kitty protocol flag 1) ---

export function keyboardEnhanceEnable(): string {
  return `${CSI}>1u`
}

export function keyboardEnhanceDisable(): string {
  return `${CSI}<u`
}

// --- Synchronized Output ---

export function syncStart(): string {
  return `${CSI}?2026h`
}

export function syncEnd(): string {
  return `${CSI}?2026l`
}
