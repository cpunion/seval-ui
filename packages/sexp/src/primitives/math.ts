/**
 * Math Primitives
 */

import type { PrimitiveFunction } from '../types'

export const mathPrimitives: Record<string, PrimitiveFunction> = {
    abs: (args) => Math.abs(args[0] as number),
    min: (args) => Math.min(...(args as number[])),
    max: (args) => Math.max(...(args as number[])),
    floor: (args) => Math.floor(args[0] as number),
    ceil: (args) => Math.ceil(args[0] as number),
    round: (args) => Math.round(args[0] as number),
    sqrt: (args) => Math.sqrt(args[0] as number),
    pow: (args) => (args[0] as number) ** (args[1] as number),
    clamp: (args) => Math.max(args[1] as number, Math.min(args[2] as number, args[0] as number)),
    sin: (args) => Math.sin(args[0] as number),
    cos: (args) => Math.cos(args[0] as number),
    tan: (args) => Math.tan(args[0] as number),
    log: (args) => Math.log(args[0] as number),
    exp: (args) => Math.exp(args[0] as number),
    random: () => Math.random(),
}
