import { type SExpr, isSymbol, sym, symName } from './parser'
import type { Value } from './types'

export type SerializedSExpr = Value | SerializedSExpr[]

function deserializeInternal(value: SerializedSExpr, quoted: boolean): SExpr {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return []
        }
        const head = deserializeInternal(value[0] as SerializedSExpr, false)
        const isQuote = isSymbol(head) && symName(head as symbol) === 'quote'
        const result: SExpr[] = [head]
        for (let i = 1; i < value.length; i++) {
            result.push(deserializeInternal(value[i] as SerializedSExpr, isQuote))
        }
        return result as unknown as SExpr
    }
    if (typeof value === 'string') {
        return quoted ? (value as SExpr) : (sym(value) as unknown as SExpr)
    }
    return value as SExpr
}

export function deserializeSExpr(value: SerializedSExpr): SExpr {
    return deserializeInternal(value, false)
}

function serializeInternal(expr: SExpr): SerializedSExpr {
    if (Array.isArray(expr)) {
        return (expr as SExpr[]).map((item) => serializeInternal(item))
    }
    if (isSymbol(expr)) {
        return symName(expr as symbol)
    }
    return expr as Value
}

export function serializeSExpr(expr: SExpr): SerializedSExpr {
    return serializeInternal(expr)
}
