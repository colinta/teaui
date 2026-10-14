import {describe, it, expect, vi, beforeEach} from 'vitest'
import {testRender, Size} from '@teaui/core'
import {Image} from '../lib/Image.js'

// Mock sharp to avoid needing real image files in tests
vi.mock('../lib/loadImage.js', () => ({
  loadImage: vi.fn(),
  loadImageResized: vi.fn(),
}))

import {loadImageResized} from '../lib/loadImage.js'

const mockedLoadImageResized = vi.mocked(loadImageResized)

function make2x2Image() {
  return {
    // 2x2 RGBA image: red, green, blue, white
    pixels: Buffer.from([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
    ]),
    width: 2,
    height: 2,
  }
}

function makeSolidImage(width: number, height: number) {
  const pixels = Buffer.alloc(width * height * 4)
  for (let offset = 0; offset < pixels.length; offset += 4) {
    pixels[offset] = 255
    pixels[offset + 1] = 255
    pixels[offset + 2] = 255
    pixels[offset + 3] = 255
  }
  return {pixels, width, height}
}

function make4x4Image() {
  const pixels = Buffer.alloc(4 * 4 * 4)
  for (let i = 0; i < 16; i++) {
    const offset = i * 4
    const row = Math.floor(i / 4)
    const col = i % 4
    // Create a gradient pattern
    pixels[offset] = col * 85 // R
    pixels[offset + 1] = row * 85 // G
    pixels[offset + 2] = 128 // B
    pixels[offset + 3] = 255 // A
  }
  return {pixels, width: 4, height: 4}
}

describe('Image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty when no source', () => {
    const t = testRender(new Image({source: ''}), {
      width: 10,
      height: 5,
    })
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders empty before image loads', () => {
    // Never resolve the promise
    mockedLoadImageResized.mockReturnValue(new Promise(() => {}))
    const t = testRender(new Image({source: 'test.png'}), {
      width: 10,
      height: 5,
    })
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders a 2x2 image after loading', async () => {
    mockedLoadImageResized.mockResolvedValue(make2x2Image())

    const t = testRender(new Image({source: 'test.png'}), {
      width: 10,
      height: 5,
    })

    // Wait for the async load to complete
    await vi.waitFor(() => {
      t.render()
      const content = t.terminal.textContent()
      expect(content).toContain('▀')
    })

    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders a 4x4 image after loading', async () => {
    mockedLoadImageResized.mockResolvedValue(make4x4Image())

    const t = testRender(new Image({source: 'gradient.png'}), {
      width: 10,
      height: 5,
    })

    await vi.waitFor(() => {
      t.render()
      const content = t.terminal.textContent()
      expect(content).toContain('▀')
    })

    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('centers the image in the viewport', async () => {
    mockedLoadImageResized.mockResolvedValue(make2x2Image())

    const t = testRender(new Image({source: 'test.png'}), {
      width: 10,
      height: 5,
    })

    await vi.waitFor(() => {
      t.render()
      expect(t.terminal.textContent()).toContain('▀')
    })

    // 2x2 image → 2 cols, 1 terminal row
    // In 10x5 viewport, should be centered
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('calls loadImageResized with correct dimensions', async () => {
    mockedLoadImageResized.mockResolvedValue(make2x2Image())

    testRender(new Image({source: 'photo.jpg'}), {
      width: 20,
      height: 10,
    })

    expect(mockedLoadImageResized).toHaveBeenCalledWith(
      'photo.jpg',
      20, // viewport width
      20, // viewport height * 2 (2 pixels per terminal row)
      'contain',
    )
  })

  it.each(['cover', 'stretch'] as const)(
    'passes the %s fit to the image loader',
    fit => {
      mockedLoadImageResized.mockResolvedValue(make2x2Image())

      testRender(new Image({source: 'photo.jpg', fit}), {
        width: 20,
        height: 10,
      })

      expect(mockedLoadImageResized).toHaveBeenCalledWith(
        'photo.jpg',
        20,
        20,
        fit,
      )
    },
  )

  it.each(['cover', 'stretch'] as const)(
    'renders %s across the full viewport',
    async fit => {
      mockedLoadImageResized.mockResolvedValue(makeSolidImage(4, 4))
      const image = new Image({source: 'photo.jpg', fit})
      const t = testRender(image, {width: 4, height: 2})

      await vi.waitFor(() => {
        t.render()
        expect(t.terminal.textContent()).toContain('▀▀▀▀')
      })

      expect(t.terminal.textContent()).toMatchSnapshot()
      const resized = image.naturalSize(new Size(8, 4))
      expect(resized.width).toBe(8)
      expect(resized.height).toBe(4)
    },
  )

  it('reloads the image when fit changes', () => {
    mockedLoadImageResized.mockResolvedValue(make2x2Image())
    const image = new Image({source: 'photo.jpg'})
    const t = testRender(image, {width: 20, height: 10})

    image.update({source: 'photo.jpg', fit: 'cover'})
    t.render()

    expect(mockedLoadImageResized).toHaveBeenNthCalledWith(
      2,
      'photo.jpg',
      20,
      20,
      'cover',
    )
  })

  it('ignores a stale load after fit changes', async () => {
    let resolveContain!: (image: ReturnType<typeof make2x2Image>) => void
    let resolveCover!: (image: ReturnType<typeof make2x2Image>) => void
    const containLoad = new Promise<ReturnType<typeof make2x2Image>>(
      resolve => {
        resolveContain = resolve
      },
    )
    const coverLoad = new Promise<ReturnType<typeof make2x2Image>>(resolve => {
      resolveCover = resolve
    })
    mockedLoadImageResized
      .mockReturnValueOnce(containLoad)
      .mockReturnValueOnce(coverLoad)

    const image = new Image({source: 'photo.jpg'})
    const t = testRender(image, {width: 10, height: 5})
    image.update({source: 'photo.jpg', fit: 'cover'})
    t.render()

    resolveCover(make4x4Image())
    await vi.waitFor(() => {
      t.render()
      expect(t.terminal.textContent()).toContain('▀▀▀▀')
    })

    resolveContain(make2x2Image())
    await Promise.resolve()
    t.render()

    expect(t.terminal.textContent()).toContain('▀▀▀▀')
    expect(mockedLoadImageResized).toHaveBeenCalledTimes(2)
  })

  it('naturalSize returns zero for empty source', () => {
    const view = new Image({source: ''})
    const size = view.naturalSize(new Size(40, 20))
    expect(size.width).toBe(0)
    expect(size.height).toBe(0)
  })

  it('handles load errors gracefully', async () => {
    mockedLoadImageResized.mockRejectedValue(new Error('File not found'))

    const t = testRender(new Image({source: 'missing.png'}), {
      width: 10,
      height: 5,
    })

    // Wait a tick for the rejection to be handled
    await new Promise(resolve => setTimeout(resolve, 10))
    t.render()

    // Should render empty without crashing
    expect(t.terminal.textContent()).toMatchSnapshot()
  })
})
