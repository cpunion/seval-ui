/**
 * Seval Runtime for A2UI
 *
 * Connects Seval logic to A2UI store for local state updates.
 * Uses TypeScript seval interpreter directly - no S-expression dependency.
 */

import { type Environment, type Value, compileSeval, executeSeval } from "@seval-ui/seval/seval";

/**
 * Minimal store interface that SevalRuntime needs
 */
export interface IMinimalStore {
    surfaces: {
        get(id: string): IMinimalSurface | undefined;
    };
    setActionHandler?(
        handler: (payload: {
            surfaceId: string;
            name: string;
            context?: Record<string, unknown>;
        }) => void,
    ): void;
    deleteSurface?(id: string): void;
}

/**
 * Minimal surface interface that SevalRuntime needs
 */
export interface IMinimalSurface {
    dataModel: Record<string, unknown>;
    version: number;
    getComponent(id: string): { id: string; component: Record<string, unknown> } | undefined;
    setDataModel(model: Record<string, unknown>): void;
    incrementVersion(): void;
}

export class SevalRuntime {
    private store: IMinimalStore;
    private surfaceId: string;
    private sevalEnv: Environment | null = null;
    public lastError: Error | null = null;

    constructor(store: IMinimalStore, surfaceId: string) {
        this.store = store;
        this.surfaceId = surfaceId;
    }

    private handleError(error: unknown, context: string): never {
        const err = error instanceof Error ? error : new Error(String(error));
        this.lastError = err;
        console.error(`[SevalRuntime] ${context}:`, error);
        throw err;
    }

    /**
     * Load code definitions from Code component in the surface
     * @param componentId - The component ID to look for (default: 'code')
     */
    loadCodeComponent(componentId = "code"): void {
        console.log(
            `[SevalRuntime] loadCodeComponent called for surfaceId=${this.surfaceId}, componentId=${componentId}`,
        );

        const surface = this.store.surfaces.get(this.surfaceId);
        if (!surface) {
            console.warn(`[SevalRuntime] Surface not found: ${this.surfaceId}`);
            return;
        }

        // Look for Code component
        const codeComp = surface.getComponent(componentId);
        if (!codeComp) {
            console.warn(`[SevalRuntime] Code component not found: ${componentId}`);
            return;
        }

        console.log("[SevalRuntime] Found code component:", codeComp);

        const codeComponent = codeComp.component as { Code?: { code?: string; lang?: string } };
        const code = codeComponent.Code?.code;

        if (!code) {
            console.warn("[SevalRuntime] No code in Code component");
            return;
        }

        console.log(
            `[SevalRuntime] Loading seval code (${code.length} chars):`,
            `${code.substring(0, 200)}...`,
        );
        this.loadCode(code);
    }

    /**
     * Load function definitions from Builtins component (legacy support)
     * @deprecated Use loadCodeComponent instead
     */
    loadBuiltins(): void {
        const surface = this.store.surfaces.get(this.surfaceId);
        if (!surface) return;

        const builtinsComp = surface.getComponent("builtins");
        if (!builtinsComp) return;

        const builtins = builtinsComp.component as { Builtins?: { code?: string } };
        const code = builtins.Builtins?.code;
        if (!code) return;

        this.loadCode(code);
    }

    /**
     * Load code directly with seval language
     * @param code - The seval code to load
     */
    loadCode(code: string): void {
        console.log(
            "[SevalRuntime] loadCode called, sevalEnv before:",
            this.sevalEnv ? Object.keys(this.sevalEnv) : "null",
        );
        try {
            console.log("[SevalRuntime] Compiling Seval...");
            this.sevalEnv = compileSeval(code);
            console.log("[SevalRuntime] After compile, sevalEnv keys:", Object.keys(this.sevalEnv));
        } catch (error) {
            this.handleError(error, "Error loading seval code");
        }
    }

