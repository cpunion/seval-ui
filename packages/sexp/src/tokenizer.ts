/**
 * S-Expression Tokenizer
 *
 * Converts source string into a stream of tokens.
 */

/**
 * Token types
 */
export enum TokenType {
    LeftParen = 'LeftParen',
    RightParen = 'RightParen',
    Number = 'Number',
    String = 'String',
    Symbol = 'Symbol',
    Boolean = 'Boolean',
    EOF = 'EOF',
}

/**
 * Token with position information
 */
export interface Token {
    type: TokenType
    value: string | number | boolean
    line: number
    column: number
}

/**
 * Tokenize S-expression source code
 */
export function tokenize(input: string): Token[] {
    const tokens: Token[] = []
    let pos = 0
    let line = 1
    let column = 1

    function advance(): string {
        const char = input[pos++]
        if (char === '\n') {
            line++
            column = 1
        } else {
            column++
        }
        return char ?? ''
    }

    function peek(): string {
        return input[pos] ?? ''
    }

    function skipWhitespace(): void {
        while (pos < input.length) {
            const char = peek()
            if (/\s/.test(char)) {
                advance()
            } else if (char === ';') {
                // Skip comment until end of line
                while (pos < input.length && peek() !== '\n') {
                    advance()
                }
            } else {
                break
            }
        }
    }

    function readString(): Token {
        const startLine = line
        const startColumn = column
        advance() // skip opening quote

        let value = ''
        while (pos < input.length && peek() !== '"') {
            if (peek() === '\\' && pos + 1 < input.length) {
                advance() // skip backslash
                const escaped = advance()
                switch (escaped) {
                    case 'n':
                        value += '\n'
                        break
                    case 't':
                        value += '\t'
                        break
                    case '\\':
                        value += '\\'
                        break
                    case '"':
                        value += '"'
                        break
                    default:
                        value += escaped
                }
            } else {
                value += advance()
            }
        }

        if (peek() !== '"') {
            throw new Error(`Unterminated string at line ${startLine}, column ${startColumn}`)
        }
        advance() // skip closing quote

        return { type: TokenType.String, value, line: startLine, column: startColumn }
    }

    function readAtom(): Token {
        const startLine = line
        const startColumn = column

        let atom = ''
        while (pos < input.length && !/[\s()";\[\]]/.test(peek())) {
            atom += advance()
        }

        if (atom === '') {
            throw new Error(`Unexpected character '${peek()}' at line ${line}, column ${column}`)
        }

        // Check for boolean
        if (atom === 'true' || atom === '#t') {
            return { type: TokenType.Boolean, value: true, line: startLine, column: startColumn }
        }
        if (atom === 'false' || atom === '#f') {
            return { type: TokenType.Boolean, value: false, line: startLine, column: startColumn }
        }

        // Check for number
        const num = Number(atom)
        if (!Number.isNaN(num)) {
            return { type: TokenType.Number, value: num, line: startLine, column: startColumn }
        }

        // Symbol
        return { type: TokenType.Symbol, value: atom, line: startLine, column: startColumn }
    }

    while (pos < input.length) {
        skipWhitespace()
        if (pos >= input.length) break

        const startLine = line
        const startColumn = column
        const char = peek()

        if (char === '(') {
            advance()
            tokens.push({
                type: TokenType.LeftParen,
                value: '(',
                line: startLine,
                column: startColumn,
            })
        } else if (char === ')') {
            advance()
            tokens.push({
                type: TokenType.RightParen,
                value: ')',
                line: startLine,
                column: startColumn,
            })
        } else if (char === '"') {
            tokens.push(readString())
        } else {
            tokens.push(readAtom())
        }
    }

    tokens.push({ type: TokenType.EOF, value: '', line, column })
    return tokens
}
