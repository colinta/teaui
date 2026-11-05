import {
  Checkbox,
  Form,
  FormSubmitButton,
  Input,
  Label,
  Screen,
  Text,
} from '@teaui/core'

const status = new Text({text: 'Not signed up'})
const form = new Form({
  width: 32,
  height: 10,
  onValidate: formData => {
    const errors = []
    for (const field of formData) {
      if (field.type === 'string' && !field.value.includes('@')) {
        errors.push({name: 'email', message: 'Email needs an @'})
      }
      if (field.type === 'boolean' && !field.value) {
        errors.push({name: 'terms', message: 'Accept the terms'})
      }
    }
    return errors
  },
  onSubmit: formData => {
    const field = formData.find(field => field.name === 'email')
    status.text = `Signed up: ${field?.value}`
    return undefined
  },
  children: [
    new Label({for: 'email', text: 'Email (Enter submits)'}),
    new Input({formName: 'email', value: 'ada', submitsForm: true}),
    new Checkbox({formName: 'terms', title: 'Accept terms', value: false}),
    new FormSubmitButton({title: 'Sign up'}),
    status,
  ],
})

await Screen.start(form)
