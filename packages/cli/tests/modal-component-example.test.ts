import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  Modal,
  Screen,
  Style,
  lineWidth,
  removeAnsi,
  testRender,
} from '@teaui/core'

import {modalExample} from '../lib/examples/samples/modal.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 36, height: 10}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('modal CLI component example', () => {
  it('documents dismissal callbacks and the non-portal React wrapper accurately', () => {
    expect(modalExample.name).toBe('modal')
    expect(modalExample.availability).toBe('both')
    expect(modalExample.description).toContain('viewport.requestModal()')
    for (const framework of ['core', 'react'] as const) {
      const props = modalExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(new Set(names).size).toBe(names.length)
      expect(names).toEqual([
        'dim',
        'dimStyle',
        'dismissOnClick',
        'dismissOnEsc',
        'onDismiss',
        'width',
        'height',
        ...(framework === 'core' ? ['child', 'children'] : ['children', 'ref']),
      ])
      expect(props.find(prop => prop.name === 'dim')).toEqual(
        expect.objectContaining({
          type: 'boolean',
          description: expect.stringContaining('defaults to false'),
        }),
      )
      expect(props.find(prop => prop.name === 'dimStyle')).toEqual(
        expect.objectContaining({
          type: 'Style',
          description: expect.stringContaining('purpose scrim'),
        }),
      )
      expect(props.find(prop => prop.name === 'dismissOnClick')).toEqual(
        expect.objectContaining({
          type: 'boolean',
          description: expect.stringContaining('defaults to true'),
        }),
      )
      expect(props.find(prop => prop.name === 'dismissOnEsc')).toEqual(
        expect.objectContaining({
          type: 'boolean',
          description: expect.stringContaining('defaults to false'),
        }),
      )
      expect(props.find(prop => prop.name === 'onDismiss')).toEqual(
        expect.objectContaining({
          type: '() => void',
          description: expect.stringContaining('stop requesting'),
        }),
      )
      for (const name of ['width', 'height']) {
        expect(props.find(prop => prop.name === name)).toEqual(
          expect.objectContaining({
            type: 'Dimension',
            description: expect.stringContaining('size the dialog child'),
          }),
        )
      }
      expect(props.find(prop => prop.name === 'children')?.type).toBe(
        framework === 'core' ? 'View[]' : 'React.ReactNode',
      )
    }
    expect(modalExample.props.find(prop => prop.name === 'child')).toEqual({
      name: 'child',
      type: 'View',
      description: 'Single modal content view',
      availability: 'core',
    })
    expect(modalExample.props.find(prop => prop.name === 'ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Modal>',
      description: 'Reference to the underlying Core Modal',
      availability: 'react',
    })
    expect(
      modalExample.props.find(
        prop => prop.name === 'children' && prop.availability === 'react',
      )?.description,
    ).toContain('not an automatic portal')
  })

  it('matches the public defaults and setters without inventing a visible prop', () => {
    const modal = new Modal()
    expect(modal.dim).toBe(false)
    expect(modal.dimStyle).toBeUndefined()
    expect(modal.dismissOnClick).toBe(true)
    expect(modal.dismissOnEsc).toBe(false)
    expect(modal.onDismiss).toBeUndefined()

    const style = new Style({foreground: 'gray', background: 'black'})
    const onDismiss = vi.fn()
    modal.dim = true
    modal.dimStyle = style
    modal.dismissOnClick = false
    modal.dismissOnEsc = true
    modal.onDismiss = onDismiss
    expect(modal.dim).toBe(true)
    expect(modal.dimStyle).toBe(style)
    expect(modal.dismissOnClick).toBe(false)
    expect(modal.dismissOnEsc).toBe(true)
    expect(modal.onDismiss).toBe(onDismiss)
  })

  it.each(['core', 'react'] as const)(
    '%s captures the exact executable sample with a visible requested modal',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/modal.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(modalExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|setTimeout|setInterval/,
      )
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).toMatch(
        /viewport\.requestModal\(modal(?: as CoreModal)?\)/,
      )
      expect(source).toContain('this.showModal = false')
      expect(source).toContain('this.invalidateRender()')
      expect(source).toContain(
        framework === 'react' ? 'width={36}' : 'width: 36',
      )
      expect(source).toContain(
        framework === 'react' ? 'height={10}' : 'height: 10',
      )
      expect(source).toContain(
        framework === 'react' ? '\n      dim\n' : 'dim: true',
      )
      expect(source).toContain(
        framework === 'react' ? 'dismissOnEsc={false}' : 'dismissOnEsc: false',
      )
      expect(source).toContain(
        framework === 'react' ? 'onDismiss={' : 'onDismiss:',
      )
      expect(source).toContain('screen.render()')
      if (framework === 'react') {
        expect(source).toContain('await run(')
        expect(source).toContain('registerElement(')
        expect(source).toContain('<modal-example-host')
        for (const component of ['Modal', 'Mouse', 'Box', 'Text']) {
          expect(source).toContain(`<${component}`)
        }
        expect(source).not.toMatch(/createElement|tui-modal|new Modal\(/)
        expect(
          existsSync(
            new URL('../lib/examples/samples/modal.react.js', import.meta.url),
          ),
        ).toBe(false)
      } else {
        expect(source).toContain('new Modal(')
        expect(source).toContain('await Screen.start(host)')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const requestSpy = vi.spyOn(Screen.prototype, 'requestModal')
      const output = await modalExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(requestSpy).toHaveBeenCalled()
      const modal = requestSpy.mock.calls[0][0]
      expect(modal).toBeInstanceOf(Modal)
      expect(modal.dim).toBe(true)
      expect(modal.dimStyle).toEqual(
        new Style({foreground: 'gray', background: 'black'}),
      )
      expect(modal.windowSize).toEqual(expect.objectContaining(SIZE))
      expect(modal.presentedRect.origin).toEqual(
        expect.objectContaining({x: 0, y: 0}),
      )
      expect(modal.presentedRect.size).toEqual(expect.objectContaining(SIZE))

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(text).toContain('Document editor')
      expect(text).toContain('Draft: quarterly report')
      expect(text).toContain('Publish document?')
      expect(text).toContain('Review the changes.')
      expect(text).toContain('Click outside to close.')
      expect(text).toContain('Underlying content stays put')
      expect(text).not.toContain('Hidden draft text')
      expect(text).toMatchSnapshot()
      expect(await modalExample.render[framework]()).toBe(output)
    },
  )

  it.each(['core', 'react'] as const)(
    '%s sample dismisses by outside click but not inside the dialog or Escape',
    async framework => {
      const requestSpy = vi.spyOn(Screen.prototype, 'requestModal')
      await modalExample.render[framework]()
      const modal = requestSpy.mock.calls[0][0]
      const host = modal.parent!
      requestSpy.mockRestore()
      const t = testRender(host, SIZE)
      try {
        expect(t.terminal.textContent()).toContain('Publish document?')
        expect(t.terminal.styleOf('Document editor')).toEqual(
          expect.objectContaining({foreground: 'gray', background: 'black'}),
        )
        t.sendMouse('mouse.button.down', {x: 8, y: 4})
        t.sendMouse('mouse.button.up', {x: 8, y: 4})
        expect(t.terminal.textContent()).toContain('Publish document?')

        t.sendKey('escape')
        expect(t.terminal.textContent()).toContain('Publish document?')
        t.sendMouse('mouse.button.down', {x: 0, y: 0})
        t.sendMouse('mouse.button.up', {x: 0, y: 0})
        const text = t.terminal.textContent()
        expect(text).not.toContain('Publish document?')
        expect(text).toContain('Hidden draft text')
        expect(text).toContain('Underlying content stays put')
        expect(t.terminal.styleOf('Document editor')?.foreground).not.toBe(
          'gray',
        )
      } finally {
        host.screen?.stop()
      }
    },
  )

  it('renders identical Core and public-wrapper React text', async () => {
    expect(removeAnsi(await modalExample.render.react())).toBe(
      removeAnsi(await modalExample.render.core()),
    )
  })
})
