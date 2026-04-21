import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {Box, Stack, Text, Style} from '@teaui/core'
import {ImageView} from '@teaui/image'

import {demo} from './demo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IMAGE_PATH = path.resolve(__dirname, '../../assets/minime.png')

demo(
  Stack.down([
    new Text({
      text: ' Image Viewer Demo',
      style: new Style({bold: true}),
    }),
    [
      'flex1',
      new Box({
        border: 'rounded',
        flex: 1,
        child: new ImageView({
          source: IMAGE_PATH,
        }),
      }),
    ],
  ]),
)
