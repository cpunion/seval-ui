/**
 * S-Expression Evaluator
 *
 * Safe, sandboxed evaluation of S-expressions with customizable primitives.
 *
 * Design:
 * - Symbols (typeof === 'symbol') are variable references, looked up in env
 * - Strings (typeof === 'string') are string literals, returned as-is
 */

import { type SExpr, isSymbol, parse, symName } from './parser'
import { defaultPrimitives } from './primitives'
import type {
    Environment,
    EvaluateFn,
    EvaluatorOptions,
    LambdaFunction,
    PrimitiveFunction,
    Value,
} from './types'
import { isLambda } from './types'

const ENV_MARK = Symbol('seval.env')

type RuntimeEnv = Environment & { [ENV_MARK]?: true }

function isRuntimeEnv(env: Environment | RuntimeEnv): env is RuntimeEnv {
    return Boolean((env as RuntimeEnv)[ENV_MARK])
}

function markEnv(env: Environment): RuntimeEnv {
    if (!isRuntimeEnv(env)) {
        Object.defineProperty(env, ENV_MARK, { value: true, enumerable: false })
        if (Object.getPrototypeOf(env) === Object.prototype) {
            Object.setPrototypeOf(env, null)
        }
    }
    return env as RuntimeEnv
}

function createEnv(parent?: RuntimeEnv | null): RuntimeEnv {
    const env = Object.create(parent ?? null) as RuntimeEnv
    Object.defineProperty(env, ENV_MARK, { value: true, enumerable: false })
    return env
}

function ensureEnv(env?: Environment): RuntimeEnv {
    if (!env) {
        return createEnv(null)
    }
    return markEnv(env)
}

function getParentEnv(env: RuntimeEnv): RuntimeEnv | null {
    return (Object.getPrototypeOf(env) as RuntimeEnv | null) ?? null
}

function findBinding(env: RuntimeEnv | null, name: string): RuntimeEnv | null {
    if (!env) return null
    if (Object.prototype.hasOwnProperty.call(env, name)) {
        return env
    }
    return findBinding(getParentEnv(env), name)
}

function assignBinding(env: RuntimeEnv, name: string, value: Value): Value {
    const target = findBinding(env, name)
    if (target) {
        target[name] = value
    } else {
        env[name] = value
    }
    return value
}

function getBinding(env: RuntimeEnv, name: string): Value | undefined {
    if (name in env) {
        return env[name] as Value
    }
    return undefined
}

/**
 * Create a new evaluator instance with optional custom primitives
 */
