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
import { compileSeval, executeSeval } from '@seval-ui/seval'

// Compile Seval code to native JavaScript object
const code = `{
  double(x) { x * 2 },
  add(a, b) { a + b }
}`

const env = compileSeval(code)

// Call methods directly on the compiled object
const result1 = env.double(5)
console.log(result1) // 10

const result2 = env.add(3, 7)
console.log(result2) // 10

// Or use executeSeval for dynamic function calls
const result3 = executeSeval(env, 'double', [5])
console.log(result3) // 10

// With state management (this-based access)
const stateCode = `{
  count: 0,
  increment() { this.count = this.count + 1 }
}`
const stateEnv = compileSeval(stateCode)

// Execute with state tracking
const state = { count: 0 }
executeSeval(stateEnv, 'increment', [], state)
console.log(state.count) // 1
```

## Features

- **Compiles to native JavaScript** – Uses `new Function()` for zero-overhead execution
- **JavaScript-like syntax** – Familiar syntax with arrow functions, objects, if/else, for loops
- **Line comments** – Use `//` for single-line comments
- **Lightweight** – No external dependencies for runtime evaluation
- **Type-safe** – Full TypeScript support with type definitions
- **Sandbox protection** – Blocks access to dangerous reflection properties

## Syntax Overview

```javascript
{
  // State properties
  display: "0",
  count: 0,

  // Methods with implicit return (last expression)
  increment() {
    this.count = this.count + 1
  },

  // Single-expression functions
  double(x) { x * 2 },

  // Control flow with if/elif/else
  action(value) {
    if value > 0 {
      this.display = "positive"
    } elif value < 0 {
      this.display = "negative"
    } else {
      this.display = "zero"
    }
  },

  // For loops (three-part form)
  sum() {
    this.total = 0
    for i = 0; i < 10; i = i + 1 {
      this.total = this.total + i
    }
    this.total  // Returns 45
  },

  // For loops (condition-only form)
  countdown() {
    for this.count > 0 {
      this.count = this.count - 1
    }
  }
}
```

## Built-in Primitives

The Seval runtime includes these built-in functions and globals:

- **Arithmetic**: `+`, `-`, `*`, `/`, `%` (+ also handles string concatenation)
- **Comparison**: `==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`
- **Logical**: `&&`, `||`, `!`
- **Object helpers**: `merge(obj1, obj2, ...)`, `get(obj, key)`
- **Globals**: `Math`, `Number`, `Date`, `String`, `Array`, `Object`

Native JavaScript methods are accessible on values:
- **String**: `s.length`, `s.substring()`, `s.includes()`, `s.startsWith()`, `s.concat()`
- **Array**: `arr.length`, `arr[index]`, `arr.map()`, `arr.filter()`, `arr.concat()`, `arr.push()`
- **Object**: `obj.property`, `obj[key]`

## License

MIT
