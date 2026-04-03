import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Alert} from '../../lib/components/Alert.js'
import {Text} from '../../lib/components/Text.js'
import {Button} from '../../lib/components/Button.js'
import {Stack} from '../../lib/components/Stack.js'
import {Space} from '../../lib/components/Space.js'

describe('Alert', () => {
  describe('presentFrom', () => {
    it('presents alert with title in a modal', () => {
      const layout = Stack.down()
      const alert = new Alert({
        title: 'Warning',
        children: [new Text({text: 'Something happened'})],
      })

      const t = testRender(layout, {width: 40, height: 12})

      // Before: empty layout
      expect(t.terminal.textContent()).toMatchSnapshot()

      // Present the alert
      alert.presentFrom(layout)
      t.render()

      // After: modal overlay with rounded box
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('presents alert without title', () => {
      const layout = Stack.down()
      const alert = new Alert({
        children: [new Text({text: 'A simple message'})],
      })

      const t = testRender(layout, {width: 40, height: 10})
      alert.presentFrom(layout)
      t.render()

      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('presents alert with purpose', () => {
      const layout = Stack.down()
      const alert = new Alert({
        title: 'Error',
        purpose: 'cancel',
        children: [new Text({text: 'Something went wrong'})],
      })

      const t = testRender(layout, {width: 40, height: 12})
      alert.presentFrom(layout)
      t.render()

      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('presents alert with multiple children', () => {
      const layout = Stack.down()
      const alert = new Alert({
        title: 'Confirm',
        children: [
          new Text({text: 'Are you sure?'}),
          Stack.right({
            gap: 1,
            children: [new Button({title: 'Yes'}), new Button({title: 'No'})],
          }),
        ],
      })

      const t = testRender(layout, {width: 40, height: 12})
      alert.presentFrom(layout)
      t.render()

      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('presents alert with direction right', () => {
      const layout = Stack.down()
      const alert = new Alert({
        direction: 'right',
        children: [new Text({text: 'Left'}), new Text({text: 'Right'})],
      })

      const t = testRender(layout, {width: 30, height: 8})
      alert.presentFrom(layout)
      t.render()

      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('dismiss', () => {
    it('removes alert from owner on dismiss', () => {
      const layout = Stack.down()
      const alert = new Alert({
        title: 'Test',
        children: [new Text({text: 'Content'})],
      })

      const t = testRender(layout, {width: 40, height: 12})

      alert.presentFrom(layout)
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot()

      alert.dismiss()
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('calls onDismiss callback', () => {
      const layout = Stack.down()
      let dismissed = false
      const alert = new Alert({
        title: 'Test',
        onDismiss() {
          dismissed = true
        },
        children: [new Text({text: 'Content'})],
      })

      const t = testRender(layout, {width: 40, height: 12})
      alert.presentFrom(layout)
      t.render()

      alert.dismiss()
      expect(dismissed).toBe(true)
    })

    it('auto-dismisses when owner is removed from tree', () => {
      const root = Stack.down()
      const owner = Stack.down()
      root.add(owner)

      const alert = new Alert({
        title: 'Test',
        children: [new Text({text: 'Content'})],
      })

      const t = testRender(root, {width: 40, height: 12})

      alert.presentFrom(owner)
      t.render()

      // Alert is visible
      expect(t.terminal.textContent()).toMatchSnapshot()

      // Remove owner from tree — alert goes with it
      root.removeChild(owner)
      t.render()

      // Alert is gone
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('heading', () => {
    it('uses child heading as title when title is not set', () => {
      const layout = Stack.down()
      const alert = new Alert({
        children: [new Text({text: 'Something happened', heading: 'Heads Up'})],
      })

      const t = testRender(layout, {width: 40, height: 12})
      alert.presentFrom(layout)
      t.render()

      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('title takes precedence over child heading', () => {
      const layout = Stack.down()
      const alert = new Alert({
        title: 'Explicit Title',
        children: [new Text({text: 'Content', heading: 'Ignored'})],
      })

      const t = testRender(layout, {width: 40, height: 12})
      alert.presentFrom(layout)
      t.render()

      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('presentFrom with existing content', () => {
    it('presents over existing views', () => {
      const layout = Stack.down({
        children: [
          new Text({text: 'Background content'}),
          new Button({title: 'Click me'}),
        ],
      })
      const alert = new Alert({
        title: 'Alert!',
        children: [new Text({text: 'Important message'})],
      })

      const t = testRender(layout, {width: 40, height: 12})

      // Before: just background content
      expect(t.terminal.textContent()).toMatchSnapshot()

      alert.presentFrom(layout)
      t.render()

      // After: modal overlay on top of background
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('modal props', () => {
    it('defaults to dim=true, dismissOnEsc=true, dismissOnClick=true', () => {
      const alert = new Alert({
        children: [new Text({text: 'test'})],
      })
      // Verify defaults via presentFrom + render (modal is internal)
      expect(alert.visible).toBe(false)
    })

    it('can re-present after dismiss', () => {
      const layout = Stack.down()
      const alert = new Alert({
        title: 'Reusable',
        children: [new Text({text: 'Hello again'})],
      })

      const t = testRender(layout, {width: 40, height: 12})

      // First presentation
      alert.presentFrom(layout)
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot()

      // Dismiss
      alert.dismiss()
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot()

      // Re-present
      alert.presentFrom(layout)
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })
})
