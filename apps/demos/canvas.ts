import {Canvas, Stack, Text} from '@teaui/core'

import {demo} from './demo.js'

const canvas = new Canvas({
  width: 'fill',
  height: 'fill',
  draw(canvas) {
    const w = canvas.pixelWidth
    const h = canvas.pixelHeight

    // Lines from the origin
    canvas.line(0, 0, w - 1, h - 1) // diagonal
    canvas.line(0, 0, w - 1, 0) // horizontal top
    canvas.line(0, 0, 0, h - 1) // vertical left

    // Rectangle outline
    canvas.rect(10, 10, 30, 20)

    // Filled rectangle
    canvas.fillRect(w - 20, 5, 10, 8)

    // Circle outline
    canvas.circle(Math.floor(w * 0.35), Math.floor(h * 0.65), Math.floor(h * 0.15))

    // Filled circle
    canvas.fillCircle(Math.floor(w * 0.7), Math.floor(h * 0.5), Math.floor(h * 0.2))
  },
})

demo(
  Stack.down({
    children: [
      new Text({text: 'Canvas Demo — Braille Drawing'}),
      canvas,
    ],
  }),
)
