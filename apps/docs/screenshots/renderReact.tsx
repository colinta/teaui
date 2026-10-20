import type {ReactNode} from 'react'
import {Root, Screen, HeadlessProgram} from '@teaui/core'
import {render} from '@teaui/react'

/**
 * Render a React element into a Root for headless screenshot rendering.
 * Triggers didMount on all views so TextContainer nodes are properly initialized.
 */
export function renderReact(
  element: ReactNode,
  {width, height}: {width: number; height: number},
): Root {
  const root = new Root()
  const program = new HeadlessProgram({cols: width, rows: height})
  const screen = new Screen(program, root)
  screen.start()
  render(screen, root, element)
  screen.stop()
  return root
}
