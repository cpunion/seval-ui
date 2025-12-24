/**
 * Seval - TypeScript Implementation
 *
 * Complete TypeScript implementation of Seval language.
 * Parser + Interpreter, no code generation needed.
 */

import { type Environment, Interpreter, type Value } from './seval-interpreter'
import { Parser } from './seval-parser'
import { Tokenizer } from './seval-tokenizer'

/**
 * Compile and execute Seval code
 *
 * @param source Seval source code
 * @returns Runtime environment with all defined functions
 */
export function compileSeval(source: string): Environment {
	// Tokenize
	const tokenizer = new Tokenizer(source)
	const tokens = tokenizer.tokenize()

	// Parse
	const parser = new Parser(tokens)
	const program = parser.parseProgram()

	// Interpret
	const interpreter = new Interpreter()
	return interpreter.evaluateProgram(program)
}

/**
 * Execute a Seval function from already-compiled environment
 *
 * @param env Runtime environment from compileSeval
 * @param functionName Name of function to call
 * @param args Arguments array
 * @param context Optional context object (e.g., for actions)
 * @returns Return value
 */
export function executeSeval(
	env: Environment,
	functionName: string,
	args: Value[] = [],
	context?: Record<string, Value>,
): Value {
	// Create new interpreter with the compiled environment
	const interpreter = new Interpreter()

	// Load all functions from environment
	for (const [name, value] of Object.entries(env)) {
		// biome-ignore lint/suspicious/noExplicitAny: Accessing private globalEnv
		;(interpreter as any).globalEnv[name] = value
	}

	// Load context (data model) into globalEnv so helper functions can access it
	if (context) {
		for (const [name, value] of Object.entries(context)) {
			// biome-ignore lint/suspicious/noExplicitAny: Accessing private globalEnv
			;(interpreter as any).globalEnv[name] = value
		}
	}

	return interpreter.callFunction(functionName, args, context)
}

// Re-export components for testing
export { Tokenizer } from './seval-tokenizer'
export { Parser } from './seval-parser'
export { Interpreter } from './seval-interpreter'
export type { Token, TokenType } from './seval-tokenizer'
export type { ASTNode, Program } from './seval-ast'
export type { Value, Environment, SFunction } from './seval-interpreter'
