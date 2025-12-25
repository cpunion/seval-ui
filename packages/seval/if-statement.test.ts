import { describe, expect, test } from 'bun:test'
import { compileSeval, executeSeval } from './src/seval'

describe('If/Elif/Else Statements', () => {
    test('simple if statement', () => {
        const code = `{
			check(x) {
				if (x > 0) {
					this.result = "positive"
				}
				this.result
			}
		}`

        const env = compileSeval(code)
        const result = executeSeval(env, 'check', [5])
        expect(result).toBe('positive')
    })

    test('if/else statement', () => {
        const code = `{
			check(x) {
				if (x > 0) {
					this.result = "positive"
				} else {
					this.result = "non-positive"
				}
				this.result
			}
		}`

        const env = compileSeval(code)
        expect(executeSeval(env, 'check', [5])).toBe('positive')
        expect(executeSeval(env, 'check', [-5])).toBe('non-positive')
    })

    test('if/elif/else statement', () => {
        const code = `{
			check(x) {
				if (x > 0) {
					this.result = "positive"
				} elif (x < 0) {
					this.result = "negative"
				} else {
					this.result = "zero"
				}
				this.result
			}
		}`

        const env = compileSeval(code)
        expect(executeSeval(env, 'check', [5])).toBe('positive')
        expect(executeSeval(env, 'check', [-5])).toBe('negative')
        expect(executeSeval(env, 'check', [0])).toBe('zero')
    })

    test('nested if statements', () => {
        const code = `{
			check(x, y) {
				if (x > 0) {
					if (y > 0) {
						this.result = "both positive"
					} else {
						this.result = "x positive, y non-positive"
					}
				} else {
					this.result = "x non-positive"
				}
				this.result
			}
		}`

        const env = compileSeval(code)
        expect(executeSeval(env, 'check', [5, 3])).toBe('both positive')
        expect(executeSeval(env, 'check', [5, -3])).toBe('x positive, y non-positive')
        expect(executeSeval(env, 'check', [-5, 3])).toBe('x non-positive')
    })

    test('if with multiple statements in blocks', () => {
        const code = `{
			process(x) {
				if (x > 10) {
					this.status = "large"
					this.multiplier = 2
					this.result = x * 2
				} else {
					this.status = "small"
					this.multiplier = 1
					this.result = x
				}
				this.result
			}
		}`

        const env = compileSeval(code)
        expect(executeSeval(env, 'process', [15])).toBe(30)
        expect(executeSeval(env, 'process', [5])).toBe(5)
    })
})
