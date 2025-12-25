import { describe, expect, it } from 'vitest'
import { compileSeval, executeSeval } from './src/seval'

describe('Assignment Statements', () => {
	it('should support property assignment', () => {
		const code = `{
			state: { count: 0 },
			increment() {
				this.state.count = this.state.count + 1
			}
		}`
		const env = compileSeval(code)
		expect(env.state).toEqual({ count: 0 })

		const result = executeSeval(env, 'increment', [])
		expect(result).toBe(1)
		expect(env.state).toEqual({ count: 1 })
	})

	it('should support nested property assignment', () => {
		const code = `{
			user: { name: "Alice", age: 30 },
			setName(newName) {
				this.user.name = newName
			}
		}`
		const env = compileSeval(code)
		expect(env.user).toEqual({ name: 'Alice', age: 30 })

		const result = executeSeval(env, 'setName', ['Bob'])
		expect(result).toBe('Bob')
		expect(env.user).toEqual({ name: 'Bob', age: 30 })
	})

	it('should support computed property assignment', () => {
		const code = `{
			obj: { x: 1, y: 2 },
			setValue(key, value) {
				this.obj[key] = value
			}
		}`
		const env = compileSeval(code)

		executeSeval(env, 'setValue', ['x', 10])
		expect(env.obj).toEqual({ x: 10, y: 2 })

		executeSeval(env, 'setValue', ['y', 20])
		expect(env.obj).toEqual({ x: 10, y: 20 })
	})

	it('should support array element assignment', () => {
		const code = `{
			arr: [1, 2, 3],
			setElement(index, value) {
				this.arr[index] = value
			}
		}`
		const env = compileSeval(code)

		executeSeval(env, 'setElement', [0, 10])
		expect(env.arr).toEqual([10, 2, 3])

		executeSeval(env, 'setElement', [2, 30])
		expect(env.arr).toEqual([10, 2, 30])
	})

	it('should return the assigned value', () => {
		const code = `{
			value: 0,
			test() {
				this.value = 42
			}
		}`
		const env = compileSeval(code)

		const result = executeSeval(env, 'test', [])
		expect(result).toBe(42)
	})
})
