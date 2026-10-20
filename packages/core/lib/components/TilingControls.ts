import type {Viewport} from '../Viewport.js'
import {View} from '../View.js'
import {Point, Rect, Size} from '../geometry.js'
import {Style} from '../Style.js'
import {
  type HotKeyDef,
  type KeyEvent,
  type MouseEvent,
  isMouseClicked,
  match,
} from '../events/index.js'

export type TilingMode = 'focus' | 'move' | 'size'
export type TilingDirection = 'up' | 'down' | 'left' | 'right'
export type TilingOrder = 'first' | 'prev' | 'next' | 'last'

/**
 * What the controls ask of the layout (see `TiledLayout`). The state lives in
 * the layout, so that it follows the active window.
 */
export interface TilingControlsDelegate {
  readonly mode: TilingMode | undefined
  setMode(mode: TilingMode | undefined): void
  /** Whether the panel is shown (the keys, or the current mode). */
  readonly isExpanded: boolean
  setExpanded(isExpanded: boolean): void
  /**
   * An arrow key or arrow button. In 'focus' and 'move' mode, picks the window
   * in that direction. In 'size' mode, moves an edge in that direction: the
   * edge on that side (growing), or with `shift`, the opposite edge
   * (shrinking).
   */
  direction(direction: TilingDirection, shift: boolean): void
  /** h/j/k/l in 'focus' and 'move' mode. */
  order(order: TilingOrder): void
  toggleFullscreen(): void
  toggleFloating(): void
}

type Action =
  | {type: 'mode'; mode: TilingMode}
  | {type: 'fullscreen'}
  | {type: 'floating'}
  | {type: 'direction'; direction: TilingDirection}
  | {type: 'order'; order: TilingOrder}
  | {type: 'escape'}
  | {type: 'shift'}

/**
 * A clickable area of a panel, relative to the panel's interior.
 */
interface Target {
  x: number
  y: number
  width: number
  action: Action
}

interface Panel {
  title: string
  /** The width inside the border. */
  width: number
  rows: readonly string[]
  targets: readonly Target[]
}

type Hover = 'toggle' | Target | undefined

/**
 * Placement controls for the active window of a tiled `Desktop`: a 3×1 button
 * on the bottom border (at x: 1) that expands into a panel in the bottom-left
 * corner. Without a mode, the panel lists the keys; with a mode, it shows that
 * mode's keys (which can also be clicked).
 *
 * - ⌥w: focus mode. Arrows pick a window by direction; h/j/k/l pick the
 *   first/previous/next/last window.
 * - ⌥m: move mode. Same keys, but the active window swaps places with the
 *   window.
 * - ⌥r: size (resize) mode. Arrows move the edge on that side outward;
 *   ⇧arrows move the opposite edge inward.
 * - esc: closes the mode (then the panel).
 * - ⌥z: fullscreen (zoom). ⌥t: modal (floating).
 *
 * The keys avoid the ⌥ keys that terminals and text fields use: ⌥b and ⌥f
 * (which macOS terminals send for ⌥← and ⌥→), ⌥d, and the letters that `Input`
 * uses for accents.
 *
 * The keys work whether or not the panel is shown. The controls are added to
 * the window as an overlay (`window.addOverlay`), so they're given the
 * window's whole frame.
 */
export class TilingControls extends View {
  #delegate: TilingControlsDelegate
  #hover: Hover
  // the (⇧) button in the size panel: arrow clicks shrink
  #isShiftLatched = false

  constructor(delegate: TilingControlsDelegate) {
    super()
    this.#delegate = delegate
  }

  naturalSize(available: Size): Size {
    return available
  }

