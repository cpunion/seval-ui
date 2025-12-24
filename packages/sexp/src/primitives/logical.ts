/**
 * Logical Primitives
 */

import type { PrimitiveFunction } from '../types'

export const logicalPrimitives: Record<string, PrimitiveFunction> = {
    and: (args) => args.every(Boolean),
    or: (args) => args.some(Boolean),
    not: (args) => !args[0],
}
