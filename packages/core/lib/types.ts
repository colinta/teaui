import type {TerminalOptions} from '@teaui/term'
import type {SGRTerminal} from './terminal.js'
import type {SystemEvent} from './events/index.js'

export type TextAlignment = 'left' | 'right' | 'center'
export const FontFamilies = [
  'default',
  'serif-bold',
  'serif-italic',
  'serif-italic-bold',
  'sans',
  'sans-bold',
  'sans-italic',
  'sans-italic-bold',
  'monospace',
  'double-struck',
  'fraktur',
  'fraktur-bold',
  'script',
  'script-bold',
] as const
export type FontFamily = (typeof FontFamilies)[number]

export type Font = Map<string, string>
export type Orientation = 'horizontal' | 'vertical'
export type Direction = 'right' | 'left' | 'down' | 'up'

export interface Edges {
  top: number
  right: number
  bottom: number
  left: number
}

export interface LegendItem {
  key: string | string[]
  label: string
}

export type ScreenDisplay =
  | {mode: 'fullscreen'}
  | {
      mode: 'inline'
      /** `'natural'` sizes the region to the root view's natural height. */
      height: number | 'natural'
      clearOnExit?: boolean
    }

export interface ScreenOptions {
  quitChar?: 'C-c' | 'C-q' | '' | undefined | false
  emoji?: boolean
  /** Defaults to fullscreen. Inline displays clear their reserved rows on exit by default. */
  display?: ScreenDisplay
  /**
   * Streams and environment for the terminal. Defaults to `process.stdout`,
   * `process.stdin`, and `process.env`. Provide these to run outside a Node
   * TTY, e.g. inside a browser terminal emulator.
   */
  terminal?: Pick<TerminalOptions, 'stdout' | 'stdin' | 'env'>
  /**
   * Called by `screen.exit()` after the screen stops. Defaults to exiting the
   * Node process once stdout drains.
   */
  exit?: () => void
}

export type Unsubscribe = () => void

/** The input side of a Program, independent of rendering or transport lifecycle. */
export interface EventSource {
  /** Subscribe to system events. Returns a function that detaches this listener. */
  onEvents(listener: (event: SystemEvent) => void): Unsubscribe
}

/**
 * The abstract interface that Screen depends on. Any terminal backend
 * (real terminal, test harness, web adapter, etc.) can implement this.
 */
export interface Program extends SGRTerminal, EventSource {
  /**
   * Prepare the terminal for application mode (e.g. configure the display,
   * enable mouse, hide cursor). Called once before the first render.
   */
  setup(): void | Promise<void>

  /**
   * Restore the terminal to its original state (e.g. exit alt buffer,
   * show cursor). Called when the screen stops.
   */
  teardown(): void

  /**
   * Returns whether the terminal is currently updating its region (e.g. resizing).
   */
  get isUpdatingRegion(): boolean

  /**
   * Refresh the terminal height. Returns whether the height changed.
   */
  refreshHeight(): Promise<boolean>

  /**
   * Subscribe to terminal resize events.
   * Returns an unsubscribe function.
   */
  onResize(listener: () => void): () => void
}
