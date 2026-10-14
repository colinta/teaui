import {Badge, Screen} from '@teaui/core'

const badge = new Badge({text: 'Ready', purpose: 'proceed'})

await Screen.start(badge)
