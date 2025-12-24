/**
 * Tokenizer Tests
 */

import { describe, expect, it } from 'bun:test'
import { TokenType, tokenize } from '../src/tokenizer'

describe('Tokenizer', () => {
    it('tokenizes numbers', () => {
        const tokens = tokenize('42 -3.14 0')
        expect(tokens[0]).toMatchObject({ type: TokenType.Number, value: 42 })
        expect(tokens[1]).toMatchObject({ type: TokenType.Number, value: -3.14 })
        expect(tokens[2]).toMatchObject({ type: TokenType.Number, value: 0 })
    })

    it('tokenizes booleans', () => {
        const tokens = tokenize('true false #t #f')
        expect(tokens[0]).toMatchObject({ type: TokenType.Boolean, value: true })
        expect(tokens[1]).toMatchObject({ type: TokenType.Boolean, value: false })
        expect(tokens[2]).toMatchObject({ type: TokenType.Boolean, value: true })
        expect(tokens[3]).toMatchObject({ type: TokenType.Boolean, value: false })
    })

    it('tokenizes symbols', () => {
        const tokens = tokenize('foo + bar-baz')
        expect(tokens[0]).toMatchObject({ type: TokenType.Symbol, value: 'foo' })
        expect(tokens[1]).toMatchObject({ type: TokenType.Symbol, value: '+' })
        expect(tokens[2]).toMatchObject({ type: TokenType.Symbol, value: 'bar-baz' })
    })

    it('tokenizes strings', () => {
        const tokens = tokenize('"hello" "world"')
        expect(tokens[0]).toMatchObject({ type: TokenType.String, value: 'hello' })
        expect(tokens[1]).toMatchObject({ type: TokenType.String, value: 'world' })
    })

    it('tokenizes string escapes', () => {
        const tokens = tokenize('"hello\\nworld" "tab\\there"')
        expect(tokens[0]).toMatchObject({ type: TokenType.String, value: 'hello\nworld' })
        expect(tokens[1]).toMatchObject({ type: TokenType.String, value: 'tab\there' })
    })

    it('tokenizes parentheses', () => {
        const tokens = tokenize('(+ 1 2)')
        expect(tokens[0]).toMatchObject({ type: TokenType.LeftParen })
        expect(tokens[1]).toMatchObject({ type: TokenType.Symbol, value: '+' })
        expect(tokens[2]).toMatchObject({ type: TokenType.Number, value: 1 })
        expect(tokens[3]).toMatchObject({ type: TokenType.Number, value: 2 })
        expect(tokens[4]).toMatchObject({ type: TokenType.RightParen })
        expect(tokens[5]).toMatchObject({ type: TokenType.EOF })
    })

    it('skips comments', () => {
        const tokens = tokenize('; comment\n42')
        expect(tokens[0]).toMatchObject({ type: TokenType.Number, value: 42 })
    })

    it('tracks line and column', () => {
        const tokens = tokenize('foo\nbar')
        expect(tokens[0]).toMatchObject({ line: 1, column: 1 })
        expect(tokens[1]).toMatchObject({ line: 2, column: 1 })
    })
})
