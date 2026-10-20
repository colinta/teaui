import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {HotKey} from '../../lib/components/HotKey.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'
import {Input} from '../../lib/components/Input.js'

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

  it('matches keys before Screen translates them (A-f is also A-right)', () => {
    let pressed = 0
    const input = new Input({value: 'hello world'})
    const hotKey = new HotKey({hotKey: 'A-f', onPress: () => pressed++})
    const t = testRender(Stack.down([input, hotKey]), {width: 20, height: 3})
    t.sendKey('f', {alt: true})
    expect(pressed).toBe(1)

    // without the hotkey, the focused Input gets the translated key
    hotKey.isVisible = false
    t.render()
    t.sendKey('home')
    t.sendKey('f', {alt: true})
    t.sendKey('!')
    expect(pressed).toBe(1)
    expect(input.value).toBe('hello! world')
  })
})

describe('Viewport.withFocusDisabled', () => {
  class Disabled extends Stack {
    render(viewport: import('../../lib/Viewport.js').Viewport) {
      viewport.withFocusDisabled(inside => super.render(inside))
    }
  }

  it('views inside cannot take focus, and lose it', () => {
    const outside = new Input({value: 'outside'})
    const inside = new Input({value: 'inside'})
    const disabled = new Disabled({direction: 'down', children: [inside]})
    const t = testRender(Stack.down([disabled, outside]), {
      width: 20,
      height: 3,
    })
    // 'inside' is first, but disabled: 'outside' gets the default focus
    expect(inside.hasFocus).toBe(false)
    expect(outside.hasFocus).toBe(true)

    t.sendKey('tab')
    t.sendKey('tab')
    expect(inside.hasFocus).toBe(false)

    // a view that is focused, then disabled, loses focus (and the focus
    // doesn't move to another view)
    inside.screen!.requestFocus(inside)
    t.render()
    expect(inside.hasFocus).toBe(false)
    expect(outside.hasFocus).toBe(false)
  })
})
