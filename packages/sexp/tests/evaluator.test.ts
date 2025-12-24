/**
 * Evaluator Tests
 */

import { describe, expect, it } from 'bun:test'
import { type Environment, createEvaluator, isLambda } from '../src'
import { parse } from '../src/parser'

const evaluator = createEvaluator()
const { evaluate, evalString } = evaluator

describe('Arithmetic', () => {
    it('adds numbers', () => {
        expect(evalString('(+ 1 2)')).toBe(3)
        expect(evalString('(+ 1 2 3 4)')).toBe(10)
    })

    it('subtracts numbers', () => {
        expect(evalString('(- 10 3)')).toBe(7)
        expect(evalString('(- 10 3 2)')).toBe(5)
    })

    it('multiplies numbers', () => {
        expect(evalString('(* 3 4)')).toBe(12)
        expect(evalString('(* 2 3 4)')).toBe(24)
    })

    it('divides numbers', () => {
        expect(evalString('(/ 12 3)')).toBe(4)
        expect(evalString('(/ 24 2 3)')).toBe(4)
    })

    it('handles modulo', () => {
        expect(evalString('(% 10 3)')).toBe(1)
        expect(evalString('(% 15 4)')).toBe(3)
    })

    it('handles negative numbers', () => {
        expect(evalString('(- 5)')).toBe(-5)
        expect(evalString('(+ -3 5)')).toBe(2)
    })
})

describe('Comparison', () => {
    it('compares equality', () => {
        expect(evalString('(= 1 1)')).toBe(true)
        expect(evalString('(= 1 2)')).toBe(false)
    })

    it('compares inequality', () => {
        expect(evalString('(!= 1 2)')).toBe(true)
        expect(evalString('(!= 1 1)')).toBe(false)
    })

    it('compares less than', () => {
        expect(evalString('(< 1 2)')).toBe(true)
        expect(evalString('(< 2 1)')).toBe(false)
    })

    it('compares greater than', () => {
        expect(evalString('(> 2 1)')).toBe(true)
        expect(evalString('(> 1 2)')).toBe(false)
    })
})

describe('Logical', () => {
    it('handles and', () => {
        expect(evalString('(and true true)')).toBe(true)
        expect(evalString('(and true false)')).toBe(false)
    })

    it('handles or', () => {
        expect(evalString('(or false true)')).toBe(true)
        expect(evalString('(or false false)')).toBe(false)
    })

    it('handles not', () => {
        expect(evalString('(not true)')).toBe(false)
        expect(evalString('(not false)')).toBe(true)
    })
})

describe('Conditionals', () => {
    it('handles if true', () => {
        expect(evalString('(if true 1 2)')).toBe(1)
    })

    it('handles if false', () => {
        expect(evalString('(if false 1 2)')).toBe(2)
    })

    it('handles cond', () => {
        expect(evalString('(cond ((= 1 2) "a") ((= 1 1) "b") (else "c"))')).toBe('b')
    })

    it('handles cond else', () => {
        expect(evalString('(cond ((= 1 2) "a") ((= 1 3) "b") (else "c"))')).toBe('c')
    })
})

describe('Let Bindings', () => {
    it('binds single variable', () => {
        expect(evalString('(let ((x 5)) x)')).toBe(5)
    })

    it('binds multiple variables', () => {
        expect(evalString('(let ((x 2) (y 3)) (+ x y))')).toBe(5)
    })

    it('handles nested lets', () => {
        expect(evalString('(let ((x 1)) (let ((y 2)) (+ x y)))')).toBe(3)
    })

    it('shadows outer bindings', () => {
        expect(evalString('(let ((x 1)) (let ((x 2)) x))')).toBe(2)
    })
})

describe('Lambda', () => {
    it('creates lambda', () => {
        const result = evalString('(lambda (x) (+ x 1))')
        expect(isLambda(result)).toBe(true)
    })

    it('calls lambda immediately', () => {
        expect(evalString('((lambda (x) (+ x 1)) 5)')).toBe(6)
    })

    it('handles multi-parameter lambda', () => {
        expect(evalString('((lambda (x y) (* x y)) 3 4)')).toBe(12)
    })

    it('supports closures', () => {
        expect(evalString('(let ((n 10)) ((lambda (x) (+ x n)) 5))')).toBe(15)
    })
})

