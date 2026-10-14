import {setTimeout as delay} from 'node:timers/promises'
import React from 'react'
import {run} from '@teaui/react'
import {Image} from '@teaui/image/react'

const WIDTH = 16
const HEIGHT = 6
const HALF_BLOCK = '▀'
const LOAD_ATTEMPTS = 500
const POLL_INTERVAL = 10

// Encoded SVG bytes: 12 × 8 pixels become 12 columns × 4 terminal rows.
// Uneven color boundaries demonstrate different top and bottom pixel colors.
const SOURCE =
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8">
  <rect width="6" height="3" fill="#e04040"/>
  <rect y="3" width="6" height="5" fill="#4070e0"/>
  <rect x="6" width="6" height="5" fill="#40c080"/>
  <rect x="6" y="5" width="6" height="3" fill="#e0b040"/>
</svg>`)

const [screen] = await run(
  <Image source={SOURCE} fit="contain" width={WIDTH} height={HEIGHT} />,
)

// Image has no ready callback. Wait for actual decoded pixels, not a fixed delay.
for (let attempt = 0; attempt < LOAD_ATTEMPTS; attempt++) {
  screen.render()
  if (screen.snapshot().includes(HALF_BLOCK)) {
    break
  }
  await delay(POLL_INTERVAL)
}

screen.render()
if (!screen.snapshot().includes(HALF_BLOCK)) {
  screen.stop()
  throw new Error('Image did not finish loading')
}
