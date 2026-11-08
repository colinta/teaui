import React, {useState} from 'react'
import {
  Checkbox,
  Form,
  FormSubmitButton,
  Input,
  Label,
  Text,
  run,
} from '@teaui/react'

function App() {
  const [email, setEmail] = useState('ada')
  const [terms, setTerms] = useState(false)
  const [status, setStatus] = useState('Not signed up')

  return (
    <Form
      width={32}
      height={10}
      onValidate={formData => {
        const errors: {name: string; message: string}[] = []
        for (const field of formData) {
          if (field.type === 'string' && !field.value.includes('@')) {
            errors.push({name: 'email', message: 'Email needs an @'})
          }
          if (field.type === 'boolean' && !field.value) {
            errors.push({name: 'terms', message: 'Accept the terms'})
          }
        }
        return errors
      }}
      onSubmit={formData => {
        const field = formData.find(field => field.name === 'email')
        setStatus(`Signed up: ${field?.value}`)
        return undefined
      }}
    >
      <Label for="email">Email (Enter submits)</Label>
      <Input
        formName="email"
        value={email}
        onChange={setEmail}
        multiline="submit"
      />
      <Checkbox
        formName="terms"
        title="Accept terms"
        value={terms}
        onChange={setTerms}
      />
      <FormSubmitButton title="Sign up" />
      <Text>{status}</Text>
    </Form>
  )
}

await run(<App />)
