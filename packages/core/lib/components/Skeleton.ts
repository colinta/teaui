import type {Viewport} from '../Viewport.js'
import {Point, Size} from '../geometry.js'
import {Style} from '../Style.js'
import {type Props as ViewProps, View} from '../View.js'

export type SkeletonShape =
  | 'rect'
  | 'circle'
  | 'rounded-rect'
  | 'row'
  | 'column'

interface Props extends ViewProps {
  shape?: SkeletonShape
}

export class Skeleton extends View {
  #shape: SkeletonShape = 'rect'
  #elapsed = 0

  constructor(props: Props = {}) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({shape}: Props) {
    this.#shape = shape ?? 'rect'
  }

  get shape(): SkeletonShape {
    return this.#shape
  }

  set shape(value: SkeletonShape) {
    if (value === this.#shape) {
      return
    }

    this.#shape = value
    this.invalidateSize()
  }

  naturalSize(available: Size): Size {
    switch (this.#shape) {
      case 'row':
        return available.withHeight(1)
      case 'column':
        return available.withWidth(1)
      default:
        return available
    }
  }

  receiveTick(dt: number): boolean {
    this.#elapsed = (this.#elapsed + dt) % ANIMATION_DURATION
    return true
  }

  render(viewport: Viewport) {
    viewport.registerTick()

    if (viewport.isEmpty) {
      return
    }

    const style = this.#backgroundStyle()
    if (
      this.#shape === 'rect' ||
      this.#shape === 'row' ||
      this.#shape === 'column'
    ) {
      viewport.paint(style)
      return
    }

    viewport.visibleRect.forEachPoint(point => {
      if (this.#contains(point, viewport.contentSize)) {
        viewport.paint(style, point)
      }
    })
  }

  #contains(point: Point, size: Size): boolean {
    if (this.#shape === 'rounded-rect') {
      const isVerticalEdge = point.x === 0 || point.x === size.width - 1
      const isHorizontalEdge = point.y === 0 || point.y === size.height - 1
      return !(isVerticalEdge && isHorizontalEdge)
    }

    const radiusY = size.height / 2
    const y = Math.abs(point.y + 0.5 - radiusY) / radiusY
    const radiusX = radiusY * CELL_HEIGHT_TO_WIDTH_RATIO
    const inset = Math.round(radiusX * (1 - Math.sqrt(1 - y * y)))
    return point.x >= inset && point.x < size.width - inset
  }

  #backgroundStyle(): Style {
    const time = this.#elapsed / ANIMATION_DURATION
    const brightness =
      MIN_BRIGHTNESS + (MAX_BRIGHTNESS - MIN_BRIGHTNESS) * easeInOut(time)
    return new Style({background: {grayscale: Math.round(brightness * 255)}})
  }
}

function easeInOut(time: number): number {
  return Math.sin(Math.PI * time) ** 2
}

const ANIMATION_DURATION = 3000
const CELL_HEIGHT_TO_WIDTH_RATIO = 2
const MIN_BRIGHTNESS = 0.3
const MAX_BRIGHTNESS = 0.5
