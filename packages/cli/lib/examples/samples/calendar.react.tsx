import React, {useState} from 'react'
import {Calendar, run} from '@teaui/react'

function App() {
  const [date, setDate] = useState(new Date(2026, 5, 29))
  const [visibleDate, setVisibleDate] = useState(new Date(2026, 5, 1))

  return (
    <Calendar
      date={date}
      visibleDate={visibleDate}
      onChangeVisible={setVisibleDate}
      onChange={setDate}
    />
  )
}

await run(<App />)
