import {
  Terminal as TermTerminal,
  cursorTo,
  isKeyEvent,
  isMouseEvent,
  isFocusEvent,
  type InputEvent as TermInputEvent,
} from '@teaui/term'

import type {SGRTerminal} from './terminal.js'
import type {Rect, Point} from './geometry.js'
import {Size} from './geometry.js'
import {View} from './View.js'
import {Viewport} from './Viewport.js'
import {flushLogs} from './log.js'
import {Buffer} from './Buffer.js'
import type {
  HotKeyDef,
  KeyEvent,
  MouseEventListenerName,
  SystemEvent,
  SystemMouseEvent,
} from './events/index.js'
import {
  translateTermKeyEvent,
  translateTermMouseEvent,
} from './events/translate.js'
import {FocusManager} from './managers/FocusManager.js'
import {ModalManager} from './managers/ModalManager.js'
import {MouseManager} from './managers/MouseManager.js'
import {TickManager} from './managers/TickManager.js'
import {Window} from './components/Window.js'
import {System, UnboundSystem} from './System.js'

// --- TerminalProgram: adapter wrapping @teaui/term's Terminal ---

type KeyListener = (char: string, key: KeyEvent) => void

/**
 * Wraps @teaui/term's Terminal for use by Screen and the public API.
 * Provides a blessed-compatible `.key()` helper and implements SGRTerminal.
 */
export class TerminalProgram implements SGRTerminal {
  #terminal: TermTerminal
  #keyListeners: {pattern: string; fn: KeyListener}[] = []
  #cleanupInput?: () => void

  constructor() {
    this.#terminal = new TermTerminal()
    this.#terminal.enableWriteBuffer()
  }

  get terminal(): TermTerminal {
    return this.#terminal
  }

  // --- SGRTerminal interface ---

  get cols(): number {
    return this.#terminal.cols
  }

  get rows(): number {
    return this.#terminal.rows
  }

  move(x: number, y: number): void {
    this.#terminal.write(cursorTo(x, y))
  }

  write(str: string): void {
    this.#terminal.write(str)
  }

  flush(): void {
    this.#terminal.flushWrites()
  }

  // --- Lifecycle ---

  enterFullscreen(): void {
    this.#terminal.enterFullscreen({
      mouse: true,
      hideCursor: true,
      focusEvents: true,
    })
  }

  exitFullscreen(): void {
    this.#terminal.exitFullscreen()
  }

  clear(): void {
    this.#terminal.clear()
  }

  // --- Input ---

  startInput(screen: Screen): void {
    this.#cleanupInput = this.#terminal.onInput((event: TermInputEvent) => {
      if (isFocusEvent(event)) {
        screen.trigger({type: event.focused ? 'focus' : 'blur'})
        return
      }

      if (isKeyEvent(event)) {
        const keyEvent = translateTermKeyEvent(event)

        // Check .key() listeners
        for (const {pattern, fn} of this.#keyListeners) {
          if (matchKeyPattern(pattern, keyEvent)) {
            fn(keyEvent.char, keyEvent)
          }
        }

        screen.trigger(keyEvent)
        return
      }

      if (isMouseEvent(event)) {
        const mouseEvent = translateTermMouseEvent(event)
        if (mouseEvent) {
          screen.trigger(mouseEvent)
        }
        return
      }
    })

    this.#terminal.onResize(() => {
      screen.trigger({type: 'resize'})
    })
  }

  stopInput(): void {
    this.#cleanupInput?.()
    this.#cleanupInput = undefined
  }

  /**
   * Register a key binding (blessed-compatible).
   * Pattern: 'escape', 'C-c', 'C-q', 'return', etc.
   */
  key(pattern: string | string[], fn: KeyListener): void {
    const patterns = Array.isArray(pattern) ? pattern : [pattern]
    for (const p of patterns) {
      this.#keyListeners.push({pattern: p, fn})
    }
  }

  /**
   * Provide raw data listener (for iTerm2 etc.)
   */
  once(event: string, fn: (...args: any[]) => void): void {
    if (event === 'data') {
      this.#terminal.onceRawData(fn)
    }
  }
}

// --- ViewConstructor type ---

type ViewConstructor<T extends View> = (
  program: TerminalProgram,
) => T | Promise<T>

export interface ScreenOptions {
  quitChar?: 'c' | 'q' | '' | undefined | false
}

export class Screen {
  #program: TerminalProgram
  #onExit?: () => void

  rootView: View

  #buffer: Buffer
  #focusManager = new FocusManager()
  #modalManager = new ModalManager()
  #mouseManager = new MouseManager()
  #tickManager = new TickManager(() => this.render())

  /**
   * A helper function that puts the terminal into a "known good" state. I use this
   * during debugging, if the app crashes and I need to get the terminal CLI working
   * again.
   */
  static reset() {
    const program = new TerminalProgram()
    program.clear()
    program.terminal.showCursor()
    program.exitFullscreen()
    setTimeout(() => {
      process.exit(0)
    }, 0)
  }

