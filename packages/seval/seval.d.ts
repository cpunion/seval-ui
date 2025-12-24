// Type definitions for @seval-ui/seval/seval

export type PrimitiveValue = number | string | boolean | null
export type Value = PrimitiveValue | ValueArray | ValueObject | SFunction

export interface ValueArray extends Array<Value> {}
export interface ValueObject extends Record<string, Value> {}

export interface SFunction {
	kind: 'function'
	params: string[]
	// biome-ignore lint/suspicious/noExplicitAny: AST body type
	body: any
	closure: Environment
}

export type Environment = Record<string, Value>

export interface Token {
	type: string
	value: string
	line: number
	column: number
}

export interface ASTNode {
	kind: string
	// biome-ignore lint/suspicious/noExplicitAny: AST node properties
	[key: string]: any
}

export interface Program {
	kind: 'Program'
	// biome-ignore lint/suspicious/noExplicitAny: Function definition type
	functions: any[]
}

export class Tokenizer {
	constructor(source: string)
	tokenize(): Token[]
}

export class Parser {
	constructor(tokens: Token[])
	parseProgram(): Program
}

export class Interpreter {
	constructor()
	evaluate(node: ASTNode, env: Environment): Value
	evaluateProgram(program: Program): Environment
	callFunction(name: string, args: Value[], context?: Record<string, Value>): Value
}

export function compileSeval(source: string): Environment
export function executeSeval(
	env: Environment,
	functionName: string,
	args?: Value[],
	context?: Record<string, Value>,
): Value
