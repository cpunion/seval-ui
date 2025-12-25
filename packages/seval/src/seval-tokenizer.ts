/**
 * Seval Tokenizer
 *
 * Converts Seval source code into tokens using an iterative state machine.
 * No recursion - safe for any stack size.
 */

export enum TokenType {
	// Literals
	NUMBER = 'NUMBER',
	STRING = 'STRING',
	IDENTIFIER = 'IDENTIFIER',

	// Keywords
	TRUE = 'TRUE',
	FALSE = 'FALSE',
	NULL = 'NULL',
	IF = 'IF',
	ELIF = 'ELIF',
	ELSE = 'ELSE',
	FOR = 'FOR',

	// Operators
	PLUS = 'PLUS',
	MINUS = 'MINUS',
	STAR = 'STAR',
	SLASH = 'SLASH',
	PERCENT = 'PERCENT',

	EQ = 'EQ', // ==
	NE = 'NE', // !=
	STRICT_EQ = 'STRICT_EQ', // ===
	STRICT_NE = 'STRICT_NE', // !==
	LT = 'LT', // <
	LE = 'LE', // <=
	GT = 'GT', // >
	GE = 'GE', // >=

	AND = 'AND', // &&
	OR = 'OR', // ||
	NOT = 'NOT', // !

	QUESTION = 'QUESTION', // ?
	COLON = 'COLON', // :
	ARROW = 'ARROW', // =>
	ASSIGN = 'ASSIGN', // =

	// Delimiters
	LPAREN = 'LPAREN', // (
	RPAREN = 'RPAREN', // )
	LBRACE = 'LBRACE', // {
	RBRACE = 'RBRACE', // }
	LBRACKET = 'LBRACKET', // [
	RBRACKET = 'RBRACKET', // ]
	COMMA = 'COMMA', // ,
	DOT = 'DOT', // .
	SEMICOLON = 'SEMICOLON', // ;
	NEWLINE = 'NEWLINE', // \n

	// Special
	EOF = 'EOF',
}

export interface Token {
	type: TokenType
	value: string
	line: number
	column: number
}

export class Tokenizer {
	private source: string
	private pos = 0
	private line = 1
	private column = 1

	constructor(source: string) {
		this.source = source
	}

	private peek(offset = 0): string {
		return this.source[this.pos + offset] || ''
	}

	private advance(): string {
		const ch = this.source[this.pos++] || ''
		if (ch === '\n') {
			this.line++
			this.column = 1
		} else {
			this.column++
		}
		return ch
	}

	private skipWhitespace(): void {
		while (this.pos < this.source.length) {
			const ch = this.peek()
			// Skip spaces, tabs, and carriage returns, but NOT newlines
			if (ch === ' ' || ch === '\t' || ch === '\r') {
				this.advance()
			} else if (ch === '/' && this.peek(1) === '/') {
				// Skip line comments
				this.advance() // skip first /
				this.advance() // skip second /
				while (this.pos < this.source.length && this.peek() !== '\n') {
					this.advance()
				}
				// Don't skip the newline - it will be returned as a token
			} else {
				break
			}
		}
	}

	private readNumber(): Token {
		const start = this.pos
		const line = this.line
		const column = this.column

		while (this.pos < this.source.length) {
			const ch = this.peek()
			if ((ch >= '0' && ch <= '9') || ch === '.') {
				this.advance()
			} else {
				break
			}
		}

		return {
			type: TokenType.NUMBER,
			value: this.source.slice(start, this.pos),
			line,
			column,
		}
	}

	private readString(quote: string): Token {
		const line = this.line
		const column = this.column
		this.advance() // skip opening quote

		let value = ''
		while (this.pos < this.source.length) {
			const ch = this.peek()
			if (ch === quote) {
				this.advance() // skip closing quote
				break
			}
			if (ch === '\\') {
				this.advance()
				const next = this.advance()
				switch (next) {
					case 'n':
						value += '\n'
						break
					case 't':
						value += '\t'
						break
					case 'r':
						value += '\r'
						break
					case '\\':
						value += '\\'
						break
					case '"':
						value += '"'
						break
					case "'":
						value += "'"
						break
					default:
						value += next
				}
			} else {
				value += this.advance()
			}
		}

		return {
			type: TokenType.STRING,
			value,
			line,
			column,
		}
	}

	private readIdentifier(): Token {
		const start = this.pos
		const line = this.line
		const column = this.column

		while (this.pos < this.source.length) {
			const ch = this.peek()
			if (
				(ch >= 'a' && ch <= 'z') ||
				(ch >= 'A' && ch <= 'Z') ||
				(ch >= '0' && ch <= '9') ||
				ch === '_'
			) {
				this.advance()
			} else {
				break
			}
		}

		const value = this.source.slice(start, this.pos)
		let type = TokenType.IDENTIFIER

		if (value === 'true') type = TokenType.TRUE
		else if (value === 'false') type = TokenType.FALSE
		else if (value === 'null') type = TokenType.NULL
		else if (value === 'if') type = TokenType.IF
		else if (value === 'elif') type = TokenType.ELIF
		else if (value === 'else') type = TokenType.ELSE
		else if (value === 'for') type = TokenType.FOR

		return { type, value, line, column }
	}

