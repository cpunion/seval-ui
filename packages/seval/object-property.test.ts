import { describe, expect, it } from 'vitest'
import { compileSeval, executeSeval } from './src/seval'

describe('Object Property Syntax', () => {
	it('should support literal property values', () => {
		const code = `{
			name: "Alice",
			age: 30
		}`
		const env = compileSeval(code)
		// Properties are now stored as values, not functions
		expect(env.name).toBe('Alice')
		expect(env.age).toBe(30)
	})

	it('should support array and object literal properties', () => {
		const code = `{
			items: [1, 2, 3],
			user: { name: "Bob", age: 25 }
		}`
		const env = compileSeval(code)
		expect(env.items).toEqual([1, 2, 3])
		expect(env.user).toEqual({ name: 'Bob', age: 25 })
	})

	it('should support methods accessing properties', () => {
		const code = `{
			count: 0,
			getCount() {
				this.count
			}
		}`
		const env = compileSeval(code)
		expect(env.count).toBe(0)
		const result = executeSeval(env, 'getCount', [])
		expect(result).toBe(0)
	})
})
