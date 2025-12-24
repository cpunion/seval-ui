/**
 * seval - S-Expression Evaluator
 *
 * A safe, sandboxed S-expression parser and evaluator for TypeScript/JavaScript.
 *
 * @example
 * ```ts
 * import { evalString, createEvaluator } from 'seval'
 *
 * // Simple usage
 * const result = evalString('(+ 1 2 3)')  // 6
 *
 * // Custom primitives
 * const evaluator = createEvaluator({
 *   primitives: {
 *     uuid: () => crypto.randomUUID(),
 *   }
 * })
 * evaluator.evalString('(uuid)')  // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */

// Parser exports
export { parse, stringify, isSymbol, sym, symName, type SExpr } from './parser'

// Tokenizer exports
export { tokenize, TokenType, type Token } from './tokenizer'

// Evaluator exports
export { createEvaluator, evaluate, evalString, defaultEvaluator } from './evaluator'

// Type exports
export {
    isLambda,
    type Value,
    type Environment,
    type PrimitiveFunction,
    type EvaluatorOptions,
    type LambdaFunction,
    type EvaluateFn,
    type ValueArray,
    type ValueObject,
} from './types'

// Primitives exports
export {
    defaultPrimitives,
    arithmeticPrimitives,
    comparisonPrimitives,
    logicalPrimitives,
    stringPrimitives,
    arrayPrimitives,
    objectPrimitives,
    mathPrimitives,
    typePrimitives,
} from './primitives'

export { deserializeSExpr, serializeSExpr, type SerializedSExpr } from './sexpr'
