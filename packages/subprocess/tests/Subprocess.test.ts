import {describe, it, expect, afterEach} from 'vitest'
import {testRender} from '@teaui/core'
import {Subprocess} from '../lib/Subprocess.js'

// These tests spawn real processes in a PTY (node-pty).

const WIDTH = 30
const HEIGHT = 5

let cleanup: (() => void) | undefined
afterEach(() => {
  cleanup?.()
  cleanup = undefined
})

function sh(script: string) {
  let resolveExit: () => void
  const exited = new Promise<void>(resolve => {
    resolveExit = resolve
  })
  const subprocess = new Subprocess({
    command: '/bin/sh',
    args: ['-c', script],
    // keep the user's shell config out of the test
    env: {PS1: '', ENV: '', BASH_ENV: ''},
    onExit: () => resolveExit(),
  })
  const t = testRender(subprocess, {width: WIDTH, height: HEIGHT})
  cleanup = () => t.view.moveToScreen(undefined)
  return {t, subprocess, exited}
}

async function waitFor(predicate: () => boolean, timeout = 3000) {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeout) {
      throw new Error('timed out')
    }
    await new Promise(resolve => setTimeout(resolve, 20))
  }
}

describe('Subprocess', () => {
  it('renders the bottom of the buffer once output scrolls', async () => {
    const {t, exited} = sh('seq 1 50')
    await exited
    // xterm parses output asynchronously, possibly after the child has exited
    await waitFor(() => {
      t.render()
      return t.terminal.textContent().includes('50')
    })

    const lines = t.terminal.textContent().split('\n')
    // The last row is covered by the "[Process exited…]" overlay
    expect(lines.slice(0, HEIGHT - 1)).toEqual(['47', '48', '49', '50'])
  })

  it('draws the cursor when focused', async () => {
    const {t, subprocess} = sh("printf 'ab'; sleep 5")
    // the only focusable view, so it takes focus on the first render
    await waitFor(() => {
      t.render()
      return t.terminal.textContent().includes('ab')
    })

    expect(subprocess.hasFocus).toBe(true)
    // the cursor sits on the blank cell after 'ab'
    expect(t.terminal.styleAt(0, 0).inverse).toBeFalsy()
    expect(t.terminal.styleAt(2, 0).inverse).toBe(true)
  })
})
