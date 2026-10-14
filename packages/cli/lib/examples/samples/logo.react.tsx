import React from 'react'
import {Logo, run} from '@teaui/react'

// Static steam and a fixed seed keep this example deterministic.
const logo = <Logo isAnimating={false} seed={42} />

await run(logo)
