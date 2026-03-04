import {inspect, Collapsible, Text} from '@teaui/core'

import {demo} from './demo.js'

const OBJ = {
  word: 'something',
  tags: ['tag1', 'tag2', 'tag3', 'tag4'],
  sentences: {
    short: 'this is a short sentence.',
    medium: 'this is another sentence, slightly longer.',
    long: 'finally, a long sentence, one that goes on a little too long, it could be argued.',
  },
}

demo(
  new Collapsible({
    isCollapsed: false,
    collapsed: new Text({text: inspect(OBJ, false)}),
    expanded: new Text({text: inspect(OBJ, true)}),
  }),
)
