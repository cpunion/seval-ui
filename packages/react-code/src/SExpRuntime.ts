/**
 * S-Expression Runtime for A2UI
 *
 * Connects S-expression logic to A2UI store for local state updates.
 * All logic is defined in the Code component as S-expressions.
 */

import {
    createEvaluator,
    parse,
    isLambda,
    deserializeSExpr,
    type Value,
    type Environment,
    type LambdaFunction,
    type SExpr,
    type SerializedSExpr,
} from '@seval-ui/sexp'
import MINIJS_SEVAL_SOURCE from '@seval-ui/seval'

/**
 * Minimal store interface that SExpRuntime needs
 */
export interface IMinimalStore {
    getSurface(id: string): IMinimalSurface | undefined
}

/**
 * Minimal surface interface that SExpRuntime needs
 */
export interface IMinimalSurface {
    dataModel: Record<string, unknown>
    version: number
    getComponent(id: string): { id: string; component: Record<string, unknown> } | undefined
    setDataModel(model: Record<string, unknown>): void
    incrementVersion(): void
}

export class SExpRuntime {
    private store: IMinimalStore
    private surfaceId: string
    private evaluator: ReturnType<typeof createEvaluator>
    private baseEnv: Environment

    constructor(store: IMinimalStore, surfaceId: string) {
        this.store = store
        this.surfaceId = surfaceId

        // Custom primitives for calculator and vocabulary apps
        const customPrimitives = {
            parseNum: (args: Value[]) => Number.parseFloat(String(args[0])) || 0,
            strContains: (args: Value[]) => String(args[0]).includes(String(args[1])),
            strStartsWith: (args: Value[]) => String(args[0]).startsWith(String(args[1])),
            substr: (args: Value[]) =>
                String(args[0]).substring(args[1] as number, args[2] as number | undefined),
            // updateAt: update array at index, return new array
            updateAt: (args: Value[]) => {
                const arr = args[0] as Value[]
                const index = args[1] as number
                const value = args[2] as Value
                const result = [...arr]
                result[index] = value
                return result
            },
        }

        // Create evaluator with increased depth limit for minijs compiler
        this.evaluator = createEvaluator({ maxDepth: 10000, primitives: customPrimitives })

        // Initialize base environment - will load Code from surface
        this.baseEnv = {}
    }

    /**
     * Load code definitions from Code component in the surface
     * @param componentId - The component ID to look for (default: 'code')
     */
    loadCodeComponent(componentId = 'code'): void {
        console.log(
            `[SExpRuntime] loadCodeComponent called for surfaceId=${this.surfaceId}, componentId=${componentId}`
        )

        const surface = this.store.getSurface(this.surfaceId)
        if (!surface) {
            console.warn(`[SExpRuntime] Surface not found: ${this.surfaceId}`)
            return
        }

        // Look for Code component
        const codeComp = surface.getComponent(componentId)
        if (!codeComp) {
            console.warn(`[SExpRuntime] Code component not found: ${componentId}`)
            console.log(
                `[SExpRuntime] Available components:`,
                // biome-ignore lint/suspicious/noExplicitAny: accessing internal map
                Array.from((surface as any).components?.keys?.() || [])
            )
            return
        }

        console.log(`[SExpRuntime] Found code component:`, codeComp)

        const codeComponent = codeComp.component as { Code?: { code?: string; lang?: string } }
        const code = codeComponent.Code?.code
        const lang = codeComponent.Code?.lang ?? 'seval'

        if (!code) {
            console.warn(`[SExpRuntime] No code in Code component`)
            return
        }

        console.log(
            `[SExpRuntime] Loading ${lang} code (${code.length} chars):`,
            code.substring(0, 200) + '...'
        )
        this.loadCode(code, lang as 'seval' | 'minijs')
    }

    /**
     * Load function definitions from Builtins component (legacy support)
     * @deprecated Use loadCodeComponent instead
     */
    loadBuiltins(): void {
        const surface = this.store.getSurface(this.surfaceId)
        if (!surface) return

        const builtinsComp = surface.getComponent('builtins')
        if (!builtinsComp) return

        const builtins = builtinsComp.component as { Builtins?: { code?: string } }
        const code = builtins.Builtins?.code
        if (!code) return

        this.loadCode(code, 'seval')
    }

