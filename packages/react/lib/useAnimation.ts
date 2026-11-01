import {useRef} from 'react'
import {Animation, type AnimationProps, type View} from '@teaui/core'

/**
 * Returns a stable Animation instance without requiring `useMemo`.
 *
 * `apply` is replaced on every render. Other options are only assigned when
 * their values change. Changing `paused` stops or resumes the animation.
 */
export function useAnimation<TView extends View = View>(
  props: AnimationProps<TView>,
): Animation<TView> {
  const animationRef = useRef<Animation<TView> | null>(null)
  const options = {
    duration: props.duration ?? 1,
    start: props.start ?? 0,
    end: props.end ?? 1,
    loops: props.loops ?? false,
    reverse: props.reverse ?? false,
    easing: props.easing ?? 'none',
  }
  const previousOptionsRef = useRef(options)
  const pausedRef = useRef(props.paused ?? false)

  if (!animationRef.current) {
    animationRef.current = new Animation(props)
    return animationRef.current
  }

  const animation = animationRef.current
  const previousOptions = previousOptionsRef.current
  const paused = props.paused ?? false

  animation.apply = props.apply
  if (!Object.is(previousOptions.duration, options.duration)) {
    animation.duration = options.duration
  }
  if (!Object.is(previousOptions.start, options.start)) {
    animation.start = options.start
  }
  if (!Object.is(previousOptions.end, options.end)) {
    animation.end = options.end
  }
  if (!Object.is(previousOptions.loops, options.loops)) {
    animation.loops = options.loops
  }
  if (!Object.is(previousOptions.reverse, options.reverse)) {
    animation.reverse = options.reverse
  }
  if (!Object.is(previousOptions.easing, options.easing)) {
    animation.easing = options.easing
  }
  previousOptionsRef.current = options

  if (pausedRef.current !== paused) {
    if (paused) {
      animation.stop()
    } else {
      animation.start()
    }
    pausedRef.current = paused
  }

  return animation
}
