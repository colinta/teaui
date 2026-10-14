import {Accordion, Screen, Text} from '@teaui/core'

const accordion = Accordion.create(
  [
    new Accordion.Section({
      title: 'Overview',
      isOpen: true,
      child: new Text({text: 'Hello, world!'}),
    }),
    ['Details', new Text({text: 'Click to reveal details.'})],
  ],
  {multiple: false, width: 30, height: 5},
)

await Screen.start(accordion)
