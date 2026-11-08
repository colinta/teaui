import React, {useRef, useState} from 'react'
import {
  Button,
  Calendar,
  Checkbox,
  ConsoleLog,
  Dropdown,
  FontStyle,
  type FontStyleValue,
  Form,
  FormSubmitButton,
  Input,
  Label,
  Radio,
  RadioGroup,
  Scrollable,
  Separator,
  Slider,
  Stack,
  Text,
  Toggle,
  ToggleGroup,
  run,
} from '@teaui/react'
import {type FormErrors, type FormField, interceptConsoleLog} from '@teaui/core'

// ── Tab: Form ───────────────────────────────────────────────────────────────

const FRUITS: [string, string][] = [
  ['Apple', 'apple'],
  ['Banana', 'banana'],
  ['Cherry', 'cherry'],
]
const TOPPINGS: [string, number][] = [
  ['Sprinkles', 1],
  ['Fudge', 2],
  ['Nuts', 3],
]
const NAME_REGEX = /^\w+$/
const FORM_NAMES = [
  'name',
  'bio',
  'terms',
  'newsletter',
  'size',
  'volume',
  'fruit',
  'toppings',
  'days',
  'style',
  'date',
]

function validate(formData: FormField[]): FormErrors {
  const errors: FormErrors = []
  for (const field of formData) {
    if (field.type !== 'string') {
      continue
    }

    if (field.name === 'name') {
      if (field.value === '') {
        errors.push({name: 'name', message: 'Name is required'})
      } else if (!NAME_REGEX.test(field.value)) {
        errors.push({
          name: 'name',
          message: 'Name can only contain letters, numbers, and _',
        })
      }
    } else if (field.name === 'bio' && field.value === '') {
      errors.push({name: 'bio', message: 'Bio is required'})
    }
  }
  return errors
}

export function FormTab() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [failValidation, setFailValidation] = useState(false)
  const [status, setStatus] = useState('Not submitted')
  // While the form is submitting, this resolves the (pretend) request.
  const resolveSubmission = useRef<(() => void) | undefined>()
  const [isPending, setIsPending] = useState(false)

  const [name, setName] = useState('Ada')
  const [bio, setBio] = useState('Mathematician\nWriter')
  const [terms, setTerms] = useState(false)
  const [newsletter, setNewsletter] = useState(true)
  const [size, setSize] = useState('medium')
  const [volume, setVolume] = useState(5)
  const [fruit, setFruit] = useState('apple')
  const [toppings, setToppings] = useState<number[]>([2])
  const [days, setDays] = useState([0, 2])
  const [style, setStyle] = useState<FontStyleValue>({
    bold: true,
    italic: false,
    underline: false,
    strikethrough: false,
  })

  function onValidate(formData: FormField[]): FormErrors {
    const errors = validate(formData)
    if (!failValidation) {
      return errors
    }

    // every other input (not just the ones in formData - an incomplete date
    // range has no value)
    const invalidNames = new Set(errors.map(({name}) => name))
    return errors.concat(
      FORM_NAMES.filter(name => !invalidNames.has(name)).map(name => ({
        name,
        message: `${name} is invalid`,
      })),
    )
  }

  function onSubmit(formData: FormField[]) {
    console.info(JSON.stringify(formData))
    setStatus('Submitting…')
    setIsPending(true)
    return new Promise<FormErrors | undefined>(resolve => {
      resolveSubmission.current = () => {
        setStatus(`Submitted ${formData.length} fields`)
        resolve(undefined)
      }
    })
  }

  function resolve() {
    setIsPending(false)
    resolveSubmission.current?.()
    resolveSubmission.current = undefined
  }

  return (
    <Stack.down>
      <Stack.right gap={2}>
        <Checkbox title="Enabled" value={isEnabled} onChange={setIsEnabled} />
        <Checkbox
          title="Fail validation"
          value={failValidation}
          onChange={setFailValidation}
        />
        <Button
          title="Resolve form submission"
          isEnabled={isPending}
          onClick={resolve}
        />
        <Text>{status}</Text>
      </Stack.right>
      <Separator.horizontal />
      <Scrollable.down flex={1}>
        <Form onValidate={onValidate} onSubmit={onSubmit}>
          <Stack.down gap={1}>
            <Stack.right gap={2}>
              <Stack.down gap={1}>
                <Field title="Name (Enter submits)" name="name">
                  <Input
                    formName="name"
                    value={name}
                    onChange={setName}
                    multiline="submit"
                    isEnabled={isEnabled}
                  />
                </Field>
                <Field title="Bio" name="bio">
                  <Input
                    formName="bio"
                    value={bio}
                    onChange={setBio}
                    multiline
                    height={2}
                    isEnabled={isEnabled}
                  />
                </Field>
                <Field title="Terms" name="terms">
                  <Checkbox
                    formName="terms"
                    title="Accept terms"
                    value={terms}
                    onChange={setTerms}
                    isEnabled={isEnabled}
                  />
                </Field>
                <Field title="Newsletter" name="newsletter">
                  <Toggle
                    formName="newsletter"
                    value={newsletter}
                    onChange={setNewsletter}
                    isEnabled={isEnabled}
                  />
                </Field>
                <Field title="Size" name="size">
                  <RadioGroup
                    formName="size"
                    value={size}
                    onChange={setSize}
                    isEnabled={isEnabled}
                  >
                    <Stack.down>
                      <Radio title="Small" value="small" />
                      <Radio title="Medium" value="medium" />
                      <Radio
                        title="Large (sold out)"
                        value="large"
                        isEnabled={false}
                      />
                    </Stack.down>
                  </RadioGroup>
                </Field>
                <Field title="Volume" name="volume">
                  <Slider
                    formName="volume"
                    range={[0, 10]}
                    value={volume}
                    onChange={setVolume}
                    isEnabled={isEnabled}
                  />
                </Field>
              </Stack.down>
              <Stack.down gap={1}>
                <Field title="Fruit" name="fruit">
                  <Dropdown<string>
                    formName="fruit"
                    choices={FRUITS}
                    selected={fruit}
                    onSelect={setFruit}
                    isEnabled={isEnabled}
                  />
                </Field>
                <Field title="Toppings" name="toppings">
                  <Dropdown<number>
                    formName="toppings"
                    multiple
                    choices={TOPPINGS}
                    selected={toppings}
                    onSelect={setToppings}
                    isEnabled={isEnabled}
                  />
                </Field>
                <Field title="Days" name="days">
                  <ToggleGroup
                    formName="days"
                    titles={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
                    multiple
                    selected={days}
                    onChange={(_, selected) => setDays(selected)}
                    isEnabled={isEnabled}
                  />
                </Field>
                <Field title="Style" name="style">
                  <FontStyle
                    formName="style"
                    value={style}
                    onChange={setStyle}
                    isEnabled={isEnabled}
                  />
                </Field>
                <Field title="Dates" name="date">
                  <Calendar
                    formName="date"
                    selection="range"
                    isEnabled={isEnabled}
                  />
                </Field>
              </Stack.down>
            </Stack.right>
            <FormSubmitButton title="Submit" isEnabled={isEnabled} />
          </Stack.down>
        </Form>
      </Scrollable.down>
      <ConsoleLog height={5} />
    </Stack.down>
  )
}

function Field({
  title,
  name,
  children,
}: {
  title: string
  name: string
  children: React.ReactNode
}) {
  return (
    <Stack.down>
      <Label for={name}>{title}</Label>
      {children}
    </Stack.down>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()
  run(<FormTab />)
}
