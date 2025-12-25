# @seval-ui/seval

> JavaScript-like language with native TypeScript runtime

[![CI](https://github.com/cpunion/seval-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/cpunion/seval-ui/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@seval-ui/seval.svg)](https://www.npmjs.com/package/@seval-ui/seval)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`@seval-ui/seval` is a JavaScript-like language with a native TypeScript runtime for evaluating logic in UI applications.

## Installation

```bash
npm install @seval-ui/seval
# or
pnpm add @seval-ui/seval
```

## Quick Start

```typescript
import { compileSeval } from '@seval-ui/seval/seval'

// Compile Seval code
const code = `{
  double(x) { x * 2 },
  add(a, b) { a + b }
}`

const env = compileSeval(code)

// Execute functions
const result1 = env.exec('double', [5])
console.log(result1) // 10

const result2 = env.exec('add', [3, 7])
console.log(result2) // 10

// Extend environment with custom functions
const extendedEnv = env.bind({
  mul: (a, b) => a * b,
  greet: (name) => `Hello, ${name}!`
})

const result3 = extendedEnv.exec('mul', [5, 6])
console.log(result3) // 30

// Evaluate expressions with nested calls
const result4 = extendedEnv.eval('greet(mul(5, 6))')
console.log(result4) // "Hello, 30!"
```

## Features

- **Native TypeScript runtime** – Direct AST interpretation without intermediate compilation
- **JavaScript-like syntax** – Familiar syntax with arrow functions, objects, if/else
- **Lightweight** – No external dependencies for runtime evaluation
- **Type-safe** – Full TypeScript support with type definitions

## Syntax Overview

```javascript
{
  // State properties
  display: "0",
  count: 0,

  // Methods
  increment() {
    this.count = this.count + 1
  },

  // Arrow functions
  double(x) { x * 2 },

  // Control flow
  action(value) {
    if value > 0 {
      this.display = "positive"
    } elif value < 0 {
      this.display = "negative"
    } else {
      this.display = "zero"
    }
  },

  // For loops
  sum() {
    total = 0
    for (i = 0; i < 10; i = i + 1) {
      total = total + i
    }
  }
}
```

## Built-in Primitives

The Seval runtime includes these built-in functions:

- **Universal**: `value.type`, `value.str()`
- **Arithmetic**: `+`, `-`, `*`, `/`, `%`
- **Comparison**: `=`, `!=`, `<`, `<=`, `>`, `>=`
- **Logic**: `and`, `or`, `not`
- **Number**: `Number.parse(str)`
- **String**: `s.length`, `s.substr()`, `s.contains()`, `s.startsWith()`, `s.concat()`
- **Array**: `[...]` syntax, `arr.length`, `arr[index]`, `arr.first()`, `arr.rest()`, `arr.append()`, `arr.prepend()`, `arr.map()`, `arr.filter()`, `arr.reduce()`
- **Object**: `{...}` syntax, `obj.property`, `obj[key]`, `obj.keys()`, `obj.merge()`
- **Math**: `Math.max()`, `Math.min()`, `Math.round()`, `Math.floor()`, `Math.ceil()`, `Math.abs()`
- **Time**: `Time.now()`

## License

MIT
