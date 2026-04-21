# TODO

## Documentation

- Add documentation for the base `View` component.
  - Use `Box` as the primary example.
  - Show background color support.
  - Show `x` / `y` offsets.
  - Show padding.
- ~~Add documentation for the base `Container` component.~~ ✅
  - ~~Document `add()`.~~
  - ~~Document `removeFromParent()`.~~
  - ~~Use `Box` as the example container.~~

## Tests

- Add tests for background color support.
- Verify which views support background color today.
  - `Button` already supports it.
  - Check `Box`.
  - Check `Stack`.
  - Check `Scrollable`.
  - Check `Input`.
  - Check other components as well.
- Add coverage for all supported components.

## SVG Rendering

- Add SVG export/rendering support.
- Convert terminal character grids into SVG output.
  - Detect box-drawing characters.
  - Convert box-drawing characters into single bezier paths.
  - Treat braille characters as uniformly spaced dots within each cell so they form a consistent grid.
- Measure font size to determine terminal cell size.
- Ensure text rendering uses the measured cell size so SVG text placement is consistent.
- Use SVG support as the foundation for image rendering.

## HTML Rendering

- Add more HTML rendering support.
- Support text rendering.
- Support mouse events.
- Support focus events.
- Support resize events.
