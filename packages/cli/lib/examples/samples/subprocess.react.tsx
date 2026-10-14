import {setTimeout as delay} from 'node:timers/promises'
import React from 'react'
import {run} from '@teaui/react'
import {Subprocess} from '@teaui/subprocess/react'

const WIDTH = 40
const HEIGHT = 6
const OUTPUT_MARKER = 'one command, no shell'
const EXIT_MESSAGE = '[Process exited with code 0]'
const MAX_ATTEMPTS = 300
const POLL_INTERVAL = 10

// Node exits naturally after writing; no shell, interactive input, or network.
const CHILD_SCRIPT = `
process.stdout.write(
  '\\x1b[1;32mSubprocess in a PTY\\x1b[0m\\r\\n' +
  'message: ' + process.env.TEAUI_EXAMPLE_MESSAGE + '\\r\\n' +
  'one command, no shell\\r\\n'
)
`

let received = ''
let exitCode: number | undefined

const [screen, , , unmount] = await run(
  <Subprocess
    command={process.execPath}
    args={['--eval', CHILD_SCRIPT]}
    env={{TEAUI_EXAMPLE_MESSAGE: 'hello from child'}}
    width={WIDTH}
    height={HEIGHT}
    onData={data => {
      received += data
    }}
    onExit={code => {
      exitCode = code
    }}
  />,
)

try {
  let complete = false
  // The public JSX wrapper has no ref; wait for callbacks AND parsed output.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    screen.render()
    const output = screen.snapshot()
    if (output.includes('Error:')) {
      throw new Error(output)
    }
    if (exitCode !== undefined && exitCode !== 0) {
      throw new Error(`Child exited with code ${exitCode}`)
    }
    if (
      exitCode === 0 &&
      received.includes(OUTPUT_MARKER) &&
      output.includes(OUTPUT_MARKER) &&
      output.includes(EXIT_MESSAGE)
    ) {
      complete = true
      break
    }
    await delay(POLL_INTERVAL)
  }
  if (!complete) {
    throw new Error('Subprocess did not finish rendering before the deadline')
  }
} finally {
  // Stop first to preserve the final frame, then release the React tree.
  screen.stop()
  unmount()
}
