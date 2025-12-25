# seval-ui

[![CI](https://github.com/cpunion/seval-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/cpunion/seval-ui/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/cpunion/seval-ui/graph/badge.svg)](https://codecov.io/gh/cpunion/seval-ui)
[![npm @seval-ui/seval](https://img.shields.io/npm/v/@seval-ui/seval?label=%40seval-ui%2Fseval)](https://www.npmjs.com/package/@seval-ui/seval)
[![npm @seval-ui/react](https://img.shields.io/npm/v/@seval-ui/react?label=%40seval-ui%2Freact)](https://www.npmjs.com/package/@seval-ui/react)
[![npm @seval-ui/react-code](https://img.shields.io/npm/v/@seval-ui/react-code?label=%40seval-ui%2Freact-code)](https://www.npmjs.com/package/@seval-ui/react-code)

A2UI (Agent to UI) protocol implementation for React, enabling AI Agents to dynamically render user interfaces.

> A2UI is an open protocol by Google. See [github.com/google/A2UI](https://github.com/google/A2UI) for the specification.

## Overview

seval-ui provides a complete solution for building agent-driven UIs:

- **@seval-ui/react** - A2UI protocol renderer for React
- **@seval-ui/react-code** - Local interaction capabilities with Seval scripting
- **@seval-ui/seval** - Lightweight JavaScript-like language for UI logic

## What is A2UI?

A2UI (Agent to UI) is a JSON streaming protocol that allows AI Agents to dynamically create and update user interfaces. The agent sends structured messages to create surfaces, update components, and modify data models, while user interactions are sent back as actions.

```
Agent → createSurface → updateComponents → updateDataModel → Client renders UI
User interaction → userAction → Agent processes → Agent responds with updates
```

## Packages

### @seval-ui/react

React implementation of the A2UI protocol:

- **A2UIProvider** - Context provider that manages store and renders surfaces
- **SurfaceView** - Renders a single surface's component tree
- **Store** - MobX State Tree based reactive state management
- **Catalog** - Extensible component registry

```tsx
import { A2UIProvider, useA2UIIngest, useA2UIStore } from '@seval-ui/react'

function App() {
  return (
    <A2UIProvider>
      <AgentUI />
    </A2UIProvider>
  )
}
```

#### Agent Integration

To integrate with an AI Agent, you need to:

1. **Receive A2UI messages** from the agent and ingest them into the store
2. **Send user actions** back to the agent when users interact with the UI

```tsx
import { useCallback, useEffect } from 'react'
import { useA2UIIngest, useA2UIStore, useSurfaceIds, SurfaceView } from '@seval-ui/react'

function AgentUI() {
  const store = useA2UIStore()
  const ingest = useA2UIIngest()
  const surfaceIds = useSurfaceIds()

  // Handle user actions - send to agent
  const handleAction = useCallback(async (payload) => {
    const response = await sendToAgent({
      userAction: {
        name: payload.name,
        surfaceId: payload.surfaceId,
        context: payload.context,
      }
    })
    // Ingest agent response
    response.messages.forEach(msg => ingest(msg))
  }, [ingest])

  useEffect(() => {
    store.setActionHandler(handleAction)
  }, [handleAction, store])

  // Render surfaces
  return (
    <div>
      {surfaceIds.map(id => (
        <SurfaceView key={id} surfaceId={id} />
      ))}
    </div>
  )
}
```

### @seval-ui/react-code

Extends A2UI with **local interaction capabilities**, allowing UI logic to run without agent round-trips:

- **Code Component** - Embeds executable Seval logic in surfaces
- **SevalRuntime** - Compiles and executes Seval code
- **Local Action Handling** - Process actions locally, fallback to agent

```tsx
import { createCodeComponent } from '@seval-ui/react-code'

const codeComponent = createCodeComponent({
  actions: {
    // Custom action handlers
    customAction: (ctx) => { /* local logic */ }
  }
})

// Use with A2UIProvider
<A2UIProvider components={[...defaultComponents, codeComponent]} />
```

#### Why Local Execution?

Standard A2UI sends all user actions to the agent, causing:
- Network latency for simple interactions
- Heavy agent load
- Poor UX for responsive interactions (counters, form validation, etc.)

The Code component solves this by intercepting actions and handling them locally:

```json
{
  "id": "code",
  "component": {
    "Code": {
      "lang": "seval",
      "code": "{ action_increment() { this.count = this.count + 1 } }"
    }
  }
}
```

### @seval-ui/seval

A lightweight JavaScript-like language designed for UI logic:

```javascript
{
  count: 0,

  action_increment() {
    this.count = this.count + 1
  },

  action_reset() {
    this.count = 0
  }
}
```

Features:
- Compiles to native JavaScript for zero-overhead execution
- If/elif/else control flow
- For loops
- Line comments (`//`)
- Sandbox protection

See [packages/seval/README.md](packages/seval/README.md) for full syntax documentation.

## Installation

```bash
# For A2UI rendering
pnpm add @seval-ui/react

# For local interaction support
pnpm add @seval-ui/react-code

# For Seval language only
pnpm add @seval-ui/seval
```

## Demo

The `packages/demo` package demonstrates the full integration:

```bash
cd packages/demo && pnpm dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AI Agent                             │
│  (sends A2UI messages: createSurface, updateComponents...)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    @seval-ui/react                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ A2UIProvider│  │   Store     │  │    SurfaceView      │  │
│  │  (context)  │  │ (MobX-MST)  │  │ (renders components)│  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────────┐   ┌───────────────────────────┐
│  @seval-ui/react-code       │   │     Direct to Agent       │
│  (optional local execution) │   │   (standard A2UI flow)    │
│  ┌─────────┐ ┌────────────┐ │   │                           │
│  │  Code   │ │SevalRuntime│ │   │  userAction → Agent       │
│  │Component│ │ (compiler) │ │   │                           │
│  └─────────┘ └────────────┘ │   └───────────────────────────┘
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│      @seval-ui/seval        │
│  ┌─────────┐ ┌────────────┐ │
│  │Tokenizer│ │  Compiler  │ │
│  └─────────┘ └────────────┘ │
└─────────────────────────────┘
```

**Note:** `@seval-ui/react-code` is optional. Without it, all user actions are sent directly to the agent (standard A2UI flow). With it, you can handle simple interactions locally for better responsiveness.

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r run build

# Run tests
pnpm -r run test

# Lint
pnpm -r run lint
```

## License

MIT
