import {View, Style, Point, Size} from '@teaui/core'
import type {Viewport, Screen} from '@teaui/core'
import type {KeyEvent, MouseEvent} from '@teaui/core'

import type * as ptyNs from 'node-pty'
import type {Terminal as XtermTerminal, IBufferCell} from '@xterm/headless'

import {keyEventToAnsi} from './keyEventToAnsi.js'
import {mouseEventToAnsi} from './mouseEventToAnsi.js'
import {StyleCache} from './xtermBridge.js'

export interface SubprocessViewProps {
  command: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  onData?: (data: string) => void
  onExit?: (exitCode: number, signal?: number) => void
  onFocus?: () => void
  onBlur?: () => void
  width?: number | 'fill' | 'shrink' | 'natural'
  height?: number | 'fill' | 'shrink' | 'natural'
}

type SubprocessState =
  | {kind: 'idle'}
  | {kind: 'starting'}
  | {kind: 'running'}
  | {kind: 'exited'; exitCode: number; signal?: number}
  | {kind: 'error'; message: string}

export class SubprocessView extends View {
  #command: string
  #args: string[]
  #env: Record<string, string>
  #cwd: string | undefined
  #onData?: (data: string) => void
  #onExit?: (exitCode: number, signal?: number) => void
  #onFocus?: () => void
  #onBlur?: () => void

  #pty: ptyNs.IPty | null = null
  #xterm: XtermTerminal | null = null
  #cellRef: IBufferCell | null = null
  #state: SubprocessState = {kind: 'idle'}
  #lastCols = 0
  #lastRows = 0
  #styleCache = new StyleCache()

  constructor(props: SubprocessViewProps) {
    super({
      width: props.width ?? 'fill',
      height: props.height ?? 'fill',
    })
    this.#command = props.command
    this.#args = props.args ?? []
    this.#env = props.env ?? {}
    this.#cwd = props.cwd
    this.#onData = props.onData
    this.#onExit = props.onExit
    this.#onFocus = props.onFocus
    this.#onBlur = props.onBlur
  }

  get processState(): SubprocessState['kind'] {
    return this.#state.kind
  }

  get exitCode(): number | null {
    return this.#state.kind === 'exited' ? this.#state.exitCode : null
  }

