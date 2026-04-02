import type {ReactNode} from 'react'
import {Window, Screen, HeadlessProgram} from '@teaui/core'
import {render} from '@teaui/react'

/**
 * Render a React element into a Window for headless screenshot rendering.
 * Triggers didMount on all views so TextContainer nodes are properly initialized.
 */
export function renderReact(
  element: ReactNode,
  {width, height}: {width: number; height: number},
): Window {
  const window = new Window()
  const program = new HeadlessProgram({cols: width, rows: height})
  const screen = new Screen(program, window)
  screen.start()
  render(screen, window, element)
  screen.stop()
  return window
}
