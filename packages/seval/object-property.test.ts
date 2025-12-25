import { describe, expect, it } from 'vitest'
import { compileSeval, executeSeval } from './src/seval'

describe('Object Property Syntax', () => {
	it('should support literal property values', () => {
		const code = `{
			name: "Alice",
			age: 30
		}`
		const env = compileSeval(code)
		// Properties are stored as zero-parameter functions
		const name = executeSeval(env, 'name', [])
		const age = executeSeval(env, 'age', [])
		expect(name).toBe('Alice')
		expect(age).toBe(30)
	})

	it('should support array and object literal properties', () => {
		const code = `{
			items: [1, 2, 3],
			user: { name: "Bob", age: 25 }
		}`
		const env = compileSeval(code)
		const items = executeSeval(env, 'items', [])
		const user = executeSeval(env, 'user', [])
		expect(items).toEqual([1, 2, 3])
		expect(user).toEqual({ name: 'Bob', age: 25 })
	})

	it('should support methods accessing properties', () => {
		const code = `{
			count: 0,
			getCount() {
				this.count()
			}
		}`
		const env = compileSeval(code)
		const count = executeSeval(env, 'count', [])
		expect(count).toBe(0)
		const result = executeSeval(env, 'getCount', [])
		expect(result).toBe(0)
	})
})
