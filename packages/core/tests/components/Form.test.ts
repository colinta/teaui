import {describe, expect, it, vi} from 'vitest'

import {testRender} from '../../lib/TestScreen.js'
import {
  Checkbox,
  Form,
  FormSubmitButton,
  type FormErrors,
  type FormField,
  type Props as FormProps,
  Input,
  Label,
  Text,
} from '../../lib/components/index.js'

const SIZE = {width: 30, height: 10}
// the first frame of the 'dots' Spinner
const SPINNER = '⣾'

function createForm(props: FormProps = {}) {
  const label = new Label({for: 'name', text: 'Name'})
  const name = new Input({formName: 'name', value: 'Ada'})
  const agree = new Checkbox({formName: 'agree', title: 'Agree', value: false})
  const button = new FormSubmitButton({title: 'Submit'})
  const form = new Form({...props, children: [label, name, agree, button]})
  return {form, label, name, agree, button}
}

function click(t: ReturnType<typeof testRender>, x: number, y: number) {
  t.sendMouse('mouse.button.down', {x, y})
  t.sendMouse('mouse.button.up', {x, y})
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

const FORM_DATA: FormField[] = [
  {name: 'name', type: 'string', value: 'Ada'},
  {name: 'agree', type: 'boolean', value: false},
]

describe('Form', () => {
  describe('rendering', () => {
    it('renders its children, without an errors box', () => {
      const {form} = createForm()
      const t = testRender(form, SIZE)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders error messages at the top, and marks invalid inputs and labels', async () => {
      const {form} = createForm({
        onValidate: () => [
          {name: 'name', message: 'Too short'},
          {name: '', message: 'Something else is wrong'},
        ],
      })
      const t = testRender(form, SIZE)
      await form.submit()
      t.render()

      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(t.terminal.styleOf('Too short')?.foreground).toBe('red')
      expect(t.terminal.styleOf('Name')).toMatchObject({
        foreground: 'red',
        italic: true,
      })
      // the checkbox is valid
      expect(t.terminal.textContent()).toContain('\n☐ Agree')
    })
  })

  describe('children', () => {
    it('only exposes the children that were added', () => {
      const {form, label, name, agree, button} = createForm()
      expect(form.children).toEqual([label, name, agree, button])

      const text = new Text('first')
      form.add(text, 0)
      expect(form.children).toEqual([text, label, name, agree, button])

      form.removeChild(text)
      expect(form.children).toEqual([label, name, agree, button])
    })

    it('still shows errors after removeAllChildren', async () => {
      const {form} = createForm({
        onValidate: () => [{name: 'name', message: 'Required'}],
      })
      form.removeAllChildren()
      expect(form.children).toEqual([])

      form.add(new Input({formName: 'name', value: ''}))
      const t = testRender(form, SIZE)
      await form.submit()
      t.render()
      expect(t.terminal.textContent()).toBe('\n Required\n\n→')
    })
  })

  describe('submit', () => {
    it('validates the form data, and does not submit when there are errors', async () => {
      const onValidate = vi.fn(() => [{name: 'agree', message: 'Agree!'}])
      const onSubmit = vi.fn()
      const {form} = createForm({onValidate, onSubmit})
      await form.submit()
      expect(onValidate).toHaveBeenCalledWith(FORM_DATA)
      expect(onSubmit).not.toHaveBeenCalled()
      expect(form.errors).toEqual([{name: 'agree', message: 'Agree!'}])
    })

    it('replaces the errors with the validation errors, and [] clears them', async () => {
      let errors: FormErrors = [{name: 'name', message: 'Bad name'}]
      const onSubmit = vi.fn()
      const {form} = createForm({onValidate: () => errors, onSubmit})
      const t = testRender(form, SIZE)

      await form.submit()
      t.render()
      expect(t.terminal.textContent()).toContain('Bad name')

      errors = []
      await form.submit()
      t.render()
      expect(form.errors).toEqual([])
      expect(t.terminal.textContent()).toBe(
        testRender(createForm().form, SIZE).terminal.textContent(),
      )
      expect(onSubmit).toHaveBeenCalledWith(FORM_DATA)
    })

    it('shows the errors returned by onSubmit', async () => {
      const {form} = createForm({
        onSubmit: () => [{name: 'agree', message: 'Agree, please'}],
      })
      const t = testRender(form, SIZE)
      await form.submit()
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('skips inputs without a formName, and includes disabled inputs', async () => {
      const onSubmit = vi.fn()
      const form = new Form({
        onSubmit,
        children: [
          new Input({value: 'unnamed'}),
          new Input({formName: 'disabled', value: 'kept', isEnabled: false}),
        ],
      })
      await form.submit()
      expect(onSubmit).toHaveBeenCalledWith([
        {name: 'disabled', type: 'string', value: 'kept'},
      ])
    })

    it('a synchronous onSubmit never enters the submitting state', async () => {
      const {form, name} = createForm({
        onSubmit: () => {
          expect(form.isSubmitting).toBe(false)
          return undefined
        },
      })
      const setIsFormSubmitting = vi.spyOn(name, 'setIsFormSubmitting')
      const t = testRender(form, SIZE)
      await form.submit()
      t.render()
      expect(form.isSubmitting).toBe(false)
      expect(t.terminal.textContent()).not.toContain(SPINNER)
      expect(setIsFormSubmitting).not.toHaveBeenCalledWith(true)
    })

    it('an immediately resolved promise does not show the spinner', async () => {
      const {form} = createForm({onSubmit: async () => undefined})
      const t = testRender(form, SIZE)
      await form.submit()
      t.render()
      expect(form.isSubmitting).toBe(false)
      expect(t.terminal.textContent()).not.toContain(SPINNER)
    })

    it('disables the inputs and shows a spinner while a promise is pending', async () => {
      const {promise, resolve} = deferred<FormErrors | undefined>()
      const onSubmit = vi.fn(() => promise)
      const {form, name, button} = createForm({onSubmit})
      const t = testRender(form, SIZE)

      const submitted = form.submit()
      t.render()
      expect(form.isSubmitting).toBe(true)
      expect(t.terminal.charAt(0, 0)).toBe(SPINNER)
      expect(t.terminal.styleOf('Ada')?.dim).toBe(true)
      expect(t.terminal.styleOf('Submit')?.dim).toBe(true)

      // the input is focused, but not editable
      t.sendKey('x')
      expect(name.value).toBe('Ada')

      // submitting again is ignored
      click(t, 1, 3)
      await form.submit()
      expect(onSubmit).toHaveBeenCalledOnce()

      resolve([{name: 'name', message: 'Taken'}])
      await submitted
      t.render()
      expect(form.isSubmitting).toBe(false)
      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(t.terminal.styleOf('Submit')?.dim).not.toBe(true)

      t.sendKey('x')
      expect(name.value).toBe('Adax')
      expect(button.isEnabled).toBe(true)
    })

    it('does not catch errors, but leaves the submitting state', async () => {
      const {form, name} = createForm({
        onSubmit: async () => {
          throw new Error('oops')
        },
      })
      await expect(form.submit()).rejects.toThrow('oops')
      expect(form.isSubmitting).toBe(false)

      const t = testRender(form, SIZE)
      t.sendKey('x')
      expect(name.value).toBe('Adax')
    })
  })

  describe('FormSubmitButton', () => {
    it('submits its form when clicked', () => {
      const onSubmit = vi.fn()
      const {form} = createForm({onSubmit})
      const t = testRender(form, SIZE)
      click(t, 1, 3)
      expect(onSubmit).toHaveBeenCalledWith(FORM_DATA)
    })

    it('does not call onClick', () => {
      const onClick = vi.fn()
      const onSubmit = vi.fn()
      const form = new Form({
        onSubmit,
        child: new FormSubmitButton({title: 'Submit', onClick} as any),
      })
      const t = testRender(form, SIZE)
      click(t, 1, 0)
      expect(onSubmit).toHaveBeenCalledOnce()
      expect(onClick).not.toHaveBeenCalled()
    })

    it('does not submit when disabled', () => {
      const onSubmit = vi.fn()
      const form = new Form({
        onSubmit,
        child: new FormSubmitButton({title: 'Submit', isEnabled: false}),
      })
      const t = testRender(form, SIZE)
      expect(t.terminal.styleOf('Submit')?.dim).toBe(true)
      click(t, 1, 0)
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Input multiline submission modes', () => {
    it.each(['submit', 'mixed'] as const)(
      '%s submits the form on Enter, after calling onSubmit',
      multiline => {
        const calls: string[] = []
        const form = new Form({
          onSubmit: () => {
            calls.push('form')
            return undefined
          },
          child: new Input({
            formName: 'name',
            value: 'Ada',
            multiline,
            onSubmit: () => calls.push('input'),
          }),
        })
        const t = testRender(form, SIZE)
        t.sendKey('return')
        expect(calls).toEqual(['input', 'form'])
      },
    )

    it('disabled ignores Enter', () => {
      const onSubmit = vi.fn()
      const input = new Input({formName: 'name', value: 'Ada', onSubmit})
      const form = new Form({onSubmit, child: input})
      const t = testRender(form, SIZE)
      t.sendKey('return')
      expect(onSubmit).not.toHaveBeenCalled()
      expect(input.value).toBe('Ada')
    })

    it('multiline inserts a newline without submitting', () => {
      const onSubmit = vi.fn()
      const input = new Input({
        formName: 'notes',
        value: 'Ada',
        multiline: true,
      })
      const form = new Form({onSubmit, child: input})
      const t = testRender(form, SIZE)
      t.sendKey('return')
      expect(onSubmit).not.toHaveBeenCalled()
      expect(input.value).toBe('Ada\n')
    })

    it('mixed inserts a newline on Shift+Enter without submitting', () => {
      const onSubmit = vi.fn()
      const input = new Input({
        formName: 'notes',
        value: 'Ada',
        multiline: 'mixed',
      })
      const form = new Form({onSubmit, child: input})
      const t = testRender(form, SIZE)
      t.sendKey('return', {shift: true})
      expect(onSubmit).not.toHaveBeenCalled()
      expect(input.value).toBe('Ada\n')
    })
  })
})
