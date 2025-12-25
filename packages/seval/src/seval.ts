/**
 * Seval - TypeScript Implementation
 *
 * Complete TypeScript implementation of Seval language.
 * Compiles to native JavaScript objects for zero-overhead execution.
 */

import { SevalCompiler } from './seval-compiler'
import type { Value } from './seval-primitives'
import { Parser } from './seval-parser'
import { Tokenizer } from './seval-tokenizer'

/**
 * Compile Seval code to native JavaScript object
 *
 * @param source Seval source code
 * @returns Native JS object with properties and methods
 */
// biome-ignore lint/suspicious/noExplicitAny: Returns dynamic native JS object
export function compileSeval(source: string): any {
	// Tokenize
	const tokenizer = new Tokenizer(source)
	const tokens = tokenizer.tokenize()

	// Parse
	const parser = new Parser(tokens)
	const program = parser.parseProgram()

	// Compile to native JS object
	const compiler = new SevalCompiler()
	return compiler.compile(program)
}

/**
 * Execute a Seval function from compiled object
 *
 * @param env Native JS object from compileSeval
 * @param functionName Name of function to call
 * @param args Arguments array
 * @param state Optional state object (merged into env for this-based access)
 * @returns Return value
 */
// biome-ignore lint/suspicious/noExplicitAny: Works with dynamic JS objects
export function executeSeval(env: any, functionName: string, args: any[] = [], state?: any): any {
	const func = env[functionName]

	if (typeof func !== 'function') {
		throw new Error(`Function '${functionName}' not found or not a function`)
	}

	// Merge state into env for this-based access
	const context = state ? { ...env, ...state } : env

	// Call the function with merged context as 'this'
	return func.apply(context, args)
}

// Re-export components for testing
export { Tokenizer } from './seval-tokenizer'
export { Parser } from './seval-parser'
export { Interpreter } from './seval-interpreter'
export type { Token, TokenType } from './seval-tokenizer'
export type { ASTNode, Program } from './seval-ast'
export type { Value, Environment, SFunction } from './seval-interpreter'
