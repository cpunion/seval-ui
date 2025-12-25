/**
 * Seval Parser
 *
 * Converts tokens into an Abstract Syntax Tree (AST).
 * Uses recursive descent parsing with bounded depth.
 */

import type { ASTNode, FunctionDef, Program } from './seval-ast'
import type { Token } from './seval-tokenizer'
import { TokenType } from './seval-tokenizer'

export class Parser {
	private tokens: Token[]
	private pos = 0
	private depth = 0
	private maxDepth = 50

	constructor(tokens: Token[]) {
		this.tokens = tokens
	}

	private peek(offset = 0): Token {
		// biome-ignore lint/style/noNonNullAssertion: Fallback to last token
		return this.tokens[this.pos + offset] || this.tokens[this.tokens.length - 1]!
	}

	private advance(): Token {
		// biome-ignore lint/style/noNonNullAssertion: Token always exists
		return this.tokens[this.pos++]!
	}

	private expect(type: TokenType): Token {
		const token = this.advance()
		if (token.type !== type) {
			throw new Error(
				`Expected ${type} but got ${token.type} at line ${token.line}, column ${token.column}`,
			)
		}
		return token
	}

	private checkDepth(): void {
		this.depth++
		if (this.depth > this.maxDepth) {
			throw new Error('Maximum parser depth exceeded')
		}
	}

	// Parse program: { prop: value, func(params) { body }, ... }
	public parseProgram(): Program {
		this.expect(TokenType.LBRACE)

		const functions: FunctionDef[] = []

		while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
			const nameToken = this.expect(TokenType.IDENTIFIER)
			const name = nameToken.value

			// Check if it's a property (name: value) or method (name(...) { ... })
			if (this.peek().type === TokenType.COLON) {
				// Property definition: name: value
				this.advance() // consume :
				const value = this.parseExpression()

				// Store as a zero-parameter function that returns the value
				functions.push({
					kind: 'FunctionDef',
					name,
					params: [],
					body: value,
				})
			} else if (this.peek().type === TokenType.LPAREN) {
				// Method definition: name(params) { body }
				this.advance() // consume (
				const params: string[] = []

				while (this.peek().type !== TokenType.RPAREN) {
					const param = this.expect(TokenType.IDENTIFIER)
					params.push(param.value)
					if (this.peek().type === TokenType.COMMA) {
						this.advance()
					}
				}

				this.expect(TokenType.RPAREN)
				this.expect(TokenType.LBRACE)

				const body = this.parseExpression()

				this.expect(TokenType.RBRACE)

				functions.push({
					kind: 'FunctionDef',
					name,
					params,
					body,
				})
			} else {
				throw new Error(
					`Expected ':' or '(' after identifier '${name}' at line ${nameToken.line}, column ${nameToken.column}`,
				)
			}

			if (this.peek().type === TokenType.COMMA) {
				this.advance()
			}
		}

		this.expect(TokenType.RBRACE)

