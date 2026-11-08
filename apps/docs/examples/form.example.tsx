import React, {useState} from 'react'
import {
  Checkbox,
  Form,
  FormSubmitButton,
  Input,
  Label,
  Stack,
} from '@teaui/react'

function App() {
  const [email, setEmail] = useState('ada@example.com')
  const [terms, setTerms] = useState(false)

  return (
    <Form
      onValidate={formData =>
        formData.flatMap(field =>
          field.type === 'boolean' && !field.value
            ? [{name: field.name, message: 'Accept the terms'}]
            : [],
        )
      }
      onSubmit={async formData => {
        await saveAccount(formData)
        return undefined
      }}
    >
      <Label for="email">Email</Label>
      <Input
        formName="email"
        value={email}
        onChange={setEmail}
        multiline="submit"
      />
      <Stack.right gap={1}>
        <Checkbox
          formName="terms"
          title="Accept terms"
          value={terms}
          onChange={setTerms}
        />
        <FormSubmitButton title="Sign up" />
      </Stack.right>
    </Form>
  )
}

async function saveAccount(_formData: unknown) {}

export default {width: 40, height: 4, title: 'Form', App}
