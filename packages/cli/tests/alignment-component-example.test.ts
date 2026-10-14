import {readFileSync} from 'node:fs'
import {lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {alignmentExample} from '../lib/examples/samples/alignment.js'
import * as capture from '../lib/examples/samples/capture.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('alignment CLI component example', () => {
  it('documents only marker props and the React-only ref', () => {
    expect(alignmentExample.name).toBe('alignment')
    expect(alignmentExample.availability).toBe('both')
    expect(alignmentExample.props).toEqual([
      expect.objectContaining({
        name: 'point',
        type: 'AlignmentPoint',
        availability: 'both',
      }),
      expect.objectContaining({
        name: 'name',
        type: 'string',
        availability: 'both',
      }),
      expect.objectContaining({
        name: 'isVisible',
        type: 'boolean',
        availability: 'both',
      }),
      expect.objectContaining({
        name: 'debug',
        type: 'boolean',
        availability: 'both',
      }),
      expect.objectContaining({
        name: 'ref',
        type: 'React.Ref<Alignment>',
        availability: 'react',
      }),
    ])
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact runnable sample at 40 by 6',
    async framework => {
      const extension = framework === 'react' ? 'tsx' : 'js'
      const moduleUrl = new URL(
        `../lib/examples/samples/alignment.${framework}.${extension}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(alignmentExample.source[framework]()).toBe(executable)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      expect(executable).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(executable).toContain(
        framework === 'core'
          ? 'right: cards.left.minus(1)'
          : 'right={cards.left.minus(1)}',
      )
      expect(executable).toContain(
        framework === 'core'
          ? 'await Screen.start(layout)'
          : 'await run(<App />)',
      )
      if (framework === 'react') {
        expect(executable).toContain("useAlignment('cards')")
        expect(executable).not.toMatch(/createElement|from '@teaui\/core'/)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await alignmentExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
        width: 40,
        height: 6,
      })
      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(6)
      expect(lines.map(line => lineWidth(line))).toEqual(Array(6).fill(40))
      expect(text).toContain('Ready')
      expect(text).toContain('Next step')
      // The invisible marker adds no row before the first card or between cards.
      expect(lines[0]).toContain('┌')
      expect(lines[3]).toContain('┌')
      expect(lines[0].slice(28, 33)).toBe('     ')
      expect(lines[3][28]).toBe(' ')
      expect(text).toMatchSnapshot()
      expect(await alignmentExample.render[framework]()).toBe(output)
    },
  )

  it('renders identical Core and public React text', async () => {
    // captureExample replaces Screen.start temporarily; captures are sequential.
    const core = await alignmentExample.render.core()
    const react = await alignmentExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
