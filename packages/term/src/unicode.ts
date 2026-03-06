/**
 * Unicode utilities for terminal cell width calculation, grapheme segmentation,
 * and ANSI sequence handling.
 *
 * Ported from blessed/teaui's unicode.js — battle-tested character width tables.
 */

/** Special character used by viewport.paint for background drawing. */
export const BG_DRAW = '\x14'

export interface AnsiLocation {
  start: number
  stop: number
  ansi: string
}

/**
 * Returns the number of *cells* that the first character of the string takes up.
 *
 * "Cell" refers to a terminal space: ASCII characters take 1 cell, Emoji and Asian
 * characters take 2 cells. ANSI codes (\x1b[...) return 0.
 */
export function charWidth(str: string): 0 | 1 | 2 {
  if (str === BG_DRAW) {
    return 1
  }

  if (!str.length || ansiRegex().test(str)) {
    return 0
  }

  // Emoji support
  if (str.length > 1 && /^\p{Extended_Pictographic}/u.test(str)) {
    if (
      str === '▫️' ||
      str === '◻️' ||
      str === '◼︎' ||
      str === '▪️' ||
      str === '◼️'
    ) {
      return 1
    }
    return 2
  }

  const point = str.codePointAt(0)!

  // nul
  if (point === 0) return 0

  // tab
  if (point === 0x09) return 1

  // 8-bit control characters
  if (point < 32 || (point >= 0x7f && point < 0xa0)) return 0

  // combining characters
  if (isCombiningCode(point)) return 0

  // double-wide
  if (
    0x3000 === point ||
    (0xff01 <= point && point <= 0xff60) ||
    (0xffe0 <= point && point <= 0xffe6)
  ) {
    return 2
  }

  if (
    (0x1100 <= point && point <= 0x115f) ||
    (0x11a3 <= point && point <= 0x11a7) ||
    (0x11fa <= point && point <= 0x11ff) ||
    (0x2329 <= point && point <= 0x232a) ||
    (0x2e80 <= point && point <= 0x2e99) ||
    (0x2e9b <= point && point <= 0x2ef3) ||
    (0x2f00 <= point && point <= 0x2fd5) ||
    (0x2ff0 <= point && point <= 0x2ffb) ||
    (0x3001 <= point && point <= 0x303e) ||
    (0x3041 <= point && point <= 0x3096) ||
    (0x3099 <= point && point <= 0x30ff) ||
    (0x3105 <= point && point <= 0x312d) ||
    (0x3131 <= point && point <= 0x318e) ||
    (0x3190 <= point && point <= 0x31ba) ||
    (0x31c0 <= point && point <= 0x31e3) ||
    (0x31f0 <= point && point <= 0x321e) ||
    (0x3220 <= point && point <= 0x3247) ||
    (0x3250 <= point && point <= 0x32fe) ||
    (0x3300 <= point && point <= 0x4dbf) ||
    (0x4e00 <= point && point <= 0xa48c) ||
    (0xa490 <= point && point <= 0xa4c6) ||
    (0xa960 <= point && point <= 0xa97c) ||
    (0xac00 <= point && point <= 0xd7a3) ||
    (0xd7b0 <= point && point <= 0xd7c6) ||
    (0xd7cb <= point && point <= 0xd7fb) ||
    (0xf900 <= point && point <= 0xfaff) ||
    (0xfe10 <= point && point <= 0xfe19) ||
    (0xfe30 <= point && point <= 0xfe52) ||
    (0xfe54 <= point && point <= 0xfe66) ||
    (0xfe68 <= point && point <= 0xfe6b) ||
    (0x1b000 <= point && point <= 0x1b001) ||
    (0x1f200 <= point && point <= 0x1f202) ||
    (0x1f210 <= point && point <= 0x1f23a) ||
    (0x1f240 <= point && point <= 0x1f248) ||
    (0x1f250 <= point && point <= 0x1f251) ||
    (0x20000 <= point && point <= 0x2f73f) ||
    (0x2b740 <= point && point <= 0x2fffd) ||
    (0x30000 <= point && point <= 0x3fffd)
  ) {
    return 2
  }

  // CJK Ambiguous
  if (process.env.NCURSES_CJK_WIDTH) {
    if (
      0x00a1 === point ||
      0x00a4 === point ||
      (0x00a7 <= point && point <= 0x00a8) ||
      0x00aa === point ||
      (0x00ad <= point && point <= 0x00ae) ||
      (0x00b0 <= point && point <= 0x00b4) ||
      (0x00b6 <= point && point <= 0x00ba) ||
      (0x00bc <= point && point <= 0x00bf) ||
      0x00c6 === point ||
      0x00d0 === point ||
      (0x00d7 <= point && point <= 0x00d8) ||
      (0x00de <= point && point <= 0x00e1) ||
      0x00e6 === point ||
      (0x00e8 <= point && point <= 0x00ea) ||
      (0x00ec <= point && point <= 0x00ed) ||
      0x00f0 === point ||
      (0x00f2 <= point && point <= 0x00f3) ||
      (0x00f7 <= point && point <= 0x00fa) ||
      0x00fc === point ||
      0x00fe === point ||
      0x0101 === point ||
      0x0111 === point ||
      0x0113 === point ||
      0x011b === point ||
      (0x0126 <= point && point <= 0x0127) ||
      0x012b === point ||
      (0x0131 <= point && point <= 0x0133) ||
      0x0138 === point ||
      (0x013f <= point && point <= 0x0142) ||
      0x0144 === point ||
      (0x0148 <= point && point <= 0x014b) ||
      0x014d === point ||
      (0x0152 <= point && point <= 0x0153) ||
      (0x0166 <= point && point <= 0x0167) ||
      0x016b === point ||
      0x01ce === point ||
      0x01d0 === point ||
      0x01d2 === point ||
      0x01d4 === point ||
      0x01d6 === point ||
      0x01d8 === point ||
      0x01da === point ||
      0x01dc === point ||
      0x0251 === point ||
      0x0261 === point ||
      0x02c4 === point ||
      0x02c7 === point ||
      (0x02c9 <= point && point <= 0x02cb) ||
      0x02cd === point ||
      0x02d0 === point ||
      (0x02d8 <= point && point <= 0x02db) ||
      0x02dd === point ||
      0x02df === point ||
      (0x0300 <= point && point <= 0x036f) ||
      (0x0391 <= point && point <= 0x03a1) ||
      (0x03a3 <= point && point <= 0x03a9) ||
      (0x03b1 <= point && point <= 0x03c1) ||
      (0x03c3 <= point && point <= 0x03c9) ||
      0x0401 === point ||
      (0x0410 <= point && point <= 0x044f) ||
      0x0451 === point ||
      0x2010 === point ||
      (0x2013 <= point && point <= 0x2016) ||
      (0x2018 <= point && point <= 0x2019) ||
      (0x201c <= point && point <= 0x201d) ||
      (0x2020 <= point && point <= 0x2022) ||
      (0x2024 <= point && point <= 0x2027) ||
      0x2030 === point ||
      (0x2032 <= point && point <= 0x2033) ||
      0x2035 === point ||
      0x203b === point ||
      0x203e === point ||
      0x2074 === point ||
      0x207f === point ||
      (0x2081 <= point && point <= 0x2084) ||
      0x20ac === point ||
      0x2103 === point ||
      0x2105 === point ||
      0x2109 === point ||
      0x2113 === point ||
      0x2116 === point ||
      (0x2121 <= point && point <= 0x2122) ||
      0x2126 === point ||
      0x212b === point ||
      (0x2153 <= point && point <= 0x2154) ||
      (0x215b <= point && point <= 0x215e) ||
      (0x2160 <= point && point <= 0x216b) ||
      (0x2170 <= point && point <= 0x2179) ||
      0x2189 === point ||
      (0x2190 <= point && point <= 0x2199) ||
      (0x21b8 <= point && point <= 0x21b9) ||
      0x21d2 === point ||
      0x21d4 === point ||
      0x21e7 === point ||
      0x2200 === point ||
      (0x2202 <= point && point <= 0x2203) ||
      (0x2207 <= point && point <= 0x2208) ||
      0x220b === point ||
      0x220f === point ||
      0x2211 === point ||
      0x2215 === point ||
      0x221a === point ||
      (0x221d <= point && point <= 0x2220) ||
      0x2223 === point ||
      0x2225 === point ||
      (0x2227 <= point && point <= 0x222c) ||
      0x222e === point ||
      (0x2234 <= point && point <= 0x2237) ||
      (0x223c <= point && point <= 0x223d) ||
      0x2248 === point ||
      0x224c === point ||
      0x2252 === point ||
      (0x2260 <= point && point <= 0x2261) ||
      (0x2264 <= point && point <= 0x2267) ||
      (0x226a <= point && point <= 0x226b) ||
      (0x226e <= point && point <= 0x226f) ||
      (0x2282 <= point && point <= 0x2283) ||
      (0x2286 <= point && point <= 0x2287) ||
      0x2295 === point ||
      0x2299 === point ||
      0x22a5 === point ||
      0x22bf === point ||
      0x2312 === point ||
      (0x2460 <= point && point <= 0x24e9) ||
      (0x24eb <= point && point <= 0x254b) ||
      (0x2550 <= point && point <= 0x2573) ||
      (0x2580 <= point && point <= 0x258f) ||
      (0x2592 <= point && point <= 0x2595) ||
      (0x25a0 <= point && point <= 0x25a1) ||
      (0x25a3 <= point && point <= 0x25a9) ||
      (0x25b2 <= point && point <= 0x25b3) ||
      (0x25b6 <= point && point <= 0x25b7) ||
      (0x25bc <= point && point <= 0x25bd) ||
      (0x25c0 <= point && point <= 0x25c1) ||
      (0x25c6 <= point && point <= 0x25c8) ||
      0x25cb === point ||
      (0x25ce <= point && point <= 0x25d1) ||
      (0x25e2 <= point && point <= 0x25e5) ||
      0x25ef === point ||
      (0x2605 <= point && point <= 0x2606) ||
      0x2609 === point ||
      (0x260e <= point && point <= 0x260f) ||
      (0x2614 <= point && point <= 0x2615) ||
      0x261c === point ||
      0x261e === point ||
      0x2640 === point ||
      0x2642 === point ||
      (0x2660 <= point && point <= 0x2661) ||
      (0x2663 <= point && point <= 0x2665) ||
      (0x2667 <= point && point <= 0x266a) ||
      (0x266c <= point && point <= 0x266d) ||
      0x266f === point ||
      (0x269e <= point && point <= 0x269f) ||
      (0x26be <= point && point <= 0x26bf) ||
      (0x26c4 <= point && point <= 0x26cd) ||
      (0x26cf <= point && point <= 0x26e1) ||
      0x26e3 === point ||
      (0x26e8 <= point && point <= 0x26ff) ||
      0x273d === point ||
      0x2757 === point ||
      (0x2776 <= point && point <= 0x277f) ||
      (0x2b55 <= point && point <= 0x2b59) ||
      (0x3248 <= point && point <= 0x324f) ||
      (0xe000 <= point && point <= 0xf8ff) ||
      (0xfe00 <= point && point <= 0xfe0f) ||
      0xfffd === point ||
      (0x1f100 <= point && point <= 0x1f10a) ||
      (0x1f110 <= point && point <= 0x1f12d) ||
      (0x1f130 <= point && point <= 0x1f169) ||
      (0x1f170 <= point && point <= 0x1f19a) ||
      (0xe0100 <= point && point <= 0xe01ef) ||
      (0xf0000 <= point && point <= 0xffffd) ||
      (0x100000 <= point && point <= 0x10fffd)
    ) {
      return (+process.env.NCURSES_CJK_WIDTH || 1) as 1 | 2
    }
  }

  return 1
}

