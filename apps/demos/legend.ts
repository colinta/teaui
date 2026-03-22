import {Legend, Stack, Text, Separator, Box} from '@teaui/core'

import {demo} from './demo.js'

demo(
  new Box({
    border: 'none',
    padding: 1,
    child: Stack.down({
      children: [
        new Text({text: 'Legend — Inline (default separator)'}),

        new Legend({
          items: [
            {key: ['up', 'down'], label: 'navigate'},
            {key: 'enter', label: 'select'},
            {key: 'q', label: 'quit'},
            {key: '?', label: 'help'},
            {key: 'escape', label: 'cancel'},
          ],
        }),

        Separator.horizontal(),
        new Text({text: 'Legend — With bullet separator'}),

        new Legend({
          items: [
            {key: ['up', 'down'], label: 'navigate'},
            {key: 'enter', label: 'select'},
            {key: 'q', label: 'quit'},
            {key: '?', label: 'more'},
          ],
          separator: ' • ',
        }),

        Separator.horizontal(),
        new Text({text: 'Legend — Modifier keys'}),

        new Legend({
          items: [
            {key: ['cmd', 'S'], label: 'save'},
            {key: ['ctrl', 'C'], label: 'quit'},
            {key: 'Ctrl+Z', label: 'undo'},
            {key: 'tab', label: 'switch'},
            {key: 'space', label: 'toggle'},
          ],
        }),
      ],
    }),
  }),
)
