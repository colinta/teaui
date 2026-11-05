import type {ReactNode} from 'react'
import {Root} from '@teaui/core'
import {render} from '@teaui/react'
import {
  startInWterm,
  type WtermScreenOptions,
  type WtermSession,
} from './wterm.js'

export interface WtermReactSession extends WtermSession<Root> {
  /** Unmount the React tree (the screen keeps running). */
  unmount: () => void
}

/**
 * Mount wterm in `element` and render a TeaUI React app inside it. The
 * browser equivalent of `run()` from `@teaui/react`.
 *
 * @example
 * import '@wterm/dom/css'
 * import {runInWterm} from '@teaui/web/react'
 *
 * const session = await runInWterm(element, <App />)
 * // later:
 * session.destroy()
 */
export async function runInWterm(
  element: HTMLElement,
  component: ReactNode,
  options?: WtermScreenOptions,
): Promise<WtermReactSession> {
  const session = await startInWterm(element, new Root(), options)
  const unmount = render(session.screen, session.rootView, component)
  return {
    ...session,
    unmount,
    destroy() {
      unmount()
      session.destroy()
    },
  }
}
