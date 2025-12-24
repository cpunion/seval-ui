# @seval-ui/react

> React components for S-expression based UI runtime

[![CI](https://github.com/cpunion/seval-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/cpunion/seval-ui/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@seval-ui/react.svg)](https://www.npmjs.com/package/@seval-ui/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`@seval-ui/react` provides React components and hooks for rendering UIs driven by A2UI protocol messages.

## Installation

```bash
npm install @seval-ui/react
# or
pnpm add @seval-ui/react
```

For S-expression runtime support, also install:
```bash
pnpm add @seval-ui/react-code
```

## Quick Start

```tsx
import {
  A2UIProvider,
  SurfaceView,
  createA2UIContextStore
} from '@seval-ui/react'

const store = createA2UIContextStore()

function App() {
  return (
    <A2UIProvider store={store}>
      <SurfaceView surfaceId="main" />
    </A2UIProvider>
  )
}
```

## Features

- **A2UI Protocol Support** - Render UIs from A2UI messages
- **Component Registry** - Extensible component catalog
- **React Hooks** - `useA2UIContextStore`, `useA2UISurface`, etc.
- **Zero seval dependency** - Pure UI library (use @seval-ui/react-code for runtime)

## Exports

### Components
- `A2UIProvider` - Context provider
- `SurfaceView` - Render a surface

### Hooks
- `createA2UIContextStore()` - Create a store
- `useA2UIContextStore()` - Access the store
- `useA2UISurface(surfaceId)` - Get surface data
- `useRendererContext()` - Component renderer context

### Types
- `A2UIMessage`, `SurfaceUpdateMessage`, `DataModelUpdateMessage`
- `ComponentRegistry`, `RendererContext`

## License

MIT