  static async start(): Promise<[Screen, TerminalProgram, Window]>

  static async start<T extends View>(
    viewConstructor: T | ViewConstructor<T>,
    opts?: Partial<ScreenOptions>,
  ): Promise<[Screen, TerminalProgram, T]>

  /**
   * Start the TeaUI application. Expects a root node (I recommend Window, it
   * consumes all the available screen space) *or* an async function that creates the
   * root node, and accepts a small amount of options.
   *
   * @return the Screen, the TerminalProgram that controls the terminal, and the root node
   * instance.
   */
  static async start<T extends View = Window>(
    viewConstructor: T | ViewConstructor<T> = new Window() as unknown as T,
    opts?: Partial<ScreenOptions>,
  ): Promise<[Screen, TerminalProgram, T]> {
    opts ??= {}
    opts = {
      quitChar: 'c',
      ...opts,
    }

    const program = new TerminalProgram()
    program.enterFullscreen()
    program.clear()

    const rootView =
      viewConstructor instanceof View
        ? viewConstructor
        : await viewConstructor(program)

    const screen = new Screen(program, rootView)
    screen.onExit(() => {
      program.clear()
      program.exitFullscreen()
    })

    if (opts.quitChar) {
      program.key(`C-${opts.quitChar}`, () => {
        screen.exit()
      })
    }

    program.startInput(screen)
    screen.start()

    return [screen, program, rootView]
  }

  constructor(program: TerminalProgram, rootView: View) {
    this.#program = program
    this.#buffer = new Buffer()
    this.rootView = rootView

    Object.defineProperty(this, 'program', {
      enumerable: false,
    })
  }

  onExit(callback: () => void) {
    if (this.#onExit) {
      const prev = this.#onExit
      this.#onExit = () => {
        prev()
        callback()
      }
    } else {
      this.#onExit = callback
    }
  }

  /**
   * Called from Screen.start(). Don't call this yourself unless you wanted
   * to construct your own 'program'. I recommend starting with a
   * copy of the implementation of Screen.start.
   */
  start() {
    this.rootView.moveToScreen(this)
    this.render()
  }

  /**
   * Puts the screen back in normal terminal mode, restores the normal buffer
   */
  stop() {
    this.#tickManager.stop()
    this.rootView.moveToScreen(undefined)
    this.#program.stopInput()
    this.#onExit?.()
  }

  /**
   * Stops (putting the screen back in normal mode and buffer) and exits by emitting
   * process.exit(0)
   */
  exit() {
    this.stop()
    setTimeout(() => {
      process.exit(0)
    }, 0)
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
      case 'mouse': {
        this.triggerMouse(event)
        break
      }
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

  /**
   * @return boolean Whether the current view has focus
   */
  registerFocus(view: View): boolean {
    return this.#focusManager.registerFocus(view)
  }

  registerHotKey(view: View, key: HotKeyDef) {
    return this.#focusManager.registerHotKey(view, key)
  }

  requestFocus(view: View) {
    return this.#focusManager.requestFocus(view)
  }

  nextFocus() {
    this.#focusManager.nextFocus()
  }

  prevFocus() {
    this.#focusManager.prevFocus()
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
    const system = new UnboundSystem(this.#focusManager)
    this.#mouseManager.trigger(systemEvent, system)
  }

  registerTick(view: View) {
    this.#tickManager.registerTick(view)
  }

  triggerTick(dt: number) {}

  preRender(view: View) {
    this.#modalManager.reset()
    this.#tickManager.reset()
    this.#mouseManager.reset()
    this.#focusManager.reset(view === this.rootView)
  }

  /**
   * @return boolean Whether or not to rerender the view due to focus or mouse change
   */
  commit() {
    const system = new UnboundSystem(this.#focusManager)
    const focusNeedsRender = this.#focusManager.commit()
    const mouseNeedsRender = this.#mouseManager.commit(system)
    return focusNeedsRender || mouseNeedsRender
  }

  needsRender() {
    this.#tickManager.needsRender()
  }

  render() {
    const screenSize = new Size(this.#program.cols, this.#program.rows)
    this.#buffer.resize(screenSize)

    // this may be called again by renderModals, before the last modal renders
    this.preRender(this.rootView)

    const size = this.rootView.naturalSize(screenSize).max(screenSize)
    const viewport = new Viewport(this, this.#buffer, size)
    this.rootView.render(viewport)
    const rerenderView = this.#modalManager.renderModals(this, viewport)
    const needsRerender = this.commit()

    // one -and only one- re-render if a change is detected to focus or mouse-hover
    if (needsRerender) {
      rerenderView.render(viewport)
    }

    this.#tickManager.endRender()

    this.#buffer.flush(this.#program)
  }
}

function matchKeyPattern(pattern: string, event: KeyEvent): boolean {
  return event.full === pattern
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