    /**
     * Handle an action from the UI by calling the action_xxx function
     */
    handleAction(actionName: string, context: Record<string, unknown> = {}): void {
        const surface = this.store.surfaces.get(this.surfaceId);
        if (!surface) {
            console.warn(`[SevalRuntime] Surface not found: ${this.surfaceId}`);
            return;
        }

        // Handle special __inputBinding action for direct data model updates
        if (actionName === "__inputBinding") {
            const { path, value } = context as { path: string; value: unknown };
            if (path) {
                const key = path.startsWith("/") ? path.slice(1) : path;
                this.updateDataModel(surface, key, value as Value);
                surface.incrementVersion();
                // Call updateDerived if it exists to update derived values
                console.log("[SevalRuntime] __inputBinding: checking for updateDerived", {
                    hasSevalEnv: !!this.sevalEnv,
                    hasUpdateDerived: this.sevalEnv ? "updateDerived" in this.sevalEnv : false,
                });
                if (this.sevalEnv && "updateDerived" in this.sevalEnv) {
                    console.log("[SevalRuntime] __inputBinding: calling updateDerived");
                    this.handleAction("updateDerived", {});
                }
            }
            return;
        }

        if (!this.sevalEnv) {
            console.warn("[SevalRuntime] No seval environment loaded");
            return;
        }

        // Look for action_xxx function
        const actionFnName = `action_${actionName}`;

        console.log("[SevalRuntime] handleAction called:", {
            actionName,
            context,
            lookingFor: actionFnName,
            installedHandlers: Object.keys(this.sevalEnv).filter((k) => k.startsWith("action")),
        });

        if (!(actionFnName in this.sevalEnv) && !(actionName in this.sevalEnv)) {
            if (actionName !== "updateDerived") {
                console.warn(`[SevalRuntime] No action handler defined: ${actionFnName}`);
            }
            return;
        }

        try {
            // Build environment from current data model
            const dataModel = surface.dataModel as Record<string, Value>;

            // Track if set() was called
            let setWasCalled = false;

            const env: Record<string, Value> = {
                ...dataModel,
                context: context as Value,
                // A2UI helpers for path-based variable binding
                get: ((path: string) => {
                    return this.getNestedValue(dataModel, path);
                }) as unknown as Value,
                set: ((path: string, value: Value) => {
                    setWasCalled = true;
                    this.updateDataModel(surface, path, value);
                }) as unknown as Value,
            };

            // Call the action function using seval
            const fnName = actionFnName in this.sevalEnv ? actionFnName : actionName;
            const result = executeSeval(this.sevalEnv, fnName, [], env);

            // Apply updates to the data model
            this.applyUpdates(surface, result);

            // If set() was called but no result returned, still increment version
            if (setWasCalled && !result) {
                surface.incrementVersion();
            }

            // Auto-call updateDerived after actions to update derived values
            if (actionName !== "updateDerived" && "updateDerived" in this.sevalEnv) {
                this.handleAction("updateDerived", {});
            }
        } catch (error) {
            this.handleError(error, `Error executing action ${actionName}`);
        }
    }

    /**
     * Get the seval environment
     */
    getEnvironment(): Environment | null {
        return this.sevalEnv;
    }

    /**
     * Apply updates from seval result to data model
     *
     * Supports two formats:
     * 1. New format: state object from executeSeval (e.g., {display: "123", operator: "+"})
     * 2. Legacy format: list of [key, value] pairs (e.g., [["display", "123"], ["operator", "+"]])
     */
    private applyUpdates(surface: IMinimalSurface, result: Value): void {
        // Handle new format: state object from executeSeval
        if (result && typeof result === 'object' && !Array.isArray(result)) {
            for (const [key, value] of Object.entries(result)) {
                // Skip special keys
                if (key === 'context' || key === 'get' || key === 'set') {
                    continue;
                }
                this.updateDataModel(surface, key, value as Value);
            }
            surface.incrementVersion();
            return;
        }

        // Handle legacy format: array of [key, value] pairs
        if (!Array.isArray(result)) {
            return;
        }

        // Result should be a list of [key, value] pairs
        for (const update of result) {
            if (!Array.isArray(update) || update.length !== 2) {
                console.warn("[SevalRuntime] Invalid update format:", update);
                continue;
            }

            const [key, value] = update as [string, Value];
            this.updateDataModel(surface, key, value);
        }

        surface.incrementVersion();
    }

