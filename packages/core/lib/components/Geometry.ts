import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps} from '../View.js'
import {Container, type Props as ContainerProps} from '../Container.js'
import {Size} from '../geometry.js'

interface Props extends ContainerProps {
  /**
   * Called during render with the available content size. Use this to implement
   * virtualized/windowed rendering where you need to know the viewport dimensions
   * before deciding what to render.
   */
  onLayout?: (size: Size) => void
}

/**
 * A container that reports its available size via onLayout callback. Defaults to
 * filling all available space (width='fill', height='fill') unless explicit
 * dimensions are provided.
 *
 * Useful for:
 * - Measuring available space before deciding what to render
 * - Virtualized lists that need viewport height to calculate visible items
 * - Responsive layouts that change based on available space
 */
export class Geometry extends Container {
  #onLayout: Props['onLayout']
  #prevSize: Size = Size.zero

  constructor({onLayout, ...props}: Props) {
    super(props)
    this.#onLayout = onLayout
  }

  update({onLayout, ...props}: Props) {
    this.#onLayout = onLayout
    super.update(props)
  }

  naturalSize(available: Size): Size {
    return available
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    const size = viewport.contentSize
    if (
      size.width !== this.#prevSize.width ||
      size.height !== this.#prevSize.height
    ) {
      this.#prevSize = size
      this.#onLayout?.(size)
    }

    super.render(viewport)
  }
}