  receiveKey(event: KeyEvent) {
    const delegate = this.#delegate
    const mode = delegate.mode
    if (match(FOCUS_KEY, event)) {
      this.#perform({type: 'mode', mode: 'focus'})
    } else if (match(MOVE_KEY, event)) {
      this.#perform({type: 'mode', mode: 'move'})
    } else if (match(SIZE_KEY, event)) {
      this.#perform({type: 'mode', mode: 'size'})
    } else if (match(FULLSCREEN_KEY, event)) {
      this.#perform({type: 'fullscreen'})
    } else if (match(FLOATING_KEY, event)) {
      this.#perform({type: 'floating'})
    } else if (event.name === 'escape') {
      this.#perform({type: 'escape'})
    } else if (!mode) {
      return
    } else if (isDirection(event.name)) {
      delegate.direction(event.name, event.shift)
    } else if (mode !== 'size' && event.name in ORDER_KEYS) {
      delegate.order(ORDER_KEYS[event.name])
    }
  }

  #perform(action: Action, shift = false) {
    const delegate = this.#delegate
    switch (action.type) {
      case 'mode':
        this.#isShiftLatched = false
        delegate.setMode(action.mode)
        break
      case 'fullscreen':
        delegate.toggleFullscreen()
        break
      case 'floating':
        delegate.toggleFloating()
        break
      case 'direction':
        delegate.direction(action.direction, shift || this.#isShiftLatched)
        break
      case 'order':
        delegate.order(action.order)
        break
      case 'shift':
        this.#isShiftLatched = !this.#isShiftLatched
        this.invalidateRender()
        break
      case 'escape':
        // closes the mode, then the panel
        if (delegate.mode) {
          delegate.setMode(undefined)
        } else {
          delegate.setExpanded(false)
        }
        break
    }
  }

  receiveMouse(event: MouseEvent) {
    const hover = this.#hoverAt(event.position)
    if (event.name.startsWith('mouse.move.') || isMouseClicked(event)) {
      this.#setHover(event.name.endsWith('.exit') ? undefined : hover)
    }

    if (!isMouseClicked(event) || !hover) {
      return
    }

    if (hover === 'toggle') {
      const delegate = this.#delegate
      if (delegate.isExpanded) {
        delegate.setMode(undefined)
        delegate.setExpanded(false)
      } else {
        delegate.setExpanded(true)
      }
    } else {
      this.#perform(hover.action, event.shift)
    }
  }

