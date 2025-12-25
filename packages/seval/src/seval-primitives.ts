// @ts-nocheck
/**
 * Seval Primitives
 *
 * Built-in functions and operators for Seval.
 */

export type PrimitiveValue = number | string | boolean | null
export type Value = PrimitiveValue | ValueArray | ValueObject | SFunction

export interface ValueArray extends Array<Value> {}
export interface ValueObject extends Record<string, Value> {}

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

	// Object helpers
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
	// Get property from object: get(obj, key)
	get: (obj, key) => {
		if (obj == null) return null
		return obj[key] ?? null
	},
	// Whitelisted global objects (for sandbox safety)
	Math: Math,
	Number: Number,
	Date: Date,
	String: String,
	Array: Array,
	// Note: Object is not included to avoid conflict with obj() primitive
	// Users can access Object via {}.constructor if needed

	// Internal: Proxy wrappers for sandbox protection
	// These prevent access to dangerous reflection properties
	// biome-ignore lint/suspicious/noExplicitAny: dynamic object creation requires any
	__createObject: (props: Record<string, any>) => {
		const FORBIDDEN = ['constructor', '__proto__', 'prototype']
		const obj = Object.assign({}, props)
		return new Proxy(obj, {
			get(target, prop) {
				if (typeof prop === 'string' && FORBIDDEN.includes(prop)) {
					return undefined
				}
				return Reflect.get(target, prop)
			},
			has(target, prop) {
				if (typeof prop === 'string' && FORBIDDEN.includes(prop)) {
					return false
				}
				return Reflect.has(target, prop)
			},
		})
	},

	// biome-ignore lint/suspicious/noExplicitAny: dynamic array creation requires any
	__createArray: (...items: any[]) => {
		const FORBIDDEN = ['constructor', '__proto__', 'prototype']
		return new Proxy([...items], {
			get(target, prop) {
				if (typeof prop === 'string' && FORBIDDEN.includes(prop)) {
					return undefined
				}
				return Reflect.get(target, prop)
			},
		})
	},
}