/**
 * Return the cell width and height of the entire string. Width is the maximum
 * length of all the lines, and height is the number of lines.
 */
export function stringSize(text: string | string[]): { width: number; height: number }
/**
 * Return the cell width and height of the entire string, wrapping lines to fit
 * within maxWidth.
 */
export function stringSize(
  text: string | string[],
  maxWidth: number,
): { width: number; height: number }
export function stringSize(
  str: string | string[],
  maxWidth?: number,
): { width: number; height: number } {
  if (Array.isArray(str)) {
    if (maxWidth != null) {
      return str.reduce(
        (size, line) => {
          const width = lineWidth(line)
          const height = Math.max(1, Math.ceil(width / maxWidth))
          size.width = Math.max(size.width, width)
          size.height += height
          return size
        },
        { width: 0, height: 0 },
      )
    }

    return { width: Math.max(...str.map(lineWidth)), height: str.length }
  } else {
    return stringSize(str.split('\n'), maxWidth as number)
  }
}

/**
 * Returns the number of cells that the first line of the string takes up.
 */
export function lineWidth(str: string | string[]): number {
  let width = 0
  for (const char of Array.isArray(str) ? str : printableChars(str)) {
    if (char === '\n') {
      break
    }
    width += charWidth(char)
  }
  return width
}

