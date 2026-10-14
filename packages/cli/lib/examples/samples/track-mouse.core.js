import {Screen, Text, TrackMouse} from '@teaui/core'

const panel = new TrackMouse({
  width: 24,
  height: 5,
  child: new Text({text: 'Move over this panel\nRulers show position.'}),
})

await Screen.start(panel)
