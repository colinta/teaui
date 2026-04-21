import React from 'react'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {interceptConsoleLog} from '@teaui/core'
import {Box, Stack, Style, Text, run} from '@teaui/react'
import {Image} from '@teaui/image/react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IMAGE_PATH = path.resolve(__dirname, '../../assets/minime.png')

export function ImageTab() {
  return (
    <Stack.down gap={1} flex={1}>
      <Text>
        <Style bold foreground="cyan">
          Image Viewer
        </Style>
        {' — Renders images in the terminal using half-block characters'}
      </Text>
      <Box border="rounded" flex={1}>
        <Image source={IMAGE_PATH} flex={1} />
      </Box>
    </Stack.down>
  )
}

// ── Standalone ───────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<ImageTab />)
}
