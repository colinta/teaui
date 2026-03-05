export function isSame(lhs: any, rhs: any, depth = 0): boolean {
  if (depth >= 100) {
    return false
  }

  if (typeof lhs !== typeof rhs) {
    return false
  }

  if (
    typeof lhs === 'symbol' ||
    typeof lhs === 'string' ||
    typeof lhs === 'undefined' ||
    typeof lhs === 'boolean' ||
    typeof lhs === 'function' ||
    typeof lhs === 'number'
  ) {
    return lhs === rhs
  }

  if (lhs === null || rhs === null) {
    return lhs === rhs
  }

  if (lhs.constructor !== rhs.constructor) {
    return false
  }

  if (Array.isArray(lhs)) {
    return (
      lhs.length === rhs.length &&
      lhs.every((value, index) => isSame(value, rhs[index], depth + 1))
    )
  }

  if (lhs instanceof Set) {
    if (lhs.size !== rhs.size) {
      return false
    }

    for (const value of lhs) {
      if (!rhs.has(value)) {
        return false
      }
    }

    return true
  }

  if (lhs instanceof Map) {
    if (lhs.size !== rhs.size) {
      return false
    }

    for (const [key, value] of lhs) {
      if (!rhs.has(key) || !isSame(value, rhs.get(key), depth + 1)) {
        return false
      }
    }

    return true
  }

  if (lhs instanceof Date) {
    return lhs.getTime() === rhs.getTime()
  }

  // ok, better be an object
  // and if it's a FiberNode, skip the _owner, it's too huge
  if ('$$typeof' in lhs || '$$typeof' in rhs) {
    const {_owner: _lhsOwner, ...lhsTrim} = lhs
    const {_owner: _rhsOwner, ...rhsTrim} = rhs
    return isSame(lhsTrim, rhsTrim, depth + 1)
  }

  for (const prop in lhs) {
    if (!Object.hasOwn(lhs, prop)) {
      continue
    }

    // if rhs doesn't have the prop, or the values aren't the same
    if (!Object.hasOwn(rhs, prop) || !isSame(lhs[prop], rhs[prop], depth + 1)) {
      return false
    }
  }

  for (const prop in rhs) {
    if (!Object.hasOwn(rhs, prop)) {
      continue
    }

    // only need to check if lhs doesn't have the prop
    if (!Object.hasOwn(lhs, prop)) {
      return false
    }
  }

  return true
}
