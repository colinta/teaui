import {View} from '../View.js'
import {Point} from '../geometry.js'
import {System, UnboundSystem} from '../System.js'
import type {
  MouseDownEvent,
  MouseEventListener,
  MouseEventListenerName,
  MouseEventName,
  MouseEventTarget,
  SystemMouseEvent,
} from '../events/index.js'
import {isMouseButton, isMouseWheel} from '../events/index.js'

function mouseKey(x: number, y: number) {
  return `${~~x},${~~y}`
}

export class MouseManager {
  #prevListener?: MouseEventListener
  #mouseListeners: Map<string, MouseEventListener> = new Map()
  #mouseMoveViews: MouseEventTarget[] = []
  #mouseDownEvent: MouseDownEvent | undefined
  #mousePosition?: Point

  reset() {
    if (this.#mouseDownEvent || !this.#mousePosition) {
      this.#prevListener = undefined
    } else {
      this.#prevListener = this.getMouseListener(
        this.#mousePosition.x,
        this.#mousePosition.y,
      )
    }

    this.#mouseListeners = new Map()
  }

  /**
   * @return boolean Whether the mouse.move targets changed
   */
  commit(system: UnboundSystem): boolean {
    if (this.#mouseDownEvent || !this.#mousePosition) {
      return false
    }

    const listener = this.getMouseListener(
      this.#mousePosition.x,
      this.#mousePosition.y,
    )
    const prev = new Set(
      this.#prevListener?.move.map(target => target.view) ?? [],
    )
    const next = new Set(listener?.move.map(target => target.view) ?? [])
    let same = prev.size === next.size
    if (same) {
      for (const view of prev) {
        if (!next.has(view)) {
          same = false
          break
        }
      }
    }

    if (!same) {
      this.trigger(
        {
          type: 'mouse',
          name: 'mouse.move.in',
          button: 'unknown',
          ctrl: false,
          alt: false,
          meta: false,
          shift: false,
          ...this.#mousePosition,
        },
        system,
      )
    }

    return !same
  }

  /**
   * Multiple views can claim the mouse.move event; they will all receive it.
   * Only the last view to claim button or wheel events will receive those events.
   */
  registerMouse(
    view: View,
    offset: Point,
    point: Point,
    eventNames: MouseEventListenerName[],
  ) {
    const resolved = offset.offset(point)
    const key = mouseKey(resolved.x, resolved.y)
    const target = {
      view,
      offset,
    } as const
    const listener = this.#mouseListeners.get(key) ?? {move: []}
    for (const eventName of eventNames) {
      if (eventName === 'mouse.move') {
        // search listener.move - only keep views that are in the current views
        // ancestors
        listener.move.unshift(target)
      } else if (eventName.startsWith('mouse.button.')) {
        switch (eventName) {
          case 'mouse.button.left':
            listener.buttonLeft = target
            break
          case 'mouse.button.middle':
            listener.buttonMiddle = target
            break
          case 'mouse.button.right':
            listener.buttonRight = target
            break
          case 'mouse.button.all':
            listener.buttonAll = target
            break
        }
      } else if (eventName === 'mouse.wheel') {
        listener.wheel = target
      }
      this.#mouseListeners.set(key, listener)
    }
  }

  checkMouse(view: View, x: number, y: number) {
    const listener = this.getMouseListener(x, y)
    if (!listener) {
      return
    }

    const ancestors = new Set<View>([view])
    for (let parent = view.parent; !!parent; parent = parent!.parent) {
      ancestors.add(parent)
    }

    ;(
      [
        'buttonAll',
        'buttonLeft',
        'buttonMiddle',
        'buttonRight',
        'wheel',
      ] as const
    ).forEach(prop => {
      const target = listener[prop]
      if (!target) {
        return
      }
      listener[prop] = ancestors.has(target.view) ? target : undefined
    })
    listener.move = listener.move.filter(({view}) => ancestors.has(view))

    this.#mouseListeners.set(mouseKey(x, y), listener)
  }

  hasMouseDownListener(x: number, y: number, event: SystemMouseEvent) {
    const listener = this.getMouseListener(x, y)
    if (!listener) {
      return false
    }

    switch (event.button) {
      case 'left':
        return Boolean(listener.buttonLeft || listener.buttonAll)
      case 'middle':
        return Boolean(listener.buttonMiddle || listener.buttonAll)
      case 'right':
        return Boolean(listener.buttonRight || listener.buttonAll)
    }

    return false
  }

  getMouseListener(x: number, y: number) {
    return this.#mouseListeners.get(mouseKey(x, y))
  }

  trigger(systemEvent: SystemMouseEvent, system: UnboundSystem): void {
    if (
      systemEvent.name === 'mouse.button.down' &&
      !this.#mouseDownEvent &&
      !this.hasMouseDownListener(systemEvent.x, systemEvent.y, systemEvent)
    ) {
      // If there's no listener for the mouse down event, unfocus the current view.
      system.focusManager.unfocus()
      return
    }

    this.#mousePosition = new Point(systemEvent.x, systemEvent.y)

    if (systemEvent.name === 'mouse.move.in' && this.#mouseDownEvent) {
      return this.trigger(
        {
          ...systemEvent,
          name: 'mouse.button.up',
          button: this.#mouseDownEvent.button,
        },
        system,
      )
    }

    if (this.#mouseDownEvent) {
      // ignore scroll wheel
      if (!isMouseButton(systemEvent)) {
        return
      }
      this.#dragMouse(systemEvent, this.#mouseDownEvent, system)

      if (systemEvent.name === 'mouse.button.up') {
        this.#moveMouse({...systemEvent, name: 'mouse.move.in'}, system)
      }
    } else if (isMouseButton(systemEvent)) {
      this.#pressMouse(systemEvent, system)
    } else if (isMouseWheel(systemEvent)) {
      this.#scrollMouse(systemEvent, system)
    } else {
      this.#moveMouse(systemEvent, system)
    }
  }

  #getListener(systemEvent: SystemMouseEvent): MouseEventTarget | undefined {
    return this.#getListeners(systemEvent)[0]
  }

  #getListeners(systemEvent: SystemMouseEvent): MouseEventTarget[] {
    const listener = this.getMouseListener(systemEvent.x, systemEvent.y)
    if (!listener) {
      return []
    }

    if (isMouseButton(systemEvent)) {
      let target: MouseEventTarget | undefined
      switch (systemEvent.button) {
        case 'left':
          target = listener.buttonLeft ?? listener.buttonAll
          break
        case 'middle':
          target = listener.buttonMiddle ?? listener.buttonAll
          break
        case 'right':
          target = listener.buttonRight ?? listener.buttonAll
          break
        default:
          return []
      }

      return target ? [target] : []
    } else if (isMouseWheel(systemEvent)) {
      return listener.wheel ? [listener.wheel] : []
    } else {
      return listener.move
    }
  }

  #sendMouse(
    systemEvent: Omit<SystemMouseEvent, 'name'>,
    eventName: MouseEventName,
    target: MouseEventTarget,
    system: System,
  ) {
    const position = new Point(
      systemEvent.x - target.offset.x,
      systemEvent.y - target.offset.y,
    )
    const event = {
      ...systemEvent,
      name: eventName,
      position,
    }
    target.view.receiveMouse(event, system)
  }

  #dragMouse(
    systemEvent: SystemMouseEvent,
    mouseDown: MouseDownEvent,
    unboundSystem: UnboundSystem,
  ) {
    if (systemEvent.name === 'mouse.button.up') {
      this.#mouseDownEvent = undefined
    }

    const {target} = mouseDown
    if (!target) {
      return
    }

    const isInside = this.#getListener(systemEvent)?.view === target.view
    const system = unboundSystem.bind(target.view)
    if (systemEvent.name === 'mouse.button.up') {
      if (isInside) {
        this.#sendMouse(systemEvent, 'mouse.button.up', target, system)
      } else {
        this.#sendMouse(systemEvent, 'mouse.button.cancel', target, system)
      }
    } else {
      if (isInside && target.wasInside) {
        this.#sendMouse(systemEvent, 'mouse.button.dragInside', target, system)
      } else if (isInside) {
        this.#sendMouse(systemEvent, 'mouse.button.enter', target, system)
      } else if (target.wasInside) {
        this.#sendMouse(systemEvent, 'mouse.button.exit', target, system)
      } else {
        this.#sendMouse(systemEvent, 'mouse.button.dragOutside', target, system)
      }

      target.wasInside = isInside
      this.#mouseDownEvent = {...mouseDown, target}
    }
  }

  #pressMouse(systemEvent: SystemMouseEvent, system: UnboundSystem) {
    const listener = this.#getListener(systemEvent)
    if (listener) {
      this.#sendMouse(
        systemEvent,
        'mouse.button.down',
        listener,
        system.bind(listener.view),
      )
      this.#mouseDownEvent = {
        target: {view: listener.view, offset: listener.offset, wasInside: true},
        button: systemEvent.button,
      }
    }
  }

  #scrollMouse(systemEvent: SystemMouseEvent, system: UnboundSystem) {
    const listener = this.#getListener(systemEvent)
    if (listener) {
      this.#sendMouse(
        systemEvent,
        systemEvent.name,
        listener,
        system.bind(listener.view),
      )
    }
  }

  #moveMouse(systemEvent: SystemMouseEvent, unboundSystem: UnboundSystem) {
    const listeners = this.#getListeners(systemEvent)
    let prevListeners = this.#mouseMoveViews
    let isFirst = true
    for (const listener of listeners) {
      let didEnter = true
      prevListeners = prevListeners.filter(prev => {
        if (prev.view === listener.view) {
          didEnter = false
          return false
        }
        return true
      })

      const system = unboundSystem.bind(listener.view)
      if (didEnter) {
        this.#sendMouse(systemEvent, 'mouse.move.enter', listener, system)
      }

      if (isFirst) {
        this.#sendMouse(systemEvent, 'mouse.move.in', listener, system)
      } else {
        this.#sendMouse(systemEvent, 'mouse.move.below', listener, system)
      }

      isFirst = false
    }
    this.#mouseMoveViews = listeners

    for (const listener of prevListeners) {
      const system = unboundSystem.bind(listener.view)
      this.#sendMouse(systemEvent, 'mouse.move.exit', listener, system)
    }
  }
}

function checkEventNames(
  systemEvent: SystemMouseEvent,
): MouseEventListenerName[] {
  switch (systemEvent.name) {
    case 'mouse.move.in':
      return ['mouse.move']
    case 'mouse.button.down':
    case 'mouse.button.up':
      return [`mouse.button.${systemEvent.button}`, 'mouse.button.all']
    case 'mouse.wheel.up':
    case 'mouse.wheel.down':
    case 'mouse.wheel.left':
    case 'mouse.wheel.right':
      return ['mouse.wheel']
  }
}
