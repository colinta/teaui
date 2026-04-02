import type {SGRTerminal} from './terminal.js'
import type {SystemEvent} from './events/index.js'

export type Alignment = 'left' | 'right' | 'center'
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

// --- Program interface: abstract terminal program for Screen ---

/**
 * The abstract interface that Screen depends on. Any terminal backend
 * (real terminal, test harness, web adapter, etc.) can implement this.
 */
export interface Program extends SGRTerminal {
  /**
   * Prepare the terminal for fullscreen app mode (e.g. enter alt buffer,
   * enable mouse, hide cursor). Called once before the first render.
   */
  setup(): void

  /**
   * Restore the terminal to its original state (e.g. exit alt buffer,
   * show cursor). Called when the screen stops.
   */
  teardown(): void

  /**
   * Subscribe to system events (key, mouse, paste, focus/blur).
   * Returns an unsubscribe function.
   */
  onEvents(listener: (event: SystemEvent) => void): () => void

  /**
   * Subscribe to terminal resize events.
   * Returns an unsubscribe function.
   */
  onResize(listener: () => void): () => void
}
