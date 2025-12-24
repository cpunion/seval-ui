# seval-ui

S-expression based UI runtime for React.

## Packages

| Package | Description |
|---------|-------------|
| `@seval-ui/sexp` | S-expression evaluator engine |
| `@seval-ui/seval` | JavaScript-like language compiler |
| `@seval-ui/react` | React UI components |
| `@seval-ui/react-code` | SExpRuntime for React |

## Installation

```bash
pnpm add @seval-ui/react @seval-ui/react-code
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r run build

# Run tests
pnpm -r run test

# Run demo
cd packages/demo && pnpm dev
```

## License

MIT
