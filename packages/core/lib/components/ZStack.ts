import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps} from '../View.js'
import {Container} from '../Container.js'
import {Size} from '../geometry.js'

interface Props extends ViewProps {
  children?: import('../View.js').View[]
  child?: import('../View.js').View
}

/**
 * Overlays children on top of each other. Each child receives the full
 * available size. Children are rendered in order, so later children appear
 * above earlier ones.
 */
export class ZStack extends Container {
  constructor(props: Props = {}) {
    super(props)
  }

  naturalSize(available: Size): Size {
    const size = Size.zero.mutableCopy()
    for (const child of this.children) {
      if (!child.isVisible) continue
      const childSize = child.naturalSize(available)
      size.width = Math.max(size.width, childSize.width)
      size.height = Math.max(size.height, childSize.height)
    }
    return size
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    for (const child of this.children) {
      if (!child.isVisible) continue
      child.render(viewport)
    }
  }
}