export function createEvaluator(options: EvaluatorOptions = {}) {
    const primitives: Record<string, PrimitiveFunction> = {
        ...defaultPrimitives,
        ...options.primitives,
    }
    const maxDepth = options.maxDepth ?? 100
    let maxDepthReached = 0

    function evalLambda(fn: LambdaFunction, argValues: Value[], depth: number): Value {
        const closureEnv = ensureEnv(fn.closure)
        const callEnv = createEnv(closureEnv)
        fn.params.forEach((param, index) => {
            callEnv[param] = argValues[index] as Value
        })
        return evalExpr(fn.body, callEnv, depth + 1)
    }

    function evalExpr(expr: SExpr, env: RuntimeEnv, depth = 0): Value {
        if (depth > maxDepthReached) {
            maxDepthReached = depth
            if (depth % 100 === 0) {
                console.log(`[evalExpr] depth reached: ${depth}`)
            }
        }
        if (depth > maxDepth) {
            console.error(`[evalExpr] Maximum depth ${maxDepth} exceeded, actual depth: ${depth}`)
            throw new Error('Maximum evaluation depth exceeded')
        }

        if (expr === null) return null
        if (typeof expr === 'number') return expr
        if (typeof expr === 'boolean') return expr
        if (typeof expr === 'string') return expr

        if (isSymbol(expr)) {
            const name = symName(expr)
            const value = getBinding(env, name)
            return value ?? name
        }

        if (!Array.isArray(expr)) {
            throw new Error(`Cannot evaluate: ${JSON.stringify(expr)}`)
        }

        if (expr.length === 0) return []

        const [op, ...args] = expr
        const opName = isSymbol(op) ? symName(op) : null

        if (opName === 'if') {
            const [cond, thenExpr, elseExpr] = args
            const condResult = evalExpr(cond as SExpr, env, depth + 1)
            return condResult
                ? evalExpr(thenExpr as SExpr, env, depth + 1)
                : evalExpr(elseExpr as SExpr, env, depth + 1)
        }

        if (opName === 'let') {
            const [bindings, body] = args
            const letEnv = createEnv(env)
            for (const binding of bindings as SExpr[]) {
                const [nameExpr, valueExpr] = binding as [SExpr, SExpr]
                const name = isSymbol(nameExpr) ? symName(nameExpr) : String(nameExpr)
                letEnv[name] = evalExpr(valueExpr, letEnv, depth + 1)
            }
            return evalExpr(body as SExpr, letEnv, depth + 1)
        }

        if (opName === 'cond') {
            for (const clause of args) {
                const [test, result] = clause as [SExpr, SExpr]
                const isElse = isSymbol(test) && symName(test) === 'else'
                if (isElse || evalExpr(test, env, depth + 1)) {
                    return evalExpr(result, env, depth + 1)
                }
            }
            return null
        }

        if (opName === 'begin' || opName === 'progn' || opName === 'do') {
            let result: Value = null
            for (const subExpr of args) {
                result = evalExpr(subExpr as SExpr, env, depth + 1)
            }
            return result
        }

        if (opName === 'quote') {
            const val = args[0]
            if (isSymbol(val)) {
                return symName(val)
            }
            return val as Value
        }

        if (opName === 'lambda' || opName === 'fn') {
            const [params, body] = args
            return {
                __lambda: true,
                params: (params as SExpr[]).map((p) => (isSymbol(p) ? symName(p) : String(p))),
                body: body as SExpr,
                closure: env,
            } as LambdaFunction
        }

        if (opName === 'define' || opName === 'defun') {
            const first = args[0]
            if (Array.isArray(first)) {
                const [nameExpr, ...paramExprs] = first as SExpr[]
                const name = isSymbol(nameExpr) ? symName(nameExpr) : String(nameExpr)
                const params = paramExprs.map((p) => (isSymbol(p) ? symName(p) : String(p)))
                const body = args[1]
                const fn: LambdaFunction = {
                    __lambda: true,
                    params,
                    body: body as SExpr,
                    closure: env,
                }
                assignBinding(env, name, fn)
                return fn
            }
            const name = isSymbol(first) ? symName(first) : String(first)
            const value = evalExpr(args[1] as SExpr, env, depth + 1)
            return assignBinding(env, name, value)
        }

        if (opName === 'apply') {
            const fnValue = evalExpr(args[0] as SExpr, env, depth + 1)
            const fnArgs = evalExpr(args[1] as SExpr, env, depth + 1) as Value[]
            if (isLambda(fnValue)) {
                return evalLambda(fnValue, fnArgs, depth)
            }
            throw new Error(`Cannot apply non-function: ${fnValue}`)
        }

        if (opName === 'filter') {
            const [predExpr, listExpr] = args
            const list = evalExpr(listExpr as SExpr, env, depth + 1) as Value[]
            const pred = evalExpr(predExpr as SExpr, env, depth + 1)
            if (isLambda(pred)) {
                return list.filter((item) => {
                    const callEnv = createEnv(ensureEnv(pred.closure))
                    callEnv[pred.params[0] as string] = item
                    return evalExpr(pred.body, callEnv, depth + 1)
                })
            }
            return list.filter((item) => {
                const itemEnv = createEnv(env)
                itemEnv['@'] = item
                itemEnv.it = item
                return evalExpr(predExpr as SExpr, itemEnv, depth + 1)
            })
        }

        if (opName === 'map') {
            const [mapExpr, listExpr] = args
            const list = evalExpr(listExpr as SExpr, env, depth + 1) as Value[]
            const mapper = evalExpr(mapExpr as SExpr, env, depth + 1)
            if (isLambda(mapper)) {
                return list.map((item) => {
                    const callEnv = createEnv(ensureEnv(mapper.closure))
                    callEnv[mapper.params[0] as string] = item
                    return evalExpr(mapper.body, callEnv, depth + 1)
                })
            }
            return list.map((item) => {
                const itemEnv = createEnv(env)
                itemEnv['@'] = item
                itemEnv.it = item
                return evalExpr(mapExpr as SExpr, itemEnv, depth + 1)
            })
        }

        if (opName === 'find') {
            const [listExpr, predExpr] = args
            const list = evalExpr(listExpr as SExpr, env, depth + 1) as Value[]
            return (
                list.find((item) => {
                    const itemEnv = createEnv(env)
                    itemEnv['@'] = item
                    itemEnv.it = item
                    return evalExpr(predExpr as SExpr, itemEnv, depth + 1)
                }) ?? null
            )
        }

        if (opName === 'find-index') {
            const [listExpr, predExpr] = args
            const list = evalExpr(listExpr as SExpr, env, depth + 1) as Value[]
            return list.findIndex((item) => {
                const itemEnv = createEnv(env)
                itemEnv['@'] = item
                itemEnv.it = item
                return evalExpr(predExpr as SExpr, itemEnv, depth + 1)
            })
        }

        if (opName === 'sort-by') {
            const [listExpr, keyExpr] = args
            const list = evalExpr(listExpr as SExpr, env, depth + 1) as Value[]
            return [...list].sort((a, b) => {
                const aEnv = createEnv(env)
                aEnv['@'] = a
                aEnv.it = a
                const bEnv = createEnv(env)
                bEnv['@'] = b
                bEnv.it = b
                const aKey = evalExpr(keyExpr as SExpr, aEnv, depth + 1)
                const bKey = evalExpr(keyExpr as SExpr, bEnv, depth + 1)
                return (aKey as number) - (bKey as number)
            })
        }

        if (opName === 'count') {
            const [listExpr, predExpr] = args
            const list = evalExpr(listExpr as SExpr, env, depth + 1) as Value[]
            if (!predExpr) return list.length
            return list.filter((item) => {
                const itemEnv = createEnv(env)
                itemEnv['@'] = item
                itemEnv.it = item
                return evalExpr(predExpr as SExpr, itemEnv, depth + 1)
            }).length
        }

        if (opName === 'reduce' || opName === 'fold') {
            const [listExpr, initExpr, ...rest] = args
            const list = evalExpr(listExpr as SExpr, env, depth + 1) as Value[]
            let acc = evalExpr(initExpr as SExpr, env, depth + 1)

            if (rest.length === 2) {
                const [params, body] = rest
                const [accExpr, itemExpr] = params as [SExpr, SExpr]
                const accName = isSymbol(accExpr) ? symName(accExpr) : String(accExpr)
                const itemName = isSymbol(itemExpr) ? symName(itemExpr) : String(itemExpr)
                for (const item of list) {
                    const reduceEnv = createEnv(env)
                    reduceEnv[accName] = acc
                    reduceEnv[itemName] = item
                    acc = evalExpr(body as SExpr, reduceEnv, depth + 1)
                }
            } else {
                const fnValue = evalExpr(rest[0] as SExpr, env, depth + 1)
                if (isLambda(fnValue)) {
                    for (const item of list) {
                        const callEnv = createEnv(ensureEnv(fnValue.closure))
                        callEnv[fnValue.params[0] as string] = acc
                        callEnv[fnValue.params[1] as string] = item
                        acc = evalExpr(fnValue.body, callEnv, depth + 1)
                    }
                } else {
                    throw new Error('reduce requires a function')
                }
            }
            return acc
        }

        const opValue = opName ? getBinding(env, opName) : undefined
        if (opValue && isLambda(opValue)) {
            const evaluatedArgs = args.map((arg) => evalExpr(arg as SExpr, env, depth + 1))
            return evalLambda(opValue, evaluatedArgs, depth)
        }

        if (opName) {
            const primitive = primitives[opName]
            if (primitive) {
                const evaluatedArgs = args.map((arg) => evalExpr(arg as SExpr, env, depth + 1))
                const evalFn: EvaluateFn = (expression, nextEnv = env) =>
                    evalExpr(expression, ensureEnv(nextEnv), depth + 1)
                return primitive(evaluatedArgs, env, evalFn)
            }
        }

        const evaluatedOp = evalExpr(op as SExpr, env, depth + 1)
        if (isLambda(evaluatedOp)) {
            const evaluatedArgs = args.map((arg) => evalExpr(arg as SExpr, env, depth + 1))
            return evalLambda(evaluatedOp, evaluatedArgs, depth)
        }

        throw new Error(`Unknown function: ${opName ?? String(op)}`)
    }

    const evaluateRoot = (expr: SExpr, env: Environment = {}) => {
        const runtimeEnv = ensureEnv(env)
        return evalExpr(expr, runtimeEnv, 0)
    }

    const evalStringRoot = (code: string, env: Environment = {}) => evaluateRoot(parse(code), env)

    return {
        evaluate: evaluateRoot,
        evalString: evalStringRoot,
    }
}

// Default evaluator instance
export const defaultEvaluator = createEvaluator()

/**
 * Evaluate an S-expression AST
 */
export const evaluate = defaultEvaluator.evaluate

/**
 * Parse and evaluate an S-expression string
 */
export const evalString = defaultEvaluator.evalString
