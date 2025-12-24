# a2ui-react

> React integration for S-expression based UI runtime

[![npm version](https://img.shields.io/npm/v/a2ui-react.svg)](https://www.npmjs.com/package/a2ui-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`a2ui-react` provides React hooks and utilities for building UIs with S-expression based logic using [seval](../seval.js).

## Installation

```bash
npm install a2ui-react
# or
bun add a2ui-react
```

## Quick Start

```tsx
import { createStore, useSurface } from 'a2ui-react'

const store = createStore()

function Counter() {
  const { dataModel, dispatch } = useSurface(store, 'counter', { count: 0 }, `
    (define (action:increment)
      (list (list "count" (+ count 1))))

    (define (action:decrement)
      (list (list "count" (- count 1))))
  `)

  return (
    <div>
      <h1>Count: {dataModel.count}</h1>
      <button onClick={() => dispatch('decrement')}>-</button>
      <button onClick={() => dispatch('increment')}>+</button>
    </div>
  )
}
```

## API

### Store

#### `createStore(): A2UIStore`
Create a new A2UI store instance.

#### `useStore(store): A2UIStore`
React hook to subscribe to store changes.

### Surface

#### `useSurface(store, surfaceId, initialData?, code?)`
Create and manage a surface with S-expression runtime.

Returns:
- `surface` - The surface object
- `dataModel` - Current data model object
- `version` - Current version number
- `dispatch(actionName, context?)` - Dispatch an action
- `evaluate(expr, context?)` - Evaluate an S-expression
- `runtime` - The SExpRuntime instance

### Actions

Actions are S-expression functions that return a list of `[key, value]` pairs to update the data model:

```lisp
(define (action:myAction)
  (list
    (list "key1" "value1")
    (list "key2" (+ someVar 1))))
```

## Re-exported from seval

For convenience, common seval functions are re-exported:
- `evalString`, `evaluate`, `parse`, `stringify`
- `createEvaluator`, `isLambda`, `defaultPrimitives`

## License

MIT
