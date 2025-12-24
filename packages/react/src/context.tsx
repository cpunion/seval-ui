/**
 * A2UI React Context and Provider
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react'
import type { ComponentRegistry, RendererContext } from './catalog'
import { defaultRegistry } from './catalog'
import type {
    A2UIMessage,
    ComponentDefinition,
    UserActionPayload,
} from './a2ui-types'
import { resolveBoundValue, valueEntriesToObject, ensurePointer, applyEntries } from './utils'

/**
 * Simple Surface implementation for A2UI
 */
export interface IA2UISurface {
    surfaceId: string
    root?: string
    catalogId?: string
    styles?: Record<string, unknown>
    components: Map<string, ComponentDefinition>
    dataModel: Record<string, unknown>
    version: number
    getComponent(id: string): ComponentDefinition | undefined
    setDataModel(model: Record<string, unknown>): void
    incrementVersion(): void
}

/**
 * A2UI Store Interface
 */
export interface IA2UIContextStore {
    surfaceIds: string[]
    getSurface(surfaceId: string): IA2UISurface | undefined
    getOrCreateSurface(surfaceId: string): IA2UISurface
    deleteSurface(surfaceId: string): void
    ingest(message: A2UIMessage): void
    ingestJsonLine(line: string): void
    emitAction(action: UserActionPayload): void
    setActionHandler(handler?: (action: UserActionPayload) => void): void
    subscribe(listener: () => void): () => void
}

/**
 * Create a simple A2UI store (no MobX dependency)
 */
export function createA2UIContextStore(options?: {
    onAction?: (action: UserActionPayload) => void
}): IA2UIContextStore {
    let onAction = options?.onAction
    const surfaces = new Map<string, IA2UISurface>()
    const listeners = new Set<() => void>()

    const notify = () => {
        for (const listener of listeners) {
            listener()
        }
    }

    const createSurface = (surfaceId: string): IA2UISurface => {
        const components = new Map<string, ComponentDefinition>()
        const surface: IA2UISurface = {
            surfaceId,
            components,
            dataModel: {},
            version: 0,
            getComponent(id: string) {
                return components.get(id)
            },
            setDataModel(model: Record<string, unknown>) {
                surface.dataModel = model
                notify()
            },
            incrementVersion() {
                surface.version++
                notify()
            },
        }
        return surface
    }

    const store: IA2UIContextStore = {
        get surfaceIds() {
            return Array.from(surfaces.keys())
        },
        getSurface(surfaceId: string) {
            return surfaces.get(surfaceId)
        },
        getOrCreateSurface(surfaceId: string) {
            let surface = surfaces.get(surfaceId)
            if (!surface) {
                surface = createSurface(surfaceId)
                surfaces.set(surfaceId, surface)
                notify()
            }
            return surface
        },
        deleteSurface(surfaceId: string) {
            surfaces.delete(surfaceId)
            notify()
        },
        ingest(message: A2UIMessage) {
            if ('surfaceUpdate' in message) {
                const surface = this.getOrCreateSurface(message.surfaceUpdate.surfaceId)
                for (const component of message.surfaceUpdate.components) {
                    surface.components.set(component.id, component)
                }
                surface.version++
                notify()
            } else if ('dataModelUpdate' in message) {
                const surface = this.getOrCreateSurface(message.dataModelUpdate.surfaceId)
                const { path, contents } = message.dataModelUpdate
                if (!path) {
                    surface.dataModel = valueEntriesToObject(contents)
                } else {
                    const current = { ...surface.dataModel }
                    const target = ensurePointer(current, path)
                    applyEntries(target, contents)
                    surface.dataModel = current
                }
                surface.version++
                notify()
            } else if ('beginRendering' in message) {
                const surface = this.getOrCreateSurface(message.beginRendering.surfaceId)
                surface.root = message.beginRendering.root
                surface.catalogId = message.beginRendering.catalogId
                if (message.beginRendering.styles) {
                    surface.styles = message.beginRendering.styles
                }
                surface.version++
                notify()
            } else if ('deleteSurface' in message) {
                this.deleteSurface(message.deleteSurface.surfaceId)
            }
        },
        ingestJsonLine(line: string) {
            const trimmed = line.trim()
            if (!trimmed) return
            this.ingest(JSON.parse(trimmed))
        },
        emitAction(action: UserActionPayload) {
            onAction?.(action)
        },
        setActionHandler(handler?: (action: UserActionPayload) => void) {
            onAction = handler
        },
        subscribe(listener: () => void) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
    }

    return store
}

