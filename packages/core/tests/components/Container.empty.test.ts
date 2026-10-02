import {describe, expect, it} from 'vitest'
import type {View} from '../../lib/View.js'
import {testRender} from '../../lib/TestScreen.js'
import {Accordion} from '../../lib/components/Accordion.js'
import {Alert} from '../../lib/components/Alert.js'
import {Callout} from '../../lib/components/Callout.js'
import {HotKey} from '../../lib/components/HotKey.js'
import {Input} from '../../lib/components/Input.js'
import {Modal} from '../../lib/components/Modal.js'
import {Page} from '../../lib/components/Page.js'
import {Stack} from '../../lib/components/Stack.js'
import {Tabs} from '../../lib/components/Tabs.js'
import {ToggleGroup} from '../../lib/components/ToggleGroup.js'
import {TrackMouse} from '../../lib/components/utility/TrackMouse.js'

type ContainerBuilder = (hotKey: HotKey) => View

const EMPTY_CONTAINER_BUILDERS: [string, ContainerBuilder][] = [
  ['Stack', hotKey => new Stack({width: 0, height: 0, children: [hotKey]})],
  [
    'Accordion',
    hotKey => Accordion.create([['Section', hotKey]], {width: 0, height: 0}),
  ],
  ['Callout', hotKey => new Callout({width: 0, height: 0, children: [hotKey]})],
  ['Modal', hotKey => new Modal({width: 0, height: 0, children: [hotKey]})],
  ['Page', hotKey => new Page({width: 0, height: 0, children: [hotKey]})],
  ['Tabs', hotKey => Tabs.create([['Tab', hotKey]], {width: 0, height: 0})],
  [
    'ToggleGroup',
    hotKey => {
      const toggleGroup = new ToggleGroup({
        width: 0,
        height: 0,
        titles: [],
        selected: [],
      })
      toggleGroup.add(hotKey)
      return toggleGroup
    },
  ],
  [
    'TrackMouse',
    hotKey => new TrackMouse({width: 0, height: 0, children: [hotKey]}),
  ],
]

describe('empty Container subclasses', () => {
  it.each(EMPTY_CONTAINER_BUILDERS)(
    '%s renders children so they can register hotkeys',
    (_name, buildContainer) => {
      let presses = 0
      const hotKey = new HotKey({
        hotKey: 'x',
        onPress: () => presses++,
      })
      const t = testRender(buildContainer(hotKey), {width: 20, height: 5})

      t.sendKey('x')

      expect(presses).toBe(1)
    },
  )

  it('does not register focus for children of empty containers', () => {
    let value = ''
    const stack = new Stack({
      width: 0,
      height: 0,
      children: [new Input({value, onChange: next => (value = next)})],
    })
    const t = testRender(stack, {width: 20, height: 5})

    t.sendKey('x')

    expect(value).toBe('')
  })

  it('renders Alert modal children when the screen is empty', () => {
    let presses = 0
    const alert = new Alert({
      visible: true,
      children: [new HotKey({hotKey: 'x', onPress: () => presses++})],
    })
    const t = testRender(alert, {width: 0, height: 0})

    t.sendKey('x')

    expect(presses).toBe(1)
  })
})
