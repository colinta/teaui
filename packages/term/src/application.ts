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
  /** Configured or dynamically resolved height before terminal-row clamping. */
  configuredHeight: number
}

export interface InlineTerminalOptions extends TerminalOptions {
  height: number | ((available: ScreenSize) => number)
  clearOnExit?: boolean
}

export abstract class ApplicationTerminal extends Terminal {
  abstract setup(): void | Promise<void>
  abstract teardown(): void

  get isUpdatingRegion(): boolean {
    return false
  }

  refreshHeight(): Promise<boolean> {
    return Promise.resolve(false)
  }
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

  #height: number | ((available: ScreenSize) => number)
  #isActive = false
  #isReserved = false
  #isReserving = false
  #mouseEnabled = false
  #resizePending = false
  #resizeRunning = false
  #pendingSize?: ScreenSize
  #lastSize: ScreenSize
  #regionUpdateQueue = Promise.resolve()
  #regionUpdateRunning = false
  #session = 0

  constructor({height, clearOnExit, ...options}: InlineTerminalOptions) {
    if (typeof height === 'number') {
      validateInlineHeight(height)
    }

    super(options)
    this.#height = height
    this.#lastSize = this.size
    const configuredHeight =
      typeof height === 'number' ? height : this.size.rows
    this.region = {
      originY: 0,
      originKnown: false,
      height: Math.min(configuredHeight, this.size.rows),
      configuredHeight,
    }
    this.clearOnExit = clearOnExit ?? true
  }

  override get rows(): number {
    return this.region.height
  }

  override get isUpdatingRegion(): boolean {
    return this.#regionUpdateRunning
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
      await this.#queueRegionUpdate(async () => {
        if (!this.#isCurrentSession(session)) return
        this.#updateConfiguredHeight(this.size)
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
      })
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

  /** Re-resolve a dynamic height and update the reserved region if it changed. */
  override refreshHeight(): Promise<boolean> {
    if (!this.#isActive) return Promise.resolve(false)
    const session = this.#session

    return this.#queueRegionUpdate(async () => {
      if (!this.#isCurrentSession(session)) return false
      const size = this.size
      const previousHeight = this.region.configuredHeight
      const previousRegionHeight = this.region.height
      this.#updateConfiguredHeight(size)
      if (this.region.configuredHeight === previousHeight) return false

      try {
        const origin = await this.#reserveConfiguredRows(session)
        if (!this.#isCurrentSession(session)) return false
        this.#setRegion(origin)
        this.#clearShrunkRegion(previousRegionHeight, size.rows)
        this.#setMouseEnabled(this.region.originKnown)
        this.flushWrites()
      } catch {
        if (!this.#isCurrentSession(session)) return false
        this.#recoverRegionUpdate()
      }

      return this.region.height !== previousRegionHeight
    })
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

        await this.#queueRegionUpdate(async () => {
          if (!this.#isCurrentSession(session)) return
          try {
            const previousHeight = this.region.configuredHeight
            const previousRegionHeight = this.region.height
            this.#updateConfiguredHeight(size)
            const heightChanged =
              this.region.configuredHeight !== previousHeight
            const origin =
              size.rows === previousSize.rows && !heightChanged
                ? await this.queryCursorPosition()
                : await this.#reserveConfiguredRows(session)
            if (!this.#isCurrentSession(session)) return
            this.#setRegion(origin)
            this.#clearShrunkRegion(previousRegionHeight, size.rows)
            this.#setMouseEnabled(this.region.originKnown)
            this.flushWrites()
          } catch {
            if (!this.#isCurrentSession(session)) return
            this.#recoverRegionUpdate()
          }
        })
        listener()
      }
    } finally {
      this.#resizeRunning = false
    }
  }

  async #reserveConfiguredRows(session: number) {
    if (!this.#isCurrentSession(session)) return null

    this.#isReserving = true
    try {
      return await this.reserveRows(
        this.region.configuredHeight,
        undefined,
        () => !this.#isCurrentSession(session),
      )
    } finally {
      this.#isReserving = false
    }
  }

  async #queueRegionUpdate<T>(update: () => Promise<T>): Promise<T> {
    const previousUpdate = this.#regionUpdateQueue
    let finishUpdate: () => void = () => {}
    this.#regionUpdateQueue = new Promise(resolve => {
      finishUpdate = resolve
    })

    await previousUpdate
    this.#regionUpdateRunning = true
    try {
      return await update()
    } finally {
      this.#regionUpdateRunning = false
      finishUpdate()
    }
  }

  #isCurrentSession(session: number): boolean {
    return this.#isActive && session === this.#session
  }

  #resolveHeight(size: ScreenSize): number {
    const height =
      typeof this.#height === 'function' ? this.#height(size) : this.#height
    validateInlineHeight(height)
    return height
  }

  #updateConfiguredHeight(size: ScreenSize): void {
    this.region.configuredHeight = this.#resolveHeight(size)
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

  #clearShrunkRegion(previousHeight: number, terminalRows: number): void {
    if (this.region.height >= previousHeight) return
    this.moveTo(0, 0)
    this.clearRows(Math.min(previousHeight, terminalRows))
  }

  #recoverRegionUpdate(): void {
    this.region.height = Math.min(this.region.configuredHeight, this.size.rows)
    this.region.originKnown = false
    try {
      this.saveCursor()
      this.#setMouseEnabled(false)
      this.flushWrites()
    } catch {
      // The output stream is already failing; retain keyboard cleanup.
    }
  }

  #setMouseEnabled(enabled: boolean): void {
    if (enabled === this.#mouseEnabled) return
    this.exitApplication()
    this.enterApplication({mouse: enabled, hideCursor: true, focusEvents: true})
    this.#mouseEnabled = enabled
  }
}

function validateInlineHeight(height: number): void {
  if (!Number.isInteger(height) || height <= 0) {
    throw new RangeError('Inline display height must be a positive integer')
  }
}

const INLINE_EXIT_NEWLINE = '\r\n'
