const colours = {
  '#817': {light: '#c256ad', dark: '#500045', original: '#817'},
  '#a35': {light: '#e76d87', dark: '#6f0028', original: '#a35'},
  '#c66': {light: '#ff9d9a', dark: '#912f35', original: '#c66'},
  '#e94': {light: '#ffd281', dark: '#b36300', original: '#e94'},
  '#ed0': {light: '#ffff77', dark: '#b6a400', original: '#ed0'},
  '#9d5': {light: '#d2ff93', dark: '#63a400', original: '#9d5'},
  '#4d8': {light: '#8bffc0', dark: '#00a453', original: '#4d8'},
  '#2cb': {light: '#79fff4', dark: '#009485', original: '#2cb'},
  '#0bc': {light: '#71f5ff', dark: '#008495', original: '#0bc'},
  '#09c': {light: '#66d2ff', dark: '#006494', original: '#09c'},
  '#36b': {light: '#679df7', dark: '#003082', original: '#36b'},
  '#639': {light: '#996ad3', dark: '#380062', original: '#639'},
}

const multiplyMatrices = (A, B) => {
  return [
    A[0] * B[0] + A[1] * B[1] + A[2] * B[2],
    A[3] * B[0] + A[4] * B[1] + A[5] * B[2],
    A[6] * B[0] + A[7] * B[1] + A[8] * B[2],
  ]
}

const oklch2oklab = ([l, c, h]) => [
  l,
  isNaN(h) ? 0 : c * Math.cos((h * Math.PI) / 180),
  isNaN(h) ? 0 : c * Math.sin((h * Math.PI) / 180),
]
const oklab2oklch = ([l, a, b]) => [
  l,
  Math.sqrt(a ** 2 + b ** 2),
  Math.abs(a) < 0.0002 && Math.abs(b) < 0.0002
    ? NaN
    : ((((Math.atan2(b, a) * 180) / Math.PI) % 360) + 360) % 360,
]

const rgb2srgbLinear = rgb =>
  rgb.map(c =>
    Math.abs(c) <= 0.04045
      ? c / 12.92
      : (c < 0 ? -1 : 1) * ((Math.abs(c) + 0.055) / 1.055) ** 2.4,
  )
const srgbLinear2rgb = rgb =>
  rgb.map(c =>
    Math.abs(c) > 0.0031308
      ? (c < 0 ? -1 : 1) * (1.055 * Math.abs(c) ** (1 / 2.4) - 0.055)
      : 12.92 * c,
  )

const oklab2xyz = lab => {
  const LMSg = multiplyMatrices(
    [
      1, 0.3963377773761749, 0.2158037573099136, 1, -0.1055613458156586,
      -0.0638541728258133, 1, -0.0894841775298119, -1.2914855480194092,
    ],
    lab,
  )
  const LMS = LMSg.map(val => val ** 3)
  return multiplyMatrices(
    [
      1.2268798758459243, -0.5578149944602171, 0.2813910456659647,
      -0.0405757452148008, 1.112286803280317, -0.0717110580655164,
      -0.0763729366746601, -0.4214933324022432, 1.5869240198367816,
    ],
    LMS,
  )
}
const xyz2oklab = xyz => {
  const LMS = multiplyMatrices(
    [
      0.819022437996703, 0.3619062600528904, -0.1288737815209879,
      0.0329836539323885, 0.9292868615863434, 0.0361446663506424,
      0.0481771893596242, 0.2642395317527308, 0.6335478284694309,
    ],
    xyz,
  )
  const LMSg = LMS.map(val => Math.cbrt(val))
  return multiplyMatrices(
    [
      0.210454268309314, 0.7936177747023054, -0.0040720430116193,
      1.9779985324311684, -2.4285922420485799, 0.450593709617411,
      0.0259040424655478, 0.7827717124575296, -0.8086757549230774,
    ],
    LMSg,
  )
}
const xyz2rgbLinear = xyz => {
  return multiplyMatrices(
    [
      3.2409699419045226, -1.537383177570094, -0.4986107602930034,
      -0.9692436362808796, 1.8759675015077202, 0.04155505740717559,
      0.05563007969699366, -0.20397695888897652, 1.0569715142428786,
    ],
    xyz,
  )
}
const rgbLinear2xyz = rgb => {
  return multiplyMatrices(
    [
      0.41239079926595934, 0.357584339383878, 0.1804807884018343,
      0.21263900587151027, 0.715168678767756, 0.07219231536073371,
      0.01933081871559182, 0.11919477979462598, 0.9505321522496607,
    ],
    rgb,
  )
}

const oklch2rgb = lch =>
  srgbLinear2rgb(xyz2rgbLinear(oklab2xyz(oklch2oklab(lch))))

const rgb2oklch = rgb =>
  oklab2oklch(xyz2oklab(rgbLinear2xyz(rgb2srgbLinear(rgb))))

for (const [name, colour] of Object.entries(colours)) {
  console.info('original', name)
  const rgb = colour.original
    .slice(1)
    .split('')
    .map(c => parseInt(c, 16) * 17)
  const oklch = rgb2oklch(rgb)

  function contrastedGray([l, c, h]) {
    const textL =
      l < 50
        ? 95 - l * 0.3 // l=0 → 95, l=50 → 80
        : 20 - (l - 50) * 0.4 // l=50 → 20, l=100 → 0
    console.info({l, textL})
    return [textL, 0, 0]
  }
  function adjust(input: number[], amount: number) {
    return [Math.min(100, Math.max(0, input[0] + amount)), input[1], input[2]]
  }

  const dark_oklch = adjust(oklch, 15)
  const light_oklch = adjust(oklch, -15)
  console.info({oklch})
  const text = contrastedGray(oklch, -15)
  const textHover = contrastedGray(light_oklch, -15)

  function log(name, oklch) {
    const rgb2 = oklch2rgb(oklch)
      .map(rgb => Math.max(0, rgb))
      .map(rgb => Math.min(255, rgb))
      .map(rgb => Math.round(rgb))
    console.info(
      name,
      '#' + rgb2.map(c => c.toString(16).padStart(2, '0')).join(''),
    )
  }

  log('dark', dark_oklch)
  log('light', light_oklch)
  log('text', text)
  log('textHover', textHover)
}
