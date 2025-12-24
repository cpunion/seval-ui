/**
 * Parser Tests
 */

import { describe, expect, it } from 'bun:test'
import { isSymbol, parse, stringify, sym, symName } from '../src/parser'

describe('Parser', () => {
    it('parses numbers', () => {
        expect(parse('42')).toBe(42)
        expect(parse('-3.14')).toBe(-3.14)
    })

    it('parses booleans', () => {
        expect(parse('true')).toBe(true)
        expect(parse('false')).toBe(false)
        expect(parse('#t')).toBe(true)
        expect(parse('#f')).toBe(false)
    })

    it('parses symbols', () => {
        const foo = parse('foo')
        expect(isSymbol(foo)).toBe(true)
        expect(symName(foo as symbol)).toBe('foo')

        const plus = parse('+')
        expect(isSymbol(plus)).toBe(true)
        expect(symName(plus as symbol)).toBe('+')

        const barBaz = parse('bar-baz')
        expect(isSymbol(barBaz)).toBe(true)
        expect(symName(barBaz as symbol)).toBe('bar-baz')
    })

    it('parses lists', () => {
        expect(parse('(+ 1 2)')).toEqual([sym('+'), 1, 2])
        expect(parse('(a b c)')).toEqual([sym('a'), sym('b'), sym('c')])
    })

    it('parses nested lists', () => {
        expect(parse('(+ (* 2 3) 4)')).toEqual([sym('+'), [sym('*'), 2, 3], 4])
    })

    it('parses empty list', () => {
        expect(parse('()')).toEqual([])
    })

    it('handles whitespace', () => {
        expect(parse('  (  +  1  2  )  ')).toEqual([sym('+'), 1, 2])
        expect(parse('(\n\t+\n\t1\n\t2\n)')).toEqual([sym('+'), 1, 2])
    })

    it('skips comments', () => {
        expect(parse('; comment\n42')).toBe(42)
        expect(parse('(+ 1 ; inline comment\n2)')).toEqual([sym('+'), 1, 2])
    })

    it('throws on unclosed paren', () => {
        expect(() => parse('(+ 1 2')).toThrow()
    })

    it('throws on unclosed string', () => {
        expect(() => parse('"hello')).toThrow()
    })

    it('throws on extra input', () => {
        expect(() => parse('1 2')).toThrow()
    })
})

describe('Stringify', () => {
    it('stringifies numbers', () => {
        expect(stringify(42)).toBe('42')
        expect(stringify(-3.14)).toBe('-3.14')
    })

    it('stringifies booleans', () => {
        expect(stringify(true)).toBe('true')
        expect(stringify(false)).toBe('false')
    })

    it('stringifies symbols', () => {
        expect(stringify(sym('foo'))).toBe('foo')
    })

    it('stringifies lists', () => {
        expect(stringify([sym('+'), 1, 2])).toBe('(+ 1 2)')
    })

    it('stringifies nested lists', () => {
        expect(stringify([sym('+'), [sym('*'), 2, 3], 4])).toBe('(+ (* 2 3) 4)')
    })

    it('round-trips expressions', () => {
        const expr = '(let ((x 1) (y 2)) (+ x y))'
        expect(stringify(parse(expr))).toBe(expr)
    })
})
