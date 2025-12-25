/**
 * Tests for new Seval language features:
 * - Line comments (//)
 * - Strict equality operators (===, !==)
 * - For loops
 */

import { describe, expect, test } from 'bun:test'
import { compileSeval } from './src/seval'
import { TokenType, Tokenizer } from './src/seval-tokenizer'

describe('Line Comments', () => {
	test('should skip single-line comments', () => {
		const code = `{
			// This is a comment
			value: 42
		}`
		const env = compileSeval(code)
		expect(env.value).toBe(42)
	})

	test('should skip end-of-line comments', () => {
		const code = `{
			value: 42 // This is a comment
		}`
		const env = compileSeval(code)
		expect(env.value).toBe(42)
	})

	test('should handle multiple comments', () => {
		const code = `{
			// Comment 1
			a: 1,
			// Comment 2
			b: 2,
			// Comment 3
			add() {
				// Inside function comment
				this.a + this.b // Result
			}
		}`
		const env = compileSeval(code)
		expect(env.a).toBe(1)
		expect(env.b).toBe(2)
		expect(env.add()).toBe(3)
	})

	test('should not treat // inside string as comment', () => {
		const code = `{
			url: "https://example.com"
		}`
		const env = compileSeval(code)
		expect(env.url).toBe('https://example.com')
	})

	test('tokenizer should produce NEWLINE after comment', () => {
		const tokenizer = new Tokenizer('x // comment\ny')
		const tokens = tokenizer.tokenize()

		expect(tokens[0].type).toBe(TokenType.IDENTIFIER)
		expect(tokens[0].value).toBe('x')
		expect(tokens[1].type).toBe(TokenType.NEWLINE)
		expect(tokens[2].type).toBe(TokenType.IDENTIFIER)
		expect(tokens[2].value).toBe('y')
	})
})

describe('Strict Equality Operators', () => {
	test('should tokenize === and !==', () => {
		const tokenizer = new Tokenizer('a === b !== c')
		const tokens = tokenizer.tokenize()

		expect(tokens[0].type).toBe(TokenType.IDENTIFIER)
		expect(tokens[1].type).toBe(TokenType.STRICT_EQ)
		expect(tokens[1].value).toBe('===')
		expect(tokens[2].type).toBe(TokenType.IDENTIFIER)
		expect(tokens[3].type).toBe(TokenType.STRICT_NE)
		expect(tokens[3].value).toBe('!==')
	})

	test('should compile === operator', () => {
		const code = `{
			check(a, b) { a === b }
		}`
		const env = compileSeval(code)
		expect(env.check(1, 1)).toBe(true)
		expect(env.check(1, '1')).toBe(false)
		expect(env.check(null, null)).toBe(true)
	})

	test('should compile !== operator', () => {
		const code = `{
			check(a, b) { a !== b }
		}`
		const env = compileSeval(code)
		expect(env.check(1, 1)).toBe(false)
		expect(env.check(1, '1')).toBe(true)
		expect(env.check(null, undefined)).toBe(true)
	})

	test('should distinguish == from ===', () => {
		const code = `{
			looseEqual(a, b) { a == b },
			strictEqual(a, b) { a === b }
		}`
		const env = compileSeval(code)
		// In Seval, == is strict (like ===)
		expect(env.looseEqual(1, 1)).toBe(true)
		expect(env.strictEqual(1, 1)).toBe(true)
	})
})

describe('For Loops', () => {
	test('should tokenize for keyword', () => {
		const tokenizer = new Tokenizer('for')
		const tokens = tokenizer.tokenize()
		expect(tokens[0].type).toBe(TokenType.FOR)
		expect(tokens[0].value).toBe('for')
	})

	test('should parse and compile three-part for loop', () => {
		const code = `{
			sum: 0,
			calculate() {
				for i = 0; i < 5; i = i + 1 {
					this.sum = this.sum + i
				}
				this.sum
			}
		}`
		const env = compileSeval(code)
		const result = env.calculate()
		expect(env.sum).toBe(10) // 0 + 1 + 2 + 3 + 4 = 10
	})

	test('should parse and compile condition-only for loop', () => {
		const code = `{
			count: 0,
			iterate() {
				for this.count < 3 {
					this.count = this.count + 1
				}
				this.count
			}
		}`
		const env = compileSeval(code)
		env.iterate()
		expect(env.count).toBe(3)
	})

	test('should handle nested for loops', () => {
		const code = `{
			result: 0,
			nestedLoop() {
				for i = 0; i < 3; i = i + 1 {
					for j = 0; j < 3; j = j + 1 {
						this.result = this.result + 1
					}
				}
				this.result
			}
		}`
		const env = compileSeval(code)
		env.nestedLoop()
		expect(env.result).toBe(9) // 3 * 3 = 9
	})

	test('should handle for loop with array iteration pattern', () => {
		const code = `{
			items: [10, 20, 30],
			sum: 0,
			sumItems() {
				for i = 0; i < this.items.length; i = i + 1 {
					this.sum = this.sum + this.items[i]
				}
				this.sum
			}
		}`
		const env = compileSeval(code)
		const result = env.sumItems()
		expect(result).toBe(60) // 10 + 20 + 30
	})
})

describe('Combined Features', () => {
	test('should handle comments in for loops', () => {
		const code = `{
			sum: 0,
			calculate() {
				// Initialize loop
				for i = 0; i < 3; i = i + 1 {
					// Add to sum
					this.sum = this.sum + i
				}
				// Return result
				this.sum
			}
		}`
		const env = compileSeval(code)
		env.calculate()
		expect(env.sum).toBe(3) // 0 + 1 + 2
	})

	test('should use strict equality in for loop condition', () => {
		const code = `{
			found: false,
			items: [1, 2, "3", 4],
			findString() {
				for i = 0; i < this.items.length; i = i + 1 {
					if this.items[i] === "3" {
						this.found = true
					}
				}
				this.found
			}
		}`
		const env = compileSeval(code)
		env.findString()
		expect(env.found).toBe(true)
	})
})
