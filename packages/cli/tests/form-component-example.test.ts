import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {Screen, lineWidth, removeAnsi, testRender} from '@teaui/core'

import {formExample} from '../lib/examples/samples/form.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 32, height: 10}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('form CLI component example', () => {
  it('documents Form, Label, and FormSubmitButton props', () => {
    expect(formExample.name).toBe('form')
    expect(formExample.availability).toBe('both')

    for (const framework of ['core', 'react'] as const) {
      const props = formExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'onValidate',
        'onSubmit',
        'width',
        'height',
        ...(framework === 'core' ? ['child', 'children'] : ['children', 'ref']),
        'Label.for',
        framework === 'core' ? 'Label.text' : 'Label.children',
        'FormSubmitButton.title',
        'FormSubmitButton.isEnabled',
      ])
      expect(new Set(names).size).toBe(names.length)
      expect(names).not.toContain('FormSubmitButton.onClick')
    }

    const prop = (name: string) =>
      formExample.props.find(prop => prop.name === name)!
    expect(prop('onValidate').type).toBe(
      '(formData: FormField[]) => FormErrors',
    )
    expect(prop('onValidate').description).toContain(
      'replace the current errors',
    )
    expect(prop('onSubmit').type).toBe(
      '(formData: FormField[]) => Promise<FormErrors | undefined> | FormErrors | undefined',
    )
    expect(prop('onSubmit').description).toContain('spinner')
    expect(prop('onSubmit').description).toContain('not caught')
    expect(prop('FormSubmitButton.title').description).toContain(
      'there is no onClick',
    )
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/form.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(formExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|createElement|setTimeout|setInterval|Math\.random|Date\./,
      )
      if (framework === 'core') {
        for (const snippet of [
          'width: 32',
          'height: 10',
          'onValidate: formData =>',
          'onSubmit: formData =>',
          "new Label({for: 'email'",
          "formName: 'email'",
          'submitsForm: true',
          "formName: 'terms'",
          "new FormSubmitButton({title: 'Sign up'})",
          'await Screen.start(form)',
        ]) {
          expect(source).toContain(snippet)
        }
      } else {
        for (const snippet of [
          "import React, {useState} from 'react'",
          'width={32}',
          'height={10}',
          'onValidate={formData =>',
          'onSubmit={formData =>',
          '<Label for="email">',
          'formName="email"',
          'submitsForm',
          'formName="terms"',
          '<FormSubmitButton title="Sign up" />',
          'await run(<App />)',
        ]) {
          expect(source).toContain(snippet)
        }
        expect(source).not.toContain("from '@teaui/core'")
        expect(
          existsSync(
            new URL('../lib/examples/samples/form.react.js', import.meta.url),
          ),
        ).toBe(false)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await formExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)

      const text = removeAnsi(output)
      expect(text).toContain('Email (Enter submits)')
      expect(text).toContain('ada')
      expect(text).toContain('☐ Accept terms')
      expect(text).toContain('Sign up')
      expect(text).toContain('Not signed up')
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(text).toMatchSnapshot()
      expect(await formExample.render[framework]()).toBe(output)
    },
  )

  it('produces identical Core and public-wrapper React output', async () => {
    // Screen.start is temporarily replaced by captureExample: capture sequentially.
    const core = await formExample.render.core()
    const react = await formExample.render.react()
    expect(react).toBe(core)
  })

  it.each(['core', 'react'] as const)(
    '%s executable sample validates, then submits',
    async framework => {
      // Reuse the exact sample's mounted tree, not a separate test-only UI.
      const stopSpy = vi.spyOn(Screen.prototype, 'stop')
      await formExample.render[framework]()
      const screen = stopSpy.mock.contexts[0]
      if (!(screen instanceof Screen)) {
        throw new Error('Sample did not stop a TeaUI screen')
      }
      const root = screen.rootView
      stopSpy.mockRestore()
      const t = testRender(root, SIZE)
      try {
        // Enter in the email input submits the form
        t.sendKey('return')
        await vi.waitFor(() => {
          t.render()
          expect(t.terminal.textContent()).toContain('Email needs an @')
        })
        const invalid = t.terminal.textContent()
        expect(invalid).toContain('Accept the terms')
        expect(invalid).toContain('→ ada')
        expect(invalid).toContain('→ ☐ Accept terms')
        expect(t.terminal.styleOf('Email (Enter submits)')).toMatchObject({
          foreground: 'red',
          italic: true,
        })

        t.sendKey('@')
        t.sendKey('return')
        await vi.waitFor(() => {
          t.render()
          expect(t.terminal.textContent()).not.toContain('Email needs an @')
        })
        expect(t.terminal.textContent()).toContain('Accept the terms')
        expect(t.terminal.textContent()).toContain('→ ☐ Accept terms')
        expect(t.terminal.textContent()).toContain('Not signed up')
      } finally {
        await screen.stop()
      }
    },
  )
})
