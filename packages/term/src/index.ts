// Types
export type {
  NamedColor,
  RGBColor,
  HSLColor,
  Color256,
  Color,
  TextAttribute,
  CursorPosition,
  CursorShape,
  ScreenSize,
  ColorSupport,
  TerminalOptions,
  FullscreenOptions,
  NamedKey,
  Letter,
  Digit,
  Printable,
  KeyName,
  KeyEvent,
  MouseButton,
  MouseAction,
  MouseEvent,
  PasteEvent,
  FocusEvent,
  InputEvent,
  ImageOptions,
  ImageProtocol,
  UnderlineStyle,
} from './types.js'

// Type guards
export {isKeyEvent, isMouseEvent, isPasteEvent, isFocusEvent} from './types.js'

// ANSI primitives
export {
  ESC,
  CSI,
  OSC,
  ST,
  cursorTo,
  cursorMove,
  cursorUp,
  cursorDown,
  cursorForward,
  cursorBack,
  cursorNextLine,
  cursorPrevLine,
  cursorColumn,
  cursorSave,
  cursorRestore,
  cursorShow,
  cursorHide,
  cursorShape,
  eraseScreen,
  eraseDown,
  eraseUp,
  eraseLine,
  eraseLineEnd,
  eraseLineStart,
  eraseChars,
  scrollUp,
  scrollDown,
  fgColor,
  fgReset,
  bgColor,
  bgReset,
  textAttr,
  textAttrOff,
  resetAll,
  alternateBufferEnter,
  alternateBufferExit,
  mouseEnable,
  mouseDisable,
  focusEventsEnable,
  focusEventsDisable,
  hslToRgb,
} from './ansi.js'

// Style
export {StyleBuilder} from './style.js'

// Cursor
export {CursorController} from './cursor.js'

// Input
export {parseInput, InputReader} from './input.js'

// Screen
export {ScreenController, detectColorSupport} from './screen.js'

// Image
export {itermImage, kittyImage, detectImageProtocol} from './image.js'

// Modern features
export {
  hyperlink,
  styledUnderline,
  underlineColor,
  setTitle,
  notification,
  bracketedPasteEnable,
  bracketedPasteDisable,
  keyboardEnhanceEnable,
  keyboardEnhanceDisable,
  syncStart,
  syncEnd,
} from './modern.js'

// Buffer
export {ScreenBuffer} from './buffer.js'
export type {Cell} from './buffer.js'

// Unicode
export {
  BG_DRAW,
  charWidth,
  lineWidth,
  stringSize,
  printableChars,
  words,
  ansiLocations,
  removeAnsi,
  getLocale,
  setLocale,
} from './unicode.js'
export type {AnsiLocation} from './unicode.js'

// Colors (256-color palette utilities)
export * as colors from './colors.js'

// SGR style descriptor parser (replaces blessed program.style())
export {parseStyleDescriptor} from './sgr.js'

// Terminal (main class)
export {Terminal} from './terminal.js'
