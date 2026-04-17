/**
 * Log filter tokenizer, parser, and matcher.
 *
 * Syntax:
 *   word          plain word (case-insensitive substring)
 *   "..." / '...' quoted literal (exact substring, case-insensitive)
 *   /regex/       regular expression
 *   ( ... )       grouped sub-expression
 *   A B           sequence — both must appear, A before B
 *   A AND B       both must appear, any order
 *   A OR B        either must appear
 *
 * Precedence (low→high): OR, AND, sequence, atom
 */

// ── Tokens ──────────────────────────────────────────────────────────────────

type Token =
  | {type: 'word'; value: string}
  | {type: 'quoted'; value: string}
  | {type: 'regex'; value: RegExp}
  | {type: 'and'}
  | {type: 'or'}
  | {type: 'lparen'}
  | {type: 'rparen'}

// ── AST ─────────────────────────────────────────────────────────────────────

export type FilterNode =
  | {type: 'word'; value: string; lower: string}
  | {type: 'quoted'; value: string; lower: string}
  | {type: 'regex'; value: RegExp}
  | {type: 'sequence'; nodes: FilterNode[]}
  | {type: 'and'; left: FilterNode; right: FilterNode}
  | {type: 'or'; left: FilterNode; right: FilterNode}

// ── Tokenizer ───────────────────────────────────────────────────────────────

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    // skip whitespace
    if (input[i] === ' ' || input[i] === '\t') {
      i++
      continue
    }

    // parentheses
    if (input[i] === '(') {
      tokens.push({type: 'lparen'})
      i++
      continue
    }
    if (input[i] === ')') {
      tokens.push({type: 'rparen'})
      i++
      continue
    }

    // quoted string
    if (input[i] === '"' || input[i] === "'") {
      const quote = input[i]
      i++
      let value = ''
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          i++
        }
        value += input[i]
        i++
      }
      if (i < input.length) i++ // skip closing quote
      tokens.push({type: 'quoted', value})
      continue
    }

    // regex
    if (input[i] === '/') {
      i++
      let pattern = ''
      while (i < input.length && input[i] !== '/') {
        if (input[i] === '\\' && i + 1 < input.length) {
          pattern += input[i]
          i++
        }
        pattern += input[i]
        i++
      }
      if (i < input.length) i++ // skip closing /
      // read flags
      let flags = ''
      while (i < input.length && /[gimsuy]/.test(input[i])) {
        flags += input[i]
        i++
      }
      try {
        tokens.push({type: 'regex', value: new RegExp(pattern, flags)})
      } catch {
        // invalid regex — treat as a word
        tokens.push({type: 'word', value: pattern})
      }
      continue
    }

    // word (or AND/OR keyword)
    let word = ''
    while (
      i < input.length &&
      input[i] !== ' ' &&
      input[i] !== '\t' &&
      input[i] !== '(' &&
      input[i] !== ')'
    ) {
      word += input[i]
      i++
    }

    if (word === 'AND') {
      tokens.push({type: 'and'})
    } else if (word === 'OR') {
      tokens.push({type: 'or'})
    } else {
      tokens.push({type: 'word', value: word})
    }
  }

  return tokens
}

// ── Parser ──────────────────────────────────────────────────────────────────
//
// Grammar:
//   expr     := and_expr (OR and_expr)*
//   and_expr := seq_expr (AND seq_expr)*
//   seq_expr := atom+
//   atom     := word | quoted | regex | '(' expr ')'

class Parser {
  #tokens: Token[]
  #pos: number = 0

  constructor(tokens: Token[]) {
    this.#tokens = tokens
  }

  parse(): FilterNode | undefined {
    if (this.#tokens.length === 0) return undefined
    const node = this.#expr()
    return node
  }

  #peek(): Token | undefined {
    return this.#tokens[this.#pos]
  }