    /**
     * Update a single key in the data model
     */
    private updateDataModel(surface: IMinimalSurface, key: string, value: Value): void {
        console.log("[SevalRuntime] updateDataModel:", {
            key,
            keyType: typeof key,
            keyValue: JSON.stringify(key),
            value,
        });
        const updated = this.setNestedValue(
            surface.dataModel as Record<string, unknown>,
            key,
            this.valueToJS(value),
        );
        surface.setDataModel(updated);
    }

    /**
     * Immutable set helper that understands slash-delimited paths (e.g., "todos/1/done")
     */
    /**
     * Get nested value from data model using path
     */
    private getNestedValue(data: Record<string, unknown>, path: string): unknown {
        if (!path.includes("/")) {
            return data[path];
        }

        const segments = path.split("/").filter(Boolean);
        // biome-ignore lint/suspicious/noExplicitAny: dynamic path handling
        let cursor: any = data;

        for (const seg of segments) {
            if (cursor == null) return null;
            const segIndex = Number.isInteger(Number(seg)) ? Number(seg) : seg;
            cursor = cursor[segIndex];
        }

        return cursor;
    }

    private setNestedValue(
        data: Record<string, unknown>,
        key: string,
        value: unknown,
    ): Record<string, unknown> {
        if (!key.includes("/")) {
            return { ...data, [key]: value };
        }

        const segments = key.split("/").filter(Boolean);
        // biome-ignore lint/suspicious/noExplicitAny: dynamic path handling
        const clone = Array.isArray(data) ? ([...data] as any) : ({ ...data } as any);
        // biome-ignore lint/suspicious/noExplicitAny: dynamic cursor
        let cursor: any = clone;

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            if (!seg) continue;
            const isLast = i === segments.length - 1;
            const segIndex = Number.isInteger(Number(seg)) ? Number(seg) : seg;

            if (isLast) {
                if (Array.isArray(cursor) && typeof segIndex === "number") {
                    const arr = [...cursor];
                    arr[segIndex] = value;
                    if (i === 0) return arr as unknown as Record<string, unknown>;
                    cursor[segIndex] = value;
                } else {
                    cursor[segIndex] = value;
                }
                break;
            }

            const nextVal = cursor[segIndex];
            const nextContainer = Array.isArray(nextVal)
                ? [...nextVal]
                : typeof nextVal === "object" && nextVal !== null
                    ? { ...nextVal }
                    : Number.isInteger(Number(segments[i + 1]))
                        ? []
                        : {};

            cursor[segIndex] = nextContainer;
            cursor = nextContainer;
        }

        return clone as Record<string, unknown>;
    }

    /**
     * Convert seval Value to plain JS value
     */
    private valueToJS(value: Value): unknown {
        if (value === null) return null;
        if (typeof value !== "object") return value;
        if (Array.isArray(value)) {
            // Check if it's a list of pairs (object representation)
            if (
                value.length > 0 &&
                Array.isArray(value[0]) &&
                value[0].length === 2 &&
                typeof value[0][0] === "string"
            ) {
                const obj: Record<string, unknown> = {};
                for (const pair of value) {
                    if (Array.isArray(pair) && pair.length === 2) {
                        obj[pair[0] as string] = this.valueToJS(pair[1] as Value);
                    }
                }
                return obj;
            }
            return value.map((v) => this.valueToJS(v as Value));
        }
        return value;
    }
}

/**
 * Create action handler for A2UI store
 */
export function createSevalActionHandler(
    _store: IMinimalStore,
    runtimes: Map<string, SevalRuntime>,
): (payload: { surfaceId: string; name: string; context?: Record<string, unknown> }) => void {
    return (payload: { surfaceId: string; name: string; context?: Record<string, unknown> }) => {
        const runtime = runtimes.get(payload.surfaceId);
        if (runtime) {
            runtime.handleAction(payload.name, payload.context ?? {});
        } else {
            console.warn(`[SevalRuntime] No runtime for surface: ${payload.surfaceId}`);
        }
    };
}
