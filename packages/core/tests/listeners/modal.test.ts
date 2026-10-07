import {describe, expect, it, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Modal} from '../../lib/components/Modal.js'
import {Text} from '../../lib/components/Text.js'
import {Stack} from '../../lib/components/Stack.js'
import type {Viewport} from '../../lib/Viewport.js'
import {Size} from '../../lib/geometry.js'
import {Probe, type ProbeConfig} from './Probe.js'

/**
 * Presents a modal (rendered after, and above, the main view tree) while
 * `showModal` is true.
 */
class ModalHost extends Probe {
  showModal = false
  modal = new Modal({children: [new Text({text: 'modal'})]})

  constructor(config: ProbeConfig = {}) {
    super(config)
  }

  render(viewport: Viewport) {
    super.render(viewport)
    if (this.showModal) {
      viewport.requestModal(this.modal)
    }
  }
}

describe('listeners and modals', () => {
  it('explicit listeners of the presenting view follow the same scope as native registrations', () => {
    const host = new ModalHost({hotKeys: ['n']})
    const keyListener = vi.fn()
    const mouseListener = vi.fn()
    host.addKeyboardListener(keyListener, {events: ['x']})
    host.addMouseListener(mouseListener, {events: ['mouse.wheel']})
    const t = testRender(host, {width: 20, height: 5})

    t.sendKey('x')
    t.sendKey('n')
    t.sendMouse('mouse.wheel.down', {x: 15, y: 4})
    expect(keyListener).toHaveBeenCalledOnce()
    expect(host.keys).toHaveLength(1)
    expect(mouseListener).toHaveBeenCalledOnce()

    // While the modal is presented, only the modal's registrations are active
    host.showModal = true
    t.render()
    keyListener.mockClear()
    mouseListener.mockClear()
    host.keys.length = 0

    t.sendKey('x')
    t.sendKey('n')
    t.sendMouse('mouse.wheel.down', {x: 15, y: 4})
    expect(keyListener).not.toHaveBeenCalled()
    expect(host.keys).toHaveLength(0)
    expect(mouseListener).not.toHaveBeenCalled()

    // And everything is back once the modal is gone
    host.showModal = false
    t.render()
    t.sendKey('x')
    t.sendKey('n')
    t.sendMouse('mouse.wheel.down', {x: 15, y: 4})
    expect(keyListener).toHaveBeenCalledOnce()
    expect(host.keys).toHaveLength(1)
    expect(mouseListener).toHaveBeenCalledOnce()
  })

  it('listeners on views inside the modal work', () => {
    const host = new ModalHost()
    const inner = new Probe({}, {height: 1})
    host.modal = new Modal({children: [inner]})
    host.showModal = true
    const keyListener = vi.fn()
    inner.addKeyboardListener(keyListener, {events: ['x']})
    const t = testRender(host, {width: 20, height: 5})

    t.sendKey('x')
    expect(keyListener).toHaveBeenCalledOnce()
  })

  it('restores the previously focused view when a modal closes', () => {
    const before = new Probe({
      focus: {isDefault: false},
      size: new Size(20, 1),
    })
    const host = new ModalHost({
      focus: {isDefault: false},
      size: new Size(20, 1),
    })
    const inner = new Probe({focus: true})
    host.modal = new Modal({children: [inner]})
    const t = testRender(Stack.down([before, host]), {width: 20, height: 5})
    t.sendKey('tab')
    t.sendKey('tab')

    host.showModal = true
    t.render()
    // Re-rendering an open modal must not replace its original return focus.
    t.render()

    host.showModal = false
    t.render()
    t.sendKey('x')
    expect(host.keys).toHaveLength(1)
    expect(before.keys).toHaveLength(0)
  })

  it('does not restore focus when the previous view leaves the focus ring', () => {
    const before = new Probe({
      focus: {isDefault: false},
      size: new Size(20, 1),
    })
    const host = new ModalHost({
      focus: {isDefault: false},
      size: new Size(20, 1),
    })
    const inner = new Probe({focus: true})
    host.modal = new Modal({children: [inner]})
    const t = testRender(Stack.down([before, host]), {width: 20, height: 5})
    t.sendKey('tab')
    t.sendKey('tab')

    host.showModal = true
    t.render()
    host.showModal = false
    host.isVisible = false
    t.render()
    t.sendKey('x')

    expect(before.keys).toHaveLength(0)
    expect(host.keys).toHaveLength(0)

    t.sendKey('tab')
    t.sendKey('x')
    expect(before.keys).toHaveLength(1)
  })
})
