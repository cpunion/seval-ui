/**
 * Tests for @seval-ui/react-code
 */
import { describe, expect, it } from "bun:test";
import type { IMinimalStore, IMinimalSurface } from "./SevalRuntime";
import { SevalRuntime, compileSeval, executeSeval } from "./index";

// Mock store and surface for testing
function createMockStore(): { store: IMinimalStore; surface: IMinimalSurface } {
    const dataModel: Record<string, unknown> = {
        display: "0",
        memory: "0",
        operator: "",
        waitingForOperand: true,
        history: "",
    };

    const components = new Map<string, { id: string; component: Record<string, unknown> }>();
    components.set("code", {
        id: "code",
        component: {
            Code: {
                code: `{
                    action_test() { [["display", "42"]] }
                }`,
                lang: "seval",
            },
        },
    });

    const surface: IMinimalSurface = {
        dataModel,
        version: 0,
        getComponent: (id) => components.get(id),
        setDataModel: (model) => Object.assign(dataModel, model),
        incrementVersion: () => {
            surface.version++;
        },
    };

    const store: IMinimalStore = {
        surfaces: {
            get: (_id: string) => surface,
        },
    };

    return { store, surface };
}

describe("SevalRuntime", () => {
    it("creates a runtime instance", () => {
        const { store } = createMockStore();
        const runtime = new SevalRuntime(store, "test");
        expect(runtime).toBeDefined();
    });

    it("loads code component and handles action", () => {
        const { store, surface } = createMockStore();
        const runtime = new SevalRuntime(store, "test");

        runtime.loadCodeComponent();

        // Should have loaded the environment
        const env = runtime.getEnvironment();
        expect(env).toBeDefined();
        expect(env).not.toBeNull();

        // Handle action
        runtime.handleAction("test");

        // Should have updated display
        expect(surface.dataModel.display).toBe("42");
    });

    it("handles __inputBinding action for direct updates", () => {
        const { store, surface } = createMockStore();
        const runtime = new SevalRuntime(store, "test");

        runtime.handleAction("__inputBinding", { path: "/display", value: "999" });

        expect(surface.dataModel.display).toBe("999");
    });
});

describe("seval utilities", () => {
    it("compileSeval creates environment with functions", () => {
        const env = compileSeval(`{
            add(a, b) { a + b },
            double(x) { x * 2 }
        }`);

        expect(env).toBeDefined();
        expect(env.add).toBeDefined();
        expect(env.double).toBeDefined();
    });

    it("executeSeval calls functions", () => {
        const env = compileSeval(`{
            add(a, b) { a + b },
            greet(name) { "Hello, " + name }
        }`);

        expect(executeSeval(env, "add", [5, 3])).toBe(8);
        expect(executeSeval(env, "greet", ["World"])).toBe("Hello, World");
    });

    it("executeSeval with context", () => {
        const env = compileSeval(`{
            getAge() { get(context, "age") }
        }`);

        const result = executeSeval(env, "getAge", [], { context: { age: 25 } });
        expect(result).toBe(25);
    });
});
