import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {HotKey} from '../../lib/components/HotKey.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'

describe('HotKey', () => {
  it('fires onPress when the matching key is pressed', () => {
    let pressed = false
    const view = Stack.down([
      new Text({text: 'Hello'}),
      new HotKey({
        hotKey: 'x',
        onPress: () => {
          pressed = true
        },
      }),
    ])
    const t = testRender(view, {width: 20, height: 5})
    t.sendKey('x')
    expect(pressed).toBe(true)
  })

  it('does not fire onPress for non-matching keys', () => {
    let pressed = false
    const view = Stack.down([
      new Text({text: 'Hello'}),
      new HotKey({
        hotKey: 'x',
        onPress: () => {
          pressed = true
        },
      }),
    ])
    const t = testRender(view, {width: 20, height: 5})
    t.sendKey('y')
    expect(pressed).toBe(false)
  })

  it('works with multiple hotkeys', () => {
    let count1 = 0
    let count2 = 0
    const view = Stack.down([
      new Text({text: 'Hello'}),
      new HotKey({
        hotKey: '1',
        onPress: () => {
          count1++
        },
      }),
      new HotKey({
        hotKey: '2',
        onPress: () => {
          count2++
        },
      }),
    ])
    const t = testRender(view, {width: 20, height: 5})
    t.sendKey('1')
    t.sendKey('1')
    t.sendKey('2')
    expect(count1).toBe(2)
    expect(count2).toBe(1)
  })

  it('works when no other component has focus', () => {
    let pressed = false
    const view = Stack.down([
      new Text({text: 'No focusable elements here'}),
      new HotKey({
        hotKey: 'a',
        onPress: () => {
          pressed = true
        },
      }),
    ])
    const t = testRender(view, {width: 30, height: 5})
    t.sendKey('a')
    expect(pressed).toBe(true)
  })

  it('works with modifier keys', () => {
    let pressed = false
    const view = Stack.down([
      new Text({text: 'Hello'}),
      new HotKey({
        hotKey: 'C-s',
        onPress: () => {
          pressed = true
        },
      }),
    ])
    const t = testRender(view, {width: 20, height: 5})
    t.sendKey('s', {ctrl: true})
    expect(pressed).toBe(true)
  })
})
