/**
 * S-Expression Parser
 *
 * Parses strings like "(+ 1 2)" into nested arrays [Symbol.for('+'), 1, 2]
 *
 * Design:
 * - Symbols (identifiers) are represented as JS Symbol via Symbol.for(name)
 * - Strings are plain JS strings
 * - This cleanly distinguishes variable references from string literals
 */

/**
 * S-Expression AST type
 * - symbol: variable reference (looked up in environment)
 * - string: string literal (used as-is)
 * - number/boolean: primitive values
 * - array: list/function call
 */
export type SExpr = symbol | string | number | boolean | null | SExpr[]

/**
 * Check if a value is a symbol (variable reference)
 */
export function isSymbol(value: unknown): value is symbol {
    return typeof value === 'symbol'
}

/**
 * Create a symbol from a name
 */
export function sym(name: string): symbol {
    return Symbol.for(name)
}

/**
 * Get the name from a symbol
 */
export function symName(s: symbol): string {
    return Symbol.keyFor(s) ?? s.description ?? ''
}

/**
 * Parse S-expression string into AST
 */
export function parse(input: string): SExpr {
    let pos = 0

    function skipWhitespace(): void {
        while (pos < input.length && /\s/.test(input[pos] ?? '')) {
            pos++
        }
        // Skip comments
        if (input[pos] === ';') {
            while (pos < input.length && input[pos] !== '\n') {
                pos++
            }
            skipWhitespace()
        }
    }

    function parseExpr(): SExpr {
        skipWhitespace()

        if (pos >= input.length) {
            throw new Error('Unexpected end of input')
        }

        const char = input[pos]

        // List
        if (char === '(') {
            pos++ // skip '('
            const list: SExpr[] = []
            skipWhitespace()
            while (pos < input.length && input[pos] !== ')') {
                list.push(parseExpr())
                skipWhitespace()
            }
            if (input[pos] !== ')') {
                throw new Error('Expected closing parenthesis')
            }
            pos++ // skip ')'
            return list
        }

        // String literal (quoted) - returns plain string
        if (char === '"') {
            pos++ // skip opening quote
            let str = ''
            while (pos < input.length && input[pos] !== '"') {
                if (input[pos] === '\\' && pos + 1 < input.length) {
                    pos++
                    const escaped = input[pos]
                    if (escaped === 'n') str += '\n'
                    else if (escaped === 't') str += '\t'
                    else if (escaped === '\\') str += '\\'
                    else if (escaped === '"') str += '"'
                    else str += escaped
                } else {
                    str += input[pos]
                }
                pos++
            }
            if (input[pos] !== '"') {
                throw new Error('Expected closing quote')
            }
            pos++ // skip closing quote
            return str // Plain string, no prefix needed
        }

        // Atom (number, symbol, boolean)
        let token = ''
        while (pos < input.length && !/[\s()";[\]]/.test(input[pos] ?? '')) {
            token += input[pos++]
        }

        if (token === '') {
            throw new Error(`Unexpected character: ${char}`)
        }

        // Boolean
        if (token === 'true' || token === '#t') return true
        if (token === 'false' || token === '#f') return false

        // null
        if (token === 'null' || token === 'nil') return null

        // Number
        const num = Number(token)
        if (!Number.isNaN(num)) return num

        // Symbol (variable reference) - use Symbol.for() for interning
        return Symbol.for(token)
    }

    const result = parseExpr()
    skipWhitespace()
    if (pos < input.length) {
        throw new Error(`Unexpected characters after expression: ${input.slice(pos)}`)
    }
    return result
}

/**
 * Convert S-expression AST back to string
 */
export function stringify(expr: SExpr): string {
    if (expr === null) return 'null'
    if (typeof expr === 'number') return String(expr)
    if (typeof expr === 'boolean') return expr ? 'true' : 'false'
    if (typeof expr === 'symbol') {
        // Symbol = variable reference
        return symName(expr)
    }
    if (typeof expr === 'string') {
        // String = string literal, needs quoting
        return `"${expr.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
    }
    if (Array.isArray(expr)) {
        return `(${expr.map(stringify).join(' ')})`
    }
    return String(expr)
}

// Legacy export for compatibility (will be removed)
export const STRING_LITERAL_PREFIX = '\0STR:'
