import { describe, expect, test } from 'bun:test'
import { compileSeval, executeSeval } from './src/seval'

describe('Null and Semicolon Support', () => {
	test('null literal', () => {
		const code = `{
			getValue() { null }
		}`

		const env = compileSeval(code)
		const result = executeSeval(env, 'getValue')
		expect(result).toBe(null)
	})

	test('null in expressions', () => {
		const code = `{
			isNull(x) { x == null }
		}`

		const env = compileSeval(code)
		expect(executeSeval(env, 'isNull', [null])).toBe(true)
		expect(executeSeval(env, 'isNull', [0])).toBe(false)
		expect(executeSeval(env, 'isNull', [''])).toBe(false)
	})

	test('semicolon as statement separator', () => {
		const code = `{
			action() {
				a = 1; b = 2; a + b
			}
		}`

		const env = compileSeval(code)
		const result = executeSeval(env, 'action')
		expect(result).toBe(3)
	})

	test('mixed newline and semicolon separators', () => {
		const code = `{
			action() {
				a = 1; b = 2
				c = 3
				a + b + c
			}
		}`

		const env = compileSeval(code)
		const result = executeSeval(env, 'action')
		expect(result).toBe(6)
	})

	test('trailing semicolon', () => {
		const code = `{
			action() {
				a = 1;
				b = 2;
				a + b;
			}
		}`

		const env = compileSeval(code)
		const result = executeSeval(env, 'action')
		expect(result).toBe(3)
	})
})
