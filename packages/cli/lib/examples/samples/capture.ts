import {existsSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

import {
  HeadlessProgram,
  Screen,
  Window,
  type ScreenOptions,
  type View,
} from '@teaui/core'

let importSequence = 0

interface Capture {
  program: HeadlessProgram
  screen: Screen
}

export async function captureExample(
  moduleUrl: URL,
  size: {width: number; height: number},
): Promise<string> {
  const originalStart = Screen.start
  let capture: Capture | undefined

  const start = async (view: View = new Window(), _options?: ScreenOptions) => {
    const program = new HeadlessProgram({cols: size.width, rows: size.height})
    const screen = new Screen(program, view, {isFocused: false})
    screen.start()
    capture = {program, screen}
    return [screen, program, view]
  }

  Screen.start = start as unknown as typeof Screen.start
  try {
    const url = executableModuleUrl(moduleUrl)
    url.searchParams.set('capture', String(importSequence++))
    await import(url.href)

    if (!capture) {
      throw new Error(`Example did not start a TeaUI screen: ${moduleUrl.href}`)
    }
    return capture.program.terminal.output
  } finally {
    Screen.start = originalStart
    capture?.screen.stop()
  }
}

function executableModuleUrl(sourceUrl: URL): URL {
  const url = new URL(sourceUrl)
  if (!url.pathname.endsWith('.tsx')) {
    return url
  }

  const javascriptUrl = new URL(url)
  javascriptUrl.pathname = `${javascriptUrl.pathname.slice(0, -4)}.js`
  return existsSync(fileURLToPath(javascriptUrl)) ? javascriptUrl : url
}
