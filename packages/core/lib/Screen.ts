import {
  Terminal as TermTerminal,
  cursorTo,
  isKeyEvent,
  isMouseEvent,
  isPasteEvent,
  isFocusEvent,
  type InputEvent as TermInputEvent,
} from '@teaui/term'

import type {Rect, Point} from './geometry.js'
import {Size} from './geometry.js'
import {type Program} from './types.js'
import {View} from './View.js'
import {Viewport} from './Viewport.js'
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
import type {Modal} from './components/Modal.js'
import {ModalManager} from './managers/ModalManager.js'
import {MouseManager} from './managers/MouseManager.js'
import {TickManager} from './managers/TickManager.js'
import {Window} from './components/Window.js'
import {UnboundSystem} from './System.js'

// --- TerminalProgram: adapter wrapping @teaui/term's Terminal ---

/**
 * Wraps @teaui/term's Terminal for use by Screen and the public API.
 * Translates low-level terminal input into SystemEvents that Screen can consume.
 */
export class TerminalProgram implements Program {
  #terminal: TermTerminal

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

  setup(): void {
    this.#terminal.enterFullscreen({
      mouse: true,
      hideCursor: true,
      focusEvents: true,
    })
    this.#terminal.clear()
  }

  teardown(): void {
    this.#terminal.clear()
    this.#terminal.exitFullscreen()
  }

  // --- Events ---

  /**
   * Subscribe to translated system events from terminal input.
   * Returns an unsubscribe function.
   */
  onEvents(listener: (event: SystemEvent) => void): () => void {
    return this.#terminal.onInput((event: TermInputEvent) => {
      if (isFocusEvent(event)) {
        listener({type: event.focused ? 'focus' : 'blur'})
        return
      }

      if (isKeyEvent(event)) {
        listener(translateTermKeyEvent(event))
        return
      }

      if (isPasteEvent(event)) {
        listener({type: 'paste', text: event.text})
        return
      }

      if (isMouseEvent(event)) {
        const mouseEvent = translateTermMouseEvent(event)
        if (mouseEvent) {
          listener(mouseEvent)
        }
        return
      }
    })
  }

  /**
   * Subscribe to terminal resize events.
   * Returns an unsubscribe function.
   */
  onResize(listener: () => void): () => void {
    return this.#terminal.onResize(() => listener())
  }

  /**
   * Listen for raw data once (for iTerm2 proprietary escape sequences, etc.)
   */
  onceRawData(fn: (...args: any[]) => void): void {
    this.#terminal.onceRawData(fn)
  }
}

// --- ViewConstructor type ---

type ViewConstructor<T extends View> = (
  program: TerminalProgram,
) => T | Promise<T>

/**
 * A ViewConstructor that receives a Program (for use with Screen constructor directly).
 */
export type ProgramViewConstructor<T extends View> = (
  program: Program,
) => T | Promise<T>

type ScreenKeyListener = (char: string, key: KeyEvent) => void

export interface ScreenOptions {
  quitChar?: 'C-c' | 'C-q' | '' | undefined | false
  emoji?: boolean
}

export type ScreenEventUnsubscribe = () => void

interface ScreenEventMap {
  focusChange: (view: View | undefined) => void
}

export class Screen {
  #program: Program
  #onExit?: () => void
  #keyListeners: {pattern: string; fn: ScreenKeyListener}[] = []
  #cleanupEvents?: () => void
  #cleanupResize?: () => void
  #isFocused: boolean

  rootView: View

