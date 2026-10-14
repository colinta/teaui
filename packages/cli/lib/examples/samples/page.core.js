import {Page, Screen, Stack, Text} from '@teaui/core'

const titled = new Page({
  width: 36,
  height: 6,
  children: [
    new Page.Section({
      title: 'Overview',
      child: new Text({text: 'Overview content (inactive)'}),
    }),
    new Page.Section({
      child: new Text({
        heading: 'Details',
        text: 'Title falls back to child heading\nPageUp / PageDown changes section\nHome / End jumps to an edge',
      }),
    }),
    new Page.Section({
      title: '',
      child: new Text({
        heading: 'Hidden title',
        text: 'Help content (inactive)',
      }),
    }),
  ],
})

const examples = Stack.down({
  width: 36,
  height: 11,
  gap: 1,
  children: [
    titled,
    new Page({
      width: 36,
      height: 4,
      children: [
        new Text({text: 'Untitled pages: dots without a title'}),
        new Text({text: 'Second untitled page (inactive)'}),
      ],
    }),
  ],
})

const [screen] = await Screen.start(examples)

// Navigate after sections are attached; settle the slide without timers.
titled.activeIndex = 1
titled.receiveTick(1000)
screen.render()
