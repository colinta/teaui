import {Box, Page, Style, Text, Stack, Space} from '@teaui/core'

import {demo} from './demo.js'

const page = Page.create([
  [
    'Welcome',
    new Box({
      border: 'none',
      child: Stack.down([
        new Text({
          text: 'Welcome to TeaUI Pages',
          style: new Style({bold: true}),
        }),
        new Space({height: 1}),
        new Text({
          text: 'Use PageUp/PageDown, Home/End to navigate between pages.\nScroll the mouse wheel to switch pages (threshold: 5 ticks).\nClick the dots below to jump to a page.',
          wrap: true,
        }),
      ]),
    }),
  ],
  [
    'Features',
    new Box({
      border: 'none',
      child: Stack.down([
        new Text({text: 'Features', style: new Style({bold: true})}),
        new Space({height: 1}),
        new Text({
          text: '• Animated slide transitions\n• Dot indicators with hover\n• Keyboard and mouse navigation\n• Title display per section',
          wrap: true,
        }),
      ]),
    }),
  ],
  [
    'Settings',
    new Box({
      border: 'none',
      child: Stack.down([
        new Text({text: 'Settings', style: new Style({bold: true})}),
        new Space({height: 1}),
        new Text({text: 'Nothing to configure here. Just enjoy the ride!'}),
      ]),
    }),
  ],
  [
    'Help',
    new Box({
      border: 'none',
      child: Stack.down([
        new Text({text: 'Help', style: new Style({bold: true})}),
        new Space({height: 1}),
        new Text({
          text: 'PageDown / PageUp — next / previous page\nHome / End — first / last page\nMouse wheel — scroll between pages\nClick dots — jump to page',
          wrap: true,
        }),
      ]),
    }),
  ],
])

demo(page)
