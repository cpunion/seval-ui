# @seval-ui/react-code

> Seval runtime integration for @seval-ui/react

[![CI](https://github.com/cpunion/seval-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/cpunion/seval-ui/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@seval-ui/react-code.svg)](https://www.npmjs.com/package/@seval-ui/react-code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`@seval-ui/react-code` provides Seval runtime support for A2UI surfaces, enabling local execution of UI logic without agent round-trips.

## Installation

```bash
npm install @seval-ui/react-code
# or
pnpm add @seval-ui/react-code
```

## Quick Start

```tsx
import { A2UIProvider } from '@seval-ui/react'
import { createCodeComponent } from '@seval-ui/react-code'

const codeComponent = createCodeComponent()

function App() {
  return (
    <A2UIProvider components={[codeComponent]}>
      <SurfaceView surfaceId="main" />
    </A2UIProvider>
  )
}
```

## Features

- **SevalRuntime** - Compiles and executes Seval code for local state management
- **Code Component** - A2UI catalog component that embeds executable logic
- **Local Action Handling** - Process actions locally for responsive UIs

## Exports

- `SevalRuntime` - Runtime class for Seval execution
- `createSevalActionHandler` - Create action handler for A2UI store
- `createCodeComponent` - Create Code component for A2UI catalog
- `CodeRenderer` - React component for rendering Code
- Re-exports from `@seval-ui/seval`: `compileSeval`, `executeSeval`, `Tokenizer`, `Parser`

## License

MIT
