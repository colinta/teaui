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

export interface KeyEvent {
  type: 'key'
  key: string
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
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
