import type {Program} from './types.js'
import type {SystemEvent} from './events/index.js'
import {StringTerminal} from './StringTerminal.js'

/**
 * A headless Program for offscreen rendering (screenshots, ANSI export).
 * Wraps a StringTerminal and no-ops everything else.
 */
export class HeadlessProgram implements Program {
  #terminal: StringTerminal

  constructor({cols, rows}: {cols: number; rows: number}) {
    this.#terminal = new StringTerminal({cols, rows})
  }

  get terminal(): StringTerminal {
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

  onEvents(_listener: (event: SystemEvent) => void): () => void {
    return () => {}
  }

  onResize(_listener: () => void): () => void {
    return () => {}
  }
}