    /**
     * Load code directly with specified language
     * @param code - The code to load
     * @param lang - The language: 'seval' (s-expression) or 'minijs' (JavaScript-like)
     */
    loadCode(code: string, lang: 'seval' | 'minijs' = 'seval'): void {
        console.log(
            `[SExpRuntime] loadCode called, lang=${lang}, baseEnv keys before:`,
            Object.keys(this.baseEnv)
        )
        try {
            if (lang === 'minijs') {
                // Use self-hosted minijs.seval compiler
                console.log(`[SExpRuntime] Compiling MiniJS...`)
                const serialized = this.compileMiniJS(code)
                console.log(`[SExpRuntime] Compiled to S-expr:`, serialized)
                if (serialized !== null) {
                    const sexpr = deserializeSExpr(serialized)
                    this.evaluator.evaluate(sexpr, this.baseEnv)
                    console.log(
                        `[SExpRuntime] After evaluate, baseEnv keys:`,
                        Object.keys(this.baseEnv)
                    )
                }
            } else {
                // Standard S-expression
                const wrappedDefs = `(progn ${code})`
                const expr = parse(wrappedDefs)
                this.evaluator.evaluate(expr, this.baseEnv)
                console.log(
                    `[SExpRuntime] After evaluate, baseEnv keys:`,
                    Object.keys(this.baseEnv)
                )
            }
        } catch (error) {
            console.error(`[SExpRuntime] Error loading ${lang} code:`, error)
        }
    }

    /**
     * MiniJS compiler environment (lazy loaded)
     */
    private minijsEnv: Environment | null = null

    /**
     * Load the minijs.seval compiler
     */
    private loadMiniJSCompiler(): Environment {
        if (this.minijsEnv) return this.minijsEnv

        // MiniJS compiler source (minijs.seval)
        // This is the self-hosted MiniJS compiler written in S-expressions
        const minijsCompilerSource = MINIJS_SEVAL_SOURCE as string

        const env: Environment = {}
        const compilerExpr = parse(`(progn ${minijsCompilerSource})`)
        this.evaluator.evaluate(compilerExpr, env)

        this.minijsEnv = env
        return env
    }

    /**
     * Compile MiniJS code to S-expression using the self-hosted compiler
     */
    private compileMiniJS(code: string): SerializedSExpr {
        const env = this.loadMiniJSCompiler()
        // Call compile-to-sexpr function from minijs.seval
        const escapedCode = code.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
        console.log(`[SExpRuntime] Escaped code first 200 chars:`, escapedCode.substring(0, 200))
        const compileExpr = parse(`(compile-to-sexpr "${escapedCode}")`)
        console.log(`[SExpRuntime] Parse expr:`, compileExpr)
        const result = this.evaluator.evaluate(compileExpr, env) as SerializedSExpr
        console.log(`[SExpRuntime] Compile result:`, result)
        return result
    }

    /**
     * Handle an action from the UI by calling the action:xxx function
     */
    handleAction(actionName: string, context: Record<string, unknown> = {}): void {
        const surface = this.store.getSurface(this.surfaceId)
        if (!surface) {
            console.warn(`[SExpRuntime] Surface not found: ${this.surfaceId}`)
            return
        }

        // Handle special __inputBinding action for direct data model updates
        if (actionName === '__inputBinding') {
            const { path, value } = context as { path: string; value: unknown }
            if (path) {
                // Strip leading slash from path (e.g., "/todoInput" -> "todoInput")
                const key = path.startsWith('/') ? path.slice(1) : path
                this.updateDataModel(surface, key, value as Value)
                surface.incrementVersion()
            }
            return
        }

        // Look for action:xxx function in baseEnv (seval convention)
        // or action_xxx (minijs convention since colons aren't valid in JS identifiers)
        const actionFnNameColon = `action:${actionName}`
        const actionFnNameUnderscore = `action_${actionName}`

        // Debug: print installed handlers and action parameters
        console.log(`[SExpRuntime] handleAction called:`, {
            actionName,
            context,
            lookingFor: [actionFnNameColon, actionFnNameUnderscore, actionName],
            installedHandlers: Object.keys(this.baseEnv).filter(
                (k) =>
                    k.startsWith('action') ||
                    (this.baseEnv[k] !== undefined && isLambda(this.baseEnv[k] as Value))
            ),
        })

        let actionFn = this.baseEnv[actionFnNameColon]

        // Fall back to underscore naming (minijs convention)
        if (!actionFn || !isLambda(actionFn)) {
            actionFn = this.baseEnv[actionFnNameUnderscore]
        }

        // Fall back to plain function name (e.g., "updateDerived")
        if (!actionFn || !isLambda(actionFn)) {
            actionFn = this.baseEnv[actionName]
        }

        if (!actionFn || !isLambda(actionFn)) {
            // Silent return for updateDerived if not defined
            if (actionName !== 'updateDerived') {
                console.warn(
                    `[SExpRuntime] No action handler defined: ${actionFnNameColon} or ${actionFnNameUnderscore}`
                )
            }
            return
        }

        try {
            // Build environment from current data model
            const env = this.buildEnvironment(surface, context)

            // Call the lambda directly by evaluating its body with merged environment
            // The env includes: baseEnv (all functions) + dataModel + context
            const lambda = actionFn as LambdaFunction
            const result = this.evaluator.evaluate(lambda.body, env)

            // Apply updates to the data model
            this.applyUpdates(surface, result as Value)
        } catch (error) {
            console.error(`[SExpRuntime] Error executing action ${actionName}:`, error)
        }
    }

