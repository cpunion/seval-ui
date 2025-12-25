/**
 * Performance comparison: Interpreter vs Compiler
 */

import { describe, expect, test } from 'bun:test'
import { Interpreter } from './src/seval-interpreter'
import { Parser } from './src/seval-parser'
import { SevalCompiler } from './src/seval-compiler'
import { Tokenizer } from './src/seval-tokenizer'

const ITERATIONS = 10000

describe('Performance: Interpreter vs Compiler', () => {
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

    // Parse once for both
    const tokenizer = new Tokenizer(code)
    const tokens = tokenizer.tokenize()
    const parser = new Parser(tokens)
    const program = parser.parseProgram()

    test('Interpreter mode', () => {
        const start = performance.now()

        for (let i = 0; i < ITERATIONS; i++) {
            const interpreter = new Interpreter()
            const env = interpreter.evaluateProgram(program)

            // Call functions
            interpreter.callFunction('increment', [], env)
            interpreter.callFunction('add', [5], env)
            interpreter.callFunction('calculate', [10, 20], env)
        }

        const end = performance.now()
        const duration = end - start
        console.log(`Interpreter: ${duration.toFixed(2)}ms for ${ITERATIONS} iterations`)
        console.log(`Average: ${(duration / ITERATIONS).toFixed(4)}ms per iteration`)

        expect(duration).toBeGreaterThan(0)
    })

    test('Compiler mode', () => {
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

    test('Compiler mode (compiled once, executed many times)', () => {
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

        const CALC_ITERATIONS = 1000

        // Interpreter
        const interpreterStart = performance.now()
        const interpreter = new Interpreter()
        const env = interpreter.evaluateProgram(program)
        for (let i = 0; i < CALC_ITERATIONS; i++) {
            interpreter.callFunction('calculate', [10], env)
        }
        const interpreterEnd = performance.now()
        const interpreterDuration = interpreterEnd - interpreterStart

        // Compiler
        const compilerStart = performance.now()
        const compiler = new SevalCompiler()
        const obj = compiler.compile(program)
        for (let i = 0; i < CALC_ITERATIONS; i++) {
            obj.calculate(10)
        }
        const compilerEnd = performance.now()
        const compilerDuration = compilerEnd - compilerStart

        console.log(`\nComplex calculation (${CALC_ITERATIONS} iterations):`)
        console.log(`Interpreter: ${interpreterDuration.toFixed(2)}ms`)
        console.log(`Compiler: ${compilerDuration.toFixed(2)}ms`)
        console.log(`Speedup: ${(interpreterDuration / compilerDuration).toFixed(2)}x`)

        expect(compilerDuration).toBeLessThan(interpreterDuration)
    })
})
