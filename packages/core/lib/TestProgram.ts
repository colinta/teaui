import type {Program} from './types.js'
import type {SystemEvent} from './events/index.js'
import {TestTerminal} from './TestTerminal.js'

/**
 * A headless Program for testing. Wraps a TestTerminal for output assertions,
 * and allows pushing events programmatically via sendEvent().
 */
export class TestProgram implements Program {
  #terminal: TestTerminal
  #eventListener?: (event: SystemEvent) => void

  constructor({cols, rows}: {cols: number; rows: number}) {
    this.#terminal = new TestTerminal({cols, rows})
  }

  get terminal(): TestTerminal {
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
    this.#terminal.move(x, y)
  }

  write(str: string): void {
    this.#terminal.write(str)
  }

  flush(): void {
    this.#terminal.flush()
  }

  // --- Program lifecycle ---

  setup(): void {}
  teardown(): void {}

  // --- Events ---

  onEvents(listener: (event: SystemEvent) => void): () => void {
    this.#eventListener = listener
    return () => {
      this.#eventListener = undefined
    }
  }

  onResize(listener: () => void): () => void {
    // No resize in tests — return no-op unsubscribe
    return () => {}
  }

  /**
   * Push a system event into the Screen's event pipeline.
   */
  sendEvent(event: SystemEvent): void {
    this.#eventListener?.(event)
  }
}
