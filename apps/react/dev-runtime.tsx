import {interceptConsoleLog, Screen, Root} from '@teaui/core'
import type React from 'react'

type RenderFn = (
  screen: Screen,
  root: Root,
  element: React.ReactNode,
) => () => void

export interface HotReloadRuntime {
  screen: Screen
  root: Root
  remount(render: RenderFn, element: React.ReactNode): void
  dispose(): void
}

export async function createHotReloadRuntime(): Promise<HotReloadRuntime> {
  interceptConsoleLog()

  const root = new Root()
  const [screen] = await Screen.start(root)

  let unmount = () => {}

  return {
    screen,
    root,

    remount(render: RenderFn, element: React.ReactNode) {
      unmount()
      root.removeAllChildren()
      unmount = render(screen, root, element)
    },

    dispose() {
      unmount()
      screen.stop()
    },
  }
}
