import {describe, it, expect} from 'vitest'
import {renderPixels} from '../lib/render.js'
import type {ImageData} from '../lib/loadImage.js'

function makeImage(width: number, height: number, pixels: number[]): ImageData {
  return {
    pixels: Buffer.from(pixels),
    width,
    height,
  }
}

describe('renderPixels', () => {
  it('renders a 1x2 image as a single cell', () => {
    // 1 pixel wide, 2 pixels tall → 1 terminal row, 1 terminal col
    const image = makeImage(
      1,
      2,
      [
        // top pixel: red, fully opaque
        255, 0, 0, 255,
        // bottom pixel: blue, fully opaque
        0, 0, 255, 255,
      ],
    )
    const cells = renderPixels(image)
    expect(cells).toHaveLength(1)
    expect(cells[0]).toHaveLength(1)
    expect(cells[0][0]).toEqual({
      char: '▀',
      fg: [255, 0, 0],
      bg: [0, 0, 255],
    })
  })

  it('renders a 2x2 image as one row, two columns', () => {
    const image = makeImage(
      2,
      2,
      [
        // row 0: red, green
        255, 0, 0, 255, 0, 255, 0, 255,
        // row 1: blue, white
        0, 0, 255, 255, 255, 255, 255, 255,
      ],
    )
    const cells = renderPixels(image)
    expect(cells).toHaveLength(1)
    expect(cells[0]).toHaveLength(2)
    expect(cells[0][0]).toEqual({char: '▀', fg: [255, 0, 0], bg: [0, 0, 255]})
    expect(cells[0][1]).toEqual({
      char: '▀',
      fg: [0, 255, 0],
      bg: [255, 255, 255],
    })
  })

  it('renders odd-height image with black bottom row', () => {
    // 1x1 image → 1 terminal row, bottom pixel is black (out of bounds)
    const image = makeImage(1, 1, [255, 128, 0, 255])
    const cells = renderPixels(image)
    expect(cells).toHaveLength(1)
    expect(cells[0][0]).toEqual({char: '▀', fg: [255, 128, 0], bg: [0, 0, 0]})
  })

  it('alpha-blends against black', () => {
    // White pixel at 50% opacity → ~128, 128, 128
    const image = makeImage(1, 2, [255, 255, 255, 128, 255, 255, 255, 0])
    const cells = renderPixels(image)
    expect(cells[0][0].fg).toEqual([128, 128, 128])
    // Fully transparent → black
    expect(cells[0][0].bg).toEqual([0, 0, 0])
  })

  it('returns empty array for zero-size image', () => {
    expect(
      renderPixels({pixels: Buffer.alloc(0), width: 0, height: 0}),
    ).toEqual([])
  })

  it('renders a 3x4 image as 2 terminal rows', () => {
    // 3 wide, 4 tall → 2 terminal rows, 3 columns
    const pixels = []
    for (let i = 0; i < 3 * 4; i++) {
      pixels.push(i * 20, i * 10, i * 5, 255)
    }
    const image = makeImage(3, 4, pixels)
    const cells = renderPixels(image)
    expect(cells).toHaveLength(2)
    expect(cells[0]).toHaveLength(3)
    expect(cells[1]).toHaveLength(3)
  })
})
