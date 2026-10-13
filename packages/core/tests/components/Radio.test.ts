import {describe, expect, it, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Radio, RadioGroup} from '../../lib/components/Radio.js'
import {Stack} from '../../lib/components/Stack.js'

function createGroup(
  value: string | undefined = 'one',
  onChange?: (value: string) => void,
) {
  return new RadioGroup({
    value,
    onChange,
    child: Stack.down([
      new Radio({title: 'One', value: 'one'}),
      new Radio({title: 'Two', value: 'two'}),
    ]),
  })
}

describe('RadioGroup', () => {
  it('renders the selected Radio through an intervening layout container', () => {
    const t = testRender(createGroup(), {width: 12, height: 2})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('selects a Radio on click and calls onChange on the group', () => {
    const onChange = vi.fn()
    const group = createGroup('one', onChange)
    const t = testRender(group, {width: 12, height: 2})

    t.sendMouse('mouse.button.down', {x: 0, y: 1})
    t.sendMouse('mouse.button.up', {x: 0, y: 1})
    t.render()

    expect(group.value).toBe('two')
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('two')
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('selects a Radio with the keyboard', () => {
    const onChange = vi.fn()
    const group = createGroup('two', onChange)
    const t = testRender(group, {width: 12, height: 2})

    t.sendKey('tab')
    t.sendKey('return')

    expect(group.value).toBe('one')
    expect(onChange).toHaveBeenCalledWith('one')
  })

  it('does not notify when the selected Radio is activated again', () => {
    const onChange = vi.fn()
    const group = createGroup('one', onChange)
    const t = testRender(group, {width: 12, height: 2})

    t.sendMouse('mouse.button.down', {x: 0, y: 0})
    t.sendMouse('mouse.button.up', {x: 0, y: 0})

    expect(group.value).toBe('one')
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('Radio', () => {
  it('does not throw when used without a RadioGroup', () => {
    const radio = new Radio({title: 'Orphan', value: 'orphan'})
    const t = testRender(radio, {width: 12, height: 1})

    expect(() => {
      t.sendMouse('mouse.button.down', {x: 0, y: 0})
      t.sendMouse('mouse.button.up', {x: 0, y: 0})
      t.sendKey('tab')
      t.sendKey('return')
      t.render()
    }).not.toThrow()
    expect(t.terminal.textContent()).toMatchSnapshot()
  })
})