	public next(): Token {
		this.skipWhitespace()

		if (this.pos >= this.source.length) {
			return {
				type: TokenType.EOF,
				value: '',
				line: this.line,
				column: this.column,
			}
		}

		const ch = this.peek()
		const line = this.line
		const column = this.column

		// Handle newlines
		if (ch === '\n') {
			this.advance()
			return { type: TokenType.NEWLINE, value: '\n', line, column }
		}

		// Numbers
		if (ch >= '0' && ch <= '9') {
			return this.readNumber()
		}

		// Strings
		if (ch === '"' || ch === "'") {
			return this.readString(ch)
		}

		// Identifiers
		if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
			return this.readIdentifier()
		}

		// Three-character operators (must check before two-character)
		if (ch === '=' && this.peek(1) === '=' && this.peek(2) === '=') {
			this.advance()
			this.advance()
			this.advance()
			return { type: TokenType.STRICT_EQ, value: '===', line, column }
		}
		if (ch === '!' && this.peek(1) === '=' && this.peek(2) === '=') {
			this.advance()
			this.advance()
			this.advance()
			return { type: TokenType.STRICT_NE, value: '!==', line, column }
		}

		// Two-character operators
		if (ch === '=' && this.peek(1) === '=') {
			this.advance()
			this.advance()
			return { type: TokenType.EQ, value: '==', line, column }
		}
		if (ch === '!' && this.peek(1) === '=') {
			this.advance()
			this.advance()
			return { type: TokenType.NE, value: '!=', line, column }
		}
		if (ch === '<' && this.peek(1) === '=') {
			this.advance()
			this.advance()
			return { type: TokenType.LE, value: '<=', line, column }
		}
		if (ch === '>' && this.peek(1) === '=') {
			this.advance()
			this.advance()
			return { type: TokenType.GE, value: '>=', line, column }
		}
		if (ch === '&' && this.peek(1) === '&') {
			this.advance()
			this.advance()
			return { type: TokenType.AND, value: '&&', line, column }
		}
		if (ch === '|' && this.peek(1) === '|') {
			this.advance()
			this.advance()
			return { type: TokenType.OR, value: '||', line, column }
		}
		if (ch === '=' && this.peek(1) === '>') {
			this.advance()
			this.advance()
			return { type: TokenType.ARROW, value: '=>', line, column }
		}

		// Single-character tokens
		this.advance()
		switch (ch) {
			case '+':
				return { type: TokenType.PLUS, value: ch, line, column }
			case '-':
				return { type: TokenType.MINUS, value: ch, line, column }
			case '*':
				return { type: TokenType.STAR, value: ch, line, column }
			case '/':
				return { type: TokenType.SLASH, value: ch, line, column }
			case '%':
				return { type: TokenType.PERCENT, value: ch, line, column }
			case '<':
				return { type: TokenType.LT, value: ch, line, column }
			case '>':
				return { type: TokenType.GT, value: ch, line, column }
			case '!':
				return { type: TokenType.NOT, value: ch, line, column }
			case '=':
				return { type: TokenType.ASSIGN, value: ch, line, column }
			case '?':
				return { type: TokenType.QUESTION, value: ch, line, column }
			case ':':
				return { type: TokenType.COLON, value: ch, line, column }
			case '(':
				return { type: TokenType.LPAREN, value: ch, line, column }
			case ')':
				return { type: TokenType.RPAREN, value: ch, line, column }
			case '{':
				return { type: TokenType.LBRACE, value: ch, line, column }
			case '}':
				return { type: TokenType.RBRACE, value: ch, line, column }
			case '[':
				return { type: TokenType.LBRACKET, value: ch, line, column }
			case ']':
				return { type: TokenType.RBRACKET, value: ch, line, column }
			case ',':
				return { type: TokenType.COMMA, value: ch, line, column }
			case '.':
				return { type: TokenType.DOT, value: ch, line, column }
			case ';':
				return { type: TokenType.SEMICOLON, value: ch, line, column }
			default:
				throw new Error(`Unexpected character '${ch}' at line ${line}, column ${column}`)
		}
	}

	public tokenize(): Token[] {
		const tokens: Token[] = []
		while (true) {
			const token = this.next()
			tokens.push(token)
			if (token.type === TokenType.EOF) {
				break
			}
		}
		return tokens
	}
}
