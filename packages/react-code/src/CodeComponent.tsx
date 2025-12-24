/**
 * Code Component Renderer for A2UI Catalog
 *
 * This component is rendered when an A2UI surface contains a "Code" component.
 * It loads Seval logic and handles actions via store listener.
 */

import { useEffect, useRef, useState } from "react";
import { SevalRuntime } from "./SevalRuntime";
import type { IMinimalStore } from "./SevalRuntime";

interface CodeRendererProps {
    id: string;
    definition: unknown;
    component: Record<string, unknown>;
    context: {
        surfaceId: string;
        emitAction: (payload: unknown) => void;
    };
    store: IMinimalStore;
}

/**
 * Code component renderer.
 * Loads Seval logic from component props and handles actions.
 */
export function CodeRenderer({ id, component, context, store }: CodeRendererProps) {
    const runtimeRef = useRef<SevalRuntime | null>(null);
    const [error, setError] = useState<Error | null>(null);

    // Throw error during render for Error Boundary
    if (error) throw error;

    useEffect(() => {
        const runtime = new SevalRuntime(store, context.surfaceId);
        runtimeRef.current = runtime;

        // Load code from component props
        // component is like: { Code: { lang: "minijs", code: "..." } }
        const codeProps = (component as { Code?: { code?: string } }).Code;
        if (codeProps?.code) {
            runtime.loadCode(codeProps.code);
        }

        // Set up action handler for this surface
        store.setActionHandler?.(
            (payload: { surfaceId: string; name: string; context?: Record<string, unknown> }) => {
                if (payload.surfaceId === context.surfaceId && runtimeRef.current) {
                    try {
                        runtimeRef.current.handleAction(payload.name, payload.context ?? {});
                    } catch (e) {
                        setError(e as Error);
                    }
                }
            },
        );

        return () => {
            runtimeRef.current = null;
        };
    }, [component, context.surfaceId, store]);

    // Renders nothing - just handles logic
    return null;
}

/**
 * Create Code entry for ComponentRegistry.
 * Call this with store to get a registry object.
 */
export function createCodeRegistry(store: IMinimalStore) {
    return {
        // biome-ignore lint/suspicious/noExplicitAny: Match ComponentRegistry's RendererFn type
        Code: (props: any) => <CodeRenderer {...props} store={store} />,
    };
}
