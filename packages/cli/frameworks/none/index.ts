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
  console.info('Logs appear in the "ConsoleLog" component')
  setTimeout(() => {
    console.info('one more log for good measure')
  }, 1000)

  process.title = '{{name}}'
  const consoleLog = new ConsoleLog({
    height: 10,
  })
  const [screen] = await Screen.start(
    new Window({
      child: new TrackMouse({
        child: Stack.down([
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
                hotKey: 'C-x',
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
    {quitChar: 'C-c'},
  )

  screen.key('escape', function () {
    consoleLog.clear()
    screen.render()
  })
})()
