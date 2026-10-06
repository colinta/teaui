import type {Mutable} from './geometry.js'
import type {Viewport} from './Viewport.js'
import type {Screen} from './Screen.js'
import type {Purpose} from './Palette.js'
import {Palette} from './Palette.js'
import type {ComposedView} from './ComposedView.js'
import {System} from './System.js'
import {
  isMouseEnter,
  isMouseExit,
  isMousePressStart,
  isMousePressExit,
  normalizeHotKey,
  toHotKeyDef,
  type FocusEventName,
  type HotKey,
  type HotKeyDef,
  type KeyEvent,
  type MouseDestination,
  type MouseEvent,
  type MouseEventListenerName,
} from './events/index.js'
import {Point, Size, Rect} from './geometry.js'
import {Color} from './Color.js'
import {Style} from './Style.js'
import {type Edges, type LegendItem} from './types.js'
import {toPaddingEdges} from './util.js'

export type Dimension = number | 'fill' | 'shrink' | 'natural'
export type FlexSize = 'natural' | number
export type FlexShorthand = FlexSize | `flex${number}`

export function parseFlexShorthand(flex: FlexShorthand): FlexSize {
  if (flex === 'natural') {
    return 'natural'
  } else if (typeof flex === 'string') {
    return +flex.slice('flex'.length) // 'flexN'
  }
  return flex
}

export type Pin = 'horizontal' | 'vertical'

/**
 * Called with every mouse event the listener is subscribed to. `event.position`
 * is relative to the view's content (the same coordinate space as `contentSize`),
 * so a listener can ignore events along the edges, for example.
 */
export type MouseListener = (
  event: MouseEvent,
  contentSize: Size,
  system: System,
) => void
export type KeyboardListener = (event: KeyEvent, contentSize: Size) => void
export type FocusListener = (isFocused: boolean) => void
/** Removes the listener. Safe to call more than once. */
export type RemoveListener = () => void

export interface MouseListenerOptions {
  /**
   * - omitted: "piggy-back" on the events the view registered for itself
   *   (the events that reach `receiveMouse`). No registration is made.
   * - a list of event names, or `true` for all of them (`mouse.move`,
   *   `mouse.button.all`, `mouse.wheel`): the listener registers for exactly
   *   those events over the view's content area. These events are *not* sent
   *   to `receiveMouse`, and the view's own registrations are not widened.
   */
  events?: MouseEventListenerName[] | true
}

export interface KeyboardListenerOptions {
  /**
   * - omitted: "piggy-back" on the key events delivered to `receiveKey`
   *   (hotkeys, focused key events, keyboard fallback).
   * - a list of hotkeys (`'C-a'`, `'ctrl+a'`, `{char: 'a', ctrl: true}`): the
   *   listener is called when one of them is pressed.
   * - `true`: the listener is called for every key event.
   *
   * Explicit listeners only observe: they never consume the event or change
   * which view receives it.
   */
  events?: HotKey[] | true
}

export interface FocusListenerOptions {
  /**
   * - omitted: "piggy-back" on the view's own focus handling (the view must call
   *   `viewport.registerFocus()` itself). Both focus and blur are reported.
   * - a list of focus events, or `true` for both: the listener makes the view
   *   focusable, and is called for the listed events. The view's `receiveKey`,
   *   `didFocus` and `didBlur` are not involved.
   */
  events?: FocusEventName[] | true
  /**
   * Only used with `events`. Whether the view may take focus when nothing else
   * has it. Default false.
   */
  isDefault?: boolean
}

/**
 * The `mouseListener` / `keyboardListener` / `focusListener` props: a function
 * (piggy-backing on the view's own events), or the function and its options.
 */
export type MouseListenerProp =
  | MouseListener
  | ({listener: MouseListener} & MouseListenerOptions)
export type KeyboardListenerProp =
  | KeyboardListener
  | ({listener: KeyboardListener} & KeyboardListenerOptions)
export type FocusListenerProp =
  | FocusListener
  | ({listener: FocusListener} & FocusListenerOptions)

/**
 * A listener subscribed from a prop. The subscription calls through `callback`,
 * so a new function can replace the old one without re-subscribing.
 */
type PropListener = {
  callback: (...args: any[]) => void
  optionsKey: string
  remove: RemoveListener
}

