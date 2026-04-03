import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
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
    expect(t.terminal.textContent()).toMatchSnapshot()
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
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('selects a tab programmatically', () => {
    const tabs = makeTabs()
    const t = testRender(tabs, {width: 35, height: 5})

    tabs.select(2)
    t.render()

    expect(tabs.selected).toBe(2)
    expect(t.terminal.textContent()).toContain('Help panel')
    expect(t.terminal.textContent()).not.toContain('Information panel')
  })

  it('updates selected tab from props', () => {
    const tabs = makeTabs()
    const t = testRender(tabs, {width: 35, height: 5})

    tabs.update({selected: 1})
    t.render()

    expect(tabs.selected).toBe(1)
    expect(t.terminal.textContent()).toContain('Settings panel')
    expect(t.terminal.textContent()).not.toContain('Information panel')
  })

  it('animates separator when selecting another tab', () => {
    const tabs = makeTabs()
    const t = testRender(tabs, {width: 35, height: 5})
    expect(t.terminal.textContent()).toMatchSnapshot()

    // Click on "Settings" tab title (y=0, x somewhere in "Settings")
    t.sendMouse('mouse.button.down', {x: 10, y: 0})
    t.sendMouse('mouse.button.up', {x: 10, y: 0})

    // After one animation frame (40ms, dx=2), separator should be partway
    t.tick(40)
    expect(t.terminal.textContent()).toMatchSnapshot()

    // After 5 seconds the animation should be fully settled on "Settings"
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })
})
