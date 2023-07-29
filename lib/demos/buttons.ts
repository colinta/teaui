import type {BlessedProgram} from '../sys'

import {iTerm2} from '../iTerm2'
import {interceptConsoleLog} from '../log'

import {Screen} from '../Screen'

import {TrackMouse} from '../components/utility'
import {Button, ConsoleLog, Flex, Separator, Space} from '../components'

async function run() {
  process.title = 'Wretched'

  const consoleLog = new ConsoleLog({
    minHeight: 10,
  })
  const [screen, program] = await Screen.start(
    async (program: BlessedProgram) => {
      await iTerm2.setBackground(program, [23, 23, 23])

      return new TrackMouse({
        content: new Flex({
          direction: 'topToBottom',
          children: [
            new Separator({
              direction: 'horizontal',
              border: 'trailing',
              padding: 1,
            }),

            ['flex1', new Space()],
            new Button({
              height: 3,
              border: 'large',
              theme: 'primary',
              text: 'Launch',
            }),

            ['flex1', new Space()],
            new Button({
              height: 3,
              border: 'large',
              theme: 'proceed',
              text: 'Proceed',
            }),

            ['flex1', new Space()],
            new Button({
              height: 3,
              border: 'large',
              theme: 'cancel',
              text: 'Cancel',
            }),

            ['flex1', new Space()],
            new Button({
              height: 3,
              border: 'large',
              theme: 'secondary',
              text: 'Do it!',
            }),

            ['flex1', new Space()],
            new Button({theme: 'plain', height: 3, text: 'Do it!'}),
            new Button({theme: 'selected', height: 3, text: 'Do it!'}),
            ['flex1', new Space()],
            new Separator({
              direction: 'horizontal',
              border: 'trailing',
              padding: 1,
            }),
          ],
        }),
      })
    },
  )

  interceptConsoleLog()

  program.key('escape', function () {
    consoleLog.clear()
    screen.render()
  })
}

run()
