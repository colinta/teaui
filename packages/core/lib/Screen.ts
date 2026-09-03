import type {Rect, Point} from './geometry.js'
import {Size} from './geometry.js'
import {type Program, type ScreenOptions, type Unsubscribe} from './types.js'
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
import {TerminalProgram} from './TerminalProgram.js'
import {FocusManager} from './managers/FocusManager.js'
import type {Modal} from './components/Modal.js'
import {ModalManager} from './managers/ModalManager.js'
import {MouseManager} from './managers/MouseManager.js'
import {TickManager} from './managers/TickManager.js'
import {Window} from './components/Window.js'
import {UnboundSystem} from './System.js'

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

type NaturalSizeRefreshState = 'idle' | 'refreshing' | 'refreshing-dirty'

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
  #isRunning = false
  #didStop = false
  #naturalSizeRefreshState: NaturalSizeRefreshState = 'idle'
  #renderRequestedDuringRegionUpdate = false

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

    const program = new TerminalProgram(opts.display)

    try {
      await program.setup()

      const rootView =
        viewConstructor instanceof View
          ? viewConstructor
          : await viewConstructor(program)

      if (opts.emoji !== undefined) {
        rootView.purpose = rootView.purpose.merge({emoji: opts.emoji})
      }

      await program.setupRootView(rootView)

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
    } catch (error) {
      try {
        program.teardown()
      } catch {
        // Preserve the startup error after making a best effort to restore the terminal.
      }
      throw error
    }
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
    this.#isRunning = true
    this.rootView.moveToScreen(this)

    this.#cleanupEvents = this.#program.onEvents(event => {
      if (event.type === 'key') {
        for (const {pattern, fn} of this.#keyListeners) {
          if (matchKeyPattern(pattern, event)) {
            fn(event.char, event)
            if (!this.#isRunning) return
          }
        }
      }

      this.trigger(event)
    })

    this.#cleanupResize = this.#program.onResize(() => {
      // A resize can move an inline region without changing its logical size.
      // Always discard the physical-frame diff so every logical cell repaints.
      this.#buffer.invalidate()
      this.trigger({type: 'resize'})
    })

    this.render()
  }

  /**
   * Puts the screen back in normal terminal mode, restores the normal buffer
   */
  stop() {
    if (this.#didStop) return
    this.#didStop = true
    this.#isRunning = false
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

    const exitProcess = () => process.exit(0)
    if (process.stdout.writable && !process.stdout.writableEnded) {
      // Teardown may have queued cursor movement and erase sequences. Wait for
      // stdout to process them before forcing the process to exit.
      process.stdout.write('', exitProcess)
    } else {
      setTimeout(exitProcess, 0)
    }
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
  ): Unsubscribe {
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
    if (this.#focusManager.determineFocus()) {
      this.#emit('focusChange', this.#focusManager.currentFocusView)
    }

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

  viewNaturalSizeDidChange(view: View): void {
    if (view !== this.rootView || !this.#isRunning) return
    if (this.#naturalSizeRefreshState !== 'idle') {
      this.#naturalSizeRefreshState = 'refreshing-dirty'
      return
    }

    this.#naturalSizeRefreshState = 'refreshing'
    void this.#refreshNaturalHeight().catch(error => {
      queueMicrotask(() => {
        throw error
      })
    })
  }

  async #refreshNaturalHeight(): Promise<void> {
    try {
      while (this.#isRunning) {
        this.#naturalSizeRefreshState = 'refreshing'
        const didChangeHeight = await this.#program.refreshHeight()
        if (this.#isRunning) {
          if (didChangeHeight) {
            this.#buffer.invalidate()
            this.render()
          } else if (this.#renderRequestedDuringRegionUpdate) {
            this.render()
          }
        }

        if (!this.#isNaturalSizeRefreshDirty()) return
      }
    } finally {
      this.#naturalSizeRefreshState = 'idle'
    }
  }

  #isNaturalSizeRefreshDirty(): boolean {
    return this.#naturalSizeRefreshState === 'refreshing-dirty'
  }

  render() {
    if (this.#program.isUpdatingRegion) {
      this.#renderRequestedDuringRegionUpdate = true
      return
    }
    this.#renderRequestedDuringRegionUpdate = false

    const screenSize = new Size(this.#program.cols, this.#program.rows)
    this.#buffer.resize(screenSize)

    // this may be called again by renderModals, before the last modal renders
    this.preRender(this.rootView)

    const viewport = new Viewport(this, this.#buffer, screenSize)
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
