import {type LegendItem} from '../types.js'
import {
  type Props as LegendProps,
  type ComputedItem,
  AbstractLegend,
} from './AbstractLegend.js'

interface Props extends LegendProps {
  items: LegendItem[]
}

export class Legend extends AbstractLegend {
  #items: LegendItem[] = []
  #cachedItems: ComputedItem[] | undefined

  constructor(props: Props) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({items}: Props) {
    this.#items = items ?? []
    this.#cachedItems = undefined
  }

  get items() {
    return this.#items
  }

  set items(items: LegendItem[]) {
    this.#items = items
    this.#cachedItems = undefined
    this.invalidateSize()
  }

  collectItems(): ComputedItem[] {
    if (!this.#cachedItems) {
      this.#cachedItems = this.computeItems(this.#items)
    }

    return this.#cachedItems
  }
}