// --- Locale / Segmenters ---

let locale = (() => {
  const lang = process.env.LANG?.split('.')[0]?.slice(0, 2)
  if (!lang || lang.length < 2) return 'en'
  try {
    Intl.getCanonicalLocales(lang)
    return lang
  } catch {
    return 'en'
  }
})()
let graphemesSegmenter = new Intl.Segmenter(locale)
let wordsSegmenter = new Intl.Segmenter(locale, { granularity: 'word' })

export function getLocale(): string {
  return locale
}

export function setLocale(value: string): void {
  locale = value
  graphemesSegmenter = new Intl.Segmenter(locale)
  wordsSegmenter = new Intl.Segmenter(locale, { granularity: 'word' })
}

// --- Word segmentation ---

/**
 * @param input String or array of graphemes.
 * @returns [grapheme[], offset][] Array of tuples. Each tuple is an array of
 * graphemes and starting string offset. ANSI codes are preserved.
 */
export function words(input: string | string[]): [string[], number][] {
  if (Array.isArray(input)) {
    input = input.join('')
  }

  const ansiData = ansiLocations(input, false)
  input = removeAnsi(input)

  let strIndex = 0
  const segments = Array.from(wordsSegmenter.segment(input)).map(
    ({ segment }) => segment,
  )
  const parts = segments.map(segment => {
    let offset = segment.length
    while (
      ansiData.length &&
      strIndex + segment.length >= ansiData[0].start
    ) {
      const { start, ansi } = ansiData.shift()!
      const lhs = segment.slice(0, start - strIndex)
      const rhs = segment.slice(start - strIndex)
      segment = lhs + ansi + rhs
      offset += ansi.length
    }
    strIndex += offset
    return segment
  })

  let offset = 0
  const result: [string[], number][] = []
  for (const segment of parts) {
    const currentOffset = offset
    const chars = printableChars(segment)
    offset += chars.length
    result.push([chars, currentOffset])
  }

  return result
}

