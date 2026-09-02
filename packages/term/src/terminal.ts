import type {
  Color,
  CursorPosition,
  ScreenSize,
  ColorSupport,
  TerminalOptions,
  FullscreenOptions,
  InputEvent,
  ImageOptions,
  UnderlineStyle,
  TextAttribute,
} from './types.js'
import * as ansi from './ansi.js'
import {CursorController} from './cursor.js'
import {ScreenController, detectColorSupport} from './screen.js'
import {InputReader} from './input.js'
import type {
  TerminalResponseMatcher,
  TerminalResponseRouteOptions,
} from './response.js'
import {StyleBuilder} from './style.js'
import {ScreenBuffer} from './buffer.js'
import {itermImage, kittyImage, detectImageProtocol} from './image.js'
import * as modern from './modern.js'

export class Terminal {
  private output: {write(s: string): boolean; columns?: number; rows?: number}
  private input: NodeJS.ReadableStream | undefined
  private cursorCtrl: CursorController
  private screenCtrl: ScreenController
  private inputReader: InputReader
  private screenBuffer: ScreenBuffer | null = null
  private useBuffer: boolean

  private styleOpen: string[] = []
  private wasRawMode: boolean = false
  private inputStarted: boolean = false
  private rawModeManaged: boolean = false
  private resizeCleanup: (() => void) | null = null
  private writeBuffer: string[] | null = null
  private cursorPositionWaiters: Array<(position: CursorPosition) => void> = []

  constructor(options: TerminalOptions = {}) {
    const stdout = options.stdout ?? process.stdout
    this.output = stdout as any
    this.input = (options.stdin ?? process.stdin) as any
    this.useBuffer = options.buffer ?? false

    const write = (s: string) => {
      this._write(s)
    }

    this.cursorCtrl = new CursorController(write)
    this.screenCtrl = new ScreenController(write)
    this.inputReader = new InputReader()
    this.inputReader.onResponse(matchCursorPositionResponse, position =>
      this.cursorPositionWaiters.shift()?.(position),
    )

    if (this.useBuffer) {
      const {columns, rows} = this.size
      this.screenBuffer = new ScreenBuffer(columns, rows)
    }
  }

  // --- Low-level write (respects write-buffer) ---

  private _write(s: string): void {
    if (this.writeBuffer) {
      this.writeBuffer.push(s)
    } else {
      this.output.write(s)
    }
  }

  /**
   * Enable write buffering. All writes are collected in memory until
   * `flushWrites()` is called, which emits them as a single `output.write()`.
   */
  enableWriteBuffer(): this {
    if (!this.writeBuffer) {
      this.writeBuffer = []
    }
    return this
  }

  /**
   * Flush buffered writes to the output stream as a single write call.
   * No-op when write buffering is not enabled.
   */
  flushWrites(): this {
    if (this.writeBuffer && this.writeBuffer.length > 0) {
      this.output.write(this.writeBuffer.join(''))
      this.writeBuffer = []
    }
    return this
  }

  // --- Style (mutable state, returns this) ---

  private addAttr(attr: TextAttribute): this {
    this.styleOpen.push(ansi.textAttr(attr))
    return this
  }

  bold(): this {
    return this.addAttr('bold')
  }

  dim(): this {
    return this.addAttr('dim')
  }

  italic(): this {
    return this.addAttr('italic')
  }

  underline(): this {
    return this.addAttr('underline')
  }

  strikethrough(): this {
    return this.addAttr('strikethrough')
  }

  inverse(): this {
    return this.addAttr('inverse')
  }

  fg(color: Color): this {
    this.styleOpen.push(ansi.fgColor(color))
    return this
  }

  bg(color: Color): this {
    this.styleOpen.push(ansi.bgColor(color))
    return this
  }

  reset(): this {
    this.styleOpen = []
    return this
  }

  // --- Output ---

  write(text: string): this {
    const style = this.styleOpen.join('')
    this.styleOpen = []
    if (this.screenBuffer) {
      this.screenBuffer.write(text, style)
    } else if (style) {
      this._write(style + text + ansi.resetAll())
    } else {
      this._write(text)
    }
    return this
  }

