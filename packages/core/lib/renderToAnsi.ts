import {Buffer} from './Buffer.js'
import {Viewport} from './Viewport.js'
import {Size} from './geometry.js'
import {StringTerminal} from './StringTerminal.js'
import type {View} from './View.js'
import type {Screen} from './Screen.js'
import type {HotKeyDef, MouseEventListenerName} from './events/index.js'

/**
 * A minimal Screen-like object for headless rendering.
 * Viewport calls various registration methods on Screen during render —
 * these are all no-ops for screenshot/offscreen purposes.
 */
export function createHeadlessScreen(): Screen {
  return {
    render() {},
    needsRender() {},
    requestModal() {
      return false
    },
    get currentFocusView() {
      return undefined
    },
    get hotKeyViews(): [View, HotKeyDef][] {
      return []
    },
    on() {
      return () => {}
    },
    registerHotKey(_view: View, _key: HotKeyDef) {},
    registerKeyboard(_view: View) {},
    registerFocus(_view: View, _isDefault: boolean) {
      return false
    },
    registerMouse(
      _view: View,
      _offset: any,
      _point: any,
      _events: MouseEventListenerName[],
    ) {},
    registerTick(_view: View) {},
    checkMouse(_view: View, _x: number, _y: number) {},
  } as unknown as Screen
}

/**
 * Render a View to an ANSI string at the given size, without needing a real terminal.
 *
 * @param view - The View (or Container) to render
 * @param size - The terminal size to render at {width, height}
 * @returns A string containing ANSI escape codes representing the rendered output
 */
export function renderToAnsi(
  view: View,
  size: {width: number; height: number},
): string {
  const termSize = new Size(size.width, size.height)
  const buffer = new Buffer()
  buffer.resize(termSize)

  const screen = createHeadlessScreen()
  const renderSize = view.naturalSize(termSize).max(termSize)
  const viewport = new Viewport(screen, buffer, renderSize)
  view.render(viewport)

  const terminal = new StringTerminal({cols: size.width, rows: size.height})
  buffer.flush(terminal)

  return terminal.output
}
