/**
 * Seval Interpreter
 *
 * Direct AST interpreter for Seval language.
 * Executes AST nodes iteratively to avoid stack overflow.
 */

import type { ASTNode, Program } from './seval-ast'

// Runtime value types
export type PrimitiveValue = number | string | boolean | null
export type Value = PrimitiveValue | ValueArray | ValueObject | SFunction

export interface ValueArray extends Array<Value> {}
export interface ValueObject extends Record<string, Value> {}

export interface SFunction {
	kind: 'function'
	params: string[]
	body: ASTNode
	closure: Environment
}

export type Environment = Record<string, Value>

export class Interpreter {
	private primitives: Record<string, (...args: Value[]) => Value>
	private globalEnv: Environment = {}

	constructor() {
		this.primitives = this.createPrimitives()
	}

	private createPrimitives(): Record<string, (...args: Value[]) => Value> {
		return {
			// Arithmetic (+ also handles string concatenation)
			'+': (a, b) => {
				if (typeof a === 'string' || typeof b === 'string') {
					return String(a) + String(b)
				}
				return (a as number) + (b as number)
			},
			'-': (a, b) => (a as number) - (b as number),
			'*': (...args) => args.reduce((a, b) => (a as number) * (b as number), 1) as number,
			'/': (a, b) => (a as number) / (b as number),
			'%': (a, b) => (a as number) % (b as number),

			// Comparison
			'=': (a, b) => a === b,
			'!=': (a, b) => a !== b,
			'<': (a, b) => (a as number) < (b as number),
			'<=': (a, b) => (a as number) <= (b as number),
			'>': (a, b) => (a as number) > (b as number),
			'>=': (a, b) => (a as number) >= (b as number),

			// Logic
			and: (...args) => args.every((v) => v),
			or: (...args) => args.some((v) => v),
			not: (a) => !a,

			// String
			str: (a) => String(a),
			parseNum: (s) => Number.parseFloat(String(s)),
			strContains: (s, sub) => String(s).includes(String(sub)),
			strStartsWith: (s, prefix) => String(s).startsWith(String(prefix)),
			substr: (s, start, len?) => {
				const str = String(s)
				const startIdx = start as number
				return len !== undefined
					? str.substring(startIdx, startIdx + (len as number))
					: str.substring(startIdx)
			},

			// Array
			list: (...args) => args,
			nth: (arr, idx) => (arr as Value[])[idx as number],
			length: (arr) => (arr as Value[]).length,
			updateAt: (arr, idx, val) => {
				const newArr = [...(arr as Value[])]
				newArr[idx as number] = val
				return newArr
			},
			append: (arr, val) => [...(arr as Value[]), val],
			prepend: (val, arr) => [val, ...(arr as Value[])],
			first: (arr) => (arr as Value[])[0],
			rest: (arr) => (arr as Value[]).slice(1),
			filter: (fn, arr) => {
				const sFunc = fn as SFunction
				const arrVal = arr as Value[]
				return arrVal.filter((item) => {
					const funcEnv: Environment = { ...sFunc.closure }
					if (sFunc.params[0]) funcEnv[sFunc.params[0]] = item
					return this.evaluate(sFunc.body, funcEnv) as boolean
				})
			},
			map: (fn, arr) => {
				const sFunc = fn as SFunction
				const arrVal = arr as Value[]
				return arrVal.map((item) => {
					const funcEnv: Environment = { ...sFunc.closure }
					if (sFunc.params[0]) funcEnv[sFunc.params[0]] = item
					return this.evaluate(sFunc.body, funcEnv)
				})
			},
			reduce: (fn, init, arr) => {
				const sFunc = fn as SFunction
				const arrVal = arr as Value[]
				return arrVal.reduce((acc, item) => {
					const funcEnv: Environment = { ...sFunc.closure }
					if (sFunc.params[0]) funcEnv[sFunc.params[0]] = acc
					if (sFunc.params[1]) funcEnv[sFunc.params[1]] = item
					return this.evaluate(sFunc.body, funcEnv)
				}, init)
			},

			// Object
			obj: (...args) => {
				const obj: Record<string, Value> = {}
				for (let i = 0; i < args.length; i += 2) {
					obj[args[i] as string] = args[i + 1]
				}
				return obj
			},
			get: (obj, key) => (obj as Record<string, Value>)[key as string],
			merge: (obj1, obj2) => ({
				...(obj1 as Record<string, Value>),
				...(obj2 as Record<string, Value>),
			}),

			// Math
			max: (...args) => Math.max(...(args as number[])),
			min: (...args) => Math.min(...(args as number[])),
			round: (a) => Math.round(a as number),
			floor: (a) => Math.floor(a as number),
			ceil: (a) => Math.ceil(a as number),

			// Time
			now: () => Date.now(),
		}
	}

