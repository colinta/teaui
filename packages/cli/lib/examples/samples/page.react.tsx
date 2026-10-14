import React, {createRef} from 'react'
import type {Page as PageView} from '@teaui/core'
import {Page, Stack, Text, run} from '@teaui/react'

const titled = createRef<PageView>()

const [screen] = await run(
  <Stack.down width={36} height={11} gap={1}>
    {/* Page forwards refs at runtime; its public props omit ref. */}
    <Page {...{ref: titled}} width={36} height={6}>
      <Page.Section title="Overview">
        <Text>Overview content (inactive)</Text>
      </Page.Section>
      <Page.Section>
        <Text heading="Details">
          {
            'Title falls back to child heading\nPageUp / PageDown changes section\nHome / End jumps to an edge'
          }
        </Text>
      </Page.Section>
      <Page.Section title="">
        <Text heading="Hidden title">Help content (inactive)</Text>
      </Page.Section>
    </Page>
    <Page width={36} height={4}>
      <Text>Untitled pages: dots without a title</Text>
      <Text>Second untitled page (inactive)</Text>
    </Page>
  </Stack.down>,
)

// Navigate after sections are attached; settle the slide without timers.
if (titled.current) {
  titled.current.activeIndex = 1
  titled.current.receiveTick(1000)
}
screen.render()
