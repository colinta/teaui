import type {Viewport} from '../Viewport.js'
import {Size} from '../geometry.js'
import {Legend, type LegendItem} from './Legend.js'
import {HotKey} from './HotKey.js'
import type {HotKey as HotKeyType} from '../events/index.js'

interface Props {
  separator?: string
}

function hotKeyToString(hotKey: HotKeyType): string {
  if (typeof hotKey === 'string') {
    return hotKey
  }

  let str = ''
  if (hotKey.ctrl) str += 'C-'
  if (hotKey.alt) str += 'A-'
  if (hotKey.meta) str += 'M-'
  if (hotKey.shift) str += 'S-'
  str += hotKey.char
  return str
}

/**
 * A Legend that automatically shows keyboard shortcuts based on:
 * - The currently focused view's `legendItems()` method
 * - Registered HotKey components that have a `label` prop
 *
 * Updates automatically when focus changes.
 */
export class AutoLegend extends Legend {
  constructor(props: Props = {}) {
    super({items: [], ...props})
  }

  #collectItems(): LegendItem[] {
    const screen = this.screen
    if (!screen) {
      return []
    }

    const items: LegendItem[] = []

    // Collect items from the focused view
    const focused = screen.currentFocusView
    if (focused) {
      items.push(...focused.legendItems())
    }

    // Collect items from registered HotKey components with labels
    for (const [view] of screen.hotKeyViews) {
      if (view instanceof HotKey && view.label) {
        items.push({
          key: hotKeyToString(view.hotKey),
          label: view.label,
        })
      }
    }

    return items
  }

  naturalSize(available: Size): Size {
    this.update({items: this.#collectItems()})
    return super.naturalSize(available)
  }

  render(viewport: Viewport) {
    this.update({items: this.#collectItems()})
    super.render(viewport)
  }
}
