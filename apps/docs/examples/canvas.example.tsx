import React from 'react'
import {Canvas} from '@teaui/react'

function App() {
  return (
    <Canvas
      draw={canvas => {
        const w = canvas.pixelWidth
        const h = canvas.pixelHeight

        // Border
        canvas.rect(0, 0, w, h)

        // Diagonals
        canvas.line(0, 0, w - 1, h - 1)
        canvas.line(w - 1, 0, 0, h - 1)

        // Center circle
        const r = Math.min(w, h) / 4
        canvas.circle(~~(w / 2), ~~(h / 2), ~~r)
      }}
    />
  )
}

export default {width: 30, height: 8, title: 'Canvas', App}