interface StoreContextValue {
    store: IA2UIContextStore
    registry: ComponentRegistry
}

const StoreContext = createContext<StoreContextValue | null>(null)

export interface A2UIProviderProps {
    store?: IA2UIContextStore
    registry?: ComponentRegistry
    onAction?: (payload: UserActionPayload) => void
    children?: React.ReactNode
}

export function A2UIProvider({ store, registry, onAction, children }: A2UIProviderProps) {
    const stableStore = useMemo(
        () => store ?? createA2UIContextStore({ onAction }),
        [store, onAction]
    )

    React.useEffect(() => {
        if (onAction) {
            stableStore.setActionHandler(onAction)
        }
    }, [stableStore, onAction])

    const value = useMemo<StoreContextValue>(
        () => ({
            store: stableStore,
            registry: registry ? { ...defaultRegistry, ...registry } : defaultRegistry,
        }),
        [stableStore, registry]
    )

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useA2UIContextStore(): IA2UIContextStore {
    const ctx = useContext(StoreContext)
    if (!ctx) {
        throw new Error('useA2UIContextStore must be used within A2UIProvider')
    }
    return ctx.store
}

export function useA2UIRegistry(): ComponentRegistry {
    const ctx = useContext(StoreContext)
    if (!ctx) {
        throw new Error('useA2UIRegistry must be used within A2UIProvider')
    }
    return ctx.registry
}

export function useSurfaceIds(): string[] {
    const store = useA2UIContextStore()
    const [, setVersion] = React.useState(0)

    React.useEffect(() => {
        return store.subscribe(() => setVersion((v) => v + 1))
    }, [store])

    return store.surfaceIds
}

export function useA2UISurface(surfaceId: string): IA2UISurface | undefined {
    const store = useA2UIContextStore()
    const [, setVersion] = React.useState(0)

    React.useEffect(() => {
        return store.subscribe(() => setVersion((v) => v + 1))
    }, [store, surfaceId])

    return store.getSurface(surfaceId)
}

export function useA2UIIngest() {
    const store = useA2UIContextStore()
    return useCallback(
        (msg: A2UIMessage | string) => {
            if (typeof msg === 'string') {
                store.ingestJsonLine(msg)
            } else {
                store.ingest(msg)
            }
        },
        [store]
    )
}

const emptyRendererContext: RendererContext = {
    surfaceId: '',
    dataModel: {},
    getDefinition: () => undefined,
    renderComponent: () => null,
    resolveBoundValue: () => undefined,
    emitAction: () => undefined,
}

export function useRendererContext(surface: IA2UISurface | undefined): RendererContext {
    const store = useA2UIContextStore()
    const registry = useA2UIRegistry()

    return useMemo(() => {
        if (!surface) {
            return emptyRendererContext
        }

        const renderComponentWithPath = (
            componentId: string,
            dataPath?: string
        ): React.ReactNode | null => {
            const definition = surface.getComponent(componentId)
            if (!definition) return null
            const component = definition.component
            const type = Object.keys(component)[0]
            if (!type) return null
            const renderer = registry[type]
            if (!renderer) return null
            const childContext = buildContext(dataPath)
            return renderer({ id: componentId, definition, component, context: childContext })
        }

        const buildContext = (dataPath?: string): RendererContext => ({
            surfaceId: surface.surfaceId,
            dataModel: surface.dataModel,
            dataPath,
            getDefinition: (id) => surface.getComponent(id),
            emitAction: (payload) => store.emitAction(payload),
            renderComponent: (id, options) =>
                renderComponentWithPath(id, options?.dataPath ?? dataPath),
            resolveBoundValue: (bound, options) => {
                if (!bound) return undefined
                return resolveBoundValue(bound, surface.dataModel, options?.dataPath ?? dataPath)
            },
        })

        return buildContext()
    }, [surface, surface?.version, registry, store])
}
