import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 32
const HEIGHT = 10

export const formExample: ComponentExample = {
  name: 'form',
  availability: 'both',
  description:
    'Collect, validate, and submit the values of its inputs. Errors are listed at the top of the form, invalid inputs are marked with →, and their (bold) Labels are drawn in red bold italics',
  props: [
    {
      name: 'onValidate',
      type: '(formData: FormField[]) => FormErrors',
      description:
        "Called with the data of every named input when the form is submitted. Returns the errors (which replace the current errors), or [] to clear them and call onSubmit. Inputs with formName '' are not included; disabled inputs are",
      availability: 'both',
    },
    {
      name: 'onSubmit',
      type: '(formData: FormField[]) => Promise<FormErrors | undefined> | FormErrors | undefined',
      description:
        'Called with valid form data. The returned errors replace the current errors; undefined is success. While a returned Promise is pending, the inputs are disabled and a spinner is drawn in the top-left corner. A synchronous result never shows the spinner. Errors thrown or rejected are not caught',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Width in columns or fill/shrink/natural; naturally the widest child or error',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Height in rows or fill/shrink/natural; the children are stacked downward, after the errors',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description: 'Single child view, added after children',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description:
        'Stacked downward. FormInput descendants (at any depth) with a formName take part in the form. Core calls form.submit() to submit',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Stacked downward. FormInput descendants (at any depth) with a formName take part in the form',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Form>',
      description:
        'Reference to the underlying Core Form, e.g. to call submit()',
      availability: 'react',
    },
    {
      name: 'Label.for',
      type: 'string',
      description:
        'The formName of the input this label describes; the label is drawn in bold, and in red bold italics while that input has errors',
      availability: 'both',
    },
    {
      name: 'Label.text',
      type: 'string',
      description: 'The label text',
      availability: 'core',
    },
    {
      name: 'Label.children',
      type: 'string',
      description: 'The label text',
      availability: 'react',
    },
    {
      name: 'FormSubmitButton.title',
      type: 'string',
      description:
        'Button title. Clicking, Return, or the hotKey submits the nearest Form; there is no onClick',
      availability: 'both',
    },
    {
      name: 'FormSubmitButton.isEnabled',
      type: 'boolean',
      description:
        'Defaults to true; when false the button is drawn dimmed and does not submit. It is also disabled while the form is submitting',
      availability: 'both',
    },
  ],
  source: {
    core: () => readExampleSource('form.core.js'),
    react: () => readExampleSource('form.react.tsx'),
  },
  render: {
    core: () => renderSample('form.core.js'),
    react: () => renderSample('form.react.tsx'),
  },
}

function readExampleSource(filename: string): string {
  return readFileSync(
    new URL(`./${filename}`, import.meta.url),
    'utf8',
  ).trimEnd()
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
