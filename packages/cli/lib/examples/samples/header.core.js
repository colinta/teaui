import {H1, H2, H3, H4, H5, H6, Header, Screen, Stack} from '@teaui/core'

// H1–H6 are functions taking only a text string.
const headings = Stack.down({
  width: 48,
  height: 19,
  gap: 1,
  children: [
    H1('H1: Double / bold'),
    H2('H2: Heavy / bold'),
    H3('H3: Single / bold'),
    H4('H4: Single / normal'),
    H5('H5: Single / dim'),
    H6('H6: No border / dim'),
    // Header supports custom border, font, and emphasis options.
    new Header({
      text: 'Custom font',
      border: 'double',
      font: 'double-struck',
      bold: false,
      dim: true,
    }),
  ],
})

await Screen.start(headings)
