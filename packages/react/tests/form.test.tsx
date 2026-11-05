import {describe, it, expect, vi} from 'vitest'
import React from 'react'
import {
  Form,
  FormSubmitButton,
  Label,
  Root,
  type FormField,
  testRender,
} from '@teaui/core'
import {render} from '../lib/reconciler'
import * as Components from '../lib/components'

function renderToRoot(element: React.ReactNode): {root: Root} {
  const root = new Root()
  render({render: vi.fn()} as any, root, element)
  return {root}
}

function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

function click(t: ReturnType<typeof testRender>, x: number, y: number) {
  t.sendMouse('mouse.button.down', {x, y})
  t.sendMouse('mouse.button.up', {x, y})
}

describe('Form', () => {
  it('renders Form, Label, and FormSubmitButton', async () => {
    const {root} = renderToRoot(
      <Components.Form>
        <Components.Label for="name">Name</Components.Label>
        <Components.Input formName="name" value="Ada" />
        <Components.FormSubmitButton title="Submit" />
      </Components.Form>,
    )
    await flush()

    const form = root.children[0] as Form
    expect(form).toBeInstanceOf(Form)
    expect(form.children[0]).toBeInstanceOf(Label)
    expect((form.children[0] as Label).for).toBe('name')
    expect((form.children[0] as Label).text).toBe('Name')
    expect(form.children[2]).toBeInstanceOf(FormSubmitButton)

    const t = testRender(root, {width: 20, height: 3})
    expect(t.terminal.textContent()).toBe('Name\nAda\n     [ Submit ]')
  })

  it('validates and submits controlled inputs', async () => {
    const onSubmit = vi.fn()
    function App() {
      const [name, setName] = React.useState('')
      const [agree, setAgree] = React.useState(false)
      return (
        <Components.Form
          onValidate={formData =>
            formData.some(field => field.name === 'name' && field.value === '')
              ? [{name: 'name', message: 'Name is required'}]
              : []
          }
          onSubmit={onSubmit}
        >
          <Components.Label for="name">Name</Components.Label>
          <Components.Input formName="name" value={name} onChange={setName} />
          <Components.Checkbox
            formName="agree"
            title="Agree"
            value={agree}
            onChange={setAgree}
          />
          <Components.FormSubmitButton title="Submit" />
        </Components.Form>
      )
    }

    const {root} = renderToRoot(<App />)
    await flush()
    const t = testRender(root, {width: 20, height: 8})

    click(t, 1, 3)
    await flush()
    t.render()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(t.terminal.textContent()).toMatchSnapshot()
    // the message is red, the Label is red and italic
    expect(t.terminal.styleOf('Name is required')).toMatchObject({
      foreground: 'red',
    })
    expect(t.terminal.styleOf('Name is required')?.italic).not.toBe(true)
    expect(t.terminal.styleAt(0, 3)).toMatchObject({
      foreground: 'red',
      italic: true,
    })

    t.sendKey('A')
    await flush()
    // submit with the FormSubmitButton (moved up, the errors are still shown)
    click(t, 1, 6)
    await flush()
    t.render()
    const expected: FormField[] = [
      {name: 'name', type: 'string', value: 'A'},
      {name: 'agree', type: 'boolean', value: false},
    ]
    expect(onSubmit).toHaveBeenCalledWith(expected)
    expect(t.terminal.textContent()).toBe('Name\nA\n☐ Agree\n     [ Submit ]')
  })

  it('updates Label text and for', async () => {
    function App({text, htmlFor}: {text: string; htmlFor: string}) {
      return (
        <Components.Form>
          <Components.Label for={htmlFor}>{text}</Components.Label>
        </Components.Form>
      )
    }

    const root = new Root()
    const screen = {render: vi.fn()} as any
    render(screen, root, <App text="Name" htmlFor="name" />)
    await flush()
    render(screen, root, <App text="Email" htmlFor="email" />)
    await flush()

    const label = (root.children[0] as Form).children[0] as Label
    expect(label.text).toBe('Email')
    expect(label.for).toBe('email')
  })

  it('passes isEnabled and formName to inputs', async () => {
    const {root} = renderToRoot(
      <Components.Form>
        <Components.Dropdown
          formName="fruit"
          isEnabled={false}
          choices={[['Apple', 'apple']]}
          selected="apple"
        />
      </Components.Form>,
    )
    await flush()
    const dropdown = (root.children[0] as Form).children[0] as any
    expect(dropdown.formName).toBe('fruit')
    expect(dropdown.isEnabled).toBe(false)
    expect(dropdown.formData()).toEqual([
      {name: 'fruit', type: 'string', value: 'apple'},
    ])
  })
})