  #setHover(hover: Hover) {
    if (hover !== this.#hover) {
      this.#hover = hover
      this.invalidateRender()
    }
  }

  render(viewport: Viewport) {
    const {mode, isExpanded} = this.#delegate
    for (const key of LEADER_KEYS) {
      viewport.registerHotKey(key)
    }
    if (mode) {
      for (const key of mode === 'size' ? SIZE_MODE_KEYS : MOVE_MODE_KEYS) {
        viewport.registerHotKey(key)
      }
    } else if (isExpanded) {
      viewport.registerHotKey(ESCAPE_KEY)
    }

    if (viewport.isEmpty) {
      return
    }

    const size = viewport.contentSize
    const toggle = toggleRect(size)
    viewport.registerMouse(['mouse.button.left', 'mouse.move'], toggle)
    // highlighted while the panel is open, or a mode is active
    const isToggleHighlighted =
      isExpanded || mode !== undefined || this.#hover === 'toggle'
    viewport.write(
      isToggleHighlighted
        ? HIGHLIGHT_LEFT + TOGGLE + HIGHLIGHT_RIGHT
        : CAP_LEFT + TOGGLE + CAP_RIGHT,
      toggle.origin,
      isToggleHighlighted ? this.#highlightStyle() : this.#borderStyle(),
    )

    const panel = this.#panel()
    const rect = panel && panelRect(panel, size)
    if (panel && rect) {
      this.#renderPanel(viewport, panel, rect)
    }
  }

  #panel(): Panel | undefined {
    const {mode, isExpanded} = this.#delegate
    if (!isExpanded) {
      return undefined
    }
    return mode ? MODE_PANELS[mode] : KEYS_PANEL
  }

  #renderPanel(viewport: Viewport, panel: Panel, rect: Rect) {
    viewport.registerMouse(['mouse.button.left', 'mouse.move'], rect)

    const {x, y} = rect.origin
    const innerWidth = rect.size.width - 2
    const borderStyle = this.#borderStyle()
    const panelStyle = this.#panelStyle()
    viewport.write(
      PANEL_TOP_LEFT +
        (PANEL_HORIZONTAL + panel.title).padEnd(innerWidth, PANEL_HORIZONTAL) +
        PANEL_TOP_RIGHT,
      new Point(x, y),
      borderStyle,
    )
    panel.rows.forEach((row, index) => {
      const rowY = y + 1 + index
      viewport.write(PANEL_VERTICAL, new Point(x, rowY), borderStyle)
      viewport.write(row.padEnd(innerWidth), new Point(x + 1, rowY), panelStyle)
      viewport.write(
        PANEL_VERTICAL,
        new Point(x + 1 + innerWidth, rowY),
        borderStyle,
      )
    })
    viewport.write(
      PANEL_BOTTOM_LEFT +
        PANEL_HORIZONTAL.repeat(innerWidth) +
        PANEL_BOTTOM_RIGHT,
      new Point(x, y + 1 + panel.rows.length),
      borderStyle,
    )

    for (const target of panel.targets) {
      const isHighlighted =
        this.#hover === target ||
        (target.action.type === 'shift' && this.#isShiftLatched)
      if (!isHighlighted) {
        continue
      }
      const text = [...panel.rows[target.y]]
        .slice(target.x, target.x + target.width)
        .join('')
      viewport.write(
        text,
        new Point(x + 1 + target.x, y + 1 + target.y),
        this.#highlightStyle(),
      )
    }
  }

  #hoverAt(position: Point): Hover {
    const size = this.contentSize
    if (toggleRect(size).includes(position)) {
      return 'toggle'
    }

    const panel = this.#panel()
    const rect = panel && panelRect(panel, size)
    if (!panel || !rect) {
      return undefined
    }

    const x = position.x - rect.origin.x - 1
    const y = position.y - rect.origin.y - 1
    return panel.targets.find(
      target => target.y === y && x >= target.x && x < target.x + target.width,
    )
  }

  #borderStyle(): Style {
    return this.purpose.text()
  }

  #panelStyle(): Style {
    return new Style({background: this.purpose.flatBackgroundColor})
  }

  #highlightStyle(): Style {
    return this.purpose.ui({isHover: true})
  }
}

function toggleRect(size: Size): Rect {
  return new Rect([TOGGLE_X, size.height - 1], [TOGGLE_WIDTH, 1])
}

/**
 * The panel is drawn above the toggle button, in the bottom-left corner. If it
 * doesn't fit between the title bar and the bottom border, it isn't shown (the
 * keys still work).
 */
function panelRect(panel: Panel, size: Size): Rect | undefined {
  const width = panel.width + 2
  const height = panel.rows.length + 2
  const origin = new Point(TOGGLE_X, size.height - 1 - height)
  if (origin.y < 1 || origin.x + width > size.width - 1) {
    return undefined
  }
  return new Rect(origin, [width, height])
}

function isDirection(name: string): name is TilingDirection {
  return name === 'up' || name === 'down' || name === 'left' || name === 'right'
}

// like Vim's ⌃w window commands
const FOCUS_KEY: HotKeyDef = {char: 'w', alt: true}
const MOVE_KEY: HotKeyDef = {char: 'm', alt: true}
// like i3's resize mode
const SIZE_KEY: HotKeyDef = {char: 'r', alt: true}
// like tmux's zoom
const FULLSCREEN_KEY: HotKeyDef = {char: 'z', alt: true}
// like xmonad's toggle between tiled and floating
const FLOATING_KEY: HotKeyDef = {char: 't', alt: true}
const LEADER_KEYS: readonly HotKeyDef[] = [
  FOCUS_KEY,
  SIZE_KEY,
  MOVE_KEY,
  FULLSCREEN_KEY,
  FLOATING_KEY,
]

const ORDER_KEYS: Record<string, TilingOrder> = {
  h: 'first',
  j: 'prev',
  k: 'next',
  l: 'last',
}

