import React, {useState} from 'react'
import {Calendar} from '@teaui/react'

function App() {
  const [date, setDate] = useState(new Date(2026, 5, 29))
  const [visibleDate, setVisibleDate] = useState(new Date(2026, 5, 1))

  return (
    <Calendar
      date={date}
      visibleDate={visibleDate}
      onChangeVisible={setVisibleDate}
      onChange={d1 => setDate(d1)}
    />
  )
}

export default {width: 22, height: 8, title: 'Calendar', App}
