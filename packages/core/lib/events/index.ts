export type * from './mouse.js'
export * from './mouse.js'
export type * from './key.js'
export * from './key.js'
export type * from './window.js'
export * from './window.js'

import type {MouseEvent, SystemMouseEvent} from './mouse.js'
import type {KeyEvent} from './key.js'
import type {FocusEvent, ResizeEvent} from './window.js'

export type Event = MouseEvent | KeyEvent | FocusEvent | ResizeEvent
export type SystemEvent = SystemMouseEvent | KeyEvent | FocusEvent | ResizeEvent
