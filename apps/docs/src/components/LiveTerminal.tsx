import React, {useEffect, useRef, useState, type ReactNode} from 'react'
import '@wterm/dom/css'
import '../css/live-terminal.css'
import {loadLiveExample} from '../live/registry'

interface Props {
  /** Example name (matches the .example.tsx filename) */
  name: string
  /** Grid size; defaults to the example's width/height. Ignored with `fill`. */
  cols?: number
  rows?: number
  /** Size the terminal to fill its container (and follow resizes). */
  fill?: boolean
  autoFocus?: boolean
  /**
   * Shown until the live terminal is ready, and kept if it fails to start
   * (e.g. the static screenshot).
   */
  placeholder?: ReactNode
}

type Status =
  | {type: 'loading'}
  | {type: 'running'}
  | {type: 'error'; message: string}

interface Session {
  destroy(): void
  wterm: {focus(): void}
}

/**
 * Runs a docs example live: a real TeaUI screen rendering into a wterm
 * terminal emulator, entirely in the browser. Client-only; wterm and TeaUI
 * load on mount.
 */
export default function LiveTerminal({
  name,
  cols,
  rows,
  fill = false,
  autoFocus = false,
  placeholder,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>({type: 'loading'})

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    // wterm owns this element; it's recreated for every run.
    const element = document.createElement('div')
    element.setAttribute('aria-label', `${name} example (live)`)
    container.appendChild(element)

    let cancelled = false
    let session: Session | undefined
    setStatus({type: 'loading'})

    start()
      .then(started => {
        if (cancelled) {
          started.destroy()
          return
        }
        session = started
        setStatus({type: 'running'})
        if (autoFocus) {
          started.wterm.focus()
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error(`[LiveTerminal] ${name} failed to start`, error)
          setStatus({type: 'error', message: errorMessage(error)})
        }
      })

    async function start(): Promise<Session> {
      const [{runInWterm}, spec] = await Promise.all([
        import('@teaui/web/react'),
        loadLiveExample(name),
        // wterm measures glyphs during init.
        document.fonts?.ready,
      ])
      const {App} = spec
      return runInWterm(element, <App />, {
        wterm: fill
          ? {autoResize: true}
          : {
              cols: cols ?? spec.width,
              rows: rows ?? spec.height,
              autoResize: false,
            },
        // Nothing to exit to; the page controls the lifetime.
        quitChar: false,
      })
    }

    return () => {
      cancelled = true
      session?.destroy()
      element.remove()
    }
  }, [name, cols, rows, fill, autoFocus])

  const showPlaceholder = placeholder !== undefined && status.type !== 'running'
  const className = [
    'live-terminal',
    fill && 'live-terminal--fill',
    showPlaceholder && 'live-terminal--placeholder',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      onClick={() => focusTerminal(containerRef.current)}
    >
      {/* Stays laid out (but hidden) under a placeholder so wterm can measure
          glyphs during init. */}
      <div className="live-terminal__screen" ref={containerRef} />
      {showPlaceholder ? (
        placeholder
      ) : (
        <>
          {status.type === 'loading' && (
            <div className="live-terminal__status">Loading…</div>
          )}
          {status.type === 'error' && (
            <div className="live-terminal__status live-terminal__status--error">
              {status.message}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function focusTerminal(container: HTMLElement | null) {
  container?.querySelector<HTMLElement>('textarea')?.focus()
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
