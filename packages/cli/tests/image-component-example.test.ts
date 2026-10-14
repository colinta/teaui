import {readFileSync} from 'node:fs'
import {lineWidth, removeAnsi, Screen, TestTerminal} from '@teaui/core'
import {Image, loadImage} from '@teaui/image'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {imageExample} from '../lib/examples/samples/image.js'

const SIZE = {width: 16, height: 6}
const RED = [224, 64, 64]
const BLUE = [64, 112, 224]
const GREEN = [64, 192, 128]
const GOLD = [224, 176, 64]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('image CLI component example', () => {
  it('documents encoded sources, asynchronous loading, fit, and terminal dimensions', () => {
    expect(imageExample.name).toBe('image')
    expect(imageExample.availability).toBe('both')
    expect(imageExample.description).toContain('@teaui/image')
    expect(imageExample.description).toContain('@teaui/image/react')
    expect(
      imageExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'source', type: 'string | Buffer', availability: 'both'},
      {
        name: 'fit',
        type: "'contain' | 'cover' | 'stretch'",
        availability: 'both',
      },
      {name: 'width', type: 'Dimension', availability: 'both'},
      {name: 'height', type: 'Dimension', availability: 'both'},
    ])
    const description = (name: string) =>
      imageExample.props.find(prop => prop.name === name)?.description
    expect(description('source')).toContain('Required local image file path')
    expect(description('source')).toContain('encoded image bytes')
    expect(description('source')).toContain('not raw RGBA pixels or a URL')
    expect(description('source')).toContain('blank until loaded')
    expect(description('source')).toContain('stays blank on failure')
    expect(description('fit')).toContain("Defaults to 'contain'")
    expect(description('fit')).toContain('without enlargement')
    expect(description('fit')).toContain('center-crops')
    expect(description('fit')).toContain('without preserving aspect ratio')
    expect(description('fit')).toContain('Changing source or fit reloads')
    expect(description('width')).toContain('16 columns')
    expect(description('width')).toContain('12-pixel-wide')
    expect(description('height')).toContain('two pixel rows')
    expect(description('height')).toContain('8 pixel rows (4 terminal rows)')
    expect(description('height')).toContain('Resizing reloads')
    expect(description('height')).toContain('black bottom half')
    // The separate package's JSX wrapper does not forward refs, accept children,
    // or provide a readiness callback; common View props are inherited.
    expect(imageExample.props.map(prop => prop.name)).not.toContain('ref')
    expect(imageExample.props.map(prop => prop.name)).not.toContain('children')
    expect(imageExample.props.map(prop => prop.name)).not.toContain('onLoad')
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact executable sample after real image decoding',
    async framework => {
      const extension = framework === 'core' ? 'js' : 'tsx'
      const moduleUrl = new URL(
        `../lib/examples/samples/image.${framework}.${extension}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(imageExample.source[framework]()).toBe(source)
      expect(source).toContain('const WIDTH = 16')
      expect(source).toContain('const HEIGHT = 6')
      expect(source).toContain('screen.render()')
      expect(source).toContain('screen.snapshot().includes(HALF_BLOCK)')
      expect(source).toContain('await delay(POLL_INTERVAL)')
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|testRender|tui-|createElement|fetch\(|readFile|Math\.random|Date\.|\.\.\//,
      )
      if (framework === 'core') {
        expect(source).toContain("import {Image} from '@teaui/image'")
        expect(source).toContain("import {Screen} from '@teaui/core'")
        expect(source).toContain('new Image({')
        expect(source).toContain("fit: 'contain'")
        expect(source).toContain('await Screen.start(image)')
      } else {
        expect(source).toContain("import {Image} from '@teaui/image/react'")
        expect(source).toContain("import {run} from '@teaui/react'")
        expect(source).toContain(
          '<Image source={SOURCE} fit="contain" width={WIDTH} height={HEIGHT} />',
        )
        expect(source).toContain('await run(')
        expect(source).not.toContain("from '@teaui/core'")
      }

      // Decode the embedded bytes with the real public API, without file/network
      // fixtures or mocking sharp. Raw RGBA would not be a valid Image source.
      const svg = source.match(/Buffer\.from\(`([\s\S]*?)`\)/)?.[1]
      expect(svg).toBeDefined()
      const decoded = await loadImage(Buffer.from(svg!))
      expect({width: decoded.width, height: decoded.height}).toEqual({
        width: 12,
        height: 8,
      })
      expect(decoded.pixels).toHaveLength(12 * 8 * 4)

      const originalStart = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const stopSpy = vi.spyOn(Screen.prototype, 'stop')
      const loadedSpy = vi.spyOn(Image.prototype, 'invalidateSize')
      const output = await imageExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(Screen.start).toBe(originalStart)
      expect(stopSpy).toHaveBeenCalledOnce()
      expect(loadedSpy).toHaveBeenCalled()

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines).toEqual([
        ' '.repeat(SIZE.width),
        ...Array(4).fill(`  ${'▀'.repeat(12)}  `),
        ' '.repeat(SIZE.width),
      ])
      expect(text).toMatchSnapshot('centered image text')

      // Replay the captured ANSI, not a separately constructed test-only view.
      const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
      output.split('\n').forEach((line, y) => {
        terminal.move(0, y)
        terminal.write(line)
      })
      const leftPairs = [
        [RED, RED],
        [RED, BLUE],
        [BLUE, BLUE],
        [BLUE, BLUE],
      ]
      const rightPairs = [
        [GREEN, GREEN],
        [GREEN, GREEN],
        [GREEN, GOLD],
        [GOLD, GOLD],
      ]
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 12; col++) {
          const [foreground, background] =
            col < 6 ? leftPairs[row] : rightPairs[row]
          expect(terminal.styleAt(col + 2, row + 1).foreground).toEqual(
            foreground,
          )
          expect(terminal.styleAt(col + 2, row + 1).background).toEqual(
            background,
          )
        }
      }
      expect(
        Array.from({length: 4}, (_, row) =>
          [2, 8].map(col => {
            const {foreground, background} = terminal.styleAt(col, row + 1)
            return {foreground, background}
          }),
        ),
      ).toMatchSnapshot('top and bottom pixel colors')

      expect(await imageExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
      expect(Screen.start).toBe(originalStart)
      expect(stopSpy).toHaveBeenCalledTimes(2)
    },
  )

  it('renders identical Core and public JSX-wrapper text', async () => {
    // captureExample replaces Screen.start temporarily: capture sequentially.
    const core = await imageExample.render.core()
    const react = await imageExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
