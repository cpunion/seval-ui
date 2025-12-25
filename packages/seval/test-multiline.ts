import { compileSeval } from './src/seval'

const code = `{
	calcOp(op, a, b) {
		formatNum(
			op == "+" ? a + b :
			op == "-" ? a - b :
			b
		)
	}
}`

console.log('Testing multi-line ternary in function call')
try {
	const env = compileSeval(code)
	console.log('Success! env:', Object.keys(env))
} catch (e) {
	console.error('Error:', (e as Error).message)
}