describe('Define', () => {
    it('defines a value', () => {
        const env: Environment = {}
        evaluate(parse('(define x 42)'), env)
        expect(env.x).toBe(42)
    })

    it('defines a function', () => {
        const env: Environment = {}
        evaluate(parse('(define (square x) (* x x))'), env)
        expect(isLambda(env.square)).toBe(true)
        expect(evaluate(parse('(square 5)'), env)).toBe(25)
    })
})

describe('String Operations', () => {
    it('concatenates strings', () => {
        expect(evalString('(concat "hello" " " "world")')).toBe('hello world')
    })

    it('converts to string', () => {
        expect(evalString('(str 42)')).toBe('42')
    })

    it('gets string length', () => {
        expect(evalString('(strlen "hello")')).toBe(5)
    })

    it('checks string contains', () => {
        expect(evalString('(str-contains "hello world" "world")')).toBe(true)
        expect(evalString('(str-contains "hello" "world")')).toBe(false)
    })

    it('parses numbers from strings', () => {
        expect(evalString('(parse-num "42")')).toBe(42)
        expect(evalString('(parse-num "3.14")')).toBe(3.14)
    })
})

describe('Array Operations', () => {
    it('creates lists', () => {
        expect(evalString('(list 1 2 3)')).toEqual([1, 2, 3])
    })

    it('gets list length', () => {
        expect(evalString('(length (list 1 2 3))')).toBe(3)
    })

    it('gets first element', () => {
        expect(evalString('(first (list 1 2 3))')).toBe(1)
    })

    it('gets rest of list', () => {
        expect(evalString('(rest (list 1 2 3))')).toEqual([2, 3])
    })

    it('gets nth element', () => {
        expect(evalString('(nth (list 10 20 30) 1)')).toBe(20)
    })

    it('appends to list', () => {
        expect(evalString('(append (list 1 2) 3)')).toEqual([1, 2, 3])
    })
})

describe('Object Operations', () => {
    it('creates objects', () => {
        expect(evalString('(obj "a" 1 "b" 2)')).toEqual({ a: 1, b: 2 })
    })

    it('gets object property', () => {
        expect(evalString('(get (obj "x" 42) "x")')).toBe(42)
    })

    it('sets object property', () => {
        expect(evalString('(set (obj "x" 1) "y" 2)')).toEqual({ x: 1, y: 2 })
    })

    it('merges objects', () => {
        expect(evalString('(merge (obj "a" 1) (obj "b" 2))')).toEqual({ a: 1, b: 2 })
    })
})

describe('Higher-Order Functions', () => {
    it('maps over list with lambda', () => {
        expect(evalString('(map (lambda (x) (* x 2)) (list 1 2 3))')).toEqual([2, 4, 6])
    })

    it('filters list with lambda', () => {
        expect(evalString('(filter (lambda (x) (> x 2)) (list 1 2 3 4))')).toEqual([3, 4])
    })

    it('reduces list', () => {
        expect(evalString('(reduce (list 1 2 3 4) 0 (acc x) (+ acc x))')).toBe(10)
    })
})

describe('Math Functions', () => {
    it('computes absolute value', () => {
        expect(evalString('(abs -5)')).toBe(5)
        expect(evalString('(abs 5)')).toBe(5)
    })

    it('finds minimum', () => {
        expect(evalString('(min 3 1 4 1 5)')).toBe(1)
    })

    it('finds maximum', () => {
        expect(evalString('(max 3 1 4 1 5)')).toBe(5)
    })

    it('rounds numbers', () => {
        expect(evalString('(round 3.7)')).toBe(4)
        expect(evalString('(floor 3.7)')).toBe(3)
        expect(evalString('(ceil 3.2)')).toBe(4)
    })

    it('clamps values', () => {
        expect(evalString('(clamp 5 0 10)')).toBe(5)
        expect(evalString('(clamp -5 0 10)')).toBe(0)
        expect(evalString('(clamp 15 0 10)')).toBe(10)
    })
})

describe('Custom Primitives', () => {
    it('allows custom primitives', () => {
        const custom = createEvaluator({
            primitives: {
                double: (args) => (args[0] as number) * 2,
            },
        })
        expect(custom.evalString('(double 21)')).toBe(42)
    })

    it('can override built-in primitives', () => {
        const custom = createEvaluator({
            primitives: {
                '+': (args) => (args[0] as number) - (args[1] as number), // evil +
            },
        })
        expect(custom.evalString('(+ 10 3)')).toBe(7)
    })
})
