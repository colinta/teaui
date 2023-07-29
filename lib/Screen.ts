import type {BlessedProgram} from './sys'
import {program as blessedProgram} from './sys'

import type {SGRTerminal} from './terminal'
import type {Rect, Point} from './geometry'
import {Size} from './geometry'
import {View} from './View'
import {Viewport} from './Viewport'
import {flushLogs} from './log'
import {Buffer} from './Buffer'
import type {
  HotKey,
  KeyEvent,
  MouseEventListenerName,
  SystemEvent,
  SystemMouseEvent,
  SystemMouseEventName,
} from './events'
import {FocusManager} from './managers/FocusManager'
import {ModalManager} from './managers/ModalManager'
import {MouseManager} from './managers/MouseManager'
import {TickManager} from './managers/TickManager'

export class Screen {
  program: SGRTerminal
  rootView: View

  #buffer: Buffer
  #focusManager = new FocusManager()
  #modalManager = new ModalManager()
  #mouseManager = new MouseManager()
  #tickManager = new TickManager(() => this.render())

  static async start(
    viewConstructor: View | ((program: BlessedProgram) => View | Promise<View>),
  ): Promise<[Screen, BlessedProgram]> {
    const program = blessedProgram({
      useBuffer: true,
    })

    program.alternateBuffer()
    program.enableMouse()
    program.hideCursor()
    program.clear()
    program.setMouse({sendFocus: true}, true)

    const fn = function () { }
    program.on('keypress', fn)

    const rootView =
      viewConstructor instanceof View
        ? viewConstructor
        : await viewConstructor(program)
    const screen = new Screen(program, rootView)
    program.off('keypress', fn)

    program.on('focus', function () {
      screen.trigger({type: 'focus'})
    })

    program.on('blur', function () {
      screen.trigger({type: 'blur'})
    })

    program.on('resize', function () {
      screen.trigger({type: 'resize'})
    })

    program.on('keypress', (char, key) => {
      if (key.name === 'c' && key.ctrl) {
        program.clear()
        program.disableMouse()
        program.showCursor()
        program.normalBuffer()
        screen.exit()
        flushLogs()
        process.exit(0)
      } else {
        screen.trigger({type: 'key', ...key})
      }
    })

    program.on('mouse', function (data) {
      let action = data.action
      if (action === 'focus' || action === 'blur') {
        return
      }
      if (data.button === 'unknown') {
        return
      }

      screen.trigger({
        ...data,
        name: translateMouseAction(action),
        type: 'mouse',
      })
    })

    screen.start()

    return [screen, program]
  }

  constructor(program: SGRTerminal, rootView: View) {
    this.program = program
    this.#buffer = new Buffer()
    this.rootView = rootView
  }

  start() {
    this.rootView.moveToScreen(this)
    this.render()
  }

  exit() {
    this.#tickManager.stop()
    this.rootView.moveToScreen(null)
  }

  trigger(event: SystemEvent) {
    switch (event.type) {
      case 'resize':
      case 'focus':
      case 'blur':
        break
      case 'key':
        this.triggerKeyboard(event)
        break
      case 'mouse':
        this.triggerMouse(event)
        break
    }
    this.render()
  }

  /**
   * Requests a modal. A modal will be created if:
   * (a) no modal is already displayed
   * or
   * (b) a modal is requesting a nested modal
   */
  requestModal(parent: View, modal: View, onClose: () => void, rect: Rect) {
    return this.#modalManager.requestModal(parent, modal, onClose, rect)
  }

  dismissModal(view: View) {
    return this.#modalManager.dismissModal(view)
  }

  registerFocus(view: View) {
    return this.#focusManager.registerFocus(view)
  }

  registerHotKey(view: View, key: HotKey) {
    return this.#focusManager.registerHotKey(view, key)
  }

  triggerKeyboard(event: KeyEvent) {
    event = translateKeyEvent(event)
    this.#focusManager.trigger(event)
  }

  /**
   * @see MouseManager.registerMouse
   */
  registerMouse(
    view: View,
    offset: Point,
    point: Point,
    eventNames: MouseEventListenerName[],
  ) {
    this.#mouseManager.registerMouse(view, offset, point, eventNames)
  }

  checkMouse(view: View, x: number, y: number) {
    this.#mouseManager.checkMouse(view, x, y)
  }

  triggerMouse(systemEvent: SystemMouseEvent): void {
    this.#mouseManager.trigger(systemEvent)
  }

  registerTick(view: View) {
    this.#tickManager.registerTick(view)
  }

  triggerTick(dt: number) { }

  preRender(rootView: View) {
    this.#modalManager.reset()
    this.#tickManager.reset()
    this.#mouseManager.reset()
    this.#focusManager.reset(rootView)
  }

  render() {
    const screenSize = new Size(this.program.cols, this.program.rows)
    this.#buffer.resize(screenSize)

    // this may be called again by renderModals, before the last modal renders
    this.preRender(this.rootView)

    const size = this.rootView.naturalSize(screenSize).max(screenSize)
    const viewport = new Viewport(this, this.#buffer, size)
    this.rootView.render(viewport)
    const rerenderView =
      this.#modalManager.renderModals(this, viewport) ?? this.rootView

    const focusNeedsRender = this.#focusManager.needsRerender()
    const mouseNeedsRender = this.#mouseManager.needsRender()

    // one -and only one- re-render if a change is detected to focus or mouse-hover
    if (focusNeedsRender || mouseNeedsRender) {
      rerenderView.render(viewport)
    }

    this.#tickManager.endRender()

    this.#buffer.flush(this.program)
  }
}

function translateMouseAction(
  action: 'mousemove' | 'mousedown' | 'mouseup' | 'wheeldown' | 'wheelup',
): SystemMouseEventName {
  switch (action) {
    case 'mousemove':
      return 'mouse.move.in'
    case 'mousedown':
      return `mouse.button.down`
    case 'mouseup':
      return `mouse.button.up`
    case 'wheeldown':
      return 'mouse.wheel.down'
    case 'wheelup':
      return 'mouse.wheel.up'
  }
}

/**
 * These are mostly due to my own terminal keybindings; would be better to have
 * these configured in some .rc file.
 */
function translateKeyEvent(event: KeyEvent): KeyEvent {
  if (event.full === 'M-b') {
    return {
      type: 'key',
      full: 'M-left',
      name: 'left',
      ctrl: false,
      meta: true,
      shift: false,
      char: '1;9D',
    }
  }
  if (event.full === 'M-f') {
    return {
      type: 'key',
      full: 'M-right',
      name: 'right',
      ctrl: false,
      meta: true,
      shift: false,
      char: '1;9C',
    }
  }
  return event
}
