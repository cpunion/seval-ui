import { describe, expect, test } from 'bun:test'
import { compileSeval, executeSeval } from './src/seval'

describe('Multi-Statement Function Bodies', () => {
    test('single statement function (backward compatibility)', () => {
        const code = `{
			add(a, b) {
				a + b
			}
		}`

        const env = compileSeval(code)
        console.log('Compiled env:', env)
        console.log('add function:', env.add)

        const result = executeSeval(env, 'add', [2, 3])
        expect(result).toBe(5)
    })

    test('multi-statement function body', () => {
        const code = `{
			calculate(x) {
				a = x * 2
				b = a + 10
				b / 2
			}
		}`

        const env = compileSeval(code)
        console.log('Compiled env:', env)
        console.log('calculate function:', env.calculate)

        const result = executeSeval(env, 'calculate', [5])
        expect(result).toBe(10) // (5 * 2 + 10) / 2 = 10
    })

    test('multi-statement with this', () => {
        const code = `{
			count: 0,
			increment() {
				this.count = this.count + 1
				this.count = this.count * 2
				this.count
			}
		}`

        const env = compileSeval(code)
        const result = executeSeval(env, 'increment')
        expect(result).toBe(2)
        expect(env.count).toBe(2)
    })
})
