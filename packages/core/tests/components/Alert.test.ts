import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Alert} from '../../lib/components/Alert.js'
import {Text} from '../../lib/components/Text.js'
import {Button} from '../../lib/components/Button.js'
import {Stack} from '../../lib/components/Stack.js'

describe('Alert', () => {
  it('renders with title', () => {
    const t = testRender(
      new Alert({
        title: 'Warning',
        children: [new Text({text: 'Something happened'})],
      }),
      {width: 30, height: 8},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders without title', () => {
    const t = testRender(
      new Alert({
        children: [new Text({text: 'A simple message'})],
      }),
      {width: 28, height: 5},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with purpose', () => {
    const t = testRender(
      new Alert({
        title: 'Error',
        purpose: 'cancel',
        children: [new Text({text: 'Something went wrong'})],
      }),
      {width: 30, height: 8},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with multiple children', () => {
    const t = testRender(
      new Alert({
        title: 'Confirm',
        children: [
          new Text({text: 'Are you sure?'}),
          Stack.right({gap: 1}, [
            new Button({title: 'Yes'}),
            new Button({title: 'No'}),
          ]),
        ],
      }),
      {width: 30, height: 9},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with direction right', () => {
    const t = testRender(
      new Alert({
        direction: 'right',
        children: [new Text({text: 'Left'}), new Text({text: 'Right'})],
      }),
      {width: 20, height: 5},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  describe('Alert.modal()', () => {
    it('creates alert and modal pair', () => {
      const {alert, modal} = Alert.modal({
        title: 'Test',
        children: [new Text({text: 'Content'})],
      })
      expect(alert).toBeInstanceOf(Alert)
      expect(modal.dim).toBe(true)
      expect(modal.dismissOnEsc).toBe(true)
      expect(modal.dismissOnClick).toBe(true)
    })

    it('passes modal props through', () => {
      const onDismiss = () => {}
      const {modal} = Alert.modal({
        title: 'Test',
        dim: false,
        dismissOnEsc: false,
        dismissOnClick: false,
        onDismiss,
        children: [new Text({text: 'Content'})],
      })
      expect(modal.dim).toBe(false)
      expect(modal.dismissOnEsc).toBe(false)
      expect(modal.dismissOnClick).toBe(false)
      expect(modal.onDismiss).toBe(onDismiss)
    })
  })
})
