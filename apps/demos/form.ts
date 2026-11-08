import {
  Button,
  Calendar,
  Checkbox,
  Dropdown,
  FontStyle,
  Form,
  type FormErrors,
  type FormField,
  type FormInput,
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
  type View,
} from '@teaui/core'

import {demo} from './demo.js'

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

const name = new Input({
  formName: 'name',
  value: 'Ada',
  multiline: 'submit',
})
const bio = new Input({
  formName: 'bio',
  value: 'Mathematician\nWriter',
  multiline: true,
  height: 2,
})
const terms = new Checkbox({
  formName: 'terms',
  title: 'Accept terms',
  value: false,
})
const newsletter = new Toggle({formName: 'newsletter', value: true})
const size = new RadioGroup({
  formName: 'size',
  value: 'medium',
  child: Stack.down([
    new Radio({title: 'Small', value: 'small'}),
    new Radio({title: 'Medium', value: 'medium'}),
    new Radio({title: 'Large (sold out)', value: 'large', isEnabled: false}),
  ]),
})
const volume = new Slider({formName: 'volume', range: [0, 10], value: 5})
const fruit = new Dropdown({
  formName: 'fruit',
  choices: FRUITS,
  selected: 'apple',
})
const toppings = new Dropdown({
  formName: 'toppings',
  multiple: true,
  choices: TOPPINGS,
  selected: [2],
})
const days = new ToggleGroup({
  formName: 'days',
  titles: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  multiple: true,
  selected: [0, 2],
})
const style = new FontStyle({
  formName: 'style',
  value: {bold: true, italic: false, underline: false, strikethrough: false},
})
const date = new Calendar({formName: 'date', selection: 'range'})

const inputs: (View & FormInput)[] = [
  name,
  bio,
  terms,
  newsletter,
  size,
  volume,
  fruit,
  toppings,
  days,
  style,
  date,
]
const submitButton = new FormSubmitButton({title: 'Submit'})

/**
 * While the form is submitting, this resolves the (pretend) request.
 */
let resolveSubmission: (() => void) | undefined
const resolveButton = new Button({
  title: 'Resolve form submission',
  isEnabled: false,
  onClick() {
    resolveButton.isEnabled = false
    resolveSubmission?.()
    resolveSubmission = undefined
  },
})

const status = new Text({text: 'Not submitted'})

const enabledCheckbox = new Checkbox({
  title: 'Enabled',
  value: true,
  onChange(isEnabled) {
    for (const input of inputs) {
      input.isEnabled = isEnabled
    }
    submitButton.isEnabled = isEnabled
  },
})
const failCheckbox = new Checkbox({
  title: 'Fail validation',
  value: false,
})

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

const form = new Form({
  onValidate(formData) {
    const errors = validate(formData)
    if (!failCheckbox.value) {
      return errors
    }

    // every other input (not just the ones in formData - an incomplete date
    // range has no value)
    const invalidNames = new Set(errors.map(({name}) => name))
    return errors.concat(
      inputs
        .filter(({formName}) => !invalidNames.has(formName))
        .map(({formName}) => ({
          name: formName,
          message: `${formName} is invalid`,
        })),
    )
  },
  onSubmit(formData) {
    console.info(JSON.stringify(formData))
    status.text = 'Submitting…'
    resolveButton.isEnabled = true
    return new Promise<FormErrors | undefined>(resolve => {
      resolveSubmission = () => {
        status.text = `Submitted ${formData.length} fields`
        resolve(undefined)
      }
    })
  },
  child: Stack.down({
    gap: 1,
    children: [
      Stack.right({
        gap: 2,
        children: [
          Stack.down({
            gap: 1,
            children: [
              field('Name (Enter submits)', name),
              field('Bio', bio),
              field('Terms', terms),
              field('Newsletter', newsletter),
              field('Size', size),
              field('Volume', volume),
            ],
          }),
          Stack.down({
            gap: 1,
            children: [
              field('Fruit', fruit),
              field('Toppings', toppings),
              field('Days', days),
              field('Style', style),
              field('Dates', date),
            ],
          }),
        ],
      }),
      submitButton,
    ],
  }),
})

function field(title: string, input: View & FormInput) {
  return Stack.down([new Label({for: input.formName, text: title}), input])
}

demo(
  Stack.down([
    Stack.right({
      gap: 2,
      children: [enabledCheckbox, failCheckbox, resolveButton, status],
    }),
    Separator.horizontal(),
    ['flex1', Scrollable.down({child: form})],
  ]),
  5,
)
