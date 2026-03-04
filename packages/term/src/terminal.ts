import type {
  Color,
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
import { CursorController } from './cursor.js'
import { ScreenController, detectColorSupport } from './screen.js'
import { InputReader } from './input.js'
import { StyleBuilder } from './style.js'
import { ScreenBuffer } from './buffer.js'
import { itermImage, kittyImage, detectImageProtocol } from './image.js'
import * as modern from './modern.js'

export class Terminal {
  private output: { write(s: string): boolean; columns?: number; rows?: number }
  private input: NodeJS.ReadableStream | undefined
  private cursorCtrl: CursorController
  private screenCtrl: ScreenController
  private inputReader: InputReader
  private screenBuffer: ScreenBuffer | null = null
  private useBuffer: boolean

  private styleOpen: string[] = []
  private wasRawMode: boolean = false
  private resizeCleanup: (() => void) | null = null
  private writeBuffer: string[] | null = null

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

    if (this.useBuffer) {
      const { columns, rows } = this.size
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

  enterFullscreen(options?: FullscreenOptions): this {
    this.screenCtrl.enterFullscreen(options)
    if (this.input) {
      this.inputReader.attach(this.input)
      // Enable raw mode so we get character-by-character input
      const stream = this.input as any
      if (typeof stream.isTTY !== 'undefined' && stream.isTTY) {
        if (typeof stream.setRawMode === 'function') {
          this.wasRawMode = stream.isRaw ?? false
          stream.setRawMode(true)
        }
        if (typeof stream.resume === 'function') {
          stream.resume()
        }
      }
    }
    // Resize buffer to match screen and track future resizes
    if (this.screenBuffer) {
      const { columns, rows } = this.size
      this.screenBuffer.resize(columns, rows)
      this.resizeCleanup = this.onResize(({ columns, rows }) => {
        this.screenBuffer?.resize(columns, rows)
      })
    }
    return this
  }

  exitFullscreen(): this {
    this.screenCtrl.exitFullscreen()
    this.inputReader.detach()
    if (this.resizeCleanup) {
      this.resizeCleanup()
      this.resizeCleanup = null
    }
    // Restore raw mode to previous state
    if (this.input) {
      const stream = this.input as any
      if (typeof stream.setRawMode === 'function') {
        stream.setRawMode(this.wasRawMode)
      }
    }
    return this
  }

  // --- Input ---

  onInput(cb: (event: InputEvent) => void): () => void {
    return this.inputReader.onInput(cb)
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
