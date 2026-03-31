/**
 * Test utilities for headless component rendering and interaction.
 *
 * Usage:
 *   const t = testRender(<view>, {width: 40, height: 10})
 *   expect(t.terminal.textContent()).toContain('Hello')
 *   expect(t.terminal.styleOf('Hello')?.bold).toBe(true)
 *
 *   t.sendKey('a')
 *   t.sendKey('tab')
 *   t.sendKey('return', {ctrl: true})
 *   t.sendMouse('mouse.button.down', {x: 5, y: 2})
 *
 *   // Re-renders automatically after events, query again:
 *   expect(t.terminal.charAt(0, 0)).toBe('a')
 */
import {type KeyName} from '@teaui/term'
import {Buffer} from './Buffer.js'
import {Viewport} from './Viewport.js'
import {Size, Point, Rect} from './geometry.js'
import {TestTerminal} from './TestTerminal.js'
import type {View} from './View.js'
import type {Screen} from './Screen.js'
import type {
  KeyEvent,
  SystemMouseEvent,
  HotKeyDef,
  MouseEventListenerName,
} from './events/index.js'
import type {Modal} from './components/Modal.js'
import {FocusManager} from './managers/FocusManager.js'
import {MouseManager} from './managers/MouseManager.js'
import {ModalManager} from './managers/ModalManager.js'
import {TickManager} from './managers/TickManager.js'
import {UnboundSystem} from './System.js'
import {Space} from './components/Space.js'
import type {ScreenEventUnsubscribe} from './Screen.js'

class TestScreen {
  #view: View
  #buffer: Buffer
  #terminal: TestTerminal
  #size: Size
  #focus: boolean
  #focusManager: FocusManager
  #mouseManager: MouseManager
  #modalManager: ModalManager
  #tickManager: TickManager
  #screenProxy: Screen | null = null
  #focusChangeListeners = new Set<(view: View | undefined) => void>()

