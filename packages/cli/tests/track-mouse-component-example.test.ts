import {existsSync, readFileSync} from 'node:fs'
import {lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {trackMouseExample} from '../lib/examples/samples/track-mouse.js'

const WIDTH = 24
const HEIGHT = 5

const EXPECTED_OUTPUT = [
  ' 0123456789⠁123456789⠉12',
  '0Move over this panel   ',
  '1Rulers show position.  ',
  '2                       ',
  '3                   0, 0',
].join('\n')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('track-mouse CLI component example', () => {
  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact runnable sample at 24 by 5',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/track-mouse.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(trackMouseExample.source[framework]()).toBe(executable)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      expect(executable).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      if (framework === 'react') {
        expect(executable).toContain("import React from 'react'")
        expect(executable).toContain('<TrackMouse width={24} height={5}>')
        expect(executable).toContain(
          "<Text>{'Move over this panel\\nRulers show position.'}</Text>",
        )
        expect(executable).toContain('await run(')
        expect(executable).not.toContain('createElement')
        expect(executable).not.toContain("from '@teaui/core'")
        expect(
          existsSync(
            new URL(
              '../lib/examples/samples/track-mouse.react.js',
              import.meta.url,
            ),
          ),
        ).toBe(false)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = removeAnsi(await trackMouseExample.render[framework]())
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
        width: WIDTH,
        height: HEIGHT,
      })
      expect(output).toBe(EXPECTED_OUTPUT)
      const lines = output.split('\n')
      expect(lines).toHaveLength(HEIGHT)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(HEIGHT).fill(WIDTH),
      )
      expect(output).toMatchSnapshot()
    },
  )

  it('preserves identical Core and React output', async () => {
    // Captures replace Screen.start temporarily, so keep them sequential.
    const core = await trackMouseExample.render.core()
    const react = await trackMouseExample.render.react()
    expect(react).toBe(core)
  })
})
