import type {ImageData} from './loadImage.js'

/**
 * A rendered cell represents one terminal character position.
 * Uses the Unicode half-block character '▀' (upper half block) to render
 * two vertical pixels per cell: the foreground color is the top pixel and
 * the background color is the bottom pixel.
 */
export interface RenderedCell {
  char: string
  /** Top pixel color as [r, g, b] */
  fg: [number, number, number]
  /** Bottom pixel color as [r, g, b] */
  bg: [number, number, number]
}

/**
 * Convert raw RGBA image data into a 2D grid of terminal cells.
 * Each terminal row represents 2 image rows using the half-block technique.
 *
 * @returns A 2D array [row][col] of RenderedCell
 */
export function renderPixels(image: ImageData): RenderedCell[][] {
  const {pixels, width, height} = image

  if (width === 0 || height === 0) {
    return []
  }

  // Each terminal row represents 2 image pixel rows
  const termRows = Math.ceil(height / 2)
  const result: RenderedCell[][] = []

  for (let termRow = 0; termRow < termRows; termRow++) {
    const row: RenderedCell[] = []
    const topY = termRow * 2
    const bottomY = topY + 1

    for (let x = 0; x < width; x++) {
      const topColor = pixelAt(pixels, width, x, topY, height)
      const bottomColor = pixelAt(pixels, width, x, bottomY, height)

      row.push({
        char: UPPER_HALF_BLOCK,
        fg: topColor,
        bg: bottomColor,
      })
    }

    result.push(row)
  }

  return result
}

/**
 * Get the RGB color of a pixel, alpha-blending against black.
 * Returns [0,0,0] for out-of-bounds coordinates.
 */
function pixelAt(
  pixels: Buffer,
  width: number,
  x: number,
  y: number,
  height: number,
): [number, number, number] {
  if (y >= height) {
    return [0, 0, 0]
  }

  const offset = (y * width + x) * BYTES_PER_PIXEL
  const r = pixels[offset]
  const g = pixels[offset + 1]
  const b = pixels[offset + 2]
  const a = pixels[offset + 3] / 255

  // Alpha-blend against black background
  return [Math.round(r * a), Math.round(g * a), Math.round(b * a)]
}

const UPPER_HALF_BLOCK = '▀'
const BYTES_PER_PIXEL = 4
