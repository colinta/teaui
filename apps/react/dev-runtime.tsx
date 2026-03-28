import {interceptConsoleLog, Screen, Window} from '@teaui/core'
import type React from 'react'

type RenderFn = (
  screen: Screen,
  window: Window,
  element: React.ReactNode,
) => () => void

export interface HotReloadRuntime {
  screen: Screen
  window: Window
  remount(render: RenderFn, element: React.ReactNode): void
  dispose(): void
}

export async function createHotReloadRuntime(): Promise<HotReloadRuntime> {
  interceptConsoleLog()

  const window = new Window()
  const [screen] = await Screen.start(window)

  let unmount = () => {}

  return {
    screen,
    window,

    remount(render: RenderFn, element: React.ReactNode) {
      unmount()
      window.removeAllChildren()
      unmount = render(screen, window, element)
    },

    dispose() {
      unmount()
      screen.stop()
    },
  }
}