const DIRECTIONS: readonly TilingDirection[] = ['up', 'down', 'left', 'right']
const ESCAPE_KEY: HotKeyDef = {char: 'escape'}
const ARROW_KEYS: HotKeyDef[] = DIRECTIONS.map(char => ({char}))
const MOVE_MODE_KEYS: readonly HotKeyDef[] = [
  ESCAPE_KEY,
  ...ARROW_KEYS,
  ...Object.keys(ORDER_KEYS).map(char => ({char})),
]
const SIZE_MODE_KEYS: readonly HotKeyDef[] = [
  ESCAPE_KEY,
  ...ARROW_KEYS,
  ...DIRECTIONS.map(char => ({char, shift: true})),
]

const TOGGLE_X = 1
const TOGGLE_WIDTH = 3
const TOGGLE = '⊞'
const CAP_LEFT = '╡'
const CAP_RIGHT = '╞'
const HIGHLIGHT_LEFT = '╣'
const HIGHLIGHT_RIGHT = '╠'

const PANEL_TOP_LEFT = '╭'
const PANEL_TOP_RIGHT = '╮'
const PANEL_BOTTOM_LEFT = '╰'
const PANEL_BOTTOM_RIGHT = '╯'
const PANEL_HORIZONTAL = '─'
const PANEL_VERTICAL = '│'

const KEYS_PANEL: Panel = {
  title: 'keys',
  width: 8,
  rows: ['⌥w focus', '⌥r size', '⌥m move', '⌥z full', '⌥t modal'],
  targets: [
    {x: 0, y: 0, width: 8, action: {type: 'mode', mode: 'focus'}},
    {x: 0, y: 1, width: 8, action: {type: 'mode', mode: 'size'}},
    {x: 0, y: 2, width: 8, action: {type: 'mode', mode: 'move'}},
    {x: 0, y: 3, width: 8, action: {type: 'fullscreen'}},
    {x: 0, y: 4, width: 8, action: {type: 'floating'}},
  ],
}

const MODE_PANEL_WIDTH = 6
const ESCAPE_TARGET: Target = {x: 1, y: 3, width: 3, action: {type: 'escape'}}

function windowPanel(title: string): Panel {
  return {
    title,
    width: MODE_PANEL_WIDTH,
    rows: ['h ▲ j', '◀   ▶', 'k ▼ l', ' esc'],
    targets: [
      {x: 0, y: 0, width: 1, action: {type: 'order', order: 'first'}},
      {x: 2, y: 0, width: 1, action: {type: 'direction', direction: 'up'}},
      {x: 4, y: 0, width: 1, action: {type: 'order', order: 'prev'}},
      {x: 0, y: 1, width: 1, action: {type: 'direction', direction: 'left'}},
      {x: 4, y: 1, width: 1, action: {type: 'direction', direction: 'right'}},
      {x: 0, y: 2, width: 1, action: {type: 'order', order: 'next'}},
      {x: 2, y: 2, width: 1, action: {type: 'direction', direction: 'down'}},
      {x: 4, y: 2, width: 1, action: {type: 'order', order: 'last'}},
      ESCAPE_TARGET,
    ],
  }
}

const MODE_PANELS: Record<TilingMode, Panel> = {
  focus: windowPanel('focus'),
  move: windowPanel('move'),
  size: {
    title: 'size',
    width: MODE_PANEL_WIDTH,
    rows: ['(⇧)▲', ' ◀   ▶', '   ▼', ' esc'],
    targets: [
      {x: 0, y: 0, width: 3, action: {type: 'shift'}},
      {x: 3, y: 0, width: 1, action: {type: 'direction', direction: 'up'}},
      {x: 1, y: 1, width: 1, action: {type: 'direction', direction: 'left'}},
      {x: 5, y: 1, width: 1, action: {type: 'direction', direction: 'right'}},
      {x: 3, y: 2, width: 1, action: {type: 'direction', direction: 'down'}},
      ESCAPE_TARGET,
    ],
  },
}