  writeln(text: string): this {
    this.write(text)
    if (this.screenBuffer) {
      this.screenBuffer.write('\n', '')
    } else {
      this._write('\n')
    }
    return this
  }

  /** Write directly to the output stream, bypassing the buffer. */
  writeRaw(text: string): this {
    this.styleOpen = []
    this.output.write(text)
    return this
  }

  // --- Cursor delegation ---

  moveTo(x: number, y: number): this {
    if (this.screenBuffer) {
      this.screenBuffer.moveTo(x, y)
    } else {
      this.cursorCtrl.moveTo(x, y)
    }
    return this
  }

  moveBy(dx: number, dy: number): this {
    this.cursorCtrl.moveBy(dx, dy)
    return this
  }

  saveCursor(): this {
    this.cursorCtrl.save()
    return this
  }

  restoreCursor(): this {
    this.cursorCtrl.restore()
    return this
  }

  showCursor(): this {
    this.cursorCtrl.show()
    return this
  }

  hideCursor(): this {
    this.cursorCtrl.hide()
    return this
  }

  // --- Screen delegation ---

  get size(): ScreenSize {
    return {
      columns: (this.output as any).columns ?? 80,
      rows: (this.output as any).rows ?? 24,
    }
  }

  /** Number of columns. Alias for `size.columns`. */
  get cols(): number {
    return this.size.columns
  }

  /** Number of rows. Alias for `size.rows`. */
  get rows(): number {
    return this.size.rows
  }

  get colorSupport(): ColorSupport {
    return detectColorSupport()
  }

  onResize(cb: (size: ScreenSize) => void): () => void {
    const handler = () => cb(this.size)
    process.stdout.on('resize', handler)
    return () => {
      process.stdout.removeListener('resize', handler)
    }
  }

  clear(): this {
    if (this.screenBuffer) {
      this.screenBuffer.clear()
    } else {
      this.screenCtrl.clear()
    }
    return this
  }

  /** Clear rows from the current line and return to the first cleared row. */
  clearRows(height: number): this {
    this.screenCtrl.clearRows(height)
    return this
  }

  /**
   * Flush the screen buffer — diffs against the previous frame and writes
   * only changed cells. Uses synchronized output to prevent tearing.
   * No-op when buffer mode is disabled.
   */
  flush(): this {
    if (this.screenBuffer) {
      this.screenBuffer.flush((s: string) => this.output.write(s))
    }
    return this
  }

  /**
   * Attach the input reader and enable character-by-character input without
   * changing the active terminal display buffer or terminal protocols.
   */
  startInput(): this {
    if (this.inputStarted || !this.input) return this

    this.inputReader.attach(this.input)
    this.inputStarted = true

    const stream = this.input as any
    if (typeof stream.isTTY !== 'undefined' && stream.isTTY) {
      if (typeof stream.setRawMode === 'function') {
        this.wasRawMode = stream.isRaw ?? false
        stream.setRawMode(true)
        this.rawModeManaged = true
      }
      if (typeof stream.resume === 'function') {
        stream.resume()
      }
    }

    return this
  }

  /** Restore the input stream state captured by `startInput()`. */
  stopInput(): this {
    if (!this.inputStarted) return this

    this.inputReader.detach()
    if (this.rawModeManaged && this.input) {
      const stream = this.input as any
      stream.setRawMode(this.wasRawMode)
      this.rawModeManaged = false
    }
    this.inputStarted = false

    return this
  }

  /** Enable interactive terminal protocols without changing the display buffer. */
  enterApplication(options?: FullscreenOptions): this {
    this.screenCtrl.enterApplication(options)
    return this
  }

  /** Disable the interactive terminal protocols enabled by `enterApplication()`. */
  exitApplication(): this {
    this.screenCtrl.exitApplication()
    return this
  }

  enterFullscreen(options?: FullscreenOptions): this {
    this.screenCtrl.enterFullscreen(options)
    this.startInput()

    // Resize buffer to match screen and track future resizes
    if (this.screenBuffer) {
      const {columns, rows} = this.size
      this.screenBuffer.resize(columns, rows)
      this.resizeCleanup = this.onResize(({columns, rows}) => {
        this.screenBuffer?.resize(columns, rows)
      })
    }
    return this
  }

