# @seval-ui/seval

> JavaScript-like language that compiles to S-expressions

[![CI](https://github.com/cpunion/seval-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/cpunion/seval-ui/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@seval-ui/seval.svg)](https://www.npmjs.com/package/@seval-ui/seval)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`@seval-ui/seval` is a self-hosted compiler that converts JavaScript-like syntax into S-expressions for evaluation with [@seval-ui/sexp](../sexp).

## Installation

```bash
npm install @seval-ui/seval @seval-ui/sexp
# or
pnpm add @seval-ui/seval @seval-ui/sexp
```

## Quick Start

```typescript
import { createEvaluator, deserializeSExpr } from '@seval-ui/sexp'
import compilerSource from '@seval-ui/seval'

const { evalString, evaluate } = createEvaluator({ maxDepth: 10_000 })
const env = {}

// Load the compiler
evalString(`(progn ${compilerSource})`, env)

// Compile and evaluate a program
const miniProgram = 'x => x + 1'
const sexprRaw = evalString(
  `(compile-to-sexpr "${miniProgram.replace(/"/g, '\\"')}")`,
  env,
)
const sexpr = deserializeSExpr(sexprRaw)
evaluate(sexpr, env)
```

## Features

- **Self-hosted compiler** – tokenizer, parser and transformer written in seval
- **JavaScript-like syntax** – familiar syntax with arrow functions, objects, if/else
- **Embeddable** – returns compiler source as string for custom toolchains
- **Integration tested** – includes calculator example for e2e testing

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

## Built-in Helpers

When using seval programs, register these primitives:

- **String helpers**: `parseNum`, `str`, `strContains`, `strStartsWith`, `substr`
- **Collection helpers**: `list`, `append`, `obj`, `get`, `set`
- **Control constructs**: `if`, `cond`, `progn`, `define`, `lambda`, `let`, `for`

## License

MIT