const ALL_MOUSE_EVENTS: MouseEventListenerName[] = [
  'mouse.move',
  'mouse.button.all',
  'mouse.wheel',
]
const ALL_FOCUS_EVENTS: FocusEventName[] = ['focus.focus', 'focus.blur']

/**
 * Like `toHotKeyDef`, but the `char` is the key name that `KeyEvent.name` uses
 * ('up', 'escape', 'return'), not the sigil `toHotKeyDef` replaces it with for
 * display.
 */
function toKeyListenerDef(hotKey: HotKey): HotKeyDef {
  const normalized = normalizeHotKey(hotKey)
  if (typeof normalized !== 'string') {
    return normalized
  }

  return {
    ...toHotKeyDef(normalized),
    char: normalized.replace(/^([CAGS]-)*/, '').toLowerCase(),
  }
}

type MouseListenerRecord = {
  // undefined: piggy-backs on the view's own registrations
  names: MouseEventListenerName[] | undefined
  destination: MouseDestination
}
type KeyboardListenerRecord = {
  specs: (HotKeyDef | 'all')[] | undefined
  deliver: (event: KeyEvent) => void
}
type FocusListenerRecord = {
  events: FocusEventName[] | undefined
  isDefault: boolean
  callback: FocusListener
}

export interface Props {
  purpose?: Palette | Purpose
  /**
   * A heading for this view. Container views (Box, Page, Alert, Drawer, etc.)
   * can read this from their children to display a section heading without
   * requiring a wrapper component.
   */
  heading?: string
  // size and positioning
  x?: number
  y?: number
  width?: Dimension
  height?: Dimension
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  padding?: number | Partial<Edges>
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  isVisible?: boolean
  // if a background color is assigned, the viewport will be drawn with this
  // colour, and the default 'pen' will be assigned this colour as 'default
  // background'
  background?: Color
  // only used as a child of <Stack> views
  flex?: FlexShorthand
  /**
   * Pin this view's size to the visible rect in the given direction. Only
   * meaningful inside a scrollable Stack — a pinned view will not scroll in the
   * pinned direction and its size in that dimension will match the visible area
   * rather than the full content area.
   *
   * - `'horizontal'` — pin width to visible width (don't scroll horizontally)
   * - `'vertical'` — pin height to visible height (don't scroll vertically)
   */
  pin?: Pin
  /**
   * Adds a mouse listener, see `View.addMouseListener`. Either a function (which
   * piggy-backs on the events the view registered for itself), or an object with
   * the `listener` and its `events`:
   *
   *     <Text mouseListener={event => ...} />
   *     <Text mouseListener={{listener: onHover, events: ['mouse.move']}} />
   *
   * The subscription is kept across updates: passing a new function doesn't
   * re-subscribe (so hover state isn't reset); changing `events` does.
   */
  mouseListener?: MouseListenerProp
  /**
   * Adds a keyboard listener, see `View.addKeyboardListener`.
   *
   *     <Box keyboardListener={{listener: save, events: ['ctrl+s']}} />
   */
  keyboardListener?: KeyboardListenerProp
  /**
   * Adds a focus listener, see `View.addFocusListener`.
   *
   *     <Text focusListener={{listener: setFocused, events: true}} />
   */
  focusListener?: FocusListenerProp
  // use this however you want
  debug?: boolean
}

/**
 * How `view.removeFromParent()` asks its parent to let go of it. Not exported
 * from the package: `ComposedView` keeps `removeChild()` protected.
 */
export const REMOVE_CHILD = Symbol('removeChild')

export abstract class View {
  // id = performance.now().toString(36)
  parent: ComposedView | undefined = undefined
  debug: boolean = false

  #screen: Screen | undefined = undefined
  #purpose: Palette | undefined
  #prevSizeCache: Map<string, Size> = new Map()
  #viewportContentSize: Size = Size.zero
  #renderedContentSize: Size = Size.zero
  #renderedLocation: Point = Point.zero
  #invalidateParent = true

