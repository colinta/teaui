import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {ZStack} from '../../lib/components/ZStack.js'
import {Text} from '../../lib/components/Text.js'
import {Box} from '../../lib/components/Box.js'
import {Size} from '../../lib/geometry.js'

describe('ZStack', () => {
  it('renders a single child', () => {
    const t = testRender(new ZStack({child: new Text({text: 'Hello'})}), {
      width: 10,
      height: 1,
    })
    expect(t.terminal.textContent()).toBe('Hello')
  })

  it('later children render on top of earlier ones', () => {
    const t = testRender(
      new ZStack({
        children: [new Text({text: 'AAAAAAA'}), new Text({text: 'BB'})],
      }),
      {width: 7, height: 1},
    )
    // 'BB' overwrites the first two characters of 'AAAAAAA'
    expect(t.terminal.textContent()).toBe('BBAAAAA')
  })

  it('naturalSize is the max of all children', () => {
    const zstack = new ZStack({
      children: [
        new Box({
          border: 'single',
          width: 5,
          height: 3,
          child: new Text({text: ''}),
        }),
        new Text({text: 'Hi'}),
      ],
    })
    const size = zstack.naturalSize(new Size(20, 20))
    expect(size.width).toBe(5)
    expect(size.height).toBe(3)
  })

  it('overlays a small view on top of a larger one', () => {
    const t = testRender(
      new ZStack({
        children: [new Text({text: '0123456'}), new Text({text: 'AB'})],
      }),
      {width: 7, height: 1},
    )
    expect(t.terminal.textContent()).toBe('AB23456')
  })

  it('stacks multiple layers', () => {
    const t = testRender(
      new ZStack({
        children: [
          new Text({text: 'XXXXXXX'}),
          new Text({text: '..YY'}),
          new Text({text: 'Z'}),
        ],
      }),
      {width: 7, height: 1},
    )
    // Z overwrites first char, ..YY overwrites chars 2-3, X fills the rest
    expect(t.terminal.textContent()).toBe('Z.YYXXX')
  })

  it('renders empty with no children', () => {
    const t = testRender(new ZStack({}), {width: 5, height: 3})
    expect(t.terminal.textContent()).toBe('')
  })
})
