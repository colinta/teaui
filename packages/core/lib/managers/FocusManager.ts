import {View} from '../View.js'
import {match, type HotKeyDef, type KeyEvent} from '../events/index.js'

const UNFOCUS = Symbol('UNFOCUS')

export class FocusManager {
  #didCommit = false
  #currentFocus: View | undefined | typeof UNFOCUS
  #prevFocus: View | undefined | typeof UNFOCUS
  #lastCommittedFocus: View | undefined | typeof UNFOCUS
  #focusRing: View[] = []
  #hotKeys: [View, HotKeyDef][] = []
  #keyboardListeners: View[] = []

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
    this.#keyboardListeners = []
    this.#didCommit = false
  }

  trigger(event: KeyEvent) {
    for (const [view, key] of this.#hotKeys) {
      if (match(key, event)) {
        return view.receiveKey(event)
      }
    }

    if (event.name === 'tab' && !event.ctrl && !event.alt && !event.gui) {
      if (event.shift) {
        this.prevFocus()
      } else {
        this.nextFocus()
      }
    } else if (this.#currentFocus && this.#currentFocus !== UNFOCUS) {
      this.#currentFocus.receiveKey(event)
    } else if (this.#keyboardListeners.length > 0) {
      // Last registered = innermost view = highest priority
      this.#keyboardListeners[this.#keyboardListeners.length - 1].receiveKey(
        event,
      )
    }
  }

  triggerPaste(text: string) {
    if (this.#currentFocus && this.#currentFocus !== UNFOCUS) {
      this.#currentFocus.receivePaste(text)
    }
  }

  /**
   * Returns whether the current view has focus.
   */
  registerFocus(view: View, isDefault: boolean) {
    if (!this.#didCommit) {
      this.#focusRing.push(view)
    }

    if (!this.#currentFocus && this.#prevFocus === view) {
      // The previously-focused view is re-registering — restore its focus
      // regardless of isDefault (it was explicitly focused via tab/click).
      this.#currentFocus = view
      return true
    } else if (!this.#currentFocus && !this.#prevFocus && isDefault) {
      // First render: only isDefault views can claim initial focus.
      this.#currentFocus = view
      return true
    } else if (this.#currentFocus === view) {
      return true
    } else {
      return false
    }
  }

  get currentFocusView(): View | undefined {
    return this.#currentFocus && this.#currentFocus !== UNFOCUS
      ? this.#currentFocus
      : undefined
  }

  get hotKeyViews(): [View, HotKeyDef][] {
    return this.#hotKeys
  }

  registerHotKey(view: View, key: HotKeyDef) {
    if (this.#didCommit) {
      return
    }

    this.#hotKeys.push([view, key])
  }

  /**
   * Registers a fallback keyboard listener. When no hotkey matches and no view
   * has focus, key events are sent to the last (innermost) registered listener.
   */
  registerKeyboard(view: View) {
    if (this.#didCommit) {
      return
    }

    this.#keyboardListeners.push(view)
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
    } else if (
      this.#focusRing.length > 0 &&
      this.#prevFocus &&
      !this.#currentFocus
    ) {
      // The previously-focused view didn't re-register — fall back to the
      // first view in the ring so focus doesn't disappear.
      this.#currentFocus = this.#focusRing[0]
    } else if (
      this.#focusRing.length > 0 &&
      !this.#prevFocus &&
      !this.#currentFocus
    ) {
      // First render with focusable views but no default view claimed focus —
      // enter the unfocused state so that tab can move into the focus ring.
      this.#currentFocus = UNFOCUS
    }

    // Detect focus changes and fire lifecycle events
    const prev = this.#lastCommittedFocus
    const current = this.#currentFocus

    if (prev !== current) {
      if (prev && prev !== UNFOCUS) {
        prev.didBlur()
      }
      if (current && current !== UNFOCUS) {
        current.didFocus()
      }
      this.#lastCommittedFocus = current
      return true
    }

    return false
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
    if (!this.#currentFocus || this.#currentFocus === UNFOCUS) {
      this.#currentFocus = this.#focusRing.at(-1)
      return
    }

    if (this.#focusRing.length <= 1) {
      this.#currentFocus = UNFOCUS
      return
    }

    // If focused on the first item, unfocus instead of wrapping.
    const index = this.#focusRing.indexOf(this.#currentFocus)
    if (index === 0) {
      this.#currentFocus = UNFOCUS
      return
    }

    this.#reorderRing()

    const last = this.#focusRing.pop()!
    this.#focusRing.unshift(last)
    this.#currentFocus = last

    return this.#currentFocus
  }

  nextFocus() {
    if (!this.#currentFocus || this.#currentFocus === UNFOCUS) {
      this.#currentFocus = this.#focusRing[0]
      return
    }

    if (this.#focusRing.length <= 1) {
      this.#currentFocus = UNFOCUS
      return
    }

    // If focused on the last item, unfocus instead of wrapping.
    const index = this.#focusRing.indexOf(this.#currentFocus)
    if (index === this.#focusRing.length - 1) {
      this.#currentFocus = UNFOCUS
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
