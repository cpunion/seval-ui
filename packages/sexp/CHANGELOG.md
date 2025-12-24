# Changelog

All notable changes to this project will be documented in this file.

## [1.1.1] - 2025-12-24

### Fixed

- `+` now concatenates when any operand is a string, matching the behavior that MiniJS and A2UI runtime expect when building display text.

## [1.1.0] - 2025-12-24

### Added

- Exported `deserializeSExpr` and `serializeSExpr` helpers so downstream compilers can round-trip AST data without reimplementing conversions.

### Fixed

- Lambda invocations now merge the caller environment with the closure scope, ensuring host-provided bindings (e.g., `context`) stay visible during nested calls.

## [1.0.0] - 2025-12-24

### Added

- Initial public release of `seval`, a safe and embeddable S-expression evaluator for TypeScript/JavaScript.
- Rich primitive library covering arithmetic, comparison, logical, string, array, object, math, and type helpers.
- Mini runtime APIs (`createEvaluator`, `evalString`, `evaluate`) with support for custom primitives and lambda closures.
- Comprehensive Bun/Vitest test suites and CI workflow with linting, formatting, coverage reporting, and Codecov upload.
- Documentation covering installation, usage examples, and licensing.
- Published on npm as `seval.js` (renamed from the earlier `seval` package to avoid conflicts).

---

Generated as part of the first stable release. Future entries should describe user-visible changes between versions.
