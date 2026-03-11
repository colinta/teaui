import {useReducer} from 'preact/hooks'

export function useToggle(initial: boolean) {
  return useReducer<boolean, void>(state => !state, initial)
}
