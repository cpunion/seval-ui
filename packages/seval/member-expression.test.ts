import { describe, expect, it } from 'vitest'
import { Parser } from './src/seval-parser'
import { Tokenizer } from './src/seval-tokenizer'

describe('Member Expression Parsing', () => {
	it('should parse dot notation', () => {
		const code = 'obj.property'
		const tokens = new Tokenizer(code).tokenize()
		const parser = new Parser(tokens)
		const ast = parser.parseExpression()

		expect(ast).toEqual({
			kind: 'MemberExpression',
			object: { kind: 'Identifier', name: 'obj' },
			property: 'property',
			computed: false,
		})
	})

	it('should parse bracket notation with number', () => {
		const code = 'arr[0]'
		const tokens = new Tokenizer(code).tokenize()
		const parser = new Parser(tokens)
		const ast = parser.parseExpression()

		expect(ast).toEqual({
			kind: 'MemberExpression',
			object: { kind: 'Identifier', name: 'arr' },
			property: { kind: 'NumberLiteral', value: 0 },
			computed: true,
		})
	})

	it('should parse bracket notation with string', () => {
		const code = 'obj["key"]'
		const tokens = new Tokenizer(code).tokenize()
		const parser = new Parser(tokens)
		const ast = parser.parseExpression()

		expect(ast).toEqual({
			kind: 'MemberExpression',
			object: { kind: 'Identifier', name: 'obj' },
			property: { kind: 'StringLiteral', value: 'key' },
			computed: true,
		})
	})

	it('should parse nested member expressions', () => {
		const code = 'obj.nested.deep'
		const tokens = new Tokenizer(code).tokenize()
		const parser = new Parser(tokens)
		const ast = parser.parseExpression()

		expect(ast).toEqual({
			kind: 'MemberExpression',
			object: {
				kind: 'MemberExpression',
				object: { kind: 'Identifier', name: 'obj' },
				property: 'nested',
				computed: false,
			},
			property: 'deep',
			computed: false,
		})
	})

	it('should parse method calls', () => {
		const code = 'obj.method()'
		const tokens = new Tokenizer(code).tokenize()
		const parser = new Parser(tokens)
		const ast = parser.parseExpression()

		expect(ast).toEqual({
			kind: 'CallExpression',
			callee: {
				kind: 'MemberExpression',
				object: { kind: 'Identifier', name: 'obj' },
				property: 'method',
				computed: false,
			},
			args: [],
		})
	})
})
