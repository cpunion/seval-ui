import { beforeAll, describe, expect, test } from 'bun:test'
import { type Environment, compileSeval, executeSeval } from './src/seval'

// Full calculator code from calculator.seval
const CALCULATOR_CODE = `{
	hasDecimal(s) { String(s).includes(".") },
	negateStr(s) { s == "0" ? "0" : s.startsWith("-") ? s.substring(1) : "-" + s },
	formatNum(n) { String(Math.round(n * 1000000000) / 1000000000) },
	calcOp(op, a, b) {
		formatNum(
			op == "+" ? Number.parseFloat(a) + Number.parseFloat(b) :
			op == "-" ? Number.parseFloat(a) - Number.parseFloat(b) :
			op == "*" ? Number.parseFloat(a) * Number.parseFloat(b) :
			op == "/" ? (Number.parseFloat(b) == 0 ? 0 : Number.parseFloat(a) / Number.parseFloat(b)) :
			Number.parseFloat(b)
		)
	},

	action_digit() {
		if (waitingForOperand) {
			this.display = String(context.digit)
			this.waitingForOperand = false
		} else {
			this.display = display + String(context.digit)
		}
	}

	action_decimal() {
		if (!hasDecimal(display)) {
			this.display = display + "."
		}
	}

	action_clear() {
		this.display = "0"
		this.memory = "0"
		this.operator = ""
		this.waitingForOperand = false
		this.history = ""
	}

	action_negate() {
		this.display = negateStr(display)
	}

	action_percent() {
		this.display = formatNum(Number.parseFloat(display) / 100)
	}

	action_operator() {
		if (waitingForOperand) {
			this.memory = display
			this.operator = context.op
			this.waitingForOperand = true
			this.history = display + " " + context.op
		} else {
			result = calcOp(operator, memory, display)
			this.display = result
			this.memory = result
			this.operator = context.op
			this.waitingForOperand = true
			this.history = result + " " + context.op
		}
	}

	action_equals() {
		if (!waitingForOperand) {
			this.display = calcOp(operator, memory, display)
			this.memory = "0"
			this.operator = ""
			this.waitingForOperand = true
			this.history = ""
		}
	}
}`


