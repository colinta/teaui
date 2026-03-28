import React, {useEffect, useMemo, useState} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {Box, Space, Stack, Style, run} from '@teaui/react'

export function ColintaDemo() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const remaining = Math.max(0, 10 - (Date.now() - time.getTime()))
    const timer = setTimeout(() => setTime(new Date()), remaining)
    return () => {
      clearTimeout(timer)
    }
  })

  const [YY, MM, DD, hh, mm, ss, ms] = useMemo(() => {
    return [
      time.getFullYear(),
      time.getMonth() + 1,
      time.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      Math.floor(time.getMilliseconds() / 10),
    ]
  }, [time])

  const selected = 0
  const tools = [
    'Ashen // Swift',
    'TeaUI // TypeScript',
    'Mechy // C++',
    'Plywood // Python',
    'Sublime Text Plugins // Python',
    'Zenburn // SCSS',
    'StrangeCase // Python',
    'chomsky // Python',
    'punt // Python',
    'ssed // JavaScript',
  ]
    .map((item, index) => `[${index + 1}] ${item}`)
    .map((text, index) => (
      <Stack.right key={index} padding={{left: 1, right: 1}}>
        {selected === index ? (
          <Style foreground="black" background="white">
            {text}
          </Style>
        ) : (
          text
        )}
        <Space background={selected === index ? 'white' : undefined} flex={1} />
      </Stack.right>
    ))

  return (
    <Stack.down padding={{top: 1, left: 1, right: 1}} gap={1}>
      <Stack.right>
        Colin T.A. Gray
        <br />
        <Style foreground="gray">Creating tools for developers</Style>
        <Space flex={1} />
        DATE {pad(YY)}-{pad(MM)}-{pad(DD)} -- TIME {pad(hh)}:{pad(mm)}:{pad(ss)}
        .{pad(ms)}
      </Stack.right>
      <Space height={2} />
      <Stack.right flex={1} gap={1} padding={{right: 1, left: 1}}>
        <Stack.down flex={1}>
          {' '}
          ABOUT
          <Box border="double" flex={1}>
            <Box border="none" padding={1}>
              <Style bold foreground="white">
                Colin T.A. Gray
                <br />
                <br />
              </Style>
              <Style foreground="gray">
                Principle Developer of Mobile at Shopify. Enthusiastic open
                source coder. These days hardware hacking is floating my boat
                (see Mechy).
                <br />
                <br />
                This site is my personal playground, thoughts on programming and
                programming culture, summaries of some of the tools I've built.
                <br />
                <br />
                -- Statford, Ontario
              </Style>
            </Box>
          </Box>
        </Stack.down>
        <Stack.down flex={2}>
          {' '}
          TOOLS
          <Box border="double" flex={1}>
            <Stack.down gap={1} padding={{top: 1, bottom: 1}}>
              {tools}
            </Stack.down>
          </Box>
        </Stack.down>
        <Stack.down flex={1}>
          {' '}
          DESCRIPTION
          <Box border="double" flex={1}></Box>
        </Stack.down>
      </Stack.right>
      <Stack.right>
        <Space flex={1} />
        <Style foreground="#ffa735">[1..8]</Style> SELECT TOOL
        {'   '}
        <Style foreground="#d58684">[R]</Style> README
        {'   '}
        <Style foreground="#70be9b">[G]</Style> GITHUB
        {'   '}
        <Style foreground="#70a2d1">[B]</Style> BLOG
        <Space flex={1} />
      </Stack.right>
      Copyright (c) 2012-2024, Colin T.A. Gray All rights reserved.
    </Stack.down>
  )
}

function pad(n: number) {
  if (n < 10) {
    return '0' + n.toString(10)
  }
  return n.toString(10)
}

interceptConsoleLog()

if (import.meta.url === `file://${process.argv[1]}`) {
  run(<ColintaDemo />)
}
