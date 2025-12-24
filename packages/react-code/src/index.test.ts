/**
 * Tests for @seval-ui/react-code
 */
import { describe, expect, it } from "bun:test";
import { createEvaluator, defaultPrimitives, evalString, parse, stringify } from "@seval-ui/sexp";
import { SExpRuntime } from "./SExpRuntime";

describe("SExpRuntime", () => {
    it("creates a runtime instance", () => {
        const runtime = new SExpRuntime();
        expect(runtime).toBeDefined();
    });

    it("initializes with custom options", () => {
        const runtime = new SExpRuntime({
            maxDepth: 500,
            debug: false,
        });
        expect(runtime).toBeDefined();
    });
});

describe("re-exported seval utilities", () => {
    it("evalString evaluates expressions", () => {
        expect(evalString("(+ 1 2)")).toBe(3);
        expect(evalString("(* 3 4)")).toBe(12);
    });

    it("parse and stringify round-trip", () => {
        const code = "(define x 42)";
        const parsed = parse(code);
        const result = stringify(parsed);
        expect(result).toContain("define");
        expect(result).toContain("42");
    });

    it("createEvaluator returns evaluator with primitives", () => {
        const evaluator = createEvaluator({
            primitives: {
                double: (args) => (args[0] as number) * 2,
            },
        });
        const result = evaluator.evalString("(double 21)");
        expect(result).toBe(42);
    });

    it("defaultPrimitives is available", () => {
        expect(defaultPrimitives).toBeDefined();
        expect(typeof defaultPrimitives["+"]).toBe("function");
    });
});
