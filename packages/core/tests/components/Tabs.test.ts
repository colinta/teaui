import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Tabs} from '../../lib/components/Tabs.js'
import {Text} from '../../lib/components/Text.js'

function makeTabs() {
  return Tabs.create(
    [
      ['Info', new Text({text: 'Information panel'})],
      ['Settings', new Text({text: 'Settings panel'})],
      ['Help', new Text({text: 'Help panel'})],
    ],
    {border: true},
  )
}

describe('Tabs', () => {
  it('renders first tab selected with border', () => {
    const tabs = makeTabs()
    const t = testRender(tabs, {width: 35, height: 5})
    expect(t.terminal.textContent()).toBe(
      [
        '   Info  Settings  Help',
        '┌╴━━━━━━╶───────────────╶─────────┐',
        '│Information panel                │',
        '│                                 │',
        '└─────────────────────────────────┘',
      ].join('\n'),
    )
  })

  it('renders without border', () => {
    const tabs = Tabs.create(
      [
        ['Tab A', new Text({text: 'Content A'})],
        ['Tab B', new Text({text: 'Content B'})],
      ],
      {border: false},
    )
    const t = testRender(tabs, {width: 20, height: 3})
    expect(t.terminal.textContent()).toBe(
      [' Tab A  Tab B', '━━━━━━━╶──────', 'Content A'].join('\n'),
    )
  })

  it('animates separator when selecting another tab', () => {
    const tabs = makeTabs()
    const t = testRender(tabs, {width: 35, height: 5})
    expect(t.terminal.textContent()).toBe(
      [
        '   Info  Settings  Help',
        '┌╴━━━━━━╶───────────────╶─────────┐',
        '│Information panel                │',
        '│                                 │',
        '└─────────────────────────────────┘',
      ].join('\n'),
    )

    // Click on "Settings" tab title (y=0, x somewhere in "Settings")
    // Tab titles start at x=2 (border offset): Info [2,8), Settings [8,18)
    t.sendMouse('mouse.button.down', {x: 10, y: 0})
    t.sendMouse('mouse.button.up', {x: 10, y: 0})

    // After one animation frame (40ms, dx=2), separator should be partway
    // between Info [0,6] and Settings [6,16] — content switches immediately
    t.tick(40)
    expect(t.terminal.textContent()).toBe(
      [
        '   Info  Settings  Help',
        '┌╴─╴━━━━━━╶─────────────╶─────────┐',
        '│Settings panel                   │',
        '│                                 │',
        '└─────────────────────────────────┘',
      ].join('\n'),
    )

    // After 5 seconds the animation should be fully settled on "Settings"
    t.tick(5000)
    expect(t.terminal.textContent()).toBe(
      [
        '   Info  Settings  Help',
        '┌╴─────╴━━━━━━━━━━╶─────╶─────────┐',
        '│Settings panel                   │',
        '│                                 │',
        '└─────────────────────────────────┘',
      ].join('\n'),
    )
  })
})
