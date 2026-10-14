import {Logo, Screen} from '@teaui/core'

// Static steam and a fixed seed keep this example deterministic.
const logo = new Logo({isAnimating: false, seed: 42})

await Screen.start(logo)
