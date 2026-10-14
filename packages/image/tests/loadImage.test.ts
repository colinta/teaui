import {beforeAll, describe, expect, it} from 'vitest'
import sharp from 'sharp'
import {loadImageResized} from '../lib/loadImage.js'

let wideImage: Buffer

beforeAll(async () => {
  const pixels = Buffer.from([
    255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255, 255, 0,
    0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
  ])

  wideImage = await sharp(pixels, {
    raw: {width: 4, height: 2, channels: 4},
  })
    .png()
    .toBuffer()
})

describe('loadImageResized', () => {
  it('contains by default without enlarging the image', async () => {
    const image = await loadImageResized(wideImage, 8, 8)

    expect(image.width).toBe(4)
    expect(image.height).toBe(2)
  })

  it('contains while preserving the aspect ratio', async () => {
    const image = await loadImageResized(wideImage, 2, 4, 'contain')

    expect(image.width).toBe(2)
    expect(image.height).toBe(1)
  })

  it('covers the target dimensions by cropping', async () => {
    const image = await loadImageResized(wideImage, 2, 4, 'cover')
    const stretched = await loadImageResized(wideImage, 2, 4, 'stretch')

    expect(image.width).toBe(2)
    expect(image.height).toBe(4)
    expect(image.pixels.equals(stretched.pixels)).toBe(false)
  })

  it('stretches to the exact target dimensions', async () => {
    const image = await loadImageResized(wideImage, 2, 4, 'stretch')

    expect(image.width).toBe(2)
    expect(image.height).toBe(4)
  })

  it.each(['cover', 'stretch'] as const)(
    'enlarges the image to %s the target dimensions',
    async fit => {
      const image = await loadImageResized(wideImage, 8, 8, fit)

      expect(image.width).toBe(8)
      expect(image.height).toBe(8)
    },
  )
})
