import {
  Alert,
  Button,
  Callout,
  Rect,
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

const showAlertButton = new Button({
  title: 'Show Alert',
  theme: 'cancel',
  height: 3,
  onClick() {
    const {modal} = Alert.modal({
      title: 'Confirm Delete',
      purpose: 'cancel',
      dismissOnEsc: true,
      onDismiss() {
        console.log('Alert dismissed')
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
                console.log('Deleted!')
              },
            }),
            new Button({
              title: 'Cancel',
              theme: 'plain',
              onClick() {
                console.log('Cancelled')
              },
            }),
          ],
        }),
      ],
    })
    showAlertButton.screen?.requestModal(modal, Rect.zero)
  },
})

const showInfoButton = new Button({
  title: 'Show Info Alert',
  theme: 'primary',
  height: 3,
  onClick() {
    const {modal} = Alert.modal({
      title: 'Information',
      purpose: 'primary',
      dismissOnEsc: true,
      onDismiss() {
        console.log('Info dismissed')
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
            console.log('OK clicked')
          },
        }),
      ],
    })
    showInfoButton.screen?.requestModal(modal, Rect.zero)
  },
})

demo(
  Stack.down({
    gap: 1,
    children: [
      new Text({
        text: 'Callout Examples',
        style: new Style({bold: true}),
      }),
      callouts,
      ['flex1', new Space()],
      new Text({
        text: 'Alert Examples (click to show modal)',
        style: new Style({bold: true}),
      }),
      Stack.right({
        gap: 1,
        children: [showAlertButton, showInfoButton],
      }),
    ],
  }),
)
