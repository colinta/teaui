import {describe, it, expect, vi, beforeEach} from 'vitest'
import {testRender, Size} from '@teaui/core'
import {ImageView} from '../lib/ImageView.js'

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

describe('ImageView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty when no source', () => {
    const t = testRender(new ImageView({source: ''}), {
      width: 10,
      height: 5,
    })
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders empty before image loads', () => {
    // Never resolve the promise
    mockedLoadImageResized.mockReturnValue(new Promise(() => {}))
    const t = testRender(new ImageView({source: 'test.png'}), {
      width: 10,
      height: 5,
    })
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders a 2x2 image after loading', async () => {
    mockedLoadImageResized.mockResolvedValue(make2x2Image())

    const t = testRender(new ImageView({source: 'test.png'}), {
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

    const t = testRender(new ImageView({source: 'gradient.png'}), {
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

    const t = testRender(new ImageView({source: 'test.png'}), {
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

    testRender(new ImageView({source: 'photo.jpg'}), {
      width: 20,
      height: 10,
    })

    expect(mockedLoadImageResized).toHaveBeenCalledWith(
      'photo.jpg',
      20, // viewport width
      20, // viewport height * 2 (2 pixels per terminal row)
    )
  })

  it('naturalSize returns zero for empty source', () => {
    const view = new ImageView({source: ''})
    const size = view.naturalSize(new Size(40, 20))
    expect(size.width).toBe(0)
    expect(size.height).toBe(0)
  })

  it('handles load errors gracefully', async () => {
    mockedLoadImageResized.mockRejectedValue(new Error('File not found'))

    const t = testRender(new ImageView({source: 'missing.png'}), {
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
