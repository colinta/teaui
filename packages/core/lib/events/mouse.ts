export type MouseButton = 'left' | 'middle' | 'right' | 'wheel' | 'unknown'
import {View} from '../View.js'
import {Point, Rect} from '../geometry.js'

export type MouseMove =
  | 'enter' // mouse move enters area
  | 'in' // mouse moving inside
  | 'below' // mouse moving inside, but this is not the topmost view
  | 'exit' // mouse exiting
export type MouseClick =
  | 'down' // mouse down, inside target area
  | 'exit' // mouse dragged from inside to outside
  | 'enter' // dragging from outside into area
  | 'dragInside' // dragging inside
  | 'dragOutside' // mouse dragged outside
  | 'up' // mouse released inside area
  | 'cancel' // mouse released outside
export type MouseWheel = 'up' | 'down' | 'left' | 'right'

export type MouseEventListenerName =
  | 'mouse.move'
  | 'mouse.button.all'
  | `mouse.button.${MouseButton}`
  | 'mouse.wheel'
export type SystemMouseEventName =
  | 'mouse.move.in'
  | 'mouse.button.down'
  | 'mouse.button.up'
  | 'mouse.wheel.up'
  | 'mouse.wheel.down'
  | 'mouse.wheel.left'
  | 'mouse.wheel.right'
export type MouseEventName =
  | `mouse.move.${MouseMove}`
  | `mouse.button.${MouseClick}`
  | `mouse.wheel.${MouseWheel}`
export type MouseEvent = {
  position: Point
  type: 'mouse'
  name: MouseEventName
  ctrl: boolean
  meta: boolean
  shift: boolean
  button: MouseButton
}

export type SystemMouseEvent = Omit<MouseEvent, 'name' | 'position'> & {
  name: SystemMouseEventName
  x: number
  y: number
}
export type MouseDownEvent = {
  target?: MouseEventTarget & {wasInside: boolean}
  button: MouseButton
}
export type MouseEventTarget = {
  view: View
  offset: Point
}
export type MouseEventListener = {
  move: MouseEventTarget[]
  buttonAll?: MouseEventTarget
  buttonLeft?: MouseEventTarget
  buttonMiddle?: MouseEventTarget
  buttonRight?: MouseEventTarget
  wheel?: MouseEventTarget
}

export function isMouseClicked(event: MouseEvent, inside?: Rect) {
  if (event.name !== 'mouse.button.up') {
    return false
  }

  if (inside === undefined) {
    return true
  }

  return inside.includes(new Point(event.position))
}

/**
 * A mouse press event is started with a 'down' event, but can also begin again
 * after the mouse is dragged outside the component ('exit' event), and then
 * dragged back inside ('enter').
 */
export function isMousePressStart(event: SystemMouseEvent | MouseEvent) {
  return (
    event.name.startsWith('mouse.button.') &&
    ['down', 'enter'].some(suffix => event.name.endsWith(suffix))
  )
}

/**
 * Press-exit is an uncomfortable name, it refers to either ending the press event
 * ('up', 'cancel') or dragging the mouse outside the component ('exit'). If the
 * component has has a 'pressed' highlight effect, `isMousePressExit` should turn
 * that effect off.
 */
export function isMousePressExit(event: SystemMouseEvent | MouseEvent) {
  return (
    event.name.startsWith('mouse.button.') &&
    ['up', 'exit', 'cancel'].some(suffix => event.name.endsWith(suffix))
  )
}

export function isMousePressEnd(event: SystemMouseEvent | MouseEvent) {
  return (
    event.name.startsWith('mouse.button.') &&
    ['up', 'cancel'].some(suffix => event.name.endsWith(suffix))
  )
}

/**
 * Dragging events (dragInside, dragOutside), but *also* mouse.button.down
 */
export function isMouseDragging(event: SystemMouseEvent | MouseEvent) {
  return (
    event.name.startsWith('mouse.button.') &&
    ['.up', '.cancel', '.enter', '.exit'].every(
      suffix => !event.name.endsWith(suffix),
    )
  )
}

export function isMouseEnter(event: MouseEvent) {
  return event.name.endsWith('.enter')
}

export function isMouseExit(event: MouseEvent) {
  return event.name.endsWith('.exit')
}

export function isMouseButton(event: SystemMouseEvent) {
  return event.name.startsWith('mouse.button.')
}

export function isMouseWheel(event: SystemMouseEvent | MouseEvent) {
  return event.name.startsWith('mouse.wheel.')
}

export function isMouseMove(event: SystemMouseEvent | MouseEvent) {
  return event.name.startsWith('mouse.move.')
}
