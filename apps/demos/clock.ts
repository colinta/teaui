import {Digits, Stack, Text, Style, Box} from '@teaui/core'
import type {Viewport} from '@teaui/core'

import {demo} from './demo.js'

function pad(n: number, len: number): string {
  return String(n).padStart(len, '0')
}

function formatClock(now: Date): string {
  const date = `${now.getFullYear()}/${pad(now.getMonth() + 1, 2)}/${pad(now.getDate(), 2)}`
  const time = `${pad(now.getHours(), 2)}:${pad(now.getMinutes(), 2)}:${pad(now.getSeconds(), 2)}.${pad(now.getMilliseconds(), 3)}`
  return `${date}\n${time}`
}

class Clock extends Digits {
  constructor() {
    super({text: formatClock(new Date())})
  }

  receiveTick(_dt: number): boolean {
    this.text = formatClock(new Date())
    return true
  }

  render(viewport: Viewport) {
    viewport.registerTick()
    super.render(viewport)
  }
}

const clock = new Clock()

const label = new Text({
  text: '',
  style: new Style({foreground: 'white'}),
})
label.text = 'Press ⌃q to quit'

demo(
  Stack.down({
    children: [
      new Box({
        border: 'rounded',
        child: clock,
        width: 'natural',
      }),
      label,
    ],
  }),
  false,
)
