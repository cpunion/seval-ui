# @seval-ui/seval

> JavaScript-like language that compiles to S-expressions

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
import { compileSeval, executeSeval } from '@seval-ui/seval/seval'

// Compile Seval code
const code = `{
  double(x) { x * 2 },
  add(a, b) { a + b }
}`

const env = compileSeval(code)

// Execute functions
const result1 = executeSeval(env, 'double', [5])
console.log(result1) // 10

const result2 = executeSeval(env, 'add', [3, 7])
console.log(result2) // 10
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
    count = count + 1
  },

  // Arrow functions
  double(x) { x * 2 },

  // Control flow
  action(value) {
    if value > 0 {
      display = "positive"
    } elif value < 0 {
      display = "negative"
    } else {
      display = "zero"
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

- **Arithmetic**: `+`, `-`, `*`, `/`, `%`
- **Comparison**: `=`, `!=`, `<`, `<=`, `>`, `>=`
- **Logic**: `and`, `or`, `not`
- **String**: `str`, `parseNum`, `strContains`, `strStartsWith`, `substr`
- **Array**: `list`, `nth`, `length`, `updateAt`, `append`, `prepend`, `first`, `rest`, `filter`, `map`, `reduce`
- **Object**: `obj`, `get`, `merge`
- **Math**: `max`, `min`, `round`, `floor`, `ceil`
- **Time**: `now`

## License

MIT