  #buffer: Buffer
  #focusManager = new FocusManager()
  #modalManager = new ModalManager()
  #mouseManager = new MouseManager()
  #tickManager = new TickManager(() => this.render())
  #eventListeners: {
    [K in keyof ScreenEventMap]: Set<ScreenEventMap[K]>
  } = {
    focusChange: new Set(),
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
      quitChar: 'C-c',
      ...opts,
    }

    const program = new TerminalProgram()
    program.setup()

    const rootView =
      viewConstructor instanceof View
        ? viewConstructor
        : await viewConstructor(program)

    if (opts.emoji !== undefined) {
      rootView.theme = rootView.theme.merge({emoji: opts.emoji})
    }

    const screen = new Screen(program, rootView)
    screen.onExit(() => {
      program.teardown()
    })

    if (opts.quitChar) {
      screen.key(opts.quitChar, () => {
        screen.exit()
      })
    }

    screen.start()

    return [screen, program, rootView]
  }

  constructor(
    program: Program,
    rootView: View,
    {isFocused = true}: {isFocused?: boolean} = {},
  ) {
    this.#program = program
    this.#buffer = new Buffer()
    this.rootView = rootView
    this.#isFocused = isFocused
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
   * Register a key binding on the screen.
   * Pattern: 'escape', 'C-c', 'C-q', 'return', etc.
   */
  key(pattern: string | string[], fn: ScreenKeyListener): void {
    const patterns = Array.isArray(pattern) ? pattern : [pattern]
    for (const p of patterns) {
      this.#keyListeners.push({pattern: p, fn})
    }
  }

  /**
   * Called from Screen.start(). Don't call this yourself unless you wanted
   * to construct your own 'program'. I recommend starting with a
   * copy of the implementation of Screen.start.
   */
  start() {
    this.rootView.moveToScreen(this)

    this.#cleanupEvents = this.#program.onEvents(event => {
      if (event.type === 'key') {
        for (const {pattern, fn} of this.#keyListeners) {
          if (matchKeyPattern(pattern, event)) {
            fn(event.char, event)
          }
        }
      }

      this.trigger(event)
    })

    this.#cleanupResize = this.#program.onResize(() => {
      this.trigger({type: 'resize'})
    })

    this.render()
  }

  /**
   * Puts the screen back in normal terminal mode, restores the normal buffer
   */
  stop() {
    this.#tickManager.stop()
    this.rootView.moveToScreen(undefined)
    this.#cleanupEvents?.()
    this.#cleanupResize?.()
    this.#cleanupEvents = undefined
    this.#cleanupResize = undefined
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
      case 'paste':
        this.triggerPaste(event.text)
        break
      case 'mouse': {
        this.triggerMouse(event)
        break
      }
    }

    this.render()
  }

  /**
   * Requests a modal to be presented. The modal is pushed onto a stack and
   * rendered after the main view tree. Multiple modals can be stacked.
   */
  requestModal(modal: Modal, rect: Rect) {
    return this.#modalManager.requestModal(modal, rect)
  }

  /**
   * @return boolean Whether the current view has focus
   */
  registerFocus(view: View, isDefault: boolean): boolean {
    return this.#focusManager.registerFocus(view, isDefault)
  }

  registerHotKey(view: View, key: HotKeyDef) {
    return this.#focusManager.registerHotKey(view, key)
  }

  registerKeyboard(view: View) {
    return this.#focusManager.registerKeyboard(view)
  }

  requestFocus(view: View) {
    return this.#focusManager.requestFocus(view)
  }

  get currentFocusView(): View | undefined {
    return this.#focusManager.currentFocusView
  }

  get hotKeyViews(): [View, HotKeyDef][] {
    return this.#focusManager.hotKeyViews
  }

  /**
   * Subscribe to a screen event. Returns an unsubscribe function.
   */
  on<K extends keyof ScreenEventMap>(
    event: K,
    listener: ScreenEventMap[K],
  ): ScreenEventUnsubscribe {
    this.#eventListeners[event].add(listener)
    return () => {
      this.#eventListeners[event].delete(listener)
    }
  }

  #emit<K extends keyof ScreenEventMap>(
    event: K,
    ...args: Parameters<ScreenEventMap[K]>
  ) {
    for (const listener of this.#eventListeners[event]) {
      ;(listener as (...a: any[]) => void)(...args)
    }
  }

  triggerKeyboard(event: KeyEvent) {
    event = translateKeyEvent(event)
    this.#focusManager.trigger(event)
  }

  triggerPaste(text: string) {
    this.#focusManager.triggerPaste(text)
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

  /**
   * Manually advance tick animations by `dt` milliseconds.
   * Useful for testing animations without real timers.
   */
  tick(dt: number) {
    this.#tickManager.triggerTick(dt)
  }

  preRender(view: View) {
    this.#modalManager.reset()
    this.#tickManager.reset()
    this.#mouseManager.reset()
    this.#focusManager.reset(view === this.rootView)

    if (!this.#isFocused) {
      this.#focusManager.unfocus()
    }
  }

  /**
   * @return boolean Whether or not to rerender the view due to focus or mouse change
   */
  commit() {
    const system = new UnboundSystem(this.#focusManager)
    const focusNeedsRender = this.#focusManager.commit()
    const mouseNeedsRender = this.#mouseManager.commit(system)

    if (focusNeedsRender) {
      this.#emit('focusChange', this.#focusManager.currentFocusView)
    }

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

    const size = this.rootView.naturalSize(screenSize).min(screenSize)
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
  if (event.full === 'A-b') {
    return {
      type: 'key',
      full: 'A-left',
      name: 'left',
      ctrl: false,
      alt: true,
      gui: false,
      shift: false,
      char: '1;9D',
    }
  }
  if (event.full === 'A-f') {
    return {
      type: 'key',
      full: 'A-right',
      name: 'right',
      ctrl: false,
      alt: true,
      gui: false,
      shift: false,
      char: '1;9C',
    }
  }
  return event
}
