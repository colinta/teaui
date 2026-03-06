import type {ReactNode} from 'react'
import type {View} from '@teaui/core'

export interface ScreenshotSpec {
  /** Terminal size to render at */
  size: {width: number; height: number}
  /** Factory function that creates the component to render */
  component: () => View
  /** Optional title for the terminal frame */
  title?: string
}

export interface ExampleSpec {
  /** Terminal size to render at */
  size: {width: number; height: number}
  /** React element to render */
  element: ReactNode
  /** Optional title for the terminal frame */
  title?: string
}
