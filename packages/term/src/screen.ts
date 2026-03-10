import type {ColorSupport, FullscreenOptions} from './types.js'
import * as ansi from './ansi.js'
import {keyboardEnhanceEnable, keyboardEnhanceDisable} from './modern.js'

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
  private fullscreenState: {
    mouse: boolean
    hideCursor: boolean
    focusEvents: boolean
  } | null = null

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

  enterFullscreen(options: FullscreenOptions = {}): this {
    const mouse = options.mouse ?? false
    const hideCursor = options.hideCursor ?? false
    const focusEvents = options.focusEvents ?? false

    this.fullscreenState = {mouse, hideCursor, focusEvents}

    this.write(ansi.alternateBufferEnter())
    if (hideCursor) this.write(ansi.cursorHide())
    if (mouse) this.write(ansi.mouseEnable())
    if (focusEvents) this.write(ansi.focusEventsEnable())
    this.write(keyboardEnhanceEnable())
    this.write(ansi.eraseScreen() + ansi.cursorTo(0, 0))

    return this
  }

  exitFullscreen(): this {
    if (this.fullscreenState) {
      this.write(keyboardEnhanceDisable())
      if (this.fullscreenState.focusEvents)
        this.write(ansi.focusEventsDisable())
      if (this.fullscreenState.mouse) this.write(ansi.mouseDisable())
      if (this.fullscreenState.hideCursor) this.write(ansi.cursorShow())
      this.write(ansi.alternateBufferExit())
      this.fullscreenState = null
    }
    return this
  }
}
