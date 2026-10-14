import type {Viewport} from '@teaui/core'
import {View, Style, Point, Size} from '@teaui/core'
import type {ViewProps} from '@teaui/core'
import type {ImageData, ImageFit} from './loadImage.js'
import {loadImageResized} from './loadImage.js'
import {renderPixels} from './render.js'
import type {RenderedCell} from './render.js'

interface ImageProps {
  /** Path to image file, or raw image Buffer */
  source: string | Buffer
  /**
   * How to fit the image in the available space:
   * - 'contain' (default): Scale down to fit, preserving aspect ratio
   * - 'cover': Scale to fill, cropping as needed
   * - 'stretch': Stretch to fill exactly
   */
  fit?: ImageFit
}

export type Props = ImageProps & ViewProps

/**
 * A view that renders an image in the terminal using half-block characters.
 * Each terminal cell displays two vertical pixels using '▀' with foreground
 * (top pixel) and background (bottom pixel) colors.
 *
 * Images are loaded asynchronously via sharp. The view renders empty until
 * the image data is available.
 */
export class Image extends View {
  #source: string | Buffer = ''
  #fit: ImageFit = 'contain'

  /** The loaded & resized image data */
  #image: ImageData | undefined
  /** Pre-rendered terminal cells */
  #cells: RenderedCell[][] = []
  /** Size the image was rendered at */
  #renderedSize: Size = Size.zero
  /** Current load promise (to avoid duplicate loads) */
  #loading: Promise<void> | undefined
  /** Identifies the latest load so stale requests cannot replace its result */
  #loadGeneration = 0
  /** The size we requested the image be resized to */
  #requestedSize: Size = Size.zero

  constructor(props: Props) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({source, fit = 'contain'}: ImageProps) {
    const imageChanged = source !== this.#source || fit !== this.#fit
    this.#source = source ?? ''
    this.#fit = fit

    if (imageChanged) {
      this.#image = undefined
      this.#cells = []
      this.#renderedSize = Size.zero
      this.#requestedSize = Size.zero
      this.#loading = undefined
      this.#loadGeneration++
    }
  }

  naturalSize(available: Size): Size {
    if (!this.#source) {
      return Size.zero
    }

    // Cover and stretch always occupy all available space, including after a
    // resize. Contain can shrink to the dimensions of the rendered image.
    if (this.#fit !== 'contain') {
      return new Size(available.width, available.height)
    }

    if (this.#cells.length > 0) {
      return new Size(this.#renderedSize.width, this.#renderedSize.height)
    }

    // Before the image loads, request the full available space
    return new Size(available.width, available.height)
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty || !this.#source) {
      return
    }

    const availableWidth = viewport.contentSize.width
    // Each terminal row = 2 image pixel rows
    const availablePixelHeight = viewport.contentSize.height * 2

    this.#ensureLoaded(availableWidth, availablePixelHeight)

    if (this.#cells.length === 0) {
      return
    }

    // Center the image in the viewport
    const offsetX = Math.floor(
      (viewport.contentSize.width - this.#renderedSize.width) / 2,
    )
    const offsetY = Math.floor(
      (viewport.contentSize.height - this.#renderedSize.height) / 2,
    )

    for (let row = 0; row < this.#cells.length; row++) {
      const y = row + offsetY
      if (y < 0 || y >= viewport.contentSize.height) {
        continue
      }

      const cellRow = this.#cells[row]
      for (let col = 0; col < cellRow.length; col++) {
        const x = col + offsetX
        if (x < 0 || x >= viewport.contentSize.width) {
          continue
        }

        const cell = cellRow[col]
        const style = new Style({
          foreground: cell.fg,
          background: cell.bg,
        })
        viewport.write(cell.char, new Point(x, y), style)
      }
    }
  }

  /**
   * Trigger an async image load if needed. The image will be resized using the
   * configured fit within the given pixel dimensions. When loading completes,
   * the view invalidates itself to trigger a re-render.
   */
  #ensureLoaded(targetWidth: number, targetPixelHeight: number) {
    const targetSize = new Size(targetWidth, targetPixelHeight)
    if (this.#loading && this.#requestedSize.isEqual(targetSize)) {
      return
    }

    if (this.#image && this.#requestedSize.isEqual(targetSize)) {
      return
    }

    this.#requestedSize = targetSize
    const generation = ++this.#loadGeneration
    this.#loading = this.#load(
      this.#source,
      this.#fit,
      targetWidth,
      targetPixelHeight,
      generation,
    )
  }

  async #load(
    source: string | Buffer,
    fit: ImageFit,
    targetWidth: number,
    targetPixelHeight: number,
    generation: number,
  ) {
    try {
      const image = await loadImageResized(
        source,
        targetWidth,
        targetPixelHeight,
        fit,
      )

      if (generation !== this.#loadGeneration) {
        return
      }

      this.#image = image
      this.#cells = renderPixels(image)
      this.#renderedSize = new Size(image.width, Math.ceil(image.height / 2))

      // Trigger re-render now that image data is available
      this.invalidateSize()
    } catch {
      if (generation !== this.#loadGeneration) {
        return
      }

      this.#image = undefined
      this.#cells = []
      this.#renderedSize = Size.zero
    } finally {
      if (generation === this.#loadGeneration) {
        this.#loading = undefined
      }
    }
  }
}
