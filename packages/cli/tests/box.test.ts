import {readFileSync} from 'node:fs'
import {BORDERS, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {boxExample} from '../lib/examples/samples/box.js'
import * as capture from '../lib/examples/samples/capture.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('box example', () => {
  it.each(['core', 'react'] as const)(
    'displays and captures the exact executable %s sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/box.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()

      expect(boxExample.source[framework]()).toBe(source)
      expect(source).toContain(
        framework === 'core' ? 'await Screen.start(box)' : 'await run(',
      )
      if (framework === 'react') {
        expect(source).toContain("import {Box, Text, run} from '@teaui/react'")
        expect(source).not.toContain('tui-box')
        expect(source).not.toContain('createElement')
        expect(source).toContain('<Box')
        expect(source).toContain('border="rounded"')
        expect(source).toContain('title="Greeting"')
        expect(source).toContain('highlight')
        expect(source).toContain('location="center"')
        expect(source).toContain('width={24}')
        expect(source).toContain('height={5}')
        expect(source).toContain('<Text>Hello from a box!</Text>')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      await boxExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
        width: 24,
        height: 5,
      })
    },
  )

  it('describes border presets and framework-specific child APIs', () => {
    expect(boxExample.name).toBe('box')
    expect(boxExample.availability).toBe('both')

    const border = boxExample.props.find(prop => prop.name === 'border')!
    for (const preset of BORDERS) {
      expect(border.type).toContain(`'${preset}'`)
    }
    expect(border.type).toContain('BorderChars')
    expect(border.availability).toBe('both')

    const coreProps = boxExample.props.filter(
      prop => prop.availability !== 'react',
    )
    const reactProps = boxExample.props.filter(
      prop => prop.availability !== 'core',
    )
    expect(coreProps.find(prop => prop.name === 'child')?.type).toBe('View')
    expect(coreProps.find(prop => prop.name === 'children')?.type).toBe(
      'View[]',
    )
    expect(coreProps.some(prop => prop.name === 'ref')).toBe(false)
    expect(reactProps.some(prop => prop.name === 'child')).toBe(false)
    expect(reactProps.find(prop => prop.name === 'children')?.type).toBe(
      'React.ReactNode',
    )
    expect(reactProps.find(prop => prop.name === 'ref')?.type).toBe(
      'React.Ref<Box>',
    )
  })

  it('captures matching, repeatable 24-column by 5-row output', async () => {
    // captureExample temporarily overrides Screen.start, so render sequentially.
    const core = await boxExample.render.core()
    const react = await boxExample.render.react()

    expect(react).toBe(core)
    expect(await boxExample.render.core()).toBe(core)
    expect(await boxExample.render.react()).toBe(react)
    expect(removeAnsi(core)).toMatchInlineSnapshot(`
      "╭─ Greeting ───────────╮
      │                      │
      │   Hello from a box!  │
      │                      │
      ╰──────────────────────╯"
    `)
  })
})
