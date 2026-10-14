import {Canvas, Screen} from '@teaui/core'

// 24 columns × 8 rows = 48 × 32 pixels.
const canvas = new Canvas({
  width: 24,
  height: 8,
  draw: canvas => {
    const {pixelWidth: width, pixelHeight: height} = canvas
    canvas.rect(0, 0, width, height)
    canvas.line(0, height - 1, width - 1, 0)
    canvas.circle(
      Math.floor(width / 2),
      Math.floor(height / 2),
      Math.floor(height / 3),
    )
  },
})

await Screen.start(canvas)
