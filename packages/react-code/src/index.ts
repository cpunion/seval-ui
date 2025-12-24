/**
 * a2ui-react-code - Code component and SExpRuntime for a2ui-react
 *
 * This package provides S-expression runtime support for a2ui-react,
 * keeping the main a2ui-react package decoupled from seval/minijs.
 */

// SExp Runtime
export { SExpRuntime, createSExpActionHandler } from './SExpRuntime'
export type { IMinimalStore, IMinimalSurface } from './SExpRuntime'

// Re-export seval utilities for convenience
export {
    evalString,
    evaluate,
    parse,
    stringify,
    createEvaluator,
    isLambda,
    defaultPrimitives,
    deserializeSExpr,
    serializeSExpr,
} from '@seval-ui/sexp'

// Re-export seval types
export type {
    Value,
    Environment,
    LambdaFunction,
    PrimitiveFunction,
    SExpr,
    SerializedSExpr,
} from '@seval-ui/sexp'
