import type {View} from './View.js'
import {Screen} from './Screen.js'
import {HeadlessProgram} from './HeadlessProgram.js'

/**
 * Render a View to an ANSI string at the given size, without needing a real terminal.
 *
 * @param view - The View (or Container) to render
 * @param size - The terminal size to render at {width, height}
 * @returns A string containing ANSI escape codes representing the rendered output
 */
export function renderToAnsi(
  view: View,
  size: {width: number; height: number},
): string {
  const program = new HeadlessProgram({cols: size.width, rows: size.height})
  const screen = new Screen(program, view)
  screen.start()
  screen.stop()

  return program.terminal.output
}