  exitFullscreen(): this {
    try {
      this.screenCtrl.exitFullscreen()
    } finally {
      try {
        this.stopInput()
      } finally {
        if (this.resizeCleanup) {
          this.resizeCleanup()
          this.resizeCleanup = null
        }
      }
    }
    return this
  }

  // --- Input ---

  onInput(cb: (event: InputEvent) => void): () => void {
    return this.inputReader.onInput(cb)
  }

  /**
   * Route a terminal response away from ordinary keyboard and mouse input.
   * Matchers may retain possible responses across multiple input chunks.
   */
  onResponse<T>(
    matcher: TerminalResponseMatcher<T>,
    listener: (value: T, raw: Buffer) => void,
    options?: TerminalResponseRouteOptions,
  ): () => void {
    return this.inputReader.onResponse(matcher, listener, options)
  }

  /**
   * Reserve up to the terminal's physical height in the normal screen buffer.
   * Returns the zero-based origin after any scrolling, or `null` when cursor
   * position reporting is unavailable.
   *
   * Input must already be attached with `startInput()`.
   */
  async reserveRows(
    height: number,
    timeoutMs: number = DEFAULT_CURSOR_POSITION_TIMEOUT_MS,
    isCancelled?: () => boolean,
  ): Promise<CursorPosition | null> {
    if (!Number.isInteger(height) || height <= 0) {
      throw new RangeError('Reserved row height must be a positive integer')
    }

    const effectiveHeight = Math.min(height, this.size.rows)
    const position = await this.queryCursorPosition(timeoutMs)
    if (isCancelled?.()) return null
    if (!position) {
      // Without a position, conservatively start on a fresh line. The rows are
      // still usable for keyboard-only rendering, but their physical origin
      // cannot be reported for mouse-coordinate translation.
      this.screenCtrl.reserveRows(effectiveHeight, {advanceToFreshLine: true})
      this.flushWrites()
      return null
    }

    this.screenCtrl.reserveRows(effectiveHeight, {
      advanceToFreshLine: position.x > 0,
    })
    // Reservation must reach the terminal before the follow-up query, even
    // when ordinary rendering uses the write buffer.
    this.flushWrites()
    return this.queryCursorPosition(timeoutMs)
  }

  /**
   * Query the terminal's physical cursor position. Coordinates are zero-based.
   * Returns `null` when the terminal does not respond before the timeout.
   *
   * Input must already be attached with `startInput()`. Cursor-position
   * responses that arrive after a timeout are still consumed instead of being
   * emitted as keyboard input.
   */
  queryCursorPosition(
    timeoutMs: number = DEFAULT_CURSOR_POSITION_TIMEOUT_MS,
  ): Promise<CursorPosition | null> {
    if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
      throw new RangeError('Cursor position timeout must be non-negative')
    }

    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined
      const waiter = (position: CursorPosition) => {
        if (timer) clearTimeout(timer)
        resolve(position)
      }
      this.cursorPositionWaiters.push(waiter)

      timer = setTimeout(() => {
        const index = this.cursorPositionWaiters.indexOf(waiter)
        if (index !== -1) this.cursorPositionWaiters.splice(index, 1)
        resolve(null)
      }, timeoutMs)