  didMount(screen: Screen) {
    super.didMount(screen)
    this.#state = {kind: 'starting'}
    this.#spawnProcess().catch(err => {
      this.#state = {
        kind: 'error',
        message: err instanceof Error ? err.message : String(err),
      }
      this.screen?.needsRender()
    })
  }

  async #spawnProcess() {
    // Dynamic imports so the module can be loaded without native deps installed
    const ptyMod = await import('node-pty')
    const xtermMod = await import('@xterm/headless')
    // @xterm/headless is CJS — under ESM dynamic import, Terminal may be on .default
    const Terminal: typeof XtermTerminal =
      (xtermMod as any).default?.Terminal ?? (xtermMod as any).Terminal

    // Check if we were unmounted during the async import
    if (!this.screen) return

    const cols = this.#lastCols || 80
    const rows = this.#lastRows || 24

    const xterm = new Terminal({
      cols,
      rows,
      allowProposedApi: true,
    })
    this.#xterm = xterm

    // Pre-allocate a reusable cell reference for render performance
    this.#cellRef = xterm.buffer.active.getNullCell()

    try {
      this.#pty = ptyMod.spawn(this.#command, this.#args, {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: this.#cwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          ...this.#env,
        } as Record<string, string>,
      })
    } catch (err) {
      this.#state = {
        kind: 'error',
        message:
          err instanceof Error ? err.message : `Failed to spawn: ${err}`,
      }
      this.screen?.needsRender()
      return
    }

    this.#state = {kind: 'running'}

    this.#pty.onData(data => {
      this.#onData?.(data)
      this.#xterm?.write(data, () => {
        this.screen?.needsRender()
      })
    })

    this.#pty.onExit(({exitCode, signal}) => {
      this.#state = {kind: 'exited', exitCode, signal}
      this.#onExit?.(exitCode, signal)
      this.screen?.needsRender()
    })

    // Trigger initial render now that PTY is live
    this.screen?.needsRender()
  }

  didUnmount(screen: Screen) {
    super.didUnmount(screen)

    if (this.#pty) {
      try {
        this.#pty.kill()
      } catch {}
      this.#pty = null
    }

    if (this.#xterm) {
      this.#xterm.dispose()
      this.#xterm = null
    }

    this.#cellRef = null
  }

  naturalSize(available: Size): Size {
    return new Size(available.width, available.height)
  }

  render(viewport: Viewport) {
    const hasFocus = viewport.registerFocus()

    if (hasFocus) {
      // When focused, receive all mouse events to forward to the subprocess
      viewport.registerMouse(['mouse.button.all', 'mouse.wheel', 'mouse.move'])
    } else {
      // When unfocused, only listen for clicks to take focus
      viewport.registerMouse(['mouse.button.all'])
    }

    const cols = viewport.contentSize.width
    const rows = viewport.contentSize.height

    // Resize PTY and xterm if viewport size changed
    if (
      cols > 0 &&
      rows > 0 &&
      (cols !== this.#lastCols || rows !== this.#lastRows)
    ) {
      this.#lastCols = cols
      this.#lastRows = rows
      this.#styleCache.clear()
      if (this.#pty && this.#state.kind === 'running') {
        try {
          this.#pty.resize(cols, rows)
        } catch {}
      }
      this.#xterm?.resize(cols, rows)
    }

    // Render status messages for non-running states
    if (this.#state.kind === 'error') {
      this.#renderMessage(viewport, cols, rows, `Error: ${this.#state.message}`)
      return
    }

    if (this.#state.kind === 'exited') {
      // Still render the final xterm buffer, then overlay exit message
      if (this.#xterm) this.#renderXtermBuffer(viewport, cols, rows)
      const msg = `[Process exited with code ${this.#state.exitCode}]`
      const y = Math.min(rows - 1, Math.max(0, rows - 1))
      const x = Math.max(0, Math.floor((cols - msg.length) / 2))
      viewport.write(
        msg,
        new Point(x, y),
        new Style({dim: true, inverse: true}),
      )
      return
    }

    if (!this.#xterm || this.#state.kind !== 'running') {
      this.#renderMessage(viewport, cols, rows, 'Starting process...')
      return
    }

    this.#renderXtermBuffer(viewport, cols, rows)
  }

  #renderMessage(
    viewport: Viewport,
    cols: number,
    rows: number,
    message: string,
  ) {
    viewport.paint(Style.NONE)
    const x = Math.max(0, Math.floor((cols - message.length) / 2))
    const y = Math.max(0, Math.floor(rows / 2))
    viewport.write(message, new Point(x, y), new Style({dim: true}))
  }

  #renderXtermBuffer(viewport: Viewport, cols: number, rows: number) {
    const buffer = this.#xterm!.buffer.active

    // Re-acquire cell ref after potential buffer switch (normal/alt)
    const cellRef = this.#cellRef ?? buffer.getNullCell()
    const styleCache = this.#styleCache

    for (let y = 0; y < rows; y++) {
      const line = buffer.getLine(y)
      if (!line) {
        for (let x = 0; x < cols; x++) {
          viewport.write(' ', new Point(x, y))
        }
        continue
      }

      let x = 0
      while (x < cols) {
        const cell = line.getCell(x, cellRef)
        if (!cell) {
          viewport.write(' ', new Point(x, y))
          x++
          continue
        }

        const width = cell.getWidth()

        if (width === 0) {
          // Continuation of a wide character — skip
          x++
          continue
        }

        const chars = cell.getChars()
        const style = styleCache.styleForCell(cell)
        viewport.write(chars || ' ', new Point(x, y), style)
        x += width
      }
    }
  }

  didFocus() {
    super.didFocus()
    this.#onFocus?.()
  }

  didBlur() {
    super.didBlur()
    this.#onBlur?.()
  }

  receiveKey(event: KeyEvent) {
    if (!this.#pty || this.#state.kind !== 'running') return

    const bytes = keyEventToAnsi(event)
    if (bytes) {
      this.#pty.write(bytes)
    }
  }

  receiveMouse(event: MouseEvent, system: any) {
    super.receiveMouse(event, system)

    if (!this.hasFocus) {
      // Clicking an unfocused SubprocessView takes focus but does not
      // forward the mouse event to the child process.
      if (event.name === 'mouse.button.down') {
        system.requestFocus()
      }
      return
    }

    if (!this.#pty || this.#state.kind !== 'running') return

    const bytes = mouseEventToAnsi(event)
    if (bytes) {
      this.#pty.write(bytes)
    }
  }
}
