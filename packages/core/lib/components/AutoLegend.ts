import type {Screen} from '../Screen.js'
import type {ScreenEventUnsubscribe} from '../Screen.js'
import type {View} from '../View.js'
import {type LegendItem} from '../types.js'
import {
  AbstractLegend,
  type Props as LegendProps,
  type ComputedItem,
} from './AbstractLegend.js'
import {HotKey} from './HotKey.js'
import {hotKeyToString} from '../events/index.js'

interface Props extends LegendProps {}

/**
 * A Legend that automatically shows keyboard shortcuts based on:
 * - The currently focused view's `legendItems()` method
 * - Registered HotKey components that have a `label` prop
 *
 * Subscribes to focusChange events on the screen and updates when focus changes.
 */
export class AutoLegend extends AbstractLegend {
  #unsubscribe?: ScreenEventUnsubscribe
  #cachedItems: ComputedItem[] | undefined

  constructor(props: Props = {}) {
    super(props)
  }

  didMount(screen: Screen) {
    super.didMount(screen)
    this.#unsubscribe?.()
    this.#unsubscribe = screen.on('focusChange', () => {
      this.#cachedItems = undefined
      this.invalidateSize()
    })
  }

  didUnmount(screen: Screen) {
    this.#unsubscribe?.()
    this.#unsubscribe = undefined
    super.didUnmount(screen)
  }

  collectItems(): ComputedItem[] {
    if (!this.#cachedItems) {
      this.#cachedItems = this.#updateItems(this.screen?.currentFocusView)
    }

    return this.#cachedItems
  }

  #updateItems(focused: View | undefined) {
    const screen = this.screen
    const items: LegendItem[] = []

    // Collect items from the focused view
    if (focused) {
      items.push(...focused.legendItems())
    }

    // Collect items from registered HotKey components with labels
    if (screen) {
      for (const [view] of screen.hotKeyViews) {
        if (view instanceof HotKey && view.label) {
          items.push({
            key: hotKeyToString(view.hotKey),
            label: view.label,
          })
        }
      }
    }

    return this.computeItems(items)
  }
}
