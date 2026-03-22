import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useReducer,
  type Reducer,
} from 'react'
import {interceptConsoleLog, type Border} from '@teaui/core'
import {
  Accordion,
  Box,
  Button,
  Checkbox,
  Collapsible,
  CollapsibleText,
  ConsoleLog,
  Digits,
  Drawer,
  Dropdown,
  FontStyle,
  type FontStyleValue,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Input,
  Progress,
  Scrollable,
  Separator,
  Slider,
  Logo,
  Spinner,
  Stack,
  ZStack,
  Style,
  Tabs,
  Text,
  run,
} from '@teaui/react'
import YAML from 'yaml'
import {BreadcrumbTab} from './breadcrumb.js'
import {CalendarTab} from './calendar.js'
import {LegendTab} from './legend.js'
import {YamlTab} from './yaml.js'
import {MoreTab} from './more.js'
import {DigitsTab} from './digits.js'
import {DrawerTab} from './drawer.js'
import {StylesTab} from './styles.js'
import {WidgetsTab} from './widgets.js'

// ── Main App ────────────────────────────────────────────────────────────────

function Demo() {
  return (
    <ZStack flex={1} location="top-right">
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
            <Tabs.Section title="More">
              <MoreTab />
            </Tabs.Section>
          </Tabs>
        </Stack.down>
      </Box>
      <Logo isAnimating />
    </ZStack>
  )
}

interceptConsoleLog()

run(<Demo />)
