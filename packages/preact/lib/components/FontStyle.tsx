import {h} from 'preact'
import {useCallback, useMemo} from 'preact/hooks'
import {bold, italic, underline, strikeout} from '@teaui/core'
import {ToggleGroup} from '../components.js'

export interface FontStyleValue {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
}

interface FontStyleProps {
  value: FontStyleValue
  onChange: (value: FontStyleValue) => void
}

const LABELS = [bold('B'), italic('I'), underline('U'), strikeout('S')]
const KEYS: (keyof FontStyleValue)[] = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
]

export function FontStyle({
  value,
  onChange,
}: FontStyleProps): preact.JSX.Element {
  const selected = useMemo(() => {
    const indices: number[] = []
    KEYS.forEach((key, i) => {
      if (value[key]) indices.push(i)
    })
    return indices
  }, [value])

  const handleChange = useCallback(
    (_index: number, newSelected: number[]) => {
      const next: FontStyleValue = {
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
      }
      for (const i of newSelected) {
        next[KEYS[i]] = true
      }
      onChange(next)
    },
    [onChange],
  )

  return (
    <ToggleGroup
      titles={LABELS}
      selected={selected}
      multiple
      onChange={handleChange}
    />
  )
}