// --- Grapheme segmentation ---

/**
 * Breaks the string up into graphemes: single ASCII/Emoji characters, and ANSI
 * sequences.
 */
export function printableChars(str: string): string[] {
  if (str.length === 0) {
    return []
  }

  if (str.length === 1) {
    return [str]
  }

  const chars: string[] = []
  const locations = ansiLocations(str, true)
  let prevIndex = 0
  for (const { start, stop, ansi } of locations) {
    if (prevIndex < start) {
      const input = str.slice(prevIndex, start)
      for (const { segment: char } of graphemesSegmenter.segment(input)) {
        chars.push(char)
      }
    }

    if (ansi) {
      chars.push(ansi)
    }

    prevIndex = stop
  }

  return chars
}

// --- ANSI utilities ---

/**
 * Copied from https://github.com/chalk/ansi-regex/blob/main/index.js
 */
function ansiRegex(): RegExp {
  const ST = '(?:\\u0007|\\u001B\\u005C|\\u009C)'
  const pattern = [
    `[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`,
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  ].join('|')

  return new RegExp(pattern, 'g')
}

/**
 * Returns an array of ranges indicating where the string includes ANSI sequences.
 * @param input The string to scan.
 * @param includeLast If true, there will always be a range at the end of the
 * string, to make looping over the ranges easier.
 */