  #advance(): Token {
    return this.#tokens[this.#pos++]!
  }

  #expr(): FilterNode {
    let left = this.#andExpr()
    while (this.#peek()?.type === 'or') {
      this.#advance()
      const right = this.#andExpr()
      left = {type: 'or', left, right}
    }
    return left
  }

  #andExpr(): FilterNode {
    let left = this.#seqExpr()
    while (this.#peek()?.type === 'and') {
      this.#advance()
      const right = this.#seqExpr()
      left = {type: 'and', left, right}
    }
    return left
  }

  #seqExpr(): FilterNode {
    const nodes: FilterNode[] = [this.#atom()]
    while (this.#isAtomStart()) {
      nodes.push(this.#atom())
    }
    return nodes.length === 1 ? nodes[0] : {type: 'sequence', nodes}
  }

  #isAtomStart(): boolean {
    const t = this.#peek()
    if (!t) return false
    return (
      t.type === 'word' ||
      t.type === 'quoted' ||
      t.type === 'regex' ||
      t.type === 'lparen'
    )
  }

  #atom(): FilterNode {
    const t = this.#peek()
    if (!t) throw new Error('Unexpected end of filter')

    if (t.type === 'lparen') {
      this.#advance()
      const inner = this.#expr()
      if (this.#peek()?.type === 'rparen') {
        this.#advance()
      }
      return inner
    }

    this.#advance()
    switch (t.type) {
      case 'word':
        return {type: 'word', value: t.value, lower: t.value.toLowerCase()}
      case 'quoted':
        return {type: 'quoted', value: t.value, lower: t.value.toLowerCase()}
      case 'regex':
        return {type: 'regex', value: t.value}
      default:
        // stray AND/OR treated as word
        return {
          type: 'word',
          value: t.type.toUpperCase(),
          lower: t.type,
        }
    }
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export function parseFilter(input: string): FilterNode | undefined {
  const tokens = tokenize(input.trim())
  return new Parser(tokens).parse()
}

/**
 * Test whether `text` matches the filter node.
 *
 * - word/quoted: case-insensitive substring
 * - regex: RegExp.test
 * - sequence: all nodes match and each match position is after the previous
 * - and: both sides match (any order)
 * - or: either side matches
 */
export function matchFilter(node: FilterNode, text: string): boolean {
  const lower = text.toLowerCase()

  switch (node.type) {
    case 'word':
      return lower.includes(node.lower)
    case 'quoted':
      return lower.includes(node.lower)
    case 'regex':
      return node.value.test(text)
    case 'sequence':
      return matchSequence(node.nodes, lower, 0)
    case 'and':
      return matchFilter(node.left, text) && matchFilter(node.right, text)
    case 'or':
      return matchFilter(node.left, text) || matchFilter(node.right, text)
  }
}

/**
 * All nodes in the sequence must match, and each must start at or after the
 * end of the previous match.
 */
function matchSequence(
  nodes: FilterNode[],
  lower: string,
  fromIndex: number,
): boolean {
  if (nodes.length === 0) return true
  const [first, ...rest] = nodes
  const pos = findMatch(first, lower, fromIndex)
  if (pos === -1) return false
  const len = matchLength(first, lower, pos)
  return matchSequence(rest, lower, pos + len)
}

/** Find the earliest position >= fromIndex where node matches. -1 if none. */
function findMatch(node: FilterNode, lower: string, fromIndex: number): number {
  switch (node.type) {
    case 'word':
      return lower.indexOf(node.lower, fromIndex)
    case 'quoted':
      return lower.indexOf(node.lower, fromIndex)
    case 'regex': {
      const sub = lower.slice(fromIndex)
      const m = node.value.exec(sub)
      return m ? fromIndex + m.index : -1
    }
    case 'sequence':
      // try every starting position
      for (let i = fromIndex; i < lower.length; i++) {
        if (matchSequence(node.nodes, lower, i)) return i
      }
      return -1
    case 'and':
    case 'or':
      // for compound nodes inside a sequence, just check if they match
      // from this position forward
      if (matchFilter(node, lower.slice(fromIndex))) return fromIndex
      return -1
  }
}

/** How many characters a match consumes (for advancing the sequence cursor). */
function matchLength(node: FilterNode, lower: string, pos: number): number {
  switch (node.type) {
    case 'word':
      return node.lower.length
    case 'quoted':
      return node.lower.length
    case 'regex': {
      const m = node.value.exec(lower.slice(pos))
      return m ? m[0].length : 0
    }
    default:
      // compound nodes: advance by 0 (they don't consume positional space)
      return 0
  }
}
