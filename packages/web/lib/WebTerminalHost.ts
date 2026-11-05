import type {
  TerminalEnv,
  TerminalInput,
  TerminalOptions,
  TerminalOutput,
} from '@teaui/term'

/** Anything that can display terminal output, e.g. a wterm `WTerm`. */
export interface TerminalSink {
  write(data: string): void
}

export interface WebTerminalHostOptions {
  cols: number
  rows: number
  /** Merged over {@link DEFAULT_WEB_ENV}. */
  env?: TerminalEnv
}

type DataListener = (data: string | Uint8Array) => void
type ResizeListener = () => void

/**
 * Bridges a browser terminal emulator and TeaUI. Provides the `stdout`,
 * `stdin`, and `env` that TeaUI's Terminal normally takes from `process`.
 *
 * Wire the emulator's input to `receive()` and its resize events to
 * `resize()`, then pass `host.terminalOptions` as `ScreenOptions.terminal`.
 */
export class WebTerminalHost {
  readonly stdout: TerminalOutput
  readonly stdin: TerminalInput
  readonly env: TerminalEnv

  #sink: TerminalSink
  #cols: number
  #rows: number
  #dataListeners = new Set<DataListener>()
  #resizeListeners = new Set<ResizeListener>()

  constructor(sink: TerminalSink, {cols, rows, env}: WebTerminalHostOptions) {
    this.#sink = sink
    this.#cols = cols
    this.#rows = rows
    this.env = {...DEFAULT_WEB_ENV, ...env}

    const getCols = () => this.#cols
    const getRows = () => this.#rows
    this.stdout = {
      get columns() {
        return getCols()
      },
      get rows() {
        return getRows()
      },
      write: (data: string) => {
        this.#sink.write(data)
      },
      on: (_event: 'resize', listener: ResizeListener) => {
        this.#resizeListeners.add(listener)
      },
      removeListener: (_event: 'resize', listener: ResizeListener) => {
        this.#resizeListeners.delete(listener)
      },
    }
    this.stdin = {
      on: (_event: 'data', listener: DataListener) => {
        this.#dataListeners.add(listener)
      },
      removeListener: (_event: 'data', listener: DataListener) => {
        this.#dataListeners.delete(listener)
      },
    }
  }

  get terminalOptions(): Pick<TerminalOptions, 'stdout' | 'stdin' | 'env'> {
    return {stdout: this.stdout, stdin: this.stdin, env: this.env}
  }

  get cols() {
    return this.#cols
  }

  get rows() {
    return this.#rows
  }

  /** Deliver input from the emulator (keys, mouse reports, responses). */
  receive(data: string | Uint8Array) {
    // Snapshot: listeners may subscribe or unsubscribe while handling input.
    for (const listener of Array.from(this.#dataListeners)) {
      listener(data)
    }
  }

  /** Report the emulator's new grid size. */
  resize(cols: number, rows: number) {
    if (cols === this.#cols && rows === this.#rows) {
      return
    }
    this.#cols = cols
    this.#rows = rows
    for (const listener of Array.from(this.#resizeListeners)) {
      listener()
    }
  }
}

/** Capabilities of modern browser terminal emulators such as wterm. */
export const DEFAULT_WEB_ENV: TerminalEnv = {
  TERM: 'xterm-256color',
  COLORTERM: 'truecolor',
}
