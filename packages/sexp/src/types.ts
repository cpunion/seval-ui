/**
 * S-Expression Types
 *
 * Core type definitions for the S-Expression evaluator.
 */

import type { SExpr } from './parser'

/**
 * Lambda function representation with closure support
 */
export interface LambdaFunction {
    __lambda: true
    params: string[]
    body: SExpr
    closure: Environment
}

/**
 * Runtime value types
 */
export type Value = string | number | boolean | null | ValueArray | ValueObject | LambdaFunction

export interface ValueArray extends Array<Value> {}
export interface ValueObject extends Record<string, Value> {}

/**
 * Variable environment (lexical scope)
 */
export type Environment = Record<string, Value>

/**
 * Evaluate function signature for recursive evaluation
 */
export type EvaluateFn = (expr: SExpr, env: Environment) => Value

/**
 * Primitive function signature
 * @param args - Evaluated arguments
 * @param env - Current environment
 * @param evaluate - Evaluate function for lazy evaluation needs
 */
export type PrimitiveFunction = (args: Value[], env: Environment, evaluate: EvaluateFn) => Value

/**
 * Evaluator configuration options
 */
export interface EvaluatorOptions {
    /** Custom primitive functions to add or override */
    primitives?: Record<string, PrimitiveFunction>
    /** Maximum recursion depth (default: 100) */
    maxDepth?: number
}

/**
 * Type guard for lambda functions
 */
export function isLambda(v: Value): v is LambdaFunction {
    return v !== null && typeof v === 'object' && '__lambda' in v && v.__lambda === true
}
