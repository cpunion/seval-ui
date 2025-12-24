/**
 * Primitives Index
 *
 * Exports all primitive functions combined into a single object.
 */

import type { PrimitiveFunction } from '../types'
import { arithmeticPrimitives } from './arithmetic'
import { arrayPrimitives } from './array'
import { comparisonPrimitives } from './comparison'
import { logicalPrimitives } from './logical'
import { mathPrimitives } from './math'
import { objectPrimitives } from './object'
import { stringPrimitives } from './string'
import { typePrimitives } from './type'

/**
 * All default primitives combined
 */
export const defaultPrimitives: Record<string, PrimitiveFunction> = {
    ...arithmeticPrimitives,
    ...comparisonPrimitives,
    ...logicalPrimitives,
    ...stringPrimitives,
    ...arrayPrimitives,
    ...objectPrimitives,
    ...mathPrimitives,
    ...typePrimitives,

    // Utility
    now: () => Date.now(),
    'add-days': (args) => (args[0] as number) + (args[1] as number) * 86400000,
    'add-hours': (args) => (args[0] as number) + (args[1] as number) * 3600000,
    'days-since': (args) => Math.floor((Date.now() - (args[0] as number)) / 86400000),
    print: (args) => {
        console.log('[seval]', ...args)
        return args[0] ?? null
    },
}

// Re-export individual primitive modules
export { arithmeticPrimitives } from './arithmetic'
export { comparisonPrimitives } from './comparison'
export { logicalPrimitives } from './logical'
export { stringPrimitives } from './string'
export { arrayPrimitives } from './array'
export { objectPrimitives } from './object'
export { mathPrimitives } from './math'
export { typePrimitives } from './type'
