/**
 * String Primitives
 */

import type { PrimitiveFunction, Value } from '../types'

export const stringPrimitives: Record<string, PrimitiveFunction> = {
    concat: (args) => args.map(String).join(''),
    str: (args) => String(args[0]),
    strlen: (args) => (args[0] as string).length,
    substr: (args) =>
        (args[0] as string).substring(args[1] as number, args[2] as number | undefined),
    'str-starts-with': (args) => (args[0] as string).startsWith(args[1] as string),
    'str-ends-with': (args) => (args[0] as string).endsWith(args[1] as string),
    'str-contains': (args) => (args[0] as string).includes(args[1] as string),
    'str-replace': (args) => (args[0] as string).replace(args[1] as string, args[2] as string),
    'str-split': (args) => (args[0] as string).split(args[1] as string),
    'str-join': (args) => (args[0] as Value[]).map(String).join(args[1] as string),
    'str-trim': (args) => (args[0] as string).trim(),
    'str-upper': (args) => (args[0] as string).toUpperCase(),
    'str-lower': (args) => (args[0] as string).toLowerCase(),
    'parse-num': (args) => Number.parseFloat(String(args[0])) || 0,
    'parse-int': (args) => Number.parseInt(String(args[0]), (args[1] as number) || 10) || 0,
}
