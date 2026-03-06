import type {ReactNode} from 'react'
import {Window, createHeadlessScreen} from '@teaui/core'
import {render} from '@teaui/react'

/**
 * Render a React element into a Window for headless screenshot rendering.
 * Triggers didMount on all views so TextContainer nodes are properly initialized.
 */
export function renderReact(element: ReactNode): Window {
  const window = new Window()
  const screen = createHeadlessScreen()
  render(screen, window, element)
  window.moveToScreen(screen)
  return window
}
