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
	// biome-ignore lint/suspicious/noExplicitAny: Compiler returns dynamic JS objects
	public compile(program: Program): any {
		// biome-ignore lint/suspicious/noExplicitAny: Dynamic object construction
		const obj: any = {}

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
	// biome-ignore lint/suspicious/noExplicitAny: Returns various JS types
	private compileValue(node: ASTNode): any {
		switch (node.kind) {
			case 'NumberLiteral':
				return node.value

			case 'StringLiteral':
				return node.value

			case 'BooleanLiteral':
				return node.value

			case 'ArrayLiteral':
				return node.elements.map((el) => this.compileValue(el))

			case 'ObjectLiteral': {
				// biome-ignore lint/suspicious/noExplicitAny: Dynamic object
				const obj: any = {}
				for (const prop of node.properties) {
					obj[prop.key] = this.compileValue(prop.value)
				}
				return obj
			}

			default:
				// biome-ignore lint/suspicious/noExplicitAny: Fallback error
				throw new Error(`Cannot compile value of kind: ${(node as any).kind}`)
		}
	}

	/**
	 * Compile a function to a native JavaScript function
	 */
	// biome-ignore lint/complexity/noBannedTypes: Need to return native Function
	private compileFunction(func: FunctionDef): Function {
		// Compile function body to JS expression string
		const bodyCode = this.compileExpression(func.body)

		// Create native JS function with proper this binding
		// Note: Using new Function() instead of eval for better security
		const funcCode = `return ${bodyCode}`

		try {
			// Create function with primitives in scope
			return new Function(...func.params, 'primitives', funcCode).bind(null, primitives)
		} catch (error) {
			throw new Error(`Failed to compile function ${func.name}: ${error}`)
		}
	}

	/**
	 * Compile an expression to JavaScript code string
	 */
	private compileExpression(node: ASTNode): string {
		switch (node.kind) {
			case 'NumberLiteral':
				return String(node.value)

			case 'StringLiteral':
				return JSON.stringify(node.value)

			case 'BooleanLiteral':
				return String(node.value)

			case 'Identifier':
				// Check if it's a primitive function
				if (node.name in primitives) {
					return `primitives.${node.name}`
				}
				return node.name

			case 'MemberExpression': {
				const object = this.compileExpression(node.object)
				if (node.computed) {
					// Bracket notation: obj[key]
					const property = this.compileExpression(node.property as ASTNode)
					return `${object}[${property}]`
				}
				// Dot notation: obj.prop
				return `${object}.${node.property}`
			}

			case 'BinaryExpression': {
				const left = this.compileExpression(node.left)
				const right = this.compileExpression(node.right)
				return `(${left} ${node.operator} ${right})`
			}

			case 'UnaryExpression': {
				const operand = this.compileExpression(node.operand)
				return `(${node.operator}${operand})`
			}

			case 'TernaryExpression': {
				const condition = this.compileExpression(node.condition)
				const consequent = this.compileExpression(node.consequent)
				const alternate = this.compileExpression(node.alternate)
				return `(${condition} ? ${consequent} : ${alternate})`
			}

			case 'AssignmentStatement': {
				const target = this.compileExpression(node.target)
				const value = this.compileExpression(node.value)
				return `(${target} = ${value})`
			}

			case 'CallExpression': {
				const callee = this.compileExpression(node.callee)
				const args = node.args.map((arg) => this.compileExpression(arg)).join(', ')
				return `${callee}(${args})`
			}

			case 'ArrayLiteral': {
				const elements = node.elements.map((el) => this.compileExpression(el)).join(', ')
				return `[${elements}]`
			}

			case 'ObjectLiteral': {
				const props = node.properties
					.map((prop) => `${JSON.stringify(prop.key)}: ${this.compileExpression(prop.value)}`)
					.join(', ')
				return `{${props}}`
			}

			case 'ArrowFunction': {
				const params = node.params.join(', ')
				const body = this.compileExpression(node.body)
				return `((${params}) => ${body})`
			}

			default:
				// biome-ignore lint/suspicious/noExplicitAny: Fallback error
				throw new Error(`Cannot compile expression of kind: ${(node as any).kind}`)
		}
	}
}