	public evaluate(node: ASTNode, env: Environment): Value {
		switch (node.kind) {
			case 'NumberLiteral':
				return node.value

			case 'StringLiteral':
				return node.value

			case 'BooleanLiteral':
				return node.value

			case 'Identifier': {
				// Special handling for 'this'
				if (node.name === 'this') {
					// Return the environment as an object so properties can be accessed
					return env
				}

				if (node.name in env) {
					return env[node.name]
				}
				if (node.name in this.globalEnv) {
					return this.globalEnv[node.name]
				}
				throw new Error(`Undefined variable: ${node.name}`)
			}

			case 'ArrayLiteral':
				return node.elements.map((el) => this.evaluate(el, env))

			case 'ObjectLiteral': {
				const obj: Record<string, Value> = {}
				for (const prop of node.properties) {
					obj[prop.key] = this.evaluate(prop.value, env)
				}
				return obj
			}

			case 'MemberExpression': {
				const object = this.evaluate(node.object, env)

				// Handle null/undefined
				if (object === null || object === undefined) {
					throw new Error('Cannot access property of null or undefined')
				}

				// Get property name
				let propertyName: string
				if (node.computed) {
					// Bracket notation: arr[0] or obj[key]
					const prop = this.evaluate(node.property as ASTNode, env)
					propertyName = String(prop)
				} else {
					// Dot notation: obj.property
					propertyName = node.property as string
				}

				// Access property
				if (typeof object === 'object' && object !== null) {
					return (object as ValueObject)[propertyName] ?? null
				}

				// For primitive values, return null for now
				// (will add universal properties later)
				return null
			}

			case 'AssignmentStatement': {
				// Evaluate the value first
				const value = this.evaluate(node.value, env)

				// Handle different assignment targets
				if (node.target.kind === 'Identifier') {
					// Simple variable assignment: x = value
					const varName = node.target.name

					// Check if variable exists in local env or global env
					if (varName in env) {
						env[varName] = value
					} else if (varName in this.globalEnv) {
						this.globalEnv[varName] = value
					} else {
						// Create new variable in current environment
						env[varName] = value
					}
				} else if (node.target.kind === 'MemberExpression') {
					// Property assignment: obj.prop = value or obj[key] = value
					const object = this.evaluate(node.target.object, env)

					if (object === null || object === undefined) {
						throw new Error('Cannot set property of null or undefined')
					}

					if (typeof object !== 'object') {
						throw new Error('Cannot set property on non-object')
					}

					// Get property name
					let propName: string
					if (node.target.computed) {
						const prop = this.evaluate(node.target.property as ASTNode, env)
						propName = String(prop)
					} else {
						propName = node.target.property as string
					}
					// Set property
					;(object as ValueObject)[propName] = value
				}

				// Assignment returns the assigned value
				return value
			}

			case 'CallExpression': {
				// Handle arrow function or identifier callee
				let sFunc: SFunction | undefined
				let callee: string | undefined

				if (node.callee.kind === 'Identifier') {
					callee = node.callee.name

					// Check for primitive
					if (callee in this.primitives) {
						const args = node.args.map((arg) => this.evaluate(arg, env))
						return this.primitives[callee]?.(...args)
					}

					// Check for user function
					const fn = env[callee] ?? this.globalEnv[callee]
					if (!fn || typeof fn !== 'object' || !('kind' in fn) || fn.kind !== 'function') {
						throw new Error(`Undefined function: ${callee}`)
					}
					sFunc = fn as SFunction
				} else if (node.callee.kind === 'ArrowFunction') {
					// Direct arrow function call: ((x) => x * 2)(5)
					sFunc = {
						kind: 'function',
						params: node.callee.params,
						body: node.callee.body,
						closure: { ...env },
					}
				} else {
					// Evaluate the callee expression
					const evaluated = this.evaluate(node.callee, env)
					if (
						typeof evaluated === 'object' &&
						evaluated !== null &&
						'kind' in evaluated &&
						evaluated.kind === 'function'
					) {
						sFunc = evaluated as SFunction
					} else {
						throw new Error('Cannot call non-function')
					}
				}

				const args = node.args.map((arg) => this.evaluate(arg, env))

				// Create new environment for function call
				const funcEnv: Environment = { ...sFunc.closure }
				for (let i = 0; i < sFunc.params.length; i++) {
					const param = sFunc.params[i]
					if (param) funcEnv[param] = args[i] ?? null
				}

				return this.evaluate(sFunc.body, funcEnv)
			}

			case 'ArrowFunction': {
				// Return an SFunction closure
				return {
					kind: 'function',
					params: node.params,
					body: node.body,
					closure: { ...env },
				} as SFunction
			}

			case 'BinaryExpression': {
				const opMap: Record<string, string> = {
					'+': '+',
					'-': '-',
					'*': '*',
					'/': '/',
					'%': '%',
					'==': '=',
					'!=': '!=',
					'<': '<',
					'<=': '<=',
					'>': '>',
					'>=': '>=',
					'&&': 'and',
					'||': 'or',
				}
				const op = opMap[node.operator]
				if (!op) throw new Error(`Unknown operator: ${node.operator}`)

				const left = this.evaluate(node.left, env)
				const right = this.evaluate(node.right, env)

				return this.primitives[op]?.(left, right)
			}

			case 'UnaryExpression': {
				const opMap: Record<string, string> = {
					'-': '-',
					'!': 'not',
				}
				const op = opMap[node.operator]
				if (!op) throw new Error(`Unknown unary operator: ${node.operator}`)

				const operand = this.evaluate(node.operand, env)

				if (op === '-') {
					return -(operand as number)
				}
				return this.primitives[op]?.(operand)
			}

			case 'TernaryExpression': {
				const condition = this.evaluate(node.condition, env)
				if (condition) {
					return this.evaluate(node.consequent, env)
				}
				return this.evaluate(node.alternate, env)
			}

			case 'FunctionDef': {
				const func: SFunction = {
					kind: 'function',
					params: node.params,
					body: node.body,
					closure: { ...env },
				}
				this.globalEnv[node.name] = func
				return func
			}

			default:
				throw new Error(`Unknown AST node: ${(node as ASTNode).kind}`)
		}
	}

	public evaluateProgram(program: Program): Environment {
		for (const item of program.members) {
			if (item.kind === 'PropertyDef') {
				// Evaluate property value and store directly
				const value = this.evaluate(item.value, this.globalEnv)
				this.globalEnv[item.name] = value
			} else {
				// FunctionDef: store as function
				this.evaluate(item, {})
			}
		}
		return this.globalEnv
	}

	public callFunction(name: string, args: Value[], context?: Record<string, Value>): Value {
		const env: Environment = context ? { ...context } : {}

		const fn = this.globalEnv[name]
		if (!fn || typeof fn !== 'object' || !('kind' in fn) || fn.kind !== 'function') {
			throw new Error(`Undefined function: ${name}`)
		}

		const sFunc = fn as SFunction
		const funcEnv: Environment = { ...sFunc.closure, ...env }
		for (let i = 0; i < sFunc.params.length; i++) {
			const param = sFunc.params[i]
			if (param) funcEnv[param] = args[i] ?? null
		}

		return this.evaluate(sFunc.body, funcEnv)
	}
}
