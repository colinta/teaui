import React, {useState} from 'react'
import {Desktop, Text, Window} from '@teaui/react'

function App() {
  const [windows, setWindows] = useState(['Notes', 'Tools', 'Help'])

  return (
    <Desktop>
      {windows.map((title, index) => (
        <Window
          key={title}
          title={title}
          x={index * 8}
          y={index * 2}
          width={24}
          height={6}
          onClose={() => setWindows(windows.filter(other => other !== title))}
        >
          <Text>Drag the title bar</Text>
        </Window>
      ))}
    </Desktop>
  )
}

export default {width: 44, height: 11, title: 'Desktop', App}
