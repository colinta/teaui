import {
  Alert,
  Button,
  Callout,
  Scrollable,
  Space,
  Stack,
  Style,
  Text,
} from '@teaui/core'

import {demo} from './demo.js'

const callouts = Stack.down({
  gap: 1,
  children: [
    new Callout({
      title: 'Note',
      purpose: 'primary',
      children: [new Text({text: 'Remember to save your work.', wrap: true})],
    }),
    new Callout({
      purpose: 'cancel',
      children: [new Text({text: 'This action cannot be undone.', wrap: true})],
    }),
    new Callout({
      title: 'Success',
      purpose: 'proceed',
      children: [new Text({text: 'Your changes have been saved.', wrap: true})],
    }),
    new Callout({
      title: 'Warning',
      purpose: 'secondary',
      children: [
        new Text({
          text: 'You are running low on disk space. Consider freeing up some room.',
          wrap: true,
        }),
      ],
    }),
    new Callout({
      children: [
        new Text({
          text: 'A plain callout with no title or purpose.',
          wrap: true,
        }),
      ],
    }),
  ],
})

const deleteAlert = new Alert({
  title: 'Confirm Delete',
  purpose: 'cancel',
  dismissOnEsc: true,
  onDismiss() {
    console.info('Alert dismissed')
  },
  children: [
    new Text({
      text: 'Are you sure you want to delete this item?',
      wrap: true,
    }),
    new Space({height: 1}),
    Stack.right({
      gap: 1,
      children: [
        new Button({
          title: 'Delete',
          theme: 'cancel',
          onClick() {
            console.info('Deleted!')
            deleteAlert.dismiss()
          },
        }),
        new Button({
          title: 'Cancel',
          theme: 'plain',
          onClick() {
            deleteAlert.dismiss()
          },
        }),
      ],
    }),
  ],
})

const infoAlert = new Alert({
  title: 'Information',
  purpose: 'primary',
  dismissOnEsc: true,
  onDismiss() {
    console.info('Info dismissed')
  },
  children: [
    new Text({
      text: 'The operation completed successfully.',
      wrap: true,
    }),
    new Space({height: 1}),
    new Button({
      title: 'OK',
      theme: 'primary',
      onClick() {
        infoAlert.dismiss()
      },
    }),
  ],
})

const layout = new Scrollable({
  gap: 1,
  children: [
    new Text({
      text: 'Alert Examples (click to show modal)',
      style: new Style({bold: true}),
    }),
    Stack.right({
      gap: 1,
      children: [
        new Button({
          title: 'Show Alert',
          theme: 'cancel',
          height: 3,
          onClick() {
            deleteAlert.presentFrom(layout)
          },
        }),
        new Button({
          title: 'Show Info Alert',
          theme: 'primary',
          height: 3,
          onClick() {
            infoAlert.presentFrom(layout)
          },
        }),
      ],
    }),
    new Text({
      text: 'Callout Examples',
      style: new Style({bold: true}),
    }),
    callouts,
    new Space({flex: 1}),
  ],
})

demo(layout)
