import {Geometry, Screen, Text} from '@teaui/core'

const items = ['Tea', 'Coffee', 'Cocoa', 'Water', 'Juice', 'Milk']
const content = new Text()
const geometry = new Geometry({
  padding: 1,
  onLayout: size => {
    // Reserve the first content row for the measurement.
    const visible = items.slice(0, Math.max(0, size.height - 1))
    content.text = [
      `Content: ${size.width}×${size.height}`,
      ...visible.map((item, index) => `${index + 1}. ${item}`),
    ].join('\n')
  },
  child: content,
})

await Screen.start(geometry)
