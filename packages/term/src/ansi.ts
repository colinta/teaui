import type {
  Color,
  Color256,
  RGBColor,
  HSLColor,
  NamedColor,
  TextAttribute,
  CursorShape,
} from './types.js'

export const ESC = '\x1b'
export const CSI = `${ESC}[`
export const OSC = `${ESC}]`
export const ST = `${ESC}\\`

// --- Cursor Movement ---

export function cursorTo(x: number, y: number): string {
  return `${CSI}${y + 1};${x + 1}H`
}

export function cursorMove(dx: number, dy: number): string {
  let seq = ''
  if (dy > 0) seq += cursorDown(dy)
  else if (dy < 0) seq += cursorUp(-dy)
  if (dx > 0) seq += cursorForward(dx)
  else if (dx < 0) seq += cursorBack(-dx)
  return seq
}

export function cursorUp(n: number): string {
  return `${CSI}${n}A`
}

export function cursorDown(n: number): string {
  return `${CSI}${n}B`
}

export function cursorForward(n: number): string {
  return `${CSI}${n}C`
}

export function cursorBack(n: number): string {
  return `${CSI}${n}D`
}

export function cursorNextLine(n: number): string {
  return `${CSI}${n}E`
}

export function cursorPrevLine(n: number): string {
  return `${CSI}${n}F`
}

export function cursorColumn(x: number): string {
  return `${CSI}${x + 1}G`
}

export function cursorSave(): string {
  return `${ESC}7`
}

export function cursorRestore(): string {
  return `${ESC}8`
}

export function cursorShow(): string {
  return `${CSI}?25h`
}

export function cursorHide(): string {
  return `${CSI}?25l`
}

const cursorShapeMap: Record<CursorShape, number> = {
  blinkingBlock: 1,
  block: 2,
  blinkingUnderline: 3,
  underline: 4,
  blinkingBar: 5,
  bar: 6,
}

export function cursorShape(shape: CursorShape): string {
  return `${CSI}${cursorShapeMap[shape]} q`
}

// --- Erase ---

export function eraseScreen(): string {
  return `${CSI}2J`
}

export function eraseDown(): string {
  return `${CSI}0J`
}

export function eraseUp(): string {
  return `${CSI}1J`
}

export function eraseLine(): string {
  return `${CSI}2K`
}

export function eraseLineEnd(): string {
  return `${CSI}0K`
}

export function eraseLineStart(): string {
  return `${CSI}1K`
}

/** Erase n characters at cursor position (does not move cursor). */
export function eraseChars(n: number = 1): string {
  return `${CSI}${n}X`
}

// --- Scroll ---

export function scrollUp(n: number): string {
  return `${CSI}${n}S`
}

export function scrollDown(n: number): string {
  return `${CSI}${n}T`
}

// --- Colors ---

const namedFgMap: Record<NamedColor, number> = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  brightBlack: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97,
}

const namedBgMap: Record<NamedColor, number> = {
  black: 40,
  red: 41,
  green: 42,
  yellow: 43,
  blue: 44,
  magenta: 45,
  cyan: 46,
  white: 47,
  brightBlack: 100,
  brightRed: 101,
  brightGreen: 102,
  brightYellow: 103,
  brightBlue: 104,
  brightMagenta: 105,
  brightCyan: 106,
  brightWhite: 107,
}

function isRGB(c: Color): c is RGBColor {
  return typeof c === 'object' && 'r' in c
}

function isHSL(c: Color): c is HSLColor {
  return typeof c === 'object' && 'h' in c
}

function is256(c: Color): c is Color256 {
  return typeof c === 'object' && 'index' in c
}

/** Convert HSL (h: 0–360, s: 0–100, l: 0–100) to RGB (0–255 each). */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ]
}

function resolveToRgb(color: Color): { r: number; g: number; b: number } | null {
  if (isRGB(color)) return color
  if (isHSL(color)) {
    const [r, g, b] = hslToRgb(color.h, color.s, color.l)
    return { r, g, b }
  }
  return null
}

export function fgReset(): string {
  return `${CSI}39m`
}

export function bgReset(): string {
  return `${CSI}49m`
}

export function fgColor(color: Color): string {
  if (typeof color === 'string') {
    return `${CSI}${namedFgMap[color]}m`
  }
  const rgb = resolveToRgb(color)
  if (rgb) {
    return `${CSI}38;2;${rgb.r};${rgb.g};${rgb.b}m`
  }
  if (is256(color)) {
    return `${CSI}38;5;${color.index}m`
  }
  return ''
}

export function bgColor(color: Color): string {
  if (typeof color === 'string') {
    return `${CSI}${namedBgMap[color]}m`
  }
  const rgb = resolveToRgb(color)
  if (rgb) {
    return `${CSI}48;2;${rgb.r};${rgb.g};${rgb.b}m`
  }
  if (is256(color)) {
    return `${CSI}48;5;${color.index}m`
  }
  return ''
}

// --- Text Attributes ---

const attrOnMap: Record<TextAttribute, number> = {
  bold: 1,
  dim: 2,
  italic: 3,
  underline: 4,
  blink: 5,
  inverse: 7,
  hidden: 8,
  strikethrough: 9,
}

const attrOffMap: Record<TextAttribute, number> = {
  bold: 22,
  dim: 22,
  italic: 23,
  underline: 24,
  blink: 25,
  inverse: 27,
  hidden: 28,
  strikethrough: 29,
}

export function textAttr(attr: TextAttribute): string {
  return `${CSI}${attrOnMap[attr]}m`
}

export function textAttrOff(attr: TextAttribute): string {
  return `${CSI}${attrOffMap[attr]}m`
}

export function resetAll(): string {
  return `${CSI}0m`
}

// --- Alternate Buffer ---

export function alternateBufferEnter(): string {
  return `${CSI}?1049h`
}

export function alternateBufferExit(): string {
  return `${CSI}?1049l`
}

// --- Focus Event Reporting ---

export function focusEventsEnable(): string {
  return `${CSI}?1004h`
}

export function focusEventsDisable(): string {
  return `${CSI}?1004l`
}

// --- Mouse Tracking (SGR mode) ---

export function mouseEnable(): string {
  return (
    `${CSI}?1000h` + // button tracking
    `${CSI}?1002h` + // button-event tracking
    `${CSI}?1003h` + // any-event tracking
    `${CSI}?1006h` // SGR encoding
  )
}

export function mouseDisable(): string {
  return (
    `${CSI}?1006l` + // SGR encoding off
    `${CSI}?1003l` + // any-event tracking off
    `${CSI}?1002l` + // button-event tracking off
    `${CSI}?1000l` // button tracking off
  )
}
