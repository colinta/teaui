import {View} from '../View.js'
import {match, type HotKeyDef, type KeyEvent} from '../events/index.js'

const UNFOCUS = Symbol('UNFOCUS')
type FocusView = View | undefined | typeof UNFOCUS

export class FocusManager {
  #didCommit = false
  #currentFocusView: FocusView
  #prevFocusView: FocusView
  #lastCommittedFocus: FocusView
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
      this.#prevFocusView = this.#currentFocusView
    }
    this.#currentFocusView = undefined
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
    } else if (this.#currentFocusView && this.#currentFocusView !== UNFOCUS) {
      this.#currentFocusView.receiveKey(event)
    } else if (this.#keyboardListeners.length > 0) {
      // Last registered = innermost view = highest priority
      this.#keyboardListeners[this.#keyboardListeners.length - 1].receiveKey(
        event,
      )
    }
  }

  triggerPaste(text: string) {
    if (this.#currentFocusView && this.#currentFocusView !== UNFOCUS) {
      this.#currentFocusView.receivePaste(text)
    }
  }

  /**
   * Returns whether the current view has focus.
   */
  registerFocus(view: View, isDefault: boolean) {
    if (!this.#didCommit) {
      this.#focusRing.push(view)
    }

    if (!this.#currentFocusView && this.#prevFocusView === view) {
      // The previously-focused view is re-registering — restore its focus
      // regardless of isDefault (it was explicitly focused via tab/click).
      this.#currentFocusView = view
      return true
    } else if (!this.#currentFocusView && !this.#prevFocusView && isDefault) {
      // First render: only isDefault views can claim initial focus.
      this.#currentFocusView = view
      return true
    } else if (this.#currentFocusView === view) {
      return true
    } else {
      return false
    }
  }

  get currentFocusView(): View | undefined {
    if (!this.#didCommit) {
      return this.#prevFocusView !== UNFOCUS ? this.#prevFocusView : undefined
    }

    return this.#currentFocusView && this.#currentFocusView !== UNFOCUS
      ? this.#currentFocusView
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
    this.#currentFocusView = view
    return true
  }

  unfocus() {
    this.#currentFocusView = UNFOCUS
  }

  determineFocus() {
    if (this.#prevFocusView === UNFOCUS && !this.#currentFocusView) {
      this.#currentFocusView = UNFOCUS
    } else if (
      this.#focusRing.length > 0 &&
      this.#prevFocusView &&
      !this.#currentFocusView
    ) {
      // The previously-focused view didn't re-register — fall back to the
      // first view in the ring so focus doesn't disappear.
      this.#currentFocusView = this.#focusRing[0]
    } else if (
      this.#focusRing.length > 0 &&
      !this.#prevFocusView &&
      !this.#currentFocusView
    ) {
      // First render with focusable views but no default view claimed focus —
      // enter the unfocused state so that tab can move into the focus ring.
      this.#currentFocusView = UNFOCUS
    }

    // Detect focus changes and fire lifecycle events
    const prev = this.#lastCommittedFocus
    const current = this.#currentFocusView

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

  /**
   * @return boolean Whether the focus changed
   */
  commit(): boolean {
    this.#didCommit = true

    return this.determineFocus()
  }

  #reorderRing() {
    if (!this.#currentFocusView || this.#currentFocusView === UNFOCUS) {
      return
    }

    const index = this.#focusRing.indexOf(this.#currentFocusView)
    if (~index) {
      const pre = this.#focusRing.slice(0, index)
      this.#focusRing = this.#focusRing.slice(index).concat(pre)
    }
  }

  prevFocus() {
    if (!this.#currentFocusView || this.#currentFocusView === UNFOCUS) {
      this.#currentFocusView = this.#focusRing.at(-1)
      return
    }

    if (this.#focusRing.length <= 1) {
      this.#currentFocusView = UNFOCUS
      return
    }

    // If focused on the first item, unfocus instead of wrapping.
    const index = this.#focusRing.indexOf(this.#currentFocusView)
    if (index === 0) {
      this.#currentFocusView = UNFOCUS
      return
    }

    this.#reorderRing()

    const last = this.#focusRing.pop()!
    this.#focusRing.unshift(last)
    this.#currentFocusView = last
  }

  nextFocus() {
    if (!this.#currentFocusView || this.#currentFocusView === UNFOCUS) {
      this.#currentFocusView = this.#focusRing[0]
      return
    }

    if (this.#focusRing.length <= 1) {
      this.#currentFocusView = UNFOCUS
      return
    }

    // If focused on the last item, unfocus instead of wrapping.
    const index = this.#focusRing.indexOf(this.#currentFocusView)
    if (index === this.#focusRing.length - 1) {
      this.#currentFocusView = UNFOCUS
      return
    }

    this.#reorderRing()

    const first = this.#focusRing.shift()!
    this.#focusRing.push(first)

    this.#currentFocusView = this.#focusRing[0]
  }
}

function findView(parent: View, prevFocus: View): boolean {
  if (parent === prevFocus) {
    return true
  }

  return parent.children.some(child => findView(child, prevFocus))
}
