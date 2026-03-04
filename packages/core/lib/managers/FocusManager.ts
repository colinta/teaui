import {View} from '../View.js'
import {match, type HotKeyDef, type KeyEvent} from '../events/index.js'

const UNFOCUS = Symbol('UNFOCUS')

export class FocusManager {
  #didCommit = false
  #currentFocus: View | undefined | typeof UNFOCUS
  #prevFocus: View | undefined | typeof UNFOCUS
  #focusRing: View[] = []
  #hotKeys: [View, HotKeyDef][] = []

  /**
   * If the previous focus-view is not mounted, we can clear out the current
   * focus-view and focus the first that registers.
   *
   * If the previous focus-view is mounted but does not request focus, we can't know
   * that until _after_ the first render. In that case, after render, 'needsRerender'
   * selects the first focus-view and triggers a re-render.
   */
  reset(isRootView: boolean) {
    if (isRootView) {
      this.#prevFocus = this.#currentFocus
    }
    this.#currentFocus = undefined
    this.#focusRing = []
    this.#hotKeys = []
    this.#didCommit = false
  }

  trigger(event: KeyEvent) {
    for (const [view, key] of this.#hotKeys) {
      if (match(key, event)) {
        return view.receiveKey(event)
      }
    }

    if (event.name === 'tab') {
      if (event.shift) {
        this.prevFocus()
      } else {
        this.nextFocus()
      }
    } else if (this.#currentFocus && this.#currentFocus !== UNFOCUS) {
      this.#currentFocus.receiveKey(event)
    }
  }

  /**
   * Returns whether the current view has focus.
   */
  registerFocus(view: View) {
    if (!this.#didCommit) {
      this.#focusRing.push(view)
    }

    if (!this.#currentFocus && (!this.#prevFocus || this.#prevFocus === view)) {
      this.#currentFocus = view
      return true
    } else if (this.#currentFocus === view) {
      return true
    } else {
      return false
    }
  }

  registerHotKey(view: View, key: HotKeyDef) {
    if (this.#didCommit) {
      return
    }

    this.#hotKeys.push([view, key])
  }

  requestFocus(view: View) {
    this.#currentFocus = view
    return true
  }

  unfocus() {
    this.#currentFocus = UNFOCUS
  }

  /**
   * @return boolean Whether the focus changed
   */
  commit(): boolean {
    this.#didCommit = true

    if (this.#prevFocus === UNFOCUS && !this.#currentFocus) {
      this.#currentFocus = UNFOCUS
      return false
    } else if (
      this.#focusRing.length > 0 &&
      this.#prevFocus &&
      !this.#currentFocus
    ) {
      this.#currentFocus = this.#focusRing[0]
      return true
    } else {
      return false
    }
  }

  #reorderRing() {
    if (!this.#currentFocus || this.#currentFocus === UNFOCUS) {
      return
    }

    const index = this.#focusRing.indexOf(this.#currentFocus)
    if (~index) {
      const pre = this.#focusRing.slice(0, index)
      this.#focusRing = this.#focusRing.slice(index).concat(pre)
    }
  }

  prevFocus() {
    if (this.#currentFocus === UNFOCUS) {
      this.#currentFocus = this.#focusRing.at(-1)
      return
    }

    if (this.#focusRing.length <= 1) {
      return
    }

    this.#reorderRing()

    const last = this.#focusRing.pop()!
    this.#focusRing.unshift(last)
    this.#currentFocus = last

    return this.#currentFocus
  }

  nextFocus() {
    if (this.#currentFocus === UNFOCUS) {
      this.#currentFocus = this.#focusRing[0]
      return
    }

    if (this.#focusRing.length <= 1) {
      return
    }

    this.#reorderRing()

    const first = this.#focusRing.shift()!
    this.#focusRing.push(first)

    this.#currentFocus = this.#focusRing[0]

    return this.#currentFocus
  }
}

function findView(parent: View, prevFocus: View): boolean {
  if (parent === prevFocus) {
    return true
  }

  return parent.children.some(child => findView(child, prevFocus))
}
