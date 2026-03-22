import React, {useState} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {
  Box,
  FontStyle,
  type FontStyleValue,
  Input,
  Separator,
  Stack,
  Style,
  Text,
  run,
} from '@teaui/react'

export function StylesTab() {
  const [fontStyle, setFontStyle] = useState<FontStyleValue>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  })
  const [sampleText, setSampleText] = useState(
    'The quick brown fox jumps over the lazy dog.',
  )

  return (
    <Stack.down gap={1} flex={1}>
      <Text>
        <Style bold foreground="cyan">
          Text Styles
        </Style>{' '}
        — Toggle bold, italic, underline, strikethrough
      </Text>
      <Stack.right gap={2}>
        <FontStyle value={fontStyle} onChange={setFontStyle} />
        <Input flex={1} value={sampleText} onChange={setSampleText} />
      </Stack.right>
      <Separator.horizontal />
      <Box border="rounded" height={5}>
        <Text wrap>
          <Style
            bold={fontStyle.bold}
            italic={fontStyle.italic}
            underline={fontStyle.underline}
            strikeout={fontStyle.strikethrough}
          >
            {sampleText}
          </Style>
        </Text>
      </Box>
      <Text>
        <Style foreground="white">Preview with all combinations:</Style>
      </Text>
      <Stack.down>
        <Text>
          <Style bold>Bold: {sampleText}</Style>
        </Text>
        <Text>
          <Style italic>Italic: {sampleText}</Style>
        </Text>
        <Text>
          <Style underline>Underline: {sampleText}</Style>
        </Text>
        <Text>
          <Style strikeout>Strikethrough: {sampleText}</Style>
        </Text>
        <Text>
          <Style bold italic underline>
            All three: {sampleText}
          </Style>
        </Text>
      </Stack.down>
    </Stack.down>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<StylesTab />)
}
