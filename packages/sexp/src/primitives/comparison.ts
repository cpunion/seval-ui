/**
 * Comparison Primitives
 */

import type { PrimitiveFunction } from '../types'

export const comparisonPrimitives: Record<string, PrimitiveFunction> = {
    '=': (args) => args[0] === args[1],
    '!=': (args) => args[0] !== args[1],
    '<': (args) => (args[0] as number) < (args[1] as number),
    '>': (args) => (args[0] as number) > (args[1] as number),
    '<=': (args) => (args[0] as number) <= (args[1] as number),
    '>=': (args) => (args[0] as number) >= (args[1] as number),
}
