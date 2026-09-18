import {expect, it} from 'vitest'
import React from 'react'
import {Screen, TestProgram, Window} from '@teaui/core'
import {Stack, Text} from '../lib/components.js'
import {render} from '../lib/reconciler.js'

it('clips raw OSC 8 labels in a React text column without linking the adjacent column', async () => {
  const url =
    'file:///Users/colinta/hd/node_modules/.pnpm/@teaui+core@1.14.14/node_modules/@teaui/core'
  const open = `\x1b]8;;${url}\x1b\\`
  const close = '\x1b]8;;\x1b\\'
  const window = new Window()
  const program = new TestProgram({cols: 13, rows: 1})
  const screen = new Screen(program, window)
  screen.start()
  const unmount = render(
    screen,
    window,
    <Stack.right>
      <Text width={7}>{`${open}node_modules/.pnpm${close}`}</Text>
      <Text> | 123</Text>
    </Stack.right>,
  )
  try {
    await new Promise(resolve => setTimeout(resolve, 0))
    screen.render()
    expect(program.terminal.textContent()).toBe('node_mo | 123')
    expect(
      program.terminal.stylesMatch(0, 0, 7, style => style.link === url),
    ).toBe(true)
    expect(program.terminal.stylesMatch(7, 0, 6, style => !style.link)).toBe(
      true,
    )
    expect(screen.snapshot()).toContain(`${open}node_mo${close}`)
  } finally {
    unmount()
    screen.stop()
  }
})
