import {Terminal} from './terminal.js'
import {
  isMouseEvent,
  type InputEvent,
  type ScreenSize,
  type TerminalOptions,
} from './types.js'

export interface InlineRegion {
  originY: number
  originKnown: boolean
  /** Height currently available for layout and rendering. */
  height: number
  /** Configured height, restored when the terminal has enough rows. */
  configuredHeight: number
}

export interface InlineTerminalOptions extends TerminalOptions {
  height: number
  clearOnExit?: boolean
}

export abstract class ApplicationTerminal extends Terminal {
  abstract setup(): void | Promise<void>
  abstract teardown(): void
}

export class FullscreenTerminal extends ApplicationTerminal {
  #isActive = false

  setup(): void {
    if (this.#isActive) return
    this.#isActive = true
    try {
      this.enterFullscreen({
        mouse: true,
        hideCursor: true,
        focusEvents: true,
      })
      this.clear()
    } catch (error) {
      try {
        this.teardown()
      } catch {
        // Preserve the setup error after best-effort cleanup.
      }
      throw error
    }
  }

  teardown(): void {
    if (!this.#isActive) return
    this.#isActive = false

    try {
      this.clear()
    } finally {
      try {
        this.exitFullscreen()
      } finally {
        this.flushWrites()
      }
    }
  }
}

export class InlineTerminal extends ApplicationTerminal {
  readonly region: InlineRegion
  readonly clearOnExit: boolean

  #isActive = false
  #isReserved = false
  #isReserving = false
  #mouseEnabled = false
  #resizePending = false
  #resizeRunning = false
  #pendingSize?: ScreenSize
  #lastSize: ScreenSize
  #reservationQueue = Promise.resolve()
  #session = 0

  constructor({height, clearOnExit, ...options}: InlineTerminalOptions) {
    if (!Number.isInteger(height) || height <= 0) {
      throw new RangeError('Inline display height must be a positive integer')
    }

    super(options)
    this.#lastSize = this.size
    this.region = {
      originY: 0,
      originKnown: false,
      height: Math.min(height, this.size.rows),
      configuredHeight: height,
    }
    this.clearOnExit = clearOnExit ?? true
  }

  override get rows(): number {
    return this.region.height
  }

  override moveTo(x: number, y: number): this {
    if (!this.region.originKnown) {
      return this.restoreCursor().moveBy(x, y)
    }

    return super.moveTo(x, this.region.originY + y)
  }

  override onInput(listener: (event: InputEvent) => void): () => void {
    return super.onInput(event => {
      if (!isMouseEvent(event)) {
        listener(event)
        return
      }

      if (!this.region.originKnown) return

      const y = event.y - this.region.originY
      if (
        event.x < 0 ||
        event.x >= this.cols ||
        y < 0 ||
        y >= this.region.height
      ) {
        return
      }

      listener({...event, y})
    })
  }

  override onResize(listener: (size: ScreenSize) => void): () => void {
    let subscribed = true
    const unsubscribe = super.onResize(size => {
      if (!this.#isActive || !subscribed) return

      this.#pendingSize = size
      this.#resizePending = true
      void this.#drainResizeEvents(() => {
        if (subscribed) listener(this.size)
      })
    })

    return () => {
      subscribed = false
      unsubscribe()
    }
  }

  override flushWrites(): this {
    // Keeping the hidden cursor at the region origin gives terminal reflow a
    // stable anchor whose new physical row can be queried after a resize.
    if (this.#isActive && this.#isReserved && !this.#isReserving) {
      this.moveTo(0, 0)
    }
    return super.flushWrites()
  }

  async setup(): Promise<void> {
    if (this.#isActive) return
    this.#isActive = true
    const session = ++this.#session

    try {
      this.startInput()
      const origin = await this.#reserveConfiguredRows(session)
      if (!this.#isCurrentSession(session)) return

      this.#isReserved = true
      this.#setRegion(origin)
      this.#lastSize = this.size

      this.#mouseEnabled = this.region.originKnown
      this.enterApplication({
        mouse: this.#mouseEnabled,
        hideCursor: true,
        focusEvents: true,
      })
      this.flushWrites()
    } catch (error) {
      if (this.#isCurrentSession(session)) {
        try {
          this.teardown()
        } catch {
          // Preserve the setup error after best-effort cleanup.
        }
      }
      throw error
    }
  }

  teardown(): void {
    if (!this.#isActive) return
    this.#isActive = false
    this.#session++
    this.#resizePending = false
    this.#pendingSize = undefined

    try {
      this.exitApplication()
    } finally {
      try {
        if (this.#isReserved && this.region.height > 0) {
          if (this.clearOnExit) {
            this.moveTo(0, 0)
            this.clearRows(this.region.height)
          } else {
            this.moveTo(0, this.region.height - 1)
            this.write(INLINE_EXIT_NEWLINE)
          }
        }
      } finally {
        try {
          this.flushWrites()
        } finally {
          this.stopInput()
        }
      }
    }
  }

  async #drainResizeEvents(listener: () => void): Promise<void> {
    if (this.#resizeRunning) return
    this.#resizeRunning = true

    try {
      while (this.#resizePending && this.#isActive) {
        this.#resizePending = false
        const size = this.#pendingSize ?? this.size
        this.#pendingSize = undefined
        const previousSize = this.#lastSize
        this.#lastSize = size
        const session = this.#session

        try {
          const origin =
            size.rows === previousSize.rows
              ? await this.queryCursorPosition()
              : await this.#reserveConfiguredRows(session)
          if (!this.#isCurrentSession(session)) return
          this.#setRegion(origin)
          this.#setMouseEnabled(this.region.originKnown)
          this.flushWrites()
        } catch {
          if (!this.#isCurrentSession(session)) return
          this.region.height = Math.min(
            this.region.configuredHeight,
            this.size.rows,
          )
          this.region.originKnown = false
          try {
            this.saveCursor()
            this.#setMouseEnabled(false)
            this.flushWrites()
          } catch {
            // The output stream is already failing; retain keyboard cleanup.
          }
        }
        listener()
      }
    } finally {
      this.#resizeRunning = false
    }
  }

  async #reserveConfiguredRows(session: number) {
    const previousReservation = this.#reservationQueue
    let finishReservation: () => void = () => {}
    this.#reservationQueue = new Promise(resolve => {
      finishReservation = resolve
    })

    await previousReservation
    if (!this.#isCurrentSession(session)) {
      finishReservation()
      return null
    }

    this.#isReserving = true
    try {
      return await this.reserveRows(
        this.region.configuredHeight,
        undefined,
        () => !this.#isCurrentSession(session),
      )
    } finally {
      this.#isReserving = false
      finishReservation()
    }
  }

  #isCurrentSession(session: number): boolean {
    return this.#isActive && session === this.#session
  }

  #setRegion(origin: {y: number} | null): void {
    this.region.height = Math.min(this.region.configuredHeight, this.size.rows)
    if (origin) {
      this.region.originY = origin.y
      this.region.originKnown = true
    } else {
      this.region.originKnown = false
      // Reservation leaves the cursor at the logical origin. Preserve it as a
      // relative drawing anchor when absolute coordinates are unavailable.
      this.saveCursor()
    }
  }

  #setMouseEnabled(enabled: boolean): void {
    if (enabled === this.#mouseEnabled) return
    this.exitApplication()
    this.enterApplication({mouse: enabled, hideCursor: true, focusEvents: true})
    this.#mouseEnabled = enabled
  }
}

const INLINE_EXIT_NEWLINE = '\r\n'
