/**
 * Seval - TypeScript Implementation
 *
 * Complete TypeScript implementation of Seval language.
 * Compiles to native JavaScript objects for zero-overhead execution.
 */

import { SevalCompiler } from './seval-compiler'
import { Parser } from './seval-parser'
import type { Value } from './seval-primitives'
import { Tokenizer } from './seval-tokenizer'

/**
 * Compile Seval code to native JavaScript object
 *
 * @param source Seval source code
 * @returns Native JS object with properties and methods
 */
export function compileSeval(source: string): Record<string, unknown> {
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
 * Execute a function from compiled environment
 * @param env Compiled environment
 * @param functionName Function name to execute
 * @param args Arguments to pass
 * @param state Optional state object for this-based access
 * @returns Return value (or updated state if state was provided)
 */
export function executeSeval(
	env: Record<string, unknown>,
	functionName: string,
	args: unknown[] = [],
	state?: Record<string, unknown>,
): unknown {
	const func = env[functionName]

	if (typeof func !== 'function') {
		throw new Error(`Function '${functionName}' not found or not a function`)
	}

	// If state is provided, use it as context and return updated state
	if (state) {
		const context = { ...env, ...state }
		const result = func.apply(context, args)

		// Extract updated state properties (exclude env properties)
		const updatedState: Record<string, unknown> = {}
		for (const key in context) {
			if (!(key in env) || state[key] !== context[key]) {
				updatedState[key] = context[key]
			}
		}

		// Return updated state for testing, or result if no state changes
		return Object.keys(updatedState).length > 0 ? updatedState : result
	}

	// No state: just call the function
	return func.apply(env, args)
}

// Re-export components for testing
export { Tokenizer } from './seval-tokenizer'
export { Parser } from './seval-parser'
export { Interpreter } from './seval-interpreter'
export type { Token, TokenType } from './seval-tokenizer'
export type { ASTNode, Program } from './seval-ast'
export type { Value, Environment, SFunction } from './seval-interpreter'
