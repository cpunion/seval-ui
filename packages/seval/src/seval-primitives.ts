// @ts-nocheck
/**
 * Seval Primitives
 *
 * Built-in functions and operators for Seval.
 */

export type PrimitiveValue = number | string | boolean | null
export type Value = PrimitiveValue | ValueArray | ValueObject | SFunction

export interface ValueArray extends Array<Value> { }
export interface ValueObject extends Record<string, Value> { }

// SFunction is defined in interpreter, but we need it in the type union
// We use a placeholder here to avoid circular dependency
export interface SFunction {
	kind: 'function'
	params: string[]
	// biome-ignore lint/suspicious/noExplicitAny: ASTNode type would create circular dependency
	body: any // ASTNode
	closure: Record<string, Value>
}

// biome-ignore lint/suspicious/noExplicitAny: primitives can be functions or global objects
export const primitives: Record<string, any> = {
	// Arithmetic (+ also handles string concatenation)
	'+': (a, b) => {
		if (typeof a === 'string' || typeof b === 'string') {
			return String(a) + String(b)
		}
		return (a as number) + (b as number)
	},
	'-': (a, b) => (a as number) - (b as number),
	'*': (...args) => args.reduce((a, b) => (a as number) * (b as number), 1) as number,
	'/': (a, b) => (a as number) / (b as number),
	'%': (a, b) => (a as number) % (b as number),

	// Comparison
	'=': (a, b) => a === b,
	'!=': (a, b) => a !== b,
	'==': (a, b) => a === b,
	'!==': (a, b) => a !== b,
	'<': (a, b) => (a as number) < (b as number),
	'<=': (a, b) => (a as number) <= (b as number),
	'>': (a, b) => (a as number) > (b as number),
	'>=': (a, b) => (a as number) >= (b as number),

	// Logical
	'&&': (a, b) => a && b,
	'||': (a, b) => a || b,
	'!': (a) => !a,

	// Type conversion
	str: (v) => String(v),
	parseNum: (s) => Number.parseFloat(String(s)),

	// Array helpers (immutable operations)
	updateAt: (arr, index, value) => {
		if (!Array.isArray(arr)) return arr
		const newArr = [...arr]
		newArr[Number(index)] = value
		return newArr
	},

	// Object helpers
	get: (obj, key) => {
		if (typeof obj === 'object' && obj !== null) {
			return (obj as ValueObject)[String(key)] ?? null
		}
		return null
	},
	obj: (...pairs) => {
		const result: ValueObject = {}
		for (let i = 0; i < pairs.length; i += 2) {
			const key = String(pairs[i])
			const value = pairs[i + 1]
			result[key] = value
		}
		return result
	},
	merge: (...objects) => {
		const result: ValueObject = {}
		for (const obj of objects) {
			if (typeof obj === 'object' && obj !== null) {
				Object.assign(result, obj)
			}
		}
		return result
	},

	// Whitelisted global objects (for sandbox safety)
	Math: Math,
	Number: Number,
	Date: Date,

	// Utility
	now: () => Date.now(),
}