describe('Calculator Comprehensive Tests', () => {
	let env: Environment

	beforeAll(() => {
		env = compileSeval(CALCULATOR_CODE)
		expect(env).toBeDefined()
	})

	describe('Helper Functions', () => {
		test('hasDecimal - detects decimal point', () => {
			expect(executeSeval(env, 'hasDecimal', ['3.14'])).toBe(true)
			expect(executeSeval(env, 'hasDecimal', ['42'])).toBe(false)
			expect(executeSeval(env, 'hasDecimal', ['0.0'])).toBe(true)
		})

		test('negateStr - negates number strings', () => {
			expect(executeSeval(env, 'negateStr', ['5'])).toBe('-5')
			expect(executeSeval(env, 'negateStr', ['-5'])).toBe('5')
			expect(executeSeval(env, 'negateStr', ['0'])).toBe('0')
		})

		test('formatNum - formats numbers', () => {
			expect(executeSeval(env, 'formatNum', [1.23456])).toBe('1.23456')
			expect(executeSeval(env, 'formatNum', [10])).toBe('10')
			expect(executeSeval(env, 'formatNum', [0.1 + 0.2])).toBe('0.3') // handles floating point
		})

		test('calcOp - performs arithmetic operations', () => {
			expect(executeSeval(env, 'calcOp', ['+', '5', '3'])).toBe('8')
			expect(executeSeval(env, 'calcOp', ['-', '10', '3'])).toBe('7')
			expect(executeSeval(env, 'calcOp', ['*', '4', '5'])).toBe('20')
			expect(executeSeval(env, 'calcOp', ['/', '15', '3'])).toBe('5')
			expect(executeSeval(env, 'calcOp', ['/', '1', '0'])).toBe('0') // division by zero
		})
	})

	describe('Action: digit', () => {
		test('enters first digit when waiting for operand', () => {
			const state = {
				display: '0',
				waitingForOperand: true,
				context: { digit: 5 },
			}
			const result = executeSeval(env, 'action_digit', [], state)
			expect(result).toEqual([
				['display', '5'],
				['waitingForOperand', false],
			])
		})

		test('appends digit when not waiting for operand', () => {
			const state = {
				display: '12',
				waitingForOperand: false,
				context: { digit: 3 },
			}
			const result = executeSeval(env, 'action_digit', [], state)
			expect(result).toEqual([['display', '123']])
		})
	})

	describe('Action: decimal', () => {
		test('starts with 0. when waiting for operand', () => {
			const state = {
				display: '0',
				waitingForOperand: true,
				context: {},
			}
			const result = executeSeval(env, 'action_decimal', [], state)
			expect(result).toEqual([
				['display', '0.'],
				['waitingForOperand', false],
			])
		})

		test('adds decimal point if not present', () => {
			const state = {
				display: '42',
				waitingForOperand: false,
				context: {},
			}
			const result = executeSeval(env, 'action_decimal', [], state)
			expect(result).toEqual([['display', '42.']])
		})

		test('does nothing if decimal already present', () => {
			const state = {
				display: '3.14',
				waitingForOperand: false,
				context: {},
			}
			const result = executeSeval(env, 'action_decimal', [], state)
			expect(result).toEqual([])
		})
	})

	describe('Action: clear', () => {
		test('resets all state to initial values', () => {
			const state = {
				display: '123',
				memory: '456',
				operator: '+',
				waitingForOperand: false,
				history: '456 +',
			}
			const result = executeSeval(env, 'action_clear', [], state)
			expect(result).toEqual([
				['display', '0'],
				['memory', '0'],
				['operator', ''],
				['waitingForOperand', true],
				['history', ''],
			])
		})
	})

	describe('Action: negate', () => {
		test('negates positive number', () => {
			const state = { display: '5' }
			const result = executeSeval(env, 'action_negate', [], state)
			expect(result).toEqual([['display', '-5']])
		})

		test('negates negative number', () => {
			const state = { display: '-5' }
			const result = executeSeval(env, 'action_negate', [], state)
			expect(result).toEqual([['display', '5']])
		})

		test('keeps zero as zero', () => {
			const state = { display: '0' }
			const result = executeSeval(env, 'action_negate', [], state)
			expect(result).toEqual([['display', '0']])
		})
	})

	describe('Action: percent', () => {
		test('converts to percentage', () => {
			const state = { display: '50' }
			const result = executeSeval(env, 'action_percent', [], state)
			expect(result).toEqual([['display', '0.5']])
		})

		test('handles already small numbers', () => {
			const state = { display: '5' }
			const result = executeSeval(env, 'action_percent', [], state)
			expect(result).toEqual([['display', '0.05']])
		})
	})

	describe('Action: operator', () => {
		test('stores first operand when no operator set', () => {
			const state = {
				display: '5',
				operator: '',
				memory: '0',
				history: '',
				waitingForOperand: false,
				context: { op: '+' },
			}
			const result = executeSeval(env, 'action_operator', [], state)
			expect(result).toEqual([
				['memory', '5'],
				['operator', '+'],
				['waitingForOperand', true],
				['history', '5 +'],
			])
		})

		test('calculates intermediate result when operator already set', () => {
			const state = {
				display: '3',
				operator: '+',
				memory: '5',
				history: '5 +',
				waitingForOperand: false,
				context: { op: '*' },
			}
			const result = executeSeval(env, 'action_operator', [], state)
			// 5 + 3 = 8, then set operator to *
			expect(result).toEqual([
				['display', '8'],
				['memory', '8'],
				['operator', '*'],
				['waitingForOperand', true],
				['history', '8 *'],
			])
		})
	})

	describe('Action: equals', () => {
		test('does nothing when no operator set', () => {
			const state = {
				display: '5',
				operator: '',
				memory: '0',
			}
			const result = executeSeval(env, 'action_equals', [], state)
			expect(result).toEqual([])
		})

		test('calculates final result', () => {
			const state = {
				display: '3',
				operator: '+',
				memory: '5',
				history: '5 +',
				waitingForOperand: false,
			}
			const result = executeSeval(env, 'action_equals', [], state)
			expect(result).toEqual([
				['display', '8'],
				['memory', '0'],
				['operator', ''],
				['waitingForOperand', true],
				['history', '5 + 3 = 8'],
			])
		})
	})

	describe('Full calculation scenarios', () => {
		test('scenario: 5 + 3 = 8', () => {
			// Setup: display shows "5", press "+"
			// biome-ignore lint/suspicious/noExplicitAny: Dynamic test state
			let state: any = {
				display: '5',
				operator: '',
				memory: '0',
				history: '',
				waitingForOperand: false,
				context: { op: '+' },
			}

			let updates = executeSeval(env, 'action_operator', [], state)
			// Apply updates
			state = { ...state, memory: '5', operator: '+', waitingForOperand: true, history: '5 +' }

			// Enter 3
			state.context = { digit: 3 }
			updates = executeSeval(env, 'action_digit', [], state)
			state = { ...state, display: '3', waitingForOperand: false }

			// Press equals
			updates = executeSeval(env, 'action_equals', [], state)
			expect(updates[0]).toEqual(['display', '8'])
		})

		test('scenario: 10 - 3 * 2 = 14 (sequential operations)', () => {
			// Start with 10
			// biome-ignore lint/suspicious/noExplicitAny: Dynamic test state
			let state: any = {
				display: '10',
				operator: '',
				memory: '0',
				history: '',
				waitingForOperand: false,
				context: { op: '-' },
			}

			// Press -
			executeSeval(env, 'action_operator', [], state)
			state = { ...state, memory: '10', operator: '-', waitingForOperand: true }

			// Enter 3
			state.context = { digit: 3 }
			executeSeval(env, 'action_digit', [], state)
			state = { ...state, display: '3', waitingForOperand: false }

			// Press * (should calculate 10 - 3 = 7 first)
			state.context = { op: '*' }
			const result = executeSeval(env, 'action_operator', [], state)
			expect(result[0]).toEqual(['display', '7']) // 10 - 3
			expect(result[2]).toEqual(['operator', '*'])
		})
	})
})