      try {
        // Queries must not wait for a buffered render to be flushed.
        this.output.write(CURSOR_POSITION_QUERY)
      } catch (error) {
        clearTimeout(timer)
        const index = this.cursorPositionWaiters.indexOf(waiter)
        if (index !== -1) this.cursorPositionWaiters.splice(index, 1)
        reject(error)
      }
    })
  }

  /**
   * Listen for raw data on stdin. Useful for reading proprietary escape
   * sequence responses (e.g. iTerm2 background color query).
   */
  onRawData(cb: (data: Buffer) => void): () => void {
    if (!this.input) throw new Error('No input stream')
    const handler = (data: Buffer) => cb(data)
    this.input.on('data', handler)
    return () => {
      this.input!.removeListener('data', handler)
    }
  }

  /**
   * Listen for raw data once, then remove the listener.
   */
  onceRawData(cb: (data: Buffer) => void): void {
    if (!this.input) throw new Error('No input stream')
    this.input.once('data', cb as any)
  }

  // --- Modern features ---

  link(url: string, text: string): this {
    this._write(modern.hyperlink(url, text))
    return this
  }

  image(data: Buffer, options?: ImageOptions): this {
    const protocol = detectImageProtocol()
    if (protocol === 'kitty') {
      this._write(kittyImage(data, options))
    } else if (protocol === 'iterm') {
      this._write(itermImage(data, options))
    }
    return this
  }

  /** Enable CSI u keyboard enhancement (disambiguates shift+enter vs alt+enter, etc). */
  keyboardEnhance(): this {
    this._write(modern.keyboardEnhanceEnable())
    return this
  }

  /** Disable CSI u keyboard enhancement (pops the enhancement off the stack). */
  keyboardEnhanceDisable(): this {
    this._write(modern.keyboardEnhanceDisable())
    return this
  }

  beginSync(): this {
    this._write(modern.syncStart())
    return this
  }

  endSync(): this {
    this._write(modern.syncEnd())
    return this
  }

  sync(fn: () => void): this {
    this.beginSync()
    fn()
    this.endSync()
    return this
  }

  underlineStyle(style: UnderlineStyle): this {
    this.styleOpen.push(modern.styledUnderline(style))
    return this
  }

  underlineColor(color: Color): this {
    this.styleOpen.push(modern.underlineColor(color))
    return this
  }

  title(title: string): this {
    this._write(modern.setTitle(title))
    return this
  }

  notify(title: string, body?: string): this {
    this._write(modern.notification(title, body))
    return this
  }

  // --- Standalone style builder ---

  style(): StyleBuilder {
    return new StyleBuilder()
  }
}

const CURSOR_POSITION_QUERY = `${ansi.CSI}6n`
const CURSOR_POSITION_RESPONSE_PREFIX = Buffer.from(ansi.CSI)
const DEFAULT_CURSOR_POSITION_TIMEOUT_MS = 100
const ZERO = '0'.charCodeAt(0)
const NINE = '9'.charCodeAt(0)
const SEMICOLON = ';'.charCodeAt(0)
const RESPONSE_END = 'R'.charCodeAt(0)

function matchCursorPositionResponse(
  candidate: Buffer,
): ReturnType<TerminalResponseMatcher<CursorPosition>> {
  const prefixLength = Math.min(
    candidate.length,
    CURSOR_POSITION_RESPONSE_PREFIX.length,
  )
  for (let index = 0; index < prefixLength; index++) {
    if (candidate[index] !== CURSOR_POSITION_RESPONSE_PREFIX[index]) {
      return {status: 'none'}
    }
  }
  if (candidate.length < CURSOR_POSITION_RESPONSE_PREFIX.length) {
    return {status: 'partial'}
  }

  let index = CURSOR_POSITION_RESPONSE_PREFIX.length
  const rowStart = index
  while (index < candidate.length && isDigit(candidate[index])) index++
  if (index === rowStart) {
    return index === candidate.length ? {status: 'partial'} : {status: 'none'}
  }
  if (index === candidate.length) return {status: 'partial'}
  if (candidate[index] !== SEMICOLON) return {status: 'none'}

  const rowEnd = index
  index++
  const columnStart = index
  while (index < candidate.length && isDigit(candidate[index])) index++
  if (index === columnStart) {
    return index === candidate.length ? {status: 'partial'} : {status: 'none'}
  }
  if (index === candidate.length) return {status: 'partial'}
  if (candidate[index] !== RESPONSE_END) return {status: 'none'}

  const row = Number(candidate.toString('ascii', rowStart, rowEnd))
  const column = Number(candidate.toString('ascii', columnStart, index))
  if (
    !Number.isSafeInteger(row) ||
    row <= 0 ||
    !Number.isSafeInteger(column) ||
    column <= 0
  ) {
    return {status: 'none'}
  }

  return {
    status: 'match',
    length: index + 1,
    value: {x: column - 1, y: row - 1},
  }
}

function isDigit(byte: number): boolean {
  return byte >= ZERO && byte <= NINE
}
