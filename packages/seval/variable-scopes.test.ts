import { describe, expect, test } from 'bun:test'
import { compileSeval, executeSeval } from './src/seval'

describe('Variable Scopes and Primitives', () => {
	describe('Local Variables (this.xxx)', () => {
		test('assign and read local variable', () => {
			const code = `{
				test() {
					this.x = 10
					this.x
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(10)
		})

		test('local variables persist across statements', () => {
			const code = `{
				test() {
					this.x = 5
					this.y = 10
					this.x + this.y
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(15)
		})

		test('local variables are shared via this', () => {
			const code = `{
				setX() {
					this.x = 100
				}
				getX() {
					this.x
				}
			}`
			const env = compileSeval(code)
			executeSeval(env, 'setX')
			const result = executeSeval(env, 'getX')
			// this is shared across functions in the same object
			expect(result).toBe(100)
		})

		test('local variable with object value', () => {
			const code = `{
				test() {
					this.data = { x: 1, y: 2 }
					this.data.x + this.data.y
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(3)
		})

		test('local variable with array value', () => {
			const code = `{
				test() {
					this.arr = [1, 2, 3]
					this.arr[0] + this.arr[1] + this.arr[2]
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(6)
		})
	})

	describe('Built-in Functions (Primitives)', () => {
		test('obj() creates object from key-value pairs', () => {
			const code = `{
				test() {
					obj("x", 1, "y", 2, "z", 3)
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toEqual({ x: 1, y: 2, z: 3 })
		})

		test('merge() combines objects', () => {
			const code = `{
				test() {
					a = { x: 1 }
					b = { y: 2 }
					merge(a, b)
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toEqual({ x: 1, y: 2 })
		})

		test('built-in functions work with local variables', () => {
			const code = `{
				test() {
					this.person = obj("name", "Alice", "age", 30)
					this.person.name
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe('Alice')
		})
	})

	describe('Global Objects', () => {
		test('Math object is available', () => {
			const code = `{
				test() {
					Math.max(1, 2, 3)
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(3)
		})

		test('Math.min, Math.round, Math.floor, Math.ceil', () => {
			const code = `{
				testMin() { Math.min(5, 2, 8) }
				testRound() { Math.round(3.7) }
				testFloor() { Math.floor(3.9) }
				testCeil() { Math.ceil(3.1) }
			}`
			const env = compileSeval(code)
			expect(executeSeval(env, 'testMin')).toBe(2)
			expect(executeSeval(env, 'testRound')).toBe(4)
			expect(executeSeval(env, 'testFloor')).toBe(3)
			expect(executeSeval(env, 'testCeil')).toBe(4)
		})

		test('Array.from creates array', () => {
			const code = `{
				test() {
					Array.from([1, 2, 3])
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toEqual([1, 2, 3])
		})

		test('Number.parseFloat parses number', () => {
			const code = `{
				test() {
					Number.parseFloat("3.14")
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(3.14)
		})

		test('String methods work', () => {
			const code = `{
				test() {
					String("hello").toUpperCase()
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe('HELLO')
		})

		test('Date.now returns timestamp', () => {
			const code = `{
				test() {
					Date.now()
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(typeof result).toBe('number')
			expect(result).toBeGreaterThan(0)
		})
	})

	describe('Variable Name Conflicts', () => {
		test('local variable does not conflict with built-in when using this', () => {
			const code = `{
				test() {
					this.Math = { custom: true }
					this.Math.custom
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(true)
		})

		test('can still access global Math after local this.Math', () => {
			const code = `{
				test() {
					this.Math = { custom: true }
					Math.max(1, 2)
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(2)
		})

		test('local variable named data does not conflict with primitives', () => {
			const code = `{
				test() {
					this.data = { x: 1 }
					this.result = obj("y", 2)
					this.data.x + this.result.y
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(3)
		})
	})

	describe('Mixed Usage', () => {
		test('combine local variables, built-ins, and globals', () => {
			const code = `{
				test() {
					this.nums = [1, 2, 3, 4, 5]
					this.max = Math.max(1, 2, 3, 4, 5)
					this.data = obj("max", this.max, "count", this.nums.length)
					this.data.max + this.data.count
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(10) // 5 + 5
		})

		test('nested function calls with mixed types', () => {
			const code = `{
				test() {
					this.a = obj("x", 10)
					this.b = obj("y", 20)
					this.merged = merge(this.a, this.b)
					Math.max(this.merged.x, this.merged.y)
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(20)
		})
	})

	describe('Edge Cases', () => {
		test('undefined local variable returns undefined', () => {
			const code = `{
				test() {
					this.nonexistent
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBeUndefined()
		})

		test('can reassign local variable', () => {
			const code = `{
				test() {
					this.x = 10
					this.x = 20
					this.x
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(20)
		})

		test('local variable survives multiple statements', () => {
			const code = `{
				test() {
					this.x = 1
					this.y = 2
					this.z = 3
					this.x + this.y + this.z
				}
			}`
			const env = compileSeval(code)
			const result = executeSeval(env, 'test')
			expect(result).toBe(6)
		})
	})
})
