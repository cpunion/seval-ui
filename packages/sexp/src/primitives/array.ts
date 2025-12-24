/**
 * Array Primitives
 */

import type { PrimitiveFunction, Value } from '../types'

export const arrayPrimitives: Record<string, PrimitiveFunction> = {
    list: (args) => args,
    length: (args) => (args[0] as Value[]).length,
    first: (args) => (args[0] as Value[])[0] ?? null,
    rest: (args) => (args[0] as Value[]).slice(1),
    last: (args) => {
        const arr = args[0] as Value[]
        return arr[arr.length - 1] ?? null
    },
    nth: (args) => (args[0] as Value[])[args[1] as number] ?? null,
    append: (args) => [...(args[0] as Value[]), (args[1] ?? null) as Value],
    prepend: (args) => [(args[1] ?? null) as Value, ...(args[0] as Value[])],
    'concat-lists': (args) => args.flatMap((a) => a as Value[]),
    slice: (args) => (args[0] as Value[]).slice(args[1] as number, args[2] as number | undefined),
    reverse: (args) => [...(args[0] as Value[])].reverse(),
    range: (args) => {
        const start = args.length > 1 ? (args[0] as number) : 0
        const end = args.length > 1 ? (args[1] as number) : (args[0] as number)
        const step = (args[2] as number) || 1
        const result: number[] = []
        for (let i = start; step > 0 ? i < end : i > end; i += step) {
            result.push(i)
        }
        return result
    },
    'empty?': (args) => (args[0] as Value[]).length === 0,
    contains: (args) => (args[0] as Value[]).includes((args[1] ?? null) as Value),
    'index-of': (args) => (args[0] as Value[]).indexOf((args[1] ?? null) as Value),
}
