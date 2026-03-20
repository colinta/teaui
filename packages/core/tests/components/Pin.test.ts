import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Pin, type PinLocation} from '../../lib/components/Pin.js'
import {Box} from '../../lib/components/Box.js'
import {Text} from '../../lib/components/Text.js'

function makePin(location: PinLocation) {
  return new Pin({
    location,
    child: new Box({
      border: 'single',
      width: 3,
      height: 3,
      child: new Text({text: '·'}),
    }),
  })
}

describe('Pin', () => {
  it('top-left', () => {
    const t = testRender(makePin('top-left'), {width: 7, height: 7})
    expect(t.terminal.textContent()).toBe(['┌─┐', '│·│', '└─┘'].join('\n'))
  })

  it('top-center', () => {
    const t = testRender(makePin('top-center'), {width: 7, height: 7})
    expect(t.terminal.textContent()).toBe(
      ['  ┌─┐', '  │·│', '  └─┘'].join('\n'),
    )
  })

  it('top-right', () => {
    const t = testRender(makePin('top-right'), {width: 7, height: 7})
    expect(t.terminal.textContent()).toBe(
      ['    ┌─┐', '    │·│', '    └─┘'].join('\n'),
    )
  })

  it('left', () => {
    const t = testRender(makePin('left'), {width: 7, height: 7})
    expect(t.terminal.textContent()).toBe(
      ['', '', '┌─┐', '│·│', '└─┘'].join('\n'),
    )
  })

  it('center', () => {
    const t = testRender(makePin('center'), {width: 7, height: 7})
    expect(t.terminal.textContent()).toBe(
      ['', '', '  ┌─┐', '  │·│', '  └─┘'].join('\n'),
    )
  })

  it('right', () => {
    const t = testRender(makePin('right'), {width: 7, height: 7})
    expect(t.terminal.textContent()).toBe(
      ['', '', '    ┌─┐', '    │·│', '    └─┘'].join('\n'),
    )
  })

  it('bottom-left', () => {
    const t = testRender(makePin('bottom-left'), {width: 7, height: 7})
    expect(t.terminal.textContent()).toBe(
      ['', '', '', '', '┌─┐', '│·│', '└─┘'].join('\n'),
    )
  })

  it('bottom-center', () => {
    const t = testRender(makePin('bottom-center'), {width: 7, height: 7})
    expect(t.terminal.textContent()).toBe(
      ['', '', '', '', '  ┌─┐', '  │·│', '  └─┘'].join('\n'),
    )
  })

  it('bottom-right', () => {
    const t = testRender(makePin('bottom-right'), {width: 7, height: 7})
    expect(t.terminal.textContent()).toBe(
      ['', '', '', '', '    ┌─┐', '    │·│', '    └─┘'].join('\n'),
    )
  })
})