  constructor(
    view: View,
    readonly options: {width: number; height: number; isFocused?: boolean},
  ) {
    this.#view = view
    this.#focus = options.isFocused !== false
    this.#size = new Size(options.width, options.height)
    this.#buffer = new Buffer()
    this.#terminal = new TestTerminal({
      cols: options.width,
      rows: options.height,
    })
    this.#focusManager = new FocusManager()
    this.#mouseManager = new MouseManager()
    this.#modalManager = new ModalManager()
    this.#tickManager = new TickManager(() => this.render())

    // Wire the view to this screen
    view.moveToScreen(this.asScreen())
    this.render()
  }

  get terminal(): TestTerminal {
    return this.#terminal
  }

  get view(): View {
    return this.#view
  }

  /**
   * Advance time by `dt` milliseconds, triggering any registered tick
   * animations and re-rendering.
   */
  tick(dt: number) {
    this.#tickManager.triggerTick(dt)
    this.render()
  }

  asScreen(): Screen {
    // Cache the screen proxy so moveToScreen identity checks work
    if (!this.#screenProxy) {
      const focusManager = this.#focusManager
      this.#screenProxy = {
        rootView: this.#view,
        preRender: (view: View) => {
          this.#modalManager.reset()
          this.#mouseManager.reset()
          this.#focusManager.reset(view === this.#view)
        },
        requestModal: (modal: Modal, rect: Rect) => {
          return this.#modalManager.requestModal(modal, rect)
        },
        get currentFocusView() {
          return focusManager.currentFocusView
        },
        get hotKeyViews(): [View, HotKeyDef][] {
          return focusManager.hotKeyViews
        },
        registerHotKey: (view: View, key: HotKeyDef) => {
          this.#focusManager.registerHotKey(view, key)
        },
        registerKeyboard: (view: View) => {
          this.#focusManager.registerKeyboard(view)
        },
        registerFocus: (view: View, isDefault: boolean) => {
          return this.#focusManager.registerFocus(view, isDefault)
        },
        registerMouse: (
          view: View,
          offset: Point,
          point: Point,
          events: MouseEventListenerName[],
        ) => {
          this.#mouseManager.registerMouse(view, offset, point, events)
        },
        registerTick: (view: View) => {
          this.#tickManager.registerTick(view)
        },
        checkMouse: (view: View, x: number, y: number) => {
          this.#mouseManager.checkMouse(view, x, y)
        },
        on: (
          event: string,
          listener: (...args: any[]) => void,
        ): ScreenEventUnsubscribe => {
          if (event === 'focusChange') {
            this.#focusChangeListeners.add(listener as any)
            return () => {
              this.#focusChangeListeners.delete(listener as any)
            }
          }
          return () => {}
        },
        needsRender: () => {
          // In test mode, renders are explicit — ignore async render requests
        },
      } as unknown as Screen
    }
    return this.#screenProxy
  }

  render() {
    this.#buffer.resize(this.#size)

    this.#modalManager.reset()
    this.#focusManager.reset(true)
    this.#mouseManager.reset()

    if (!this.#focus) {
      this.#focusManager.unfocus()
      this.#focusManager.requestFocus(new Space())
    }

    const renderSize = this.#view.naturalSize(this.#size).min(this.#size)
    const viewport = new Viewport(this.asScreen(), this.#buffer, renderSize)
    this.#view.render(viewport)

    // Modals need the full screen size to position overlays (e.g. dropdowns),
    // matching Screen.render() which uses naturalSize.max(screenSize).
    const modalViewport = new Viewport(
      this.asScreen(),
      this.#buffer,
      this.#size,
    )
    const rerenderView = this.#modalManager.renderModals(
      this.asScreen(),
      modalViewport,
    )
    const focusNeedsRender = this.#focusManager.commit()
    if (focusNeedsRender) {
      for (const listener of this.#focusChangeListeners) {
        listener(this.#focusManager.currentFocusView)
      }
      // Match Screen.render(): re-render with the same viewport, no
      // mouse manager reset (so modal button registrations are preserved).
      rerenderView.render(modalViewport)
      this.#focusManager.commit()
    }

    this.#tickManager.endRender()

    this.#terminal.reset()
    this.#buffer.invalidate()
    this.#buffer.flush(this.#terminal)
  }

  sendKey(
    key: KeyName,
    mods: {ctrl?: boolean; alt?: boolean; gui?: boolean; shift?: boolean} = {},
  ) {
    const ctrl = mods.ctrl ?? false
    const alt = mods.alt ?? false
    const gui = mods.gui ?? false
    const shift = mods.shift ?? false

    let full = ''
    if (ctrl) full += 'C-'
    if (alt) full += 'A-'
    if (gui) full += 'G-'
    if (shift) full += 'S-'
    full += key

    const char = key === 'space' ? ' ' : key.length === 1 ? key : ''

    const event: KeyEvent = {
      type: 'key',
      name: key,
      char,
      full: full as import('./events/index.js').FullKeyName,
      ctrl,
      alt,
      gui,
      shift,
    }

    this.#focusManager.trigger(event)
    this.render()
  }

  sendMouse(
    name: SystemMouseEvent['name'],
    pos: {x: number; y: number},
    mods: {ctrl?: boolean; alt?: boolean; gui?: boolean; shift?: boolean} = {},
  ) {
    const button = name.startsWith('mouse.wheel')
      ? ('wheel' as const)
      : name === 'mouse.move.in'
        ? ('unknown' as const)
        : ('left' as const)

    const event: SystemMouseEvent = {
      type: 'mouse',
      name,
      x: pos.x,
      y: pos.y,
      ctrl: mods.ctrl ?? false,
      alt: mods.alt ?? false,
      gui: mods.gui ?? false,
      shift: mods.shift ?? false,
      button,
    }

    const system = new UnboundSystem(this.#focusManager)
    this.#mouseManager.trigger(event, system)
    this.render()
  }

  sendPaste(text: string) {
    this.#focusManager.triggerPaste(text)
    this.render()
  }
}

/**
 * Render a component headlessly and return a test harness for interaction testing.
 *
 * @example
 * ```ts
 * const t = testRender(new Input({value: 'hello'}), {width: 20, height: 1})
 * expect(t.terminal.textContent()).toContain('hello')
 * t.sendKey('!') // type a character
 * expect(t.terminal.textContent()).toContain('hello!')
 * ```
 */
export function testRender(
  view: View,
  size: {width: number; height: number; isFocused?: boolean},
): TestScreen {
  return new TestScreen(view, size)
}
