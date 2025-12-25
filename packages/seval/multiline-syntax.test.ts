import { describe, expect, test } from 'bun:test'
import { compileSeval, executeSeval } from './src/seval'

describe('Multi-line syntax support', () => {
	test('multi-line object literal', () => {
		const code = `{
			test() {
				data = {
					x: 1,
					y: 2,
					z: 3
				}
				data.x + data.y + data.z
			}
		}`

		const env = compileSeval(code)
		const result = executeSeval(env, 'test')

		expect(result).toBe(6)
	})

	test('multi-line array literal', () => {
		const code = `{
			test() {
				arr = [
					1,
					2,
					3
				]
				arr[0] + arr[1] + arr[2]
			}
		}`
		const env = compileSeval(code)
		const result = executeSeval(env, 'test')
		expect(result).toBe(6)
	})

	test('multi-line function call', () => {
		const code = `{
			add(a, b) { a + b }
			test() {
				add(
					1,
					2
				)
			}
		}`
		const env = compileSeval(code)
		const result = executeSeval(env, 'test')
		expect(result).toBe(3)
	})

	test('newline separates statements in function body', () => {
		const code = `{
			test() {
				x = 1
				y = 2
				x + y
			}
		}`
		const env = compileSeval(code)
		const result = executeSeval(env, 'test')
		expect(result).toBe(3)
	})

	test('semicolon separates statements in function body', () => {
		const code = `{
			test() {
				x = 1; y = 2; x + y
			}
		}`
		const env = compileSeval(code)
		const result = executeSeval(env, 'test')
		expect(result).toBe(3)
	})

	test('mixed newline and semicolon', () => {
		const code = `{
			test() {
				x = 1; y = 2
				z = 3
				x + y + z
			}
		}`
		const env = compileSeval(code)
		const result = executeSeval(env, 'test')
		expect(result).toBe(6)
	})

	test('if statement with multi-line body', () => {
		const code = `{
			test(n) {
				if (n > 0) {
					x = 1
					y = 2
					x + y
				} else {
					a = 10
					b = 20
					a + b
				}
			}
		}`
		const env = compileSeval(code)
		expect(executeSeval(env, 'test', [5])).toBe(3)
		expect(executeSeval(env, 'test', [-1])).toBe(30)
	})

	test('nested blocks with newlines', () => {
		const code = `{
			test(n) {
				x = 1
				if (n > 0) {
					y = 2
					z = 3
					y + z
				} else {
					y = 10
					y
				}
			}
		}`
		const env = compileSeval(code)
		expect(executeSeval(env, 'test', [5])).toBe(5)
		expect(executeSeval(env, 'test', [-1])).toBe(10)
	})

	test('multi-line expression with operators', () => {
		const code = `{
			test() {
				result = 1 +
					2 +
					3
				result
			}
		}`
		const env = compileSeval(code)
		const result = executeSeval(env, 'test')
		expect(result).toBe(6)
	})

	test('multi-line ternary expression', () => {
		const code = `{
			test(n) {
				n > 0
					? 100
					: 200
			}
		}`
		const env = compileSeval(code)
		expect(executeSeval(env, 'test', [5])).toBe(100)
		expect(executeSeval(env, 'test', [-1])).toBe(200)
	})

	test('complex nested structure', () => {
		const code = `{
			test() {
				data = {
					items: [
						{ id: 1, name: "a" },
						{ id: 2, name: "b" }
					],
					count: 2
				}
				data.count
			}
		}`
		const env = compileSeval(code)
		const result = executeSeval(env, 'test')
		expect(result).toBe(2)
	})
})
