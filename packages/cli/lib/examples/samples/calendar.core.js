import {Calendar, Screen} from '@teaui/core'

const calendar = new Calendar({
  date: new Date(2026, 5, 29),
  visibleDate: new Date(2026, 5, 1),
  onChangeVisible: date => {
    calendar.visibleDate = date
  },
  onChange: date => {
    calendar.date = date
  },
})

await Screen.start(calendar)
