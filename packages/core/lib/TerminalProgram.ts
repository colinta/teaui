import {
  type ApplicationTerminal,
  FullscreenTerminal,
  InlineTerminal,
  type Terminal as TermTerminal,
  isKeyEvent,
  isMouseEvent,
  isPasteEvent,
  isFocusEvent,
  type InlineRegion,
  type InputEvent as TermInputEvent,
} from '@teaui/term'

import {Size} from './geometry.js'
import {type Program, type ScreenDisplay} from './types.js'
import type {View} from './View.js'
import type {SystemEvent} from './events/index.js'
import {
  translateTermKeyEvent,
  translateTermMouseEvent,
} from './events/translate.js'

export type ResolvedScreenDisplay =
  | {mode: 'fullscreen'}
  | {mode: 'inline'; region: InlineRegion; clearOnExit: boolean}

/**
 * Wraps @teaui/term's Terminal for use by Screen and the public API.
 * Translates low-level terminal input into SystemEvents that Screen can consume.
 */
export class TerminalProgram implements Program {
  #terminal: ApplicationTerminal
  #naturalHeightView?: View
  #usesNaturalHeight = false
  readonly display: ResolvedScreenDisplay

  constructor(display: ScreenDisplay = {mode: 'fullscreen'}) {
    if (display.mode === 'inline') {
      const height = display.height
      this.#usesNaturalHeight = height === 'natural'
      const terminal = new InlineTerminal({
        height:
          height === 'natural'
            ? ({columns, rows}) => this.#naturalHeight(columns, rows)
            : height,
        clearOnExit: display.clearOnExit,
      })
      this.#terminal = terminal
      this.display = {
        mode: 'inline',
        region: terminal.region,
        clearOnExit: terminal.clearOnExit,
      }
    } else {
      this.#terminal = new FullscreenTerminal()
      this.display = {mode: 'fullscreen'}
    }
    this.#terminal.enableWriteBuffer()
  }

  get terminal(): TermTerminal {
    return this.#terminal
  }

  // --- SGRTerminal interface ---

  get cols(): number {
    return this.#terminal.cols
  }

  get rows(): number {
    return this.#terminal.rows
  }

  move(x: number, y: number): void {
    this.#terminal.moveTo(x, y)
  }

  write(str: string): void {
    this.#terminal.write(str)
  }

  flush(): void {
    this.#terminal.flushWrites()
  }

  // --- Lifecycle ---

  setup(): void | Promise<void> {
    if (this.#usesNaturalHeight) return
    return this.#terminal.setup()
  }

  /** Complete deferred inline setup once the root view is available to measure. */
  setupRootView(rootView: View): void | Promise<void> {
    if (!this.#usesNaturalHeight) return
    this.#naturalHeightView = rootView
    return this.#terminal.setup()
  }

  teardown(): void {
    this.#terminal.teardown()
  }

  get isUpdatingRegion(): boolean {
    return this.#terminal.isUpdatingRegion
  }

  refreshHeight(): Promise<boolean> {
    return this.#terminal.refreshHeight()
  }

  // --- Events ---

  /**
   * Subscribe to translated system events from terminal input.
   * Returns an unsubscribe function.
   */
  onEvents(listener: (event: SystemEvent) => void): () => void {
    return this.#terminal.onInput((event: TermInputEvent) => {
      if (isFocusEvent(event)) {
        listener({type: event.focused ? 'focus' : 'blur'})
        return
      }

      if (isKeyEvent(event)) {
        listener(translateTermKeyEvent(event))
        return
      }

      if (isPasteEvent(event)) {
        listener({type: 'paste', text: event.text})
        return
      }

      if (isMouseEvent(event)) {
        const mouseEvent = translateTermMouseEvent(event)
        if (mouseEvent) {
          listener(mouseEvent)
        }
        return
      }
    })
  }

  /**
   * Subscribe to terminal resize events.
   * Returns an unsubscribe function.
   */
  onResize(listener: () => void): () => void {
    return this.#terminal.onResize(() => listener())
  }

  /**
   * Listen for raw data once (for iTerm2 proprietary escape sequences, etc.)
   */
  onceRawData(fn: (...args: any[]) => void): void {
    this.#terminal.onceRawData(fn)
  }

  #naturalHeight(columns: number, rows: number): number {
    const height =
      this.#naturalHeightView?.naturalSize(new Size(columns, rows)).height ??
      rows
    return Math.max(1, Math.min(rows, Math.ceil(height)))
  }
}
