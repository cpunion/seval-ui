/**
 * Symbol-based Parser and Evaluator Tests
 */
import { describe, expect, it } from 'bun:test'
import { createEvaluator } from '../src/evaluator'
import { isSymbol, parse, stringify, sym, symName } from '../src/parser'

describe('Parser with Symbol', () => {
    it('parses identifier as Symbol', () => {
        const result = parse('foo')
        expect(isSymbol(result)).toBe(true)
        expect(symName(result as symbol)).toBe('foo')
    })

    it('parses string as string', () => {
        const result = parse('"hello"')
        expect(typeof result).toBe('string')
        expect(result).toBe('hello')
    })

    it('parses number', () => {
        const result = parse('42')
        expect(typeof result).toBe('number')
        expect(result).toBe(42)
    })

    it('parses boolean', () => {
        expect(parse('true')).toBe(true)
        expect(parse('false')).toBe(false)
    })

    it('parses null', () => {
        expect(parse('null')).toBe(null)
    })

    it('parses list with symbols', () => {
        const result = parse('(+ 1 2)')
        expect(Array.isArray(result)).toBe(true)
        const [op, a, b] = result as unknown[]
        expect(isSymbol(op)).toBe(true)
        expect(symName(op as symbol)).toBe('+')
        expect(a).toBe(1)
        expect(b).toBe(2)
    })
})

describe('Stringify', () => {
    it('stringifies symbol', () => {
        expect(stringify(sym('foo'))).toBe('foo')
    })

    it('stringifies string with quotes', () => {
        expect(stringify('hello')).toBe('"hello"')
    })

    it('stringifies number', () => {
        expect(stringify(42)).toBe('42')
    })

    it('stringifies list', () => {
        expect(stringify([sym('+'), 1, 2])).toBe('(+ 1 2)')
    })
})

describe('Evaluator with Symbol', () => {
    const { evalString } = createEvaluator()

    it('evaluates number', () => {
        expect(evalString('42')).toBe(42)
    })

    it('evaluates string literal', () => {
        expect(evalString('"hello"')).toBe('hello')
    })

    it('looks up variable', () => {
        expect(evalString('x', { x: 42 })).toBe(42)
    })

    it('evaluates addition', () => {
        expect(evalString('(+ 1 2)')).toBe(3)
    })

    it('evaluates with string key', () => {
        const env = { context: { digit: 9 } }
        // "digit" is now a plain string, get should work
        expect(evalString('(get context "digit")', env)).toBe(9)
    })

    it('evaluates define', () => {
        const env = {}
        evalString('(define x 42)', env)
        expect(env).toHaveProperty('x', 42)
    })

    it('evaluates lambda', () => {
        expect(evalString('((lambda (x) (+ x 1)) 5)')).toBe(6)
    })
})
