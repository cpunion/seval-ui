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

export const primitives: Record<string, (...args: Value[]) => Value> = {
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

	// String functions
	str: (v) => String(v),
	parseNum: (s) => Number.parseFloat(String(s)),
	strContains: (s, sub) => String(s).includes(String(sub)),
	strStartsWith: (s, prefix) => String(s).startsWith(String(prefix)),
	substr: (s, start, length?) =>
		length !== undefined
			? String(s).substr(Number(start), Number(length))
			: String(s).substr(Number(start)),

	// Array functions
	len: (arr) => (Array.isArray(arr) ? arr.length : 0),
	at: (arr, index) => (Array.isArray(arr) ? arr[Number(index)] : null),
	updateAt: (arr, index, value) => {
		if (!Array.isArray(arr)) return arr
		const newArr = [...arr]
		newArr[Number(index)] = value
		return newArr
	},
	push: (arr, ...values) => (Array.isArray(arr) ? [...arr, ...values] : []),
	concat: (...arrays) => {
		const result: Value[] = []
		for (const arr of arrays) {
			if (Array.isArray(arr)) {
				result.push(...arr)
			}
		}
		return result
	},

	// Object functions
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

	// Math functions
	round: (n) => Math.round(Number(n)),
	floor: (n) => Math.floor(Number(n)),
	ceil: (n) => Math.ceil(Number(n)),
	abs: (n) => Math.abs(Number(n)),
	min: (...args) => Math.min(...args.map((n) => Number(n))),
	max: (...args) => Math.max(...args.map((n) => Number(n))),

	// Utility
	now: () => Date.now(),
}
