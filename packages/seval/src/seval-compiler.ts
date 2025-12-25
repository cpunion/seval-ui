/**
 * Seval Compiler
 *
 * Compiles Seval AST to native JavaScript objects.
 * Methods are compiled using new Function() for native execution.
 */

import type { ASTNode, FunctionDef, Program, PropertyDef } from './seval-ast'
import { primitives } from './seval-primitives'

export class SevalCompiler {
	/**
	 * Compile a Seval program to a native JavaScript object
	 */
	public compile(program: Program): Record<string, unknown> {
		const obj: Record<string, unknown> = {}

		for (const member of program.members) {
			if (member.kind === 'PropertyDef') {
				// Properties: evaluate and store directly
				obj[member.name] = this.compileValue(member.value)
			} else if (member.kind === 'FunctionDef') {
				// Methods: compile to native JS functions
				obj[member.name] = this.compileFunction(member)
			}
		}

		return obj
	}

	/**
	 * Compile a literal value (numbers, strings, arrays, objects)
	 */
	private compileValue(node: ASTNode): unknown {
		switch (node.kind) {
			case 'NumberLiteral':
				return node.value

			case 'StringLiteral':
				return node.value

			case 'BooleanLiteral':
				return node.value

			case 'NullLiteral':
				return null

			case 'ArrayLiteral':
				return node.elements.map((el) => this.compileValue(el))

			case 'ObjectLiteral': {
				const obj: Record<string, unknown> = {}
				for (const prop of node.properties) {
					obj[prop.key] = this.compileValue(prop.value)
				}
				return obj
			}

			default:
				throw new Error(`Cannot compile value of kind: ${(node as { kind: string }).kind}`)
		}
	}

	/**
	 * Compile a function to a native JavaScript function
	 */
	private compileFunction(func: FunctionDef): (...args: unknown[]) => unknown {
		// Compile function body to JS expression string
		const bodyCode = this.compileExpression(func.body, func.params)

		// Create native JS function with proper this binding
		// The function signature is: function(...userParams, primitives)
		// When called, we need to append primitives as the last argument
		const funcCode = `return ${bodyCode}`

		try {
			// Create function: function(param1, param2, ..., primitives) { return ... }
			const compiledFunc = new Function(...func.params, 'primitives', funcCode)

			// Wrap to inject primitives
			return function (this: unknown, ...args: unknown[]) {
				return compiledFunc.apply(this, [...args, primitives])
			}
		} catch (error) {
			throw new Error(`Failed to compile function ${func.name}: ${error}`)
		}
	}
	/**
	 * Compile an expression to JavaScript code string
	 * @param params Function parameters (for scope checking)
	 */
	private compileExpression(node: ASTNode, params: string[] = []): string {
		switch (node.kind) {
			case 'NumberLiteral':
				return String(node.value)

			case 'StringLiteral':
				return JSON.stringify(node.value)

			case 'BooleanLiteral':
				return String(node.value)

			case 'NullLiteral':
				return 'null'

			case 'Identifier':
				// Special case: 'this' keyword
				if (node.name === 'this') {
					return 'this'
				}
				// Check if it's a function parameter
				if (params.includes(node.name)) {
					return node.name
				}
				// Check if it's a primitive function
				if (node.name in primitives) {
					return `primitives.${node.name}`
				}
				// Otherwise it's an object member (property or method)
				return `this.${node.name}`

			case 'MemberExpression': {
				const object = this.compileExpression(node.object, params)
				if (node.computed) {
					// Bracket notation: obj[key]
					const property = this.compileExpression(node.property as ASTNode, params)
					return `${object}[${property}]`
				}
				// Dot notation: obj.prop
				return `${object}.${node.property}`
			}

			case 'BinaryExpression': {
				const left = this.compileExpression(node.left, params)
				const right = this.compileExpression(node.right, params)
				return `(${left} ${node.operator} ${right})`
			}

			case 'UnaryExpression': {
				const operand = this.compileExpression(node.operand, params)
				return `(${node.operator}${operand})`
			}

			case 'TernaryExpression': {
				const condition = this.compileExpression(node.condition, params)
				const consequent = this.compileExpression(node.consequent, params)
				const alternate = this.compileExpression(node.alternate, params)
				return `(${condition} ? ${consequent} : ${alternate})`
			}

			case 'AssignmentStatement': {
				const target = this.compileExpression(node.target, params)
				const value = this.compileExpression(node.value, params)
				return `(${target} = ${value})`
			}

			case 'CallExpression': {
				const callee = this.compileExpression(node.callee, params)
				const args = node.args.map((arg) => this.compileExpression(arg, params)).join(', ')
				return `${callee}(${args})`
			}

			case 'ArrayLiteral': {
				const elements = node.elements.map((el) => this.compileExpression(el, params)).join(', ')
				return `[${elements}]`
			}

			case 'ObjectLiteral': {
				const props = node.properties
					.map(
						(prop) => `${JSON.stringify(prop.key)}: ${this.compileExpression(prop.value, params)}`,
					)
					.join(', ')
				return `{${props}}`
			}

			case 'ArrowFunction': {
				const arrowParams = node.params.join(', ')
				const body = this.compileExpression(node.body, node.params)
				return `((${arrowParams}) => ${body})`
			}

			case 'BlockExpression': {
				// Compile all statements
				const compiledStatements = node.statements.map((stmt) =>
					this.compileExpression(stmt, params),
				)

				// Use IIFE to create block scope and return last value
				const statementsCode = compiledStatements
					.slice(0, -1)
					.map((s) => `${s};`)
					.join(' ')
				const lastStatement = compiledStatements[compiledStatements.length - 1]

				return `(() => { ${statementsCode} return ${lastStatement}; }).call(this)`
			}

			case 'IfStatement': {
				const condition = this.compileExpression(node.condition, params)
				const consequent = this.compileExpression(node.consequent, params)

				if (node.alternate) {
					const alternate = this.compileExpression(node.alternate, params)
					// Use ternary for simple if/else, or IIFE for complex blocks
					return `(${condition} ? ${consequent} : ${alternate})`
				}

				// If without else: use IIFE that returns null if condition is false
				return `(${condition} ? ${consequent} : null)`
			}

			default:
				throw new Error(`Cannot compile expression of kind: ${(node as { kind: string }).kind}`)
		}
	}
}