    /**
     * Evaluate an S-expression with current environment
     */
    evaluate(code: string, context: Record<string, unknown> = {}): Value {
        const surface = this.store.getSurface(this.surfaceId)
        const env = surface ? this.buildEnvironment(surface, context) : { ...this.baseEnv }
        return this.evaluator.evalString(code, env)
    }

    /**
     * Get the base environment
     */
    getEnvironment(): Environment {
        return this.baseEnv
    }

    /**
     * Build environment from surface data model
     */
    private buildEnvironment(
        surface: IMinimalSurface,
        context: Record<string, unknown>
    ): Environment {
        const dataModel = surface.dataModel as Record<string, Value>
        return {
            ...this.baseEnv, // Include defined functions
            ...dataModel, // Include current data model
            context: context as Value, // Include action context
        }
    }

    /**
     * Apply updates from S-expression result to data model
     *
     * Expected format: list of [key, value] pairs
     * e.g., (list (list "display" "123") (list "operator" "+"))
     */
    private applyUpdates(surface: IMinimalSurface, result: Value): void {
        if (!Array.isArray(result)) {
            console.warn('[SExpRuntime] Logic result is not a list:', result)
            return
        }

        // Result should be a list of [key, value] pairs
        for (const update of result) {
            if (!Array.isArray(update) || update.length !== 2) {
                console.warn('[SExpRuntime] Invalid update format:', update)
                continue
            }

            const [key, value] = update as [string, Value]
            this.updateDataModel(surface, key, value)
        }

        surface.incrementVersion()
    }

    /**
     * Update a single key in the data model
     */
    private updateDataModel(surface: IMinimalSurface, key: string, value: Value): void {
        console.log('[SExpRuntime] updateDataModel:', {
            key,
            keyType: typeof key,
            keyValue: JSON.stringify(key),
            value,
        })
        const updated = this.setNestedValue(
            surface.dataModel as Record<string, unknown>,
            key,
            this.valueToJS(value)
        )
        surface.setDataModel(updated)
    }

    /**
     * Immutable set helper that understands slash-delimited paths (e.g., "todos/1/done")
     */
    private setNestedValue(
        data: Record<string, unknown>,
        key: string,
        value: unknown
    ): Record<string, unknown> {
        if (!key.includes('/')) {
            return { ...data, [key]: value }
        }

        const segments = key.split('/').filter(Boolean)
        // biome-ignore lint/suspicious/noExplicitAny: dynamic path handling
        const clone = Array.isArray(data) ? ([...data] as any) : ({ ...data } as any)
        // biome-ignore lint/suspicious/noExplicitAny: dynamic cursor
        let cursor: any = clone

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i]!
            const isLast = i === segments.length - 1
            const segIndex = Number.isInteger(Number(seg)) ? Number(seg) : seg

            if (isLast) {
                if (Array.isArray(cursor) && typeof segIndex === 'number') {
                    const arr = [...cursor]
                    arr[segIndex] = value
                    // Update parent reference
                    if (i === 0) return arr as unknown as Record<string, unknown>
                    cursor[segIndex] = value
                } else {
                    cursor[segIndex] = value
                }
                break
            }

            const nextVal = cursor[segIndex]
            const nextContainer = Array.isArray(nextVal)
                ? [...nextVal]
                : typeof nextVal === 'object' && nextVal !== null
                    ? { ...nextVal }
                    : // create container based on next segment hint (number => array)
                    Number.isInteger(Number(segments[i + 1]))
                        ? []
                        : {}

            cursor[segIndex] = nextContainer
            cursor = nextContainer
        }

        return clone as Record<string, unknown>
    }

    /**
     * Convert S-expression Value to plain JS value
     */
    private valueToJS(value: Value): unknown {
        if (value === null) return null
        if (typeof value !== 'object') return value
        if (Array.isArray(value)) {
            // Check if it's a list of pairs (object representation)
            if (
                value.length > 0 &&
                Array.isArray(value[0]) &&
                value[0].length === 2 &&
                typeof value[0][0] === 'string'
            ) {
                const obj: Record<string, unknown> = {}
                for (const pair of value) {
                    if (Array.isArray(pair) && pair.length === 2) {
                        obj[pair[0] as string] = this.valueToJS(pair[1] as Value)
                    }
                }
                return obj
            }
            return value.map((v) => this.valueToJS(v as Value))
        }
        return value
    }
}

/**
 * Create action handler for A2UI store
 */
export function createSExpActionHandler(
    _store: IMinimalStore,
    runtimes: Map<string, SExpRuntime>
): (payload: { surfaceId: string; name: string; context?: Record<string, unknown> }) => void {
    return (payload: { surfaceId: string; name: string; context?: Record<string, unknown> }) => {
        const runtime = runtimes.get(payload.surfaceId)
        if (runtime) {
            runtime.handleAction(payload.name, payload.context ?? {})
        } else {
            console.warn(`[SExpRuntime] No runtime for surface: ${payload.surfaceId}`)
        }
    }
}
