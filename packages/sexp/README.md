# seval.js

> S-expression evaluator for TypeScript/JavaScript

[![CI](https://github.com/cpunion/seval.js/actions/workflows/ci.yml/badge.svg)](https://github.com/cpunion/seval.js/actions/workflows/ci.yml)
[![Codecov](https://codecov.io/gh/cpunion/seval.js/branch/main/graph/badge.svg)](https://codecov.io/gh/cpunion/seval.js)
[![npm version](https://img.shields.io/npm/v/seval.js.svg)](https://www.npmjs.com/package/seval.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`seval.js` is a safe, sandboxed S-expression parser and evaluator. It's designed to be easily extensible and embeddable in JavaScript/TypeScript applications.

## Installation

```bash
npm install seval.js
# or
bun add seval.js
```

## Quick Start

```typescript
import { evalString, createEvaluator } from 'seval.js'

// Simple evaluation
evalString('(+ 1 2 3)')     // 6
evalString('(* 2 (+ 3 4))') // 14

// Conditional and logic
evalString('(if (> 5 3) "yes" "no")') // "yes"
evalString('(and true (not false))')  // true

// Lambda and closures
evalString('((lambda (x) (* x x)) 5)') // 25

// Custom primitives
const evaluator = createEvaluator({
  primitives: {
    uuid: () => crypto.randomUUID(),
    greet: (args) => `Hello, ${args[0]}!`,
  }
})
evaluator.evalString('(greet "World")') // "Hello, World!"
```

## Features

- **Safe sandboxed evaluation** - No access to global scope or dangerous APIs
- **Rich primitive library** - 60+ built-in functions for math, strings, arrays, objects
- **Lambda and closures** - First-class functions with lexical scoping
- **Customizable** - Add or override primitives easily
- **TypeScript support** - Full type definitions included

## Built-in Primitives

### Arithmetic
`+`, `-`, `*`, `/`, `%`

### Comparison
`=`, `!=`, `<`, `>`, `<=`, `>=`

### Logical
`and`, `or`, `not`

### Math
`abs`, `min`, `max`, `floor`, `ceil`, `round`, `sqrt`, `pow`, `clamp`, `sin`, `cos`, `tan`, `log`, `exp`, `random`

### Strings
`concat`, `str`, `strlen`, `substr`, `str-starts-with`, `str-ends-with`, `str-contains`, `str-replace`, `str-split`, `str-join`, `str-trim`, `str-upper`, `str-lower`, `parse-num`, `parse-int`

### Arrays
`list`, `length`, `first`, `rest`, `last`, `nth`, `append`, `prepend`, `concat-lists`, `slice`, `reverse`, `range`, `empty?`, `contains`, `index-of`

### Objects
`obj`, `get`, `set`, `keys`, `values`, `has-key`, `update-at`, `merge`

### Type checks
`null?`, `number?`, `string?`, `bool?`, `list?`, `object?`

## Special Forms

```lisp
; Conditionals
(if condition then-expr else-expr)
(cond (test1 expr1) (test2 expr2) (else exprN))

; Variable bindings
(let ((x 1) (y 2)) (+ x y))

; Functions
(lambda (x y) (+ x y))
(define (square x) (* x x))
(define pi 3.14159)

; Sequences
(begin expr1 expr2 ...)
(progn expr1 expr2 ...)

; Higher-order functions
(map (lambda (x) (* x 2)) (list 1 2 3))        ; (2 4 6)
(filter (lambda (x) (> x 2)) (list 1 2 3 4))   ; (3 4)
(reduce (list 1 2 3) 0 (acc x) (+ acc x))      ; 6
```

## API

### `evalString(code: string): Value`
Parse and evaluate an S-expression string.

### `evaluate(expr: SExpr, env?: Environment): Value`
Evaluate a parsed S-expression AST.

### `parse(code: string): SExpr`
Parse an S-expression string into an AST.

### `stringify(expr: SExpr): string`
Convert an AST back to string.

### `createEvaluator(options?: EvaluatorOptions)`
Create a custom evaluator with additional primitives.

```typescript
interface EvaluatorOptions {
  primitives?: Record<string, PrimitiveFunction>
  maxDepth?: number  // default: 100
}
```

## License

MIT
