// --- Colors ---

export type NamedColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'brightBlack'
  | 'brightRed'
  | 'brightGreen'
  | 'brightYellow'
  | 'brightBlue'
  | 'brightMagenta'
  | 'brightCyan'
  | 'brightWhite'

export interface RGBColor {
  r: number
  g: number
  b: number
}

/** HSL color: h = 0–360, s = 0–100, l = 0–100 */
export interface HSLColor {
  h: number
  s: number
  l: number
}

/** 0–255 palette index */
export type Color256 = {index: number}

export type Color = NamedColor | RGBColor | HSLColor | Color256

// --- Text Attributes ---

export type TextAttribute =
  | 'bold'
  | 'dim'
  | 'italic'
  | 'underline'
  | 'blink'
  | 'inverse'
  | 'hidden'
  | 'strikethrough'

// --- Cursor ---

export interface CursorPosition {
  x: number
  y: number
}

export type CursorShape =
  | 'block'
  | 'underline'
  | 'bar'
  | 'blinkingBlock'
  | 'blinkingUnderline'
  | 'blinkingBar'

// --- Screen ---

export interface ScreenSize {
  columns: number
  rows: number
}

export type ColorSupport = 'none' | 'basic' | '256' | 'truecolor'

export interface TerminalOptions {
  stdout?: NodeJS.WritableStream
  stdin?: NodeJS.ReadableStream
  /** Enable screen buffer with diff-based rendering. Default: false. */
  buffer?: boolean
}

export interface FullscreenOptions {
  mouse?: boolean
  hideCursor?: boolean
  focusEvents?: boolean
}

// --- Input Events ---

export type NamedKey =
  | 'backspace'
  | 'delete'
  | 'down'
  | 'end'
  | 'escape'
  | 'f1'
  | 'f2'
  | 'f3'
  | 'f4'
  | 'f5'
  | 'f6'
  | 'f7'
  | 'f8'
  | 'f9'
  | 'f10'
  | 'f11'
  | 'f12'
  | 'home'
  | 'insert'
  | 'left'
  | 'pagedown'
  | 'pageup'
  | 'return'
  | 'right'
  | 'space'
  | 'tab'
  | 'up'

export type Letter =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z'

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

export type Printable = Letter | Digit

/**
 * Key name: a named special key, a printable character, or any other Unicode
 * character (emoji, symbols, etc.) as a string fallback.
 */
export type KeyName = NamedKey | Printable | (string & {})

export interface KeyEvent {
  type: 'key'
  key: KeyName
  ctrl: boolean
  alt: boolean
  shift: boolean
  gui: boolean
}

export type MouseButton = 'left' | 'middle' | 'right' | 'none'

export type MouseAction =
  | 'press'
  | 'release'
  | 'drag'
  | 'move'
  | 'scrollUp'
  | 'scrollDown'
  | 'scrollLeft'
  | 'scrollRight'

export interface MouseEvent {
  type: 'mouse'
  action: MouseAction
  button: MouseButton
  x: number
  y: number
  ctrl: boolean
  alt: boolean
  gui: boolean
  shift: boolean
}

export interface PasteEvent {
  type: 'paste'
  text: string
}

export interface FocusEvent {
  type: 'focus'
  focused: boolean
}

export type InputEvent = KeyEvent | MouseEvent | PasteEvent | FocusEvent

// --- Type Guards ---

export function isKeyEvent(event: InputEvent): event is KeyEvent {
  return event.type === 'key'
}

export function isMouseEvent(event: InputEvent): event is MouseEvent {
  return event.type === 'mouse'
}

export function isPasteEvent(event: InputEvent): event is PasteEvent {
  return event.type === 'paste'
}

export function isFocusEvent(event: InputEvent): event is FocusEvent {
  return event.type === 'focus'
}

// --- Image ---

export interface ImageOptions {
  width?: number | string
  height?: number | string
  preserveAspectRatio?: boolean
}

export type ImageProtocol = 'iterm' | 'kitty' | 'none'

// --- Underline ---

export type UnderlineStyle = 'single' | 'double' | 'curly' | 'dotted' | 'dashed'
