/**
 * Performance tests for Seval Compiler
 */

import { describe, expect, test } from 'bun:test'
import { SevalCompiler } from './src/seval-compiler'
import { Parser } from './src/seval-parser'
import { Tokenizer } from './src/seval-tokenizer'

const ITERATIONS = 10000

describe('Performance: Compiler', () => {
	const code = `{
		count: 0,
		increment() {
			this.count = this.count + 1
		},
		add(n) {
			this.count = this.count + n
		},
		calculate(a, b) {
			(a + b) * 2
		}
	}`

	// Parse once
	const tokenizer = new Tokenizer(code)
	const tokens = tokenizer.tokenize()
	const parser = new Parser(tokens)
	const program = parser.parseProgram()

	test('Compile and execute', () => {
		const start = performance.now()

		for (let i = 0; i < ITERATIONS; i++) {
			const compiler = new SevalCompiler()
			const obj = compiler.compile(program)

			// Call functions
			obj.increment()
			obj.add(5)
			obj.calculate(10, 20)
		}

		const end = performance.now()
		const duration = end - start
		console.log(`Compiler: ${duration.toFixed(2)}ms for ${ITERATIONS} iterations`)
		console.log(`Average: ${(duration / ITERATIONS).toFixed(4)}ms per iteration`)

		expect(duration).toBeGreaterThan(0)
	})

	test('Compile once, execute many times', () => {
		const compiler = new SevalCompiler()
		const obj = compiler.compile(program)

		const start = performance.now()

		for (let i = 0; i < ITERATIONS; i++) {
			// Reset state
			obj.count = 0

			// Call functions
			obj.increment()
			obj.add(5)
			obj.calculate(10, 20)
		}

		const end = performance.now()
		const duration = end - start
		console.log(`Compiler (reuse): ${duration.toFixed(2)}ms for ${ITERATIONS} iterations`)
		console.log(`Average: ${(duration / ITERATIONS).toFixed(4)}ms per iteration`)

		expect(duration).toBeGreaterThan(0)
	})

	test('Complex calculation benchmark', () => {
		const complexCode = `{
			sum(a, b, c) {
				a + b + c
			},
			multiply(a, b) {
				a * b
			},
			calculate(x) {
				this.multiply(this.sum(x, x, x), 2)
			}
		}`

		const tokenizer = new Tokenizer(complexCode)
		const tokens = tokenizer.tokenize()
		const parser = new Parser(tokens)
		const program = parser.parseProgram()

		const CALC_ITERATIONS = 10000

		const compiler = new SevalCompiler()
		const obj = compiler.compile(program)

		const start = performance.now()
		for (let i = 0; i < CALC_ITERATIONS; i++) {
			obj.calculate(10)
		}
		const end = performance.now()
		const duration = end - start

		console.log(`\nComplex calculation (${CALC_ITERATIONS} iterations):`)
		console.log(`Duration: ${duration.toFixed(2)}ms`)
		console.log(`Average: ${(duration / CALC_ITERATIONS).toFixed(4)}ms per iteration`)

		expect(duration).toBeGreaterThan(0)
	})
})