// Additional tests for primitive coverage
describe('Seval Primitives Coverage', () => {
	test('array element modification', () => {
		const code = `{
            modifyArray(arr, idx, val) {
				newArr = [...arr]
				newArr[idx] = val
				newArr
			}
        }`
		const env = compileSeval(code)
		const arr = [1, 2, 3]
		const result = executeSeval(env, 'modifyArray', [arr, 1, 99])
		expect(result).toEqual([1, 99, 3])
		expect(arr).toEqual([1, 2, 3]) // Original unchanged
	})

	test('obj creates object from key-value pairs', () => {
		const code = `{
            createPerson(name, age) { obj("name", name, "age", age) }
        }`
		const env = compileSeval(code)
		const result = executeSeval(env, 'createPerson', ['Alice', 30])
		expect(result).toEqual({ name: 'Alice', age: 30 })
	})

	test('merge combines objects', () => {
		const code = `{
            mergeObjs(a, b) { merge(a, b) }
        }`
		const env = compileSeval(code)
		const result = executeSeval(env, 'mergeObjs', [{ x: 1 }, { y: 2 }])
		expect(result).toEqual({ x: 1, y: 2 })
	})

	test('floor and ceil math functions', () => {
		const code = `{
            testFloor(n) { Math.floor(n) },
            testCeil(n) { Math.ceil(n) }
        }`
		const env = compileSeval(code)
		expect(executeSeval(env, 'testFloor', [3.7])).toBe(3)
		expect(executeSeval(env, 'testCeil', [3.2])).toBe(4)
	})

	test('now returns timestamp', () => {
		const code = `{
            getTime() { now() }
        }`
		const env = compileSeval(code)
		const result = executeSeval(env, 'getTime', []) as number
		expect(typeof result).toBe('number')
		expect(result).toBeGreaterThan(1700000000000) // After 2023
	})
})
