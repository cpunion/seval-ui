/**
 * Type Check Primitives
 */

import type { PrimitiveFunction } from '../types'

export const typePrimitives: Record<string, PrimitiveFunction> = {
    'null?': (args) => args[0] === null,
    'number?': (args) => typeof args[0] === 'number',
    'string?': (args) => typeof args[0] === 'string',
    'bool?': (args) => typeof args[0] === 'boolean',
    'list?': (args) => Array.isArray(args[0]),
    'object?': (args) => args[0] !== null && typeof args[0] === 'object' && !Array.isArray(args[0]),
}