export function ansiLocations(input: string, includeLast?: boolean): AnsiLocation[] {
  const locations: AnsiLocation[] = [...input.matchAll(ansiRegex())].map(
    ({ 0: match, index }) => ({
      start: index!,
      stop: index! + match.length,
      ansi: match,
    }),
  )

  if (
    includeLast &&
    (!locations.length || locations.at(-1)!.stop < input.length)
  ) {
    locations.push({
      start: input.length,
      stop: input.length,
      ansi: '',
    })
  }

  return locations
}

/**
 * Removes ANSI color/style sequences.
 */
export function removeAnsi(input: string): string {
  return input.replaceAll(ansiRegex(), '')
}

// --- Combining character table ---

const combiningTable: [number, number][] = [
  [0x0300, 0x036f],
  [0x0483, 0x0486],
  [0x0488, 0x0489],
  [0x0591, 0x05bd],
  [0x05bf, 0x05bf],
  [0x05c1, 0x05c2],
  [0x05c4, 0x05c5],
  [0x05c7, 0x05c7],
  [0x0600, 0x0603],
  [0x0610, 0x0615],
  [0x064b, 0x065e],
  [0x0670, 0x0670],
  [0x06d6, 0x06e4],
  [0x06e7, 0x06e8],
  [0x06ea, 0x06ed],
  [0x070f, 0x070f],
  [0x0711, 0x0711],
  [0x0730, 0x074a],
  [0x07a6, 0x07b0],
  [0x07eb, 0x07f3],
  [0x0901, 0x0902],
  [0x093c, 0x093c],
  [0x0941, 0x0948],
  [0x094d, 0x094d],
  [0x0951, 0x0954],
  [0x0962, 0x0963],
  [0x0981, 0x0981],
  [0x09bc, 0x09bc],
  [0x09c1, 0x09c4],
  [0x09cd, 0x09cd],
  [0x09e2, 0x09e3],
  [0x0a01, 0x0a02],
  [0x0a3c, 0x0a3c],
  [0x0a41, 0x0a42],
  [0x0a47, 0x0a48],
  [0x0a4b, 0x0a4d],
  [0x0a70, 0x0a71],
  [0x0a81, 0x0a82],
  [0x0abc, 0x0abc],
  [0x0ac1, 0x0ac5],
  [0x0ac7, 0x0ac8],
  [0x0acd, 0x0acd],
  [0x0ae2, 0x0ae3],
  [0x0b01, 0x0b01],
  [0x0b3c, 0x0b3c],
  [0x0b3f, 0x0b3f],
  [0x0b41, 0x0b43],
  [0x0b4d, 0x0b4d],
  [0x0b56, 0x0b56],
  [0x0b82, 0x0b82],
  [0x0bc0, 0x0bc0],
  [0x0bcd, 0x0bcd],
  [0x0c3e, 0x0c40],
  [0x0c46, 0x0c48],
  [0x0c4a, 0x0c4d],
  [0x0c55, 0x0c56],
  [0x0cbc, 0x0cbc],
  [0x0cbf, 0x0cbf],
  [0x0cc6, 0x0cc6],
  [0x0ccc, 0x0ccd],
  [0x0ce2, 0x0ce3],
  [0x0d41, 0x0d43],
  [0x0d4d, 0x0d4d],
  [0x0dca, 0x0dca],
  [0x0dd2, 0x0dd4],
  [0x0dd6, 0x0dd6],
  [0x0e31, 0x0e31],
  [0x0e34, 0x0e3a],
  [0x0e47, 0x0e4e],
  [0x0eb1, 0x0eb1],
  [0x0eb4, 0x0eb9],
  [0x0ebb, 0x0ebc],
  [0x0ec8, 0x0ecd],
  [0x0f18, 0x0f19],
  [0x0f35, 0x0f35],
  [0x0f37, 0x0f37],
  [0x0f39, 0x0f39],
  [0x0f71, 0x0f7e],
  [0x0f80, 0x0f84],
  [0x0f86, 0x0f87],
  [0x0f90, 0x0f97],
  [0x0f99, 0x0fbc],
  [0x0fc6, 0x0fc6],
  [0x102d, 0x1030],
  [0x1032, 0x1032],
  [0x1036, 0x1037],
  [0x1039, 0x1039],
  [0x1058, 0x1059],
  [0x1160, 0x11ff],
  [0x135f, 0x135f],
  [0x1712, 0x1714],
  [0x1732, 0x1734],
  [0x1752, 0x1753],
  [0x1772, 0x1773],
  [0x17b4, 0x17b5],
  [0x17b7, 0x17bd],
  [0x17c6, 0x17c6],
  [0x17c9, 0x17d3],
  [0x17dd, 0x17dd],
  [0x180b, 0x180d],
  [0x18a9, 0x18a9],
  [0x1920, 0x1922],
  [0x1927, 0x1928],
  [0x1932, 0x1932],
  [0x1939, 0x193b],
  [0x1a17, 0x1a18],
  [0x1b00, 0x1b03],
  [0x1b34, 0x1b34],
  [0x1b36, 0x1b3a],
  [0x1b3c, 0x1b3c],
  [0x1b42, 0x1b42],
  [0x1b6b, 0x1b73],
  [0x1dc0, 0x1dca],
  [0x1dfe, 0x1dff],
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2060, 0x2063],
  [0x206a, 0x206f],
  [0x20d0, 0x20ef],
  [0x302a, 0x302f],
  [0x3099, 0x309a],
  [0xa806, 0xa806],
  [0xa80b, 0xa80b],
  [0xa825, 0xa826],
  [0xfb1e, 0xfb1e],
  [0xfe00, 0xfe0f],
  [0xfe20, 0xfe23],
  [0xfeff, 0xfeff],
  [0xfff9, 0xfffb],
  [0x10a01, 0x10a03],
  [0x10a05, 0x10a06],
  [0x10a0c, 0x10a0f],
  [0x10a38, 0x10a3a],
  [0x10a3f, 0x10a3f],
  [0x1d167, 0x1d169],
  [0x1d173, 0x1d182],
  [0x1d185, 0x1d18b],
  [0x1d1aa, 0x1d1ad],
  [0x1d242, 0x1d244],
  [0xe0001, 0xe0001],
  [0xe0020, 0xe007f],
  [0xe0100, 0xe01ef],
]

const _isCombiningCode: Map<number, true> = combiningTable.reduce(
  (map, row) => {
    for (let i = row[0]; i <= row[1]; i++) {
      map.set(i, true)
    }
    return map
  },
  new Map<number, true>(),
)

function isCombiningCode(code: number): boolean {
  return _isCombiningCode.get(code) ?? false
}
