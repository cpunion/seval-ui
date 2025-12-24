/**
 * Arithmetic Primitives
 */

import type { PrimitiveFunction } from '../types'

export const arithmeticPrimitives: Record<string, PrimitiveFunction> = {
    '+': (args) => {
        if (args.some((arg) => typeof arg === 'string')) {
            return args.reduce((acc, val) => `${acc}${String(val ?? '')}`, '')
        }
        return args.reduce((a, b) => (a as number) + (b as number), 0)
    },

    '-': (args) =>
        args.length === 1
            ? -(args[0] as number)
            : args.slice(1).reduce((a, b) => (a as number) - (b as number), args[0] as number),

    '*': (args) => args.reduce((a, b) => (a as number) * (b as number), 1),

    '/': (args) => args.slice(1).reduce((a, b) => (a as number) / (b as number), args[0] as number),

    '%': (args) => (args[0] as number) % (args[1] as number),
}