  #heading: string | undefined
  #x: Props['x']
  #y: Props['y']
  #width: Props['width']
  #height: Props['height']
  #minWidth: Props['minWidth']
  #minHeight: Props['minHeight']
  #maxWidth: Props['maxWidth']
  #maxHeight: Props['maxHeight']
  #isVisible: NonNullable<Props['isVisible']> = true
  #background: Props['background']
  padding: Edges | undefined
  flex: FlexSize = 'natural'
  pin: Pin | undefined = undefined

  // mouse handling helpers
  #isHover = false
  #isPressed = false
  #hasFocus = false

  // External listeners, see addMouseListener / addKeyboardListener / addFocusListener.
  // These arrays are replaced (never mutated), so a listener can add or remove
  // listeners while they're being notified.
  #mouseListeners: MouseListenerRecord[] = []
  #keyboardListeners: KeyboardListenerRecord[] = []
  #focusListeners: FocusListenerRecord[] = []
  // absolute location of the content, as of the last render
  #contentOrigin: Point = Point.zero
  // listeners from the mouseListener / keyboardListener / focusListener props
  #propMouseListener: PropListener | undefined
  #propKeyboardListener: PropListener | undefined
  #propFocusListener: PropListener | undefined

  /**
   * Receives the events this view registered for itself (`viewport.registerMouse`).
   * Updates hover/pressed state, calls `receiveMouse`, and then notifies the
   * listeners that piggy-back on the view's events. Subclasses don't need to call
   * `super.receiveMouse()` for any of this to work.
   */
  #nativeMouse: MouseDestination = {
    isNative: true,
    deliver: (event, system, location) => {
      if (isMousePressStart(event)) {
        this.#isPressed = true
      } else if (isMousePressExit(event)) {
        this.#isPressed = false
      }

      if (isMouseEnter(event)) {
        this.#isHover = true
      } else if (isMouseExit(event)) {
        this.#isHover = false
      }

      this.receiveMouse(event, system)
      for (const record of this.#mouseListeners) {
        if (!record.names) {
          record.destination.deliver(event, system, location)
        }
      }
    },
  }

  constructor(props: Props = {}) {
    this.#update(props)

    const render = this.render.bind(this)
    const naturalSize = this.naturalSize.bind(this)

    Object.defineProperties(this, {
      render: {
        enumerable: false,
        value: this.#renderWrap(render).bind(this),
      },
      naturalSize: {
        enumerable: false,
        value: this.#naturalSizeWrap(naturalSize).bind(this),
      },
      // don't want to include these in inspect output
      parent: {
        enumerable: false,
      },
      debug: {
        enumerable: false,
      },
    })
  }

  update(props: Props) {
    this.#update(props)
    this.invalidateSize()
  }

  #update({
    purpose,
    heading,
    x,
    y,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    isVisible,
    background,
    padding,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    flex,
    pin,
    mouseListener,
    keyboardListener,
    focusListener,
    debug,
  }: Props) {
    this.#purpose = typeof purpose === 'string' ? Palette[purpose] : purpose
    this.#heading = heading
    this.#x = x
    this.#y = y
    this.#width = width
    this.#height = height
    this.#minWidth = minWidth
    this.#minHeight = minHeight
    this.#maxWidth = maxWidth
    this.#maxHeight = maxHeight
    this.#isVisible = isVisible ?? true
    this.#background = background

    this.padding = toPaddingEdges(
      padding,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
    )
    this.flex = flex === undefined ? 'natural' : parseFlexShorthand(flex)
    this.pin = pin
    this.debug = debug ?? false

    this.#propMouseListener = this.#syncPropListener(
      this.#propMouseListener,
      mouseListener,
      (callback, options) => this.addMouseListener(callback, options),
    )
    this.#propKeyboardListener = this.#syncPropListener(
      this.#propKeyboardListener,
      keyboardListener,
      (callback, options) => this.addKeyboardListener(callback, options),
    )
    this.#propFocusListener = this.#syncPropListener(
      this.#propFocusListener,
      focusListener,
      (callback, options) => this.addFocusListener(callback, options),
    )

    Object.defineProperties(this, {
      // only include these if they were defined
      padding: {
        enumerable: padding !== undefined,
      },
      flex: {
        enumerable: flex !== undefined,
      },
      pin: {
        enumerable: pin !== undefined,
      },
    })
  }

  /**
   * Reconciles a listener prop with its current subscription. Returns the
   * subscription to keep, if any.
   */
  #syncPropListener(
    current: PropListener | undefined,
    prop:
      | ((...args: any[]) => void)
      | {listener: (...args: any[]) => void}
      | undefined,
    add: (callback: (...args: any[]) => void, options: any) => RemoveListener,
  ): PropListener | undefined {
    if (!prop) {
      current?.remove()
      return undefined
    }

    const {listener, ...options} =
      typeof prop === 'function' ? {listener: prop} : prop
    const optionsKey = JSON.stringify(options)
    if (current && current.optionsKey === optionsKey) {
      current.callback = listener
      return current
    }

    current?.remove()
    const subscription: PropListener = {
      callback: listener,
      optionsKey,
      remove: () => {},
    }
    subscription.remove = add(
      (...args) => subscription.callback(...args),
      options,
    )
    return subscription
  }

  get purpose(): Palette {
    return this.#purpose ?? this.parent?.childPalette(this) ?? Palette.plain
  }

  set purpose(value: Palette | Purpose | undefined) {
    this.#purpose = typeof value === 'string' ? Palette[value] : value
  }

  childPalette(_view: View) {
    return this.purpose
  }

  get heading(): string | undefined {
    return this.#heading
  }

  set heading(value: string | undefined) {
    this.#heading = value
    this.invalidateSize()
  }

  get isVisible(): boolean {
    return this.#isVisible
  }

  set isVisible(value: boolean) {
    this.#isVisible = value
    this.invalidateSize()
  }

  get background(): Color | undefined {
    return this.#background
  }

  set background(value: Color | undefined) {
    this.#background = value
    this.invalidateSize()
  }

  get screen(): Screen | undefined {
    return this.#screen
  }

  get children(): readonly View[] {
    return []
  }

  get contentSize(): Size {
    return this.#renderedContentSize
  }

  /**
   * Where this view was last rendered, relative to its parent (for children of
   * a Scrollable, relative to the scrolled content). Views that have never been
   * rendered - e.g. never scrolled into view - report Point.zero.
   */
  get origin(): Point {
    return this.#renderedLocation
  }

  get isHover() {
    return this.#isHover
  }

  get isPressed() {
    return this.#isPressed
  }

  get hasFocus() {
    return this.#hasFocus
  }

  get width() {
    return this.#width
  }

  get height() {
    return this.#height
  }

  abstract naturalSize(available: Size): Size
  abstract render(viewport: Viewport): void

  /**
   * Called from a view when a property change could affect naturalSize
   */
  invalidateSize() {
    this.#prevSizeCache = new Map()
    if (this.#invalidateParent) {
      if (this.parent) {
        this.parent.invalidateSize()
      } else {
        this.#screen?.viewNaturalSizeDidChange(this)
      }
    }
    this.invalidateRender()
  }

  /**
   * Indicates that a rerender is needed (but size is not affected)
   */
  invalidateRender() {
    this.#screen?.needsRender()
  }

  #toDimension(
    dim: Dimension,
    available: number,
    natural: () => number,
    prefer: 'shrink' | 'grow',
  ): number {
    if (dim === 'fill') {
      return available
    } else if (dim === 'shrink') {
      return prefer === 'shrink' ? 0 : available
    } else if (dim === 'natural') {
      return natural()
    }
    return dim
  }

  #restrictSize(
    _calcSize: () => Size,
    available: Size,
    prefer: 'grow' | 'shrink',
  ): Mutable<Size> {
    let memo: Size | undefined
    const calcSize = () => {
      return (memo ??= _calcSize())
    }

    if (this.#width !== undefined && this.#height !== undefined) {
      // shortcut for explicit or 'fill' on both width & height, skip all the rest
      const width = this.#toDimension(
          this.#width,
          available.width,
          () => calcSize().width,
          prefer,
        ),
        height = this.#toDimension(
          this.#height,
          available.height,
          () => calcSize().height,
          prefer,
        )
      return new Size(width, height).mutableCopy()
    }

    const size = (prefer === 'shrink' ? calcSize() : available).mutableCopy()

    if (this.#width !== undefined) {
      size.width = this.#toDimension(
        this.#width,
        available.width,
        () => calcSize().width,
        prefer,
      )
    } else {
      if (this.#minWidth !== undefined) {
        size.width = Math.max(this.#minWidth, size.width)
      }

      if (this.#maxWidth !== undefined) {
        size.width = Math.min(this.#maxWidth, size.width)
      }
    }

    if (this.#height !== undefined) {
      size.height = this.#toDimension(
        this.#height,
        available.height,
        () => calcSize().height,
        prefer,
      )
    } else {
      if (this.#minHeight !== undefined) {
        size.height = Math.max(this.#minHeight, size.height)
      }
      if (this.#maxHeight !== undefined) {
        size.height = Math.min(this.#maxHeight, size.height)
      }
    }

    return size
  }

  #calculateAvailableSize(parentAvailableSize: Size): Size {
    const available = parentAvailableSize.mutableCopy()
    if (this.#x || this.#y) {
      available.width -= this.#x ?? 0
      available.height -= this.#y ?? 0
    }

    if (typeof this.#width === 'number') {
      available.width = this.#width
    } else {
      if (this.#maxWidth !== undefined) {
        available.width = Math.min(this.#maxWidth, available.width)
      }

      if (this.#minWidth !== undefined) {
        available.width = Math.max(this.#minWidth, available.width)
      }
    }

    if (typeof this.#height === 'number') {
      available.height = this.#height
    } else {
      if (this.#maxHeight !== undefined) {
        available.height = Math.min(this.#maxHeight, available.height)
      }

      if (this.#minHeight !== undefined) {
        available.height = Math.max(this.#minHeight, available.height)
      }
    }

    if (this.padding) {
      available.width -= this.padding.left + this.padding.right
      available.height -= this.padding.top + this.padding.bottom
    }

    available.width = Math.max(0, available.width)
    available.height = Math.max(0, available.height)

    return available
  }

  #naturalSizeWrap(
    naturalSize: (available: Size) => Size,
  ): (available: Size) => Size {
    return parentAvailableSize => {
      const cached = this.#prevSizeCache.get(cacheKey(parentAvailableSize))
      if (cached) {
        return cached
      }

      const available = this.#calculateAvailableSize(parentAvailableSize)

      const size = this.#restrictSize(
        () => {
          let size = naturalSize(available)
          if (this.padding) {
            size = size.grow(
              this.padding.left + this.padding.right,
              this.padding.top + this.padding.bottom,
            )
          }
          return size
        },
        available,
        'shrink',
      )

      if (this.#x) {
        size.width += this.#x
      }
      if (this.#y) {
        size.height += this.#y
      }

      this.#prevSizeCache.set(cacheKey(available), size)
      return size
    }
  }

  #renderWrap(
    render: (viewport: Viewport) => void,
  ): (viewport: Viewport) => void {
    return viewport => {
      if (
        this.#viewportContentSize.width !== viewport.contentSize.width ||
        this.#viewportContentSize.height !== viewport.contentSize.height
      ) {
        this.#invalidateParent = false
        this.invalidateSize()
        this.#invalidateParent = true
      }

      this.#viewportContentSize = viewport.contentSize
      this.#renderedLocation = viewport.location

      let origin: Point
      const contentSize = viewport.contentSize.mutableCopy()
      if (this.#x || this.#y) {
        origin = new Point(this.#x ?? 0, this.#y ?? 0)
        contentSize.width -= origin.x
        contentSize.height -= origin.y
      } else {
        origin = Point.zero
      }

      this.#renderedContentSize = this.#restrictSize(
        () => this.naturalSize(contentSize),
        contentSize,
        'grow',
      )
      if (this.padding) {
        origin = origin.offset(this.padding.left, this.padding.top)
        this.#renderedContentSize = this.#renderedContentSize.shrink(
          this.padding.left + this.padding.right,
          this.padding.top + this.padding.bottom,
        )
      }

      const rect = new Rect(origin, this.#renderedContentSize)
      // Inside `_render`, the viewport is positioned at this view's content, and
      // viewport.register*() calls are associated with this view.
      const renderWithListeners = (viewport: Viewport) => {
        this.#contentOrigin = viewport.absoluteOrigin
        this.#registerListeners(viewport)
        render(viewport)
      }
      if (this.#background) {
        const style = new Style({background: this.#background})
        viewport.paint(style, rect)
        viewport.usingPen(style, () => {
          viewport._render(this, rect, renderWithListeners)
        })
      } else {
        viewport._render(this, rect, renderWithListeners)
      }
    }
  }

  /**
   * Registers the external listeners that asked for specific `events`. These
   * are registered before the view renders, so the view's children (which render
   * later) take precedence for button and wheel events, as usual.
   */
  #registerListeners(viewport: Viewport) {
    for (const record of this.#mouseListeners) {
      if (record.names && record.names.length > 0) {
        viewport._registerMouse(record.names, record.destination)
      }
    }

    let isFocusable = false
    let isDefault = false
    for (const record of this.#focusListeners) {
      if (record.events && record.events.length > 0) {
        isFocusable = true
        isDefault ||= record.isDefault
      }
    }
    if (isFocusable) {
      viewport._registerFocus(isDefault)
    }

    for (const record of this.#keyboardListeners) {
      for (const spec of record.specs ?? []) {
        viewport._registerKeyTap(spec, record.deliver)
      }
    }
  }

  /**
   * Adds a mouse listener. The callback is *not* `receiveMouse`: it's an
   * additional subscriber, and works with any view, whether or not the view's
   * implementation calls `super`.
   *
   *     // events the view registered for itself (a Button's clicks and hover)
   *     button.addMouseListener((event, contentSize) => ...)
   *
   *     // register for specific events over the view's area
   *     text.addMouseListener(onHover, {events: ['mouse.move']})
   *
   * @return A function that removes the listener.
   */
  addMouseListener(
    callback: MouseListener,
    options: MouseListenerOptions = {},
  ): RemoveListener {
    const {events} = options
    let isActive = true
    const record: MouseListenerRecord = {
      names:
        events === undefined
          ? undefined
          : events === true
            ? [...ALL_MOUSE_EVENTS]
            : [...events],
      destination: {
        isNative: false,
        deliver: (event, system, location) => {
          if (!isActive) {
            return
          }

          const position = new Point(
            location.x - this.#contentOrigin.x,
            location.y - this.#contentOrigin.y,
          )
          callback({...event, position}, this.#renderedContentSize, system)
        },
      },
    }

    this.#mouseListeners = [...this.#mouseListeners, record]
    this.invalidateRender()
    return () => {
      if (!isActive) {
        return
      }
      isActive = false
      this.#mouseListeners = this.#mouseListeners.filter(
        other => other !== record,
      )
      this.invalidateRender()
    }
  }

  /**
   * Adds a keyboard listener, see `KeyboardListenerOptions`. Listeners only
   * observe key events; they never consume them.
   *
   *     input.addKeyboardListener(event => ...)                       // events the input handles
   *     view.addKeyboardListener(onSave, {events: ['ctrl+s']})        // hotkey
   *     view.addKeyboardListener(onKey, {events: true})               // every key
   *
   * @return A function that removes the listener.
   */
  addKeyboardListener(
    callback: KeyboardListener,
    options: KeyboardListenerOptions = {},
  ): RemoveListener {
    const {events} = options
    let isActive = true
    const record: KeyboardListenerRecord = {
      specs:
        events === undefined
          ? undefined
          : events === true
            ? ['all']
            : events.map(toKeyListenerDef),
      deliver: event => {
        if (isActive) {
          callback(event, this.#renderedContentSize)
        }
      },
    }

    this.#keyboardListeners = [...this.#keyboardListeners, record]
    this.invalidateRender()
    return () => {
      if (!isActive) {
        return
      }
      isActive = false
      this.#keyboardListeners = this.#keyboardListeners.filter(
        other => other !== record,
      )
      this.invalidateRender()
    }
  }

  /**
   * Adds a focus listener, see `FocusListenerOptions`. With `events`, the view
   * becomes focusable; without, the view must register for focus itself.
   *
   *     button.addFocusListener(isFocused => ...)
   *     text.addFocusListener(isFocused => ..., {events: true})
   *
   * @return A function that removes the listener.
   */
  addFocusListener(
    callback: FocusListener,
    options: FocusListenerOptions = {},
  ): RemoveListener {
    const {events} = options
    let isActive = true
    const record: FocusListenerRecord = {
      events:
        events === undefined
          ? undefined
          : events === true
            ? [...ALL_FOCUS_EVENTS]
            : [...events],
      isDefault: options.isDefault ?? false,
      callback: isFocused => {
        if (isActive) {
          callback(isFocused)
        }
      },
    }

    this.#focusListeners = [...this.#focusListeners, record]
    this.invalidateRender()
    return () => {
      if (!isActive) {
        return
      }
      isActive = false
      this.#focusListeners = this.#focusListeners.filter(
        other => other !== record,
      )
      this.invalidateRender()
    }
  }

  /**
   * The destination for the events this view registers for itself with
   * `viewport.registerMouse()`.
   *
   * @internal
   */
  get _nativeMouse(): MouseDestination {
    return this.#nativeMouse
  }

  /**
   * Called by the FocusManager for hotkeys, focused key events, and keyboard
   * fallback: calls `receiveKey`, then the piggy-backing keyboard listeners.
   *
   * @internal
   */
  _deliverKey(event: KeyEvent) {
    this.receiveKey(event)
    for (const record of this.#keyboardListeners) {
      if (!record.specs) {
        record.deliver(event)
      }
    }
  }

  /**
   * Called by the FocusManager when this view gains or loses focus.
   * `isNative` is false when the view is focusable only because of an external
   * focus listener: `didFocus` and `didBlur` are skipped.
   *
   * @internal
   */
  _focusChanged(isFocused: boolean, isNative: boolean) {
    this.#hasFocus = isFocused
    if (isNative) {
      if (isFocused) {
        this.didFocus()
      } else {
        this.didBlur()
      }
    }

    const eventName: FocusEventName = isFocused ? 'focus.focus' : 'focus.blur'
    for (const record of this.#focusListeners) {
      if (record.events ? record.events.includes(eventName) : isNative) {
        record.callback(isFocused)
      }
    }
  }

  /**
   * Called before being added to the parent View
   */
  willMoveTo(_parent: View) {}
  /**
   * Called after being removed from the parent View
   */
  didMoveFrom(_parent: View) {}
  /**
   * Called after being added to a Screen
   */
  didMount(_screen: Screen) {}
  /**
   * Called after being removed from a Screen (even when about to be moved to a new
   * screen).
   */
  didUnmount(_screen: Screen) {}
  /**
   * Called when this view gains keyboard focus. Only called on views that call
   * `viewport.registerFocus()` in their render method. (`hasFocus` is already
   * up to date; overrides don't need to call `super`.)
   */
  didFocus() {}
  /**
   * Called when this view loses keyboard focus. Only called on views that previously
   * had focus (i.e. `didFocus()` was called).
   */
  didBlur() {}

  /**
   * Returns keyboard shortcut items for this view, shown by AutoLegend
   * when this view has focus. Override in subclasses to advertise shortcuts.
   */
  legendItems(): LegendItem[] {
    return []
  }

  removeFromParent() {
    if (!this.parent) {
      return
    }

    this.parent[REMOVE_CHILD](this)
  }

  moveToScreen(screen: Screen | undefined) {
    if (this.#screen === screen) {
      return
    }

    const prev = this.#screen
    this.#screen = screen

    if (screen) {
      if (prev) {
        this.didUnmount(prev)
      }
      this.didMount(screen)
    } else {
      this.didUnmount(prev!)
    }
  }

  /**
   * To register for this event, call `viewport.registerFocus()`, which returns `true`
   * if the current view has the keyboard focus.
   */
  receiveKey(_event: KeyEvent) {}
  /**
   * Called when text is pasted from the clipboard (bracketed paste).
   * Only dispatched to the currently focused view.
   */
  receivePaste(_text: string) {}
  /**
   * To register for this event, call `viewport.registerMouse()`. `isHover` and
   * `isPressed` are updated before this is called; overrides don't need to call
   * `super`.
   */
  receiveMouse(_event: MouseEvent, _system: System) {}

  /**
   * Receives the time-delta between previous and current render. Return 'true' if
   * this function causes the view to need a rerender.
   *
   * To register for this event, call `viewport.registerTick()`
   */
  receiveTick(_dt: number): boolean {
    return false
  }
}

function cacheKey(size: Size) {
  return `${size.width}x${size.height}`
}
