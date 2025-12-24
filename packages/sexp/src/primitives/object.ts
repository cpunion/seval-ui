/**
 * Object Primitives
 */

import type { PrimitiveFunction, Value } from '../types'

export const objectPrimitives: Record<string, PrimitiveFunction> = {
    obj: (args) => {
        const result: Record<string, Value> = {}
        for (let i = 0; i < args.length; i += 2) {
            result[args[i] as string] = args[i + 1] as Value
        }
        return result
    },

    get: (args) => {
        let obj = args[0] as Record<string, Value> | Value[]
        for (let i = 1; i < args.length; i++) {
            const key = args[i]
            if (obj == null) return null
            if (Array.isArray(obj)) {
                obj = obj[key as number] as Record<string, Value> | Value[]
            } else {
                obj = (obj as Record<string, Value>)[key as string] as
                    | Record<string, Value>
                    | Value[]
            }
        }
        return obj as Value
    },

    set: (args) => {
        const obj = { ...(args[0] as Record<string, Value>) }
        obj[args[1] as string] = args[2] as Value
        return obj
    },

    keys: (args) => Object.keys(args[0] as Record<string, Value>),
    values: (args) => Object.values(args[0] as Record<string, Value>),

    'has-key': (args) => (args[1] as string) in (args[0] as Record<string, Value>),

    'update-at': (args) => {
        const arr = [...(args[0] as Value[])]
        arr[args[1] as number] = args[2] as Value
        return arr
    },

    merge: (args) => Object.assign({}, ...(args as Record<string, Value>[])),
}
