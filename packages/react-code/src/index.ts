/**
 * @seval-ui/react-code - SevalRuntime for @seval-ui/react
 *
 * This package provides Seval runtime support for a2ui-react,
 * keeping the main a2ui-react package decoupled from seval.
 */

// Seval Runtime
export { SevalRuntime, createSevalActionHandler } from "./SevalRuntime";
export type { IMinimalStore, IMinimalSurface } from "./SevalRuntime";

// Code Component for A2UI Catalog
export { CodeRenderer, createCodeRegistry as createCodeComponent } from "./CodeComponent";

// Re-export seval utilities for convenience
export { compileSeval, executeSeval, Tokenizer, Parser } from "@seval-ui/seval";

// Re-export seval types
export type { Value, Environment, SFunction } from "@seval-ui/seval";
