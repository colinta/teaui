# @teaui/result

Dependency-free Result types and constructors. Independent of TeaUI rendering and networking.

```ts
import {ok, err, type Result} from '@teaui/result'

function parsePort(value: string): Result<number, string> {
  const port = Number(value)
  return Number.isInteger(port) && port >= 0 && port <= 65535
    ? ok(port)
    : err('Invalid port')
}

const result = parsePort('9123')
if (result.ok) {
  console.log(result.value)
} else {
  console.error(result.error)
}
```

Exports `Result<T, E = Error>`, `Ok<T>`, `Err<E>`, `ok(value)`, and `err(error)`.
The error type need not extend `Error`. Results are plain discriminated unions,
not wrapper classes.