		return { kind: 'Program', functions }
	}

	// Parse function: name(param1, param2) { body }
	private parseFunction(): FunctionDef {
		const nameToken = this.expect(TokenType.IDENTIFIER)
		const name = nameToken.value

		this.expect(TokenType.LPAREN)
		const params: string[] = []

		while (this.peek().type !== TokenType.RPAREN) {
			const param = this.expect(TokenType.IDENTIFIER)
			params.push(param.value)
			if (this.peek().type === TokenType.COMMA) {
				this.advance()
			}
		}

		this.expect(TokenType.RPAREN)
		this.expect(TokenType.LBRACE)

		const body = this.parseExpression()

		this.expect(TokenType.RBRACE)

		return {
			kind: 'FunctionDef',
			name,
			params,
			body,
		}
	}

	// Parse expression (entry point for expression parsing)
	private parseExpression(): ASTNode {
		this.checkDepth()
		const result = this.parseTernary()
		this.depth--
		return result
	}

	// Parse ternary: condition ? consequent : alternate
	private parseTernary(): ASTNode {
		const expr = this.parseLogicalOr()

		if (this.peek().type === TokenType.QUESTION) {
			this.advance()
			const consequent = this.parseExpression()
			this.expect(TokenType.COLON)
			const alternate = this.parseExpression()

			return {
				kind: 'TernaryExpression',
				condition: expr,
				consequent,
				alternate,
			}
		}

		return expr
	}

	// Parse logical OR: expr || expr
	private parseLogicalOr(): ASTNode {
		let left = this.parseLogicalAnd()

		while (this.peek().type === TokenType.OR) {
			const op = this.advance()
			const right = this.parseLogicalAnd()
			left = {
				kind: 'BinaryExpression',
				operator: op.value,
				left,
				right,
			}
		}

		return left
	}

	// Parse logical AND: expr && expr
	private parseLogicalAnd(): ASTNode {
		let left = this.parseEquality()

		while (this.peek().type === TokenType.AND) {
			const op = this.advance()
			const right = this.parseEquality()
			left = {
				kind: 'BinaryExpression',
				operator: op.value,
				left,
				right,
			}
		}

		return left
	}

	// Parse equality: expr == expr, expr != expr
	private parseEquality(): ASTNode {
		let left = this.parseRelational()

		while (this.peek().type === TokenType.EQ || this.peek().type === TokenType.NE) {
			const op = this.advance()
			const right = this.parseRelational()
			left = {
				kind: 'BinaryExpression',
				operator: op.value,
				left,
				right,
			}
		}

		return left
	}

	// Parse relational: expr < expr, expr <= expr, etc.
	private parseRelational(): ASTNode {
		let left = this.parseAdditive()

		while (
			this.peek().type === TokenType.LT ||
			this.peek().type === TokenType.LE ||
			this.peek().type === TokenType.GT ||
			this.peek().type === TokenType.GE
		) {
			const op = this.advance()
			const right = this.parseAdditive()
			left = {
				kind: 'BinaryExpression',
				operator: op.value,
				left,
				right,
			}
		}

		return left
	}

	// Parse additive: expr + expr, expr - expr
	private parseAdditive(): ASTNode {
		let left = this.parseMultiplicative()

		while (this.peek().type === TokenType.PLUS || this.peek().type === TokenType.MINUS) {
			const op = this.advance()
			const right = this.parseMultiplicative()
			left = {
				kind: 'BinaryExpression',
				operator: op.value,
				left,
				right,
			}
		}

		return left
	}

	// Parse multiplicative: expr * expr, expr / expr, expr % expr
	private parseMultiplicative(): ASTNode {
		let left = this.parseUnary()

		while (
			this.peek().type === TokenType.STAR ||
			this.peek().type === TokenType.SLASH ||
			this.peek().type === TokenType.PERCENT
		) {
			const op = this.advance()
			const right = this.parseUnary()
			left = {
				kind: 'BinaryExpression',
				operator: op.value,
				left,
				right,
			}
		}

		return left
	}

	// Parse unary: -expr, !expr
	private parseUnary(): ASTNode {
		if (this.peek().type === TokenType.MINUS || this.peek().type === TokenType.NOT) {
			const op = this.advance()
			const operand = this.parseUnary()
			return {
				kind: 'UnaryExpression',
				operator: op.value,
				operand,
			}
		}

		return this.parsePostfix()
	}

	// Parse postfix: primary(...), primary[...], primary.prop
	private parsePostfix(): ASTNode {
		let expr = this.parsePrimary()

		while (true) {
			if (this.peek().type === TokenType.LPAREN) {
				// Function call
				this.advance()
				const args: ASTNode[] = []

				while (this.peek().type !== TokenType.RPAREN) {
					args.push(this.parseExpression())
					if (this.peek().type === TokenType.COMMA) {
						this.advance()
					}
				}

				this.expect(TokenType.RPAREN)

				expr = {
					kind: 'CallExpression',
					callee: expr,
					args,
				}
			} else if (this.peek().type === TokenType.DOT) {
				// Dot notation: obj.property
				this.advance() // consume .
				const propertyToken = this.expect(TokenType.IDENTIFIER)
				expr = {
					kind: 'MemberExpression',
					object: expr,
					property: propertyToken.value,
					computed: false,
				}
			} else if (this.peek().type === TokenType.LBRACKET) {
				// Bracket notation: arr[index] or obj["key"]
				this.advance() // consume [
				const property = this.parseExpression()
				this.expect(TokenType.RBRACKET)
				expr = {
					kind: 'MemberExpression',
					object: expr,
					property,
					computed: true,
				}
			} else {
				break
			}
		}

		return expr
	}

	// Parse primary: number, string, boolean, identifier, array, object, (expr)
	private parsePrimary(): ASTNode {
		const token = this.peek()

		if (token.type === TokenType.NUMBER) {
			this.advance()
			return {
				kind: 'NumberLiteral',
				value: Number.parseFloat(token.value),
			}
		}

		if (token.type === TokenType.STRING) {
			this.advance()
			return {
				kind: 'StringLiteral',
				value: token.value,
			}
		}

		if (token.type === TokenType.TRUE) {
			this.advance()
			return {
				kind: 'BooleanLiteral',
				value: true,
			}
		}

		if (token.type === TokenType.FALSE) {
			this.advance()
			return {
				kind: 'BooleanLiteral',
				value: false,
			}
		}

		if (token.type === TokenType.IDENTIFIER) {
			// Check if this is an arrow function: x => expr
			if (this.peek(1).type === TokenType.ARROW) {
				const param = this.advance() // consume identifier
				this.advance() // consume =>
				const body = this.parseExpression()
				return {
					kind: 'ArrowFunction',
					params: [param.value],
					body,
				}
			}
			this.advance()
			return {
				kind: 'Identifier',
				name: token.value,
			}
		}

		if (token.type === TokenType.LBRACKET) {
			// Array literal
			this.advance()
			const elements: ASTNode[] = []

			while (this.peek().type !== TokenType.RBRACKET) {
				elements.push(this.parseExpression())
				if (this.peek().type === TokenType.COMMA) {
					this.advance()
				}
			}

			this.expect(TokenType.RBRACKET)
			return {
				kind: 'ArrayLiteral',
				elements,
			}
		}

		if (token.type === TokenType.LPAREN) {
			// Could be arrow function or grouped expression
			// Look ahead to determine which
			const savedPos = this.pos
			this.advance() // consume (

			// Check for arrow function patterns: () =>, (x) =>, (x, y) =>
			if (this.peek().type === TokenType.RPAREN) {
				// Could be () => or just ()
				this.advance() // consume )
				if (this.peek().type === TokenType.ARROW) {
					this.advance() // consume =>
					const body = this.parseExpression()
					return {
						kind: 'ArrowFunction',
						params: [],
						body,
					}
				}
				// Not arrow function, restore and parse as grouped
				this.pos = savedPos
				this.advance() // (
				const expr = this.parseExpression()
				this.expect(TokenType.RPAREN)
				return expr
			}

			// Check if it looks like arrow function parameters
			if (this.peek().type === TokenType.IDENTIFIER) {
				const params: string[] = [this.advance().value]
				while (this.peek().type === TokenType.COMMA) {
					this.advance() // comma
					if (this.peek().type === TokenType.IDENTIFIER) {
						params.push(this.advance().value)
					}
				}
				if (this.peek().type === TokenType.RPAREN) {
					this.advance() // )
					if (this.peek().type === TokenType.ARROW) {
						this.advance() // =>
						const body = this.parseExpression()
						return {
							kind: 'ArrowFunction',
							params,
							body,
						}
					}
				}
				// Not an arrow function, restore and parse as grouped expression
				this.pos = savedPos
			} else {
				this.pos = savedPos
			}

			// Grouped expression
			this.advance() // (
			const expr = this.parseExpression()
			this.expect(TokenType.RPAREN)
			return expr
		}

		if (token.type === TokenType.LBRACE) {
			// Object literal: { key: value, key2: value2, ... }
			this.advance() // consume {
			const properties: Array<{ key: string; value: ASTNode }> = []

			while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
				const keyToken = this.expect(TokenType.IDENTIFIER)
				this.expect(TokenType.COLON)
				const value = this.parseExpression()

				properties.push({
					key: keyToken.value,
					value,
				})

				if (this.peek().type === TokenType.COMMA) {
					this.advance()
				}
			}

			this.expect(TokenType.RBRACE)
			return {
				kind: 'ObjectLiteral',
				properties,
			}
		}

		throw new Error(`Unexpected token ${token.type} at line ${token.line}, column ${token.column}`)
	}
}
