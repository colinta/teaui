import type {ColorSupport, FullscreenOptions} from './types.js'
import * as ansi from './ansi.js'
import {
  keyboardEnhanceEnable,
  keyboardEnhanceDisable,
  bracketedPasteEnable,
  bracketedPasteDisable,
} from './modern.js'

export function detectColorSupport(
  env: Record<string, string | undefined> = process.env,
): ColorSupport {
  const colorterm = env.COLORTERM?.toLowerCase()
  if (colorterm === 'truecolor' || colorterm === '24bit') {
    return 'truecolor'
  }

  const term = env.TERM?.toLowerCase() ?? ''
  if (term === 'dumb') return 'none'
  if (term.includes('256color')) return '256'
  if (
    term.includes('xterm') ||
    term.includes('screen') ||
    term.includes('vt100')
  ) {
    return 'basic'
  }

  return 'none'
}

export class ScreenController {
  private write: (s: string) => void
  private applicationState: {
    mouse: boolean
    hideCursor: boolean
    focusEvents: boolean
  } | null = null
  private fullscreenActive = false

  constructor(write: (s: string) => void) {
    this.write = write
  }

  clear(): this {
    this.write(ansi.eraseScreen() + ansi.cursorTo(0, 0))
    return this
  }

  eraseDown(): this {
    this.write(ansi.eraseDown())
    return this
  }

  eraseUp(): this {
    this.write(ansi.eraseUp())
    return this
  }

  eraseLine(): this {
    this.write(ansi.eraseLine())
    return this
  }

  eraseLineEnd(): this {
    this.write(ansi.eraseLineEnd())
    return this
  }

  eraseLineStart(): this {
    this.write(ansi.eraseLineStart())
    return this
  }

  eraseChars(n: number = 1): this {
    this.write(ansi.eraseChars(n))
    return this
  }

  /**
   * Clear and reserve rows beginning at the current cursor line, then return
   * the cursor to the first reserved row. Line feeds intentionally drive any
   * required terminal scrolling before the cursor is moved back up.
   */
  reserveRows(
    height: number,
    {advanceToFreshLine = false}: {advanceToFreshLine?: boolean} = {},
  ): this {
    if (!Number.isInteger(height) || height <= 0) {
      throw new RangeError('Reserved row height must be a positive integer')
    }

    let output = CARRIAGE_RETURN
    if (advanceToFreshLine) output += LINE_FEED
    for (let row = 0; row < height; row++) {
      output += ansi.eraseLine() + LINE_FEED + CARRIAGE_RETURN
    }
    output += ansi.cursorUp(height)
    this.write(output)
    return this
  }

  /** Clear rows from the current line and return to the first cleared row. */
  clearRows(height: number): this {
    if (!Number.isInteger(height) || height <= 0) {
      throw new RangeError('Cleared row height must be a positive integer')
    }

    let output = CARRIAGE_RETURN
    for (let row = 0; row < height; row++) {
      output += ansi.eraseLine()
      if (row < height - 1) output += ansi.cursorDown(1)
    }
    if (height > 1) output += ansi.cursorUp(height - 1)
    output += CARRIAGE_RETURN
    this.write(output)
    return this
  }

  enterAlternateBuffer(): this {
    this.write(ansi.alternateBufferEnter())
    return this
  }

  exitAlternateBuffer(): this {
    this.write(ansi.alternateBufferExit())
    return this
  }

  hideCursor(): this {
    this.write(ansi.cursorHide())
    return this
  }

  showCursor(): this {
    this.write(ansi.cursorShow())
    return this
  }

  enableMouse(): this {
    this.write(ansi.mouseEnable())
    return this
  }

  disableMouse(): this {
    this.write(ansi.mouseDisable())
    return this
  }

  enableFocusEvents(): this {
    this.write(ansi.focusEventsEnable())
    return this
  }

  disableFocusEvents(): this {
    this.write(ansi.focusEventsDisable())
    return this
  }

  enableKeyboardEnhancement(): this {
    this.write(keyboardEnhanceEnable())
    return this
  }

  disableKeyboardEnhancement(): this {
    this.write(keyboardEnhanceDisable())
    return this
  }

  enableBracketedPaste(): this {
    this.write(bracketedPasteEnable())
    return this
  }

  disableBracketedPaste(): this {
    this.write(bracketedPasteDisable())
    return this
  }

  enterApplication(options: FullscreenOptions = {}): this {
    const mouse = options.mouse ?? false
    const hideCursor = options.hideCursor ?? false
    const focusEvents = options.focusEvents ?? false

    this.applicationState = {mouse, hideCursor, focusEvents}

    if (hideCursor) this.hideCursor()
    if (mouse) this.enableMouse()
    if (focusEvents) this.enableFocusEvents()
    this.enableKeyboardEnhancement()
    this.enableBracketedPaste()

    return this
  }

  exitApplication(): this {
    if (this.applicationState) {
      this.disableBracketedPaste()
      this.disableKeyboardEnhancement()
      if (this.applicationState.focusEvents) this.disableFocusEvents()
      if (this.applicationState.mouse) this.disableMouse()
      if (this.applicationState.hideCursor) this.showCursor()
      this.applicationState = null
    }
    return this
  }

  enterFullscreen(options: FullscreenOptions = {}): this {
    this.fullscreenActive = true
    this.enterAlternateBuffer()
    this.enterApplication(options)
    this.clear()

    return this
  }

  exitFullscreen(): this {
    if (this.fullscreenActive) {
      this.exitApplication()
      this.exitAlternateBuffer()
      this.fullscreenActive = false
    }
    return this
  }
}

const CARRIAGE_RETURN = '\r'
const LINE_FEED = '\n'
