import {
  Screen,
  TrackMouse,
  ConsoleLog,
  Button,
  Stack,
  Separator,
  Space,
  Text,
  Window,
  interceptConsoleLog,
} from '@teaui/core'
;(async () => {
  interceptConsoleLog()
  console.log('Logs appear in the "ConsoleLog" component')
  setTimeout(() => {
    console.log('one more log for good measure')
  }, 1000)

  process.title = '{{name}}'
  const consoleLog = new ConsoleLog({
    height: 10,
  })
  const [screen, program] = await Screen.start(
    new Window({
      child: new TrackMouse({
        content: Stack.down([
          [
            'flex1',
            Stack.down([
              new Text({alignment: 'center', text: 'Hello to "{{name}}"'}),
              new Separator({
                direction: 'horizontal',
                border: 'trailing',
                padding: 1,
              }),
              Space.vertical(10),
              new Button({
                title: 'Exit',
                onClick: () => {
                  screen.exit()
                },
              }),
            ]),
          ],
          ['natural', consoleLog],
        ]),
      }),
    }),
    {quitChar: 'C-q'},
  )

  program.key('escape', function () {
    consoleLog.clear()
    screen.render()
  })
})()
