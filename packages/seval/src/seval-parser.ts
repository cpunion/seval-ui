/**
 * Seval Parser
 *
 * Converts tokens into an Abstract Syntax Tree (AST).
 * Uses recursive descent parsing with bounded depth.
 */

import type { ASTNode, FunctionDef, Program, PropertyDef } from './seval-ast'
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

	/**
	 * Peek at next token
	 * @param skipNewlines - if true, skip over NEWLINE tokens (default: true for expression context)
	 */
	private peek(skipNewlines = true): Token {
		let pos = this.pos

		if (skipNewlines) {
			// Skip newlines to peek at next significant token
			while (pos < this.tokens.length && this.tokens[pos].type === TokenType.NEWLINE) {
				pos++
			}
		}

		// biome-ignore lint/style/noNonNullAssertion: Fallback to last token
		return this.tokens[pos] || this.tokens[this.tokens.length - 1]!
	}

	/**
	 * Advance to next token
	 * @param skipNewlines - if true, skip over NEWLINE tokens after advancing (default: true)
	 */
	private advance(skipNewlines = true): Token {
		// biome-ignore lint/style/noNonNullAssertion: Token always exists
		const token = this.tokens[this.pos++]!

		if (skipNewlines) {
			// Skip subsequent newlines
			while (this.pos < this.tokens.length && this.tokens[this.pos].type === TokenType.NEWLINE) {
				this.pos++
			}
		}

		return token
	}

	/**
	 * Expect a specific token type
	 * @param type - expected token type
	 * @param skipNewlines - if true, skip newlines before checking (default: true)
	 */
	private expect(type: TokenType, skipNewlines = true): Token {
		const token = this.peek(skipNewlines)
		if (token.type !== type) {
			throw new Error(
				`Expected ${type} but got ${token.type} at line ${token.line}, column ${token.column}`,
			)
		}
		return this.advance(skipNewlines)
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

		const members: Array<PropertyDef | FunctionDef> = []

		// Skip leading newlines
		while (this.peek().type === TokenType.NEWLINE) {
			this.advance()
		}

		while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
			const nameToken = this.expect(TokenType.IDENTIFIER)
			const name = nameToken.value

			// Check if it's a property (name: value) or method (name(...) { ... })
			if (this.peek().type === TokenType.COLON) {
				// Property definition: name: value
				this.advance() // consume :
				const value = this.parseExpression()

				members.push({
					kind: 'PropertyDef',
					name,
					value,
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

				const body = this.parseFunctionBody()

				members.push({
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

			// Skip optional comma and newlines
			if (this.peek().type === TokenType.COMMA) {
				this.advance()
			}

			// Skip newlines between members
			while (this.peek().type === TokenType.NEWLINE) {
				this.advance()
			}
		}

		this.expect(TokenType.RBRACE)

		return {
			kind: 'Program',
			members,
		}
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

	/**
	 * Parse function body - supports multi-statement blocks
	 * Newlines and semicolons are treated as statement separators
	 */
	private parseFunctionBody(): ASTNode {
		this.expect(TokenType.LBRACE)

		const statements: ASTNode[] = []

		// Skip leading separators (newlines and semicolons)
		while (
			this.peek(false).type === TokenType.NEWLINE ||
			this.peek(false).type === TokenType.SEMICOLON
		) {
			this.advance(false)
		}

		// Parse statements until closing brace
		while (this.peek(false).type !== TokenType.RBRACE && this.peek(false).type !== TokenType.EOF) {
			statements.push(this.parseStatement())

			// Skip separators after statement
			while (
				this.peek(false).type === TokenType.NEWLINE ||
				this.peek(false).type === TokenType.SEMICOLON
			) {
				this.advance(false)
			}
		}

		this.expect(TokenType.RBRACE)

		// Single statement: return it directly
		if (statements.length === 1) {
			return statements[0]
		}

		// Multiple statements: return BlockExpression
		return {
			kind: 'BlockExpression',
			statements,
		}
	}

	// Parse statement (if statement or expression)
	private parseStatement(): ASTNode {
		// Check for if statement
		if (this.peek().type === TokenType.IF) {
			return this.parseIfStatement()
		}

		// Otherwise parse as expression/assignment
		return this.parseAssignment()
	}

	// Parse if statement: if (condition) { ... } elif (condition) { ... } else { ... }
	private parseIfStatement(): ASTNode {
		this.expect(TokenType.IF)

		// Parse condition
		const condition = this.parseExpression()

		// Parse consequent block
		const consequent = this.parseFunctionBody()

		// Check for elif or else
		const alternate = this.parseElseOrElif()

		return {
			kind: 'IfStatement',
			condition,
			consequent,
			alternate,
		}
	}

	private parseElseOrElif(): ASTNode | undefined {
		if (this.peek().type === TokenType.ELIF) {
			this.advance() // consume 'elif'

			const condition = this.parseExpression()
			const consequent = this.parseFunctionBody()

			return {
				kind: 'IfStatement',
				condition,
				consequent,
				alternate: this.parseElseOrElif(), // Recursively handle more elif/else
			}
		}
		if (this.peek().type === TokenType.ELSE) {
			this.advance() // consume 'else'
			return this.parseFunctionBody()
		}

		return undefined
	}

	// Parse expression (entry point for expression parsing)
	private parseExpression(): ASTNode {
		this.checkDepth()
		const result = this.parseAssignment()
		this.depth--
		return result
	}

	// Parse assignment: target = value
	// Also handles arrow functions: x => expr, (x, y) => expr
	private parseAssignment(): ASTNode {
		// First, check if this might be an arrow function
		// Arrow functions have lower precedence than assignment
		const savedPos = this.pos

		// Try to detect arrow function pattern: identifier => expr
		if (this.peek().type === TokenType.IDENTIFIER) {
			const identToken = this.peek()
			this.advance() // consume identifier

			if (this.peek().type === TokenType.ARROW) {
				// It's an arrow function: x => expr
				this.advance() // consume =>
				const body = this.parseAssignment() // Parse body (right-associative)
				return {
					kind: 'ArrowFunction',
					params: [identToken.value],
					body,
				}
			}

			// Not an arrow function, restore position
			this.pos = savedPos
		}

		// Try to detect arrow function pattern: (params) => expr
		if (this.peek().type === TokenType.LPAREN) {
			const parenPos = this.pos
			this.advance() // consume (

			// Collect potential parameters
			const params: string[] = []
			let isArrowFunction = false

			if (this.peek().type === TokenType.RPAREN) {
				// () => expr
				this.advance() // consume )
				if (this.peek().type === TokenType.ARROW) {
					isArrowFunction = true
				}
			} else if (this.peek().type === TokenType.IDENTIFIER) {
				// (x) => expr or (x, y) => expr
				params.push(this.advance().value)

				while (this.peek().type === TokenType.COMMA) {
					this.advance() // consume comma
					if (this.peek().type === TokenType.IDENTIFIER) {
						params.push(this.advance().value)
					}
				}

				if (this.peek().type === TokenType.RPAREN) {
					this.advance() // consume )
					if (this.peek().type === TokenType.ARROW) {
						isArrowFunction = true
					}
				}
			}

			if (isArrowFunction) {
				this.advance() // consume =>
				const body = this.parseAssignment()
				return {
					kind: 'ArrowFunction',
					params,
					body,
				}
			}

			// Not an arrow function, restore position
			this.pos = parenPos
		}

		// Not an arrow function, parse as normal expression
		const expr = this.parseTernary()

		// Check if this is an assignment
		if (this.peek().type === TokenType.ASSIGN) {
			// Validate that left side is assignable
			if (expr.kind !== 'Identifier' && expr.kind !== 'MemberExpression') {
				throw new Error('Invalid assignment target')
			}

			this.advance() // consume =
			const value = this.parseAssignment() // Right-associative

			return {
				kind: 'AssignmentStatement',
				target: expr as import('./seval-ast').Identifier | import('./seval-ast').MemberExpression,
				value,
			}
		}

		return expr
	}

	// Parse ternary: condition ? consequent : alternate
	private parseTernary(): ASTNode {
		const expr = this.parseLogicalOr()

		if (this.peek().type === TokenType.QUESTION) {
			this.advance()
			const consequent = this.parseTernary()
			this.expect(TokenType.COLON)
			const alternate = this.parseTernary()

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
				const property = this.parseExpression() // Changed from 'index' to 'property' to match AST node structure
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
		// Skip newlines before parsing primary expression

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

		if (token.type === TokenType.NULL) {
			this.advance()
			return {
				kind: 'NullLiteral',
				value: null,
			}
		}

		if (token.type === TokenType.IDENTIFIER) {
			// Check if this is an arrow function: x => expr
			// Save position to check next token
			const savedPos = this.pos
			const nextToken = this.peek()

			if (nextToken.type === TokenType.ARROW) {
				// It's an arrow function
				this.advance() // consume =>
				const body = this.parseExpression()
				return {
					kind: 'ArrowFunction',
					params: [token.value],
					body,
				}
			}

			// Not an arrow function, restore position and treat as identifier
			this.pos = savedPos
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
