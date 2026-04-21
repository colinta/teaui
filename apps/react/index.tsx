import React from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {Box, Logo, At, Stack, ZStack, Tabs, run, AutoLegend} from '@teaui/react'
import {BreadcrumbTab} from './breadcrumb.js'
import {CalendarTab} from './calendar.js'
import {LegendTab} from './legend.js'
import {YamlTab} from './yaml.js'
import {MoreTab} from './more.js'
import {DigitsTab} from './digits.js'
import {DrawerTab} from './drawer.js'
import {StylesTab} from './styles.js'
import {ListTab} from './scrollable-list.js'
import {WidgetsTab} from './widgets.js'
import {AtTab} from './at.js'
import {CodeTab} from './code.js'

// ── Main App ────────────────────────────────────────────────────────────────

function Demo() {
  return (
    <ZStack flex={1}>
      <Box border="rounded" flex={1}>
        <Stack.down flex={1}>
          <Tabs border flex={1}>
            <Tabs.Section title="YAML → JSON">
              <YamlTab />
            </Tabs.Section>
            <Tabs.Section title="Digits">
              <DigitsTab />
            </Tabs.Section>
            <Tabs.Section title="Styles">
              <StylesTab />
            </Tabs.Section>
            <Tabs.Section title="At">
              <AtTab />
            </Tabs.Section>
            <Tabs.Section title="Widgets">
              <WidgetsTab />
            </Tabs.Section>
            <Tabs.Section title="Drawer">
              <DrawerTab />
            </Tabs.Section>
            <Tabs.Section title="Breadcrumbs">
              <BreadcrumbTab />
            </Tabs.Section>
            <Tabs.Section title="Calendar">
              <CalendarTab />
            </Tabs.Section>
            <Tabs.Section title="Legend">
              <LegendTab />
            </Tabs.Section>
            <Tabs.Section title="List">
              <ListTab />
            </Tabs.Section>
            <Tabs.Section title="Code">
              <CodeTab />
            </Tabs.Section>
            <Tabs.Section title="More">
              <MoreTab />
            </Tabs.Section>
          </Tabs>
          <AutoLegend />
        </Stack.down>
      </Box>
      <At location="top-right">
        <Logo isAnimating />
      </At>
    </ZStack>
  )
}

interceptConsoleLog()

if (import.meta.url === `file://${process.argv[1]}`) {
  run(<Demo />)
}
