import {Screen, type ScreenOptions, type View} from '@teaui/core'
import type {TerminalEnv} from '@teaui/term'
import {WTerm, type WTermOptions} from '@wterm/dom'
import {WebTerminalHost} from './WebTerminalHost.js'

/** wterm options managed by TeaUI are omitted. */
export type WtermOptions = Omit<WTermOptions, 'onData' | 'onResize'>

export interface MountWtermOptions {
  wterm?: WtermOptions
  /** Merged over the default web env (truecolor, xterm-256color). */
  env?: TerminalEnv
}

export interface MountedWterm {
  wterm: WTerm
  host: WebTerminalHost
  /** Destroy the wterm instance and remove its DOM. */
  destroy(): void
}

/**
 * Create and initialize a wterm instance in `element`, connected to a
 * {@link WebTerminalHost}. Lower-level than {@link startInWterm}; use it to
 * call `Screen.start` (or `run` from `@teaui/react`) yourself.
 *
 * Remember to import wterm's stylesheet: `import '@wterm/dom/css'`.
 */
export async function mountWterm(
  element: HTMLElement,
  {wterm: wtermOptions, env}: MountWtermOptions = {},
): Promise<MountedWterm> {
  // wterm reports input and resizes from init() onward; the host needs the
  // initialized grid size, so it's created after init().
  let host: WebTerminalHost | undefined
  const wterm = new WTerm(element, {
    ...wtermOptions,
    onData(data) {
      host?.receive(data)
    },
    onResize(cols, rows) {
      host?.resize(cols, rows)
    },
  })
  await wterm.init()

  host = new WebTerminalHost(wterm, {cols: wterm.cols, rows: wterm.rows, env})
  return {
    wterm,
    host,
    destroy() {
      wterm.destroy()
    },
  }
}

export type WtermScreenOptions = MountWtermOptions &
  Omit<Partial<ScreenOptions>, 'terminal' | 'exit'> & {
    /**
     * Called after the app exits (e.g. via `quitChar`) and the screen has
     * stopped. The wterm instance is left mounted; call `session.destroy()`
     * to remove it.
     */
    onExit?: () => void
  }

export interface WtermSession<T extends View = View> extends MountedWterm {
  screen: Screen
  rootView: T
}

/**
 * Mount wterm in `element` and start a TeaUI app inside it. Accepts a root
 * view, or a function that creates one (like `Screen.start`).
 *
 * @example
 * import '@wterm/dom/css'
 * import {Box, Text} from '@teaui/core'
 * import {startInWterm} from '@teaui/web'
 *
 * const session = await startInWterm(element, new Box({
 *   border: 'rounded',
 *   child: new Text({text: 'Hello from the browser'}),
 * }))
 * // later:
 * session.destroy()
 */
export async function startInWterm<T extends View>(
  element: HTMLElement,
  view: T | (() => T | Promise<T>),
  {wterm: wtermOptions, env, onExit, ...screenOptions}: WtermScreenOptions = {},
): Promise<WtermSession<T>> {
  const mounted = await mountWterm(element, {wterm: wtermOptions, env})
  try {
    const [screen, , rootView] = await Screen.start(
      typeof view === 'function' ? () => view() : view,
      {
        ...screenOptions,
        terminal: mounted.host.terminalOptions,
        exit: () => onExit?.(),
      },
    )
    return {
      ...mounted,
      screen,
      rootView,
      destroy() {
        screen.stop()
        mounted.destroy()
      },
    }
  } catch (error) {
    mounted.destroy()
    throw error
  }
}
