/**
 * A2UI React Context and Provider
 *
 * A2UIProvider auto-creates store (or uses provided one) and renders all surfaces.
 */

import { observer } from 'mobx-react-lite'
import React, { createContext, useContext, useMemo, useState } from 'react'
import { SurfaceView } from './SurfaceView'
import type { ComponentRegistry } from './catalog'
import { defaultRegistry } from './catalog'
import { type IA2UIContextStore, type IA2UISurface, createA2UIStore } from './store'

// Re-export types
export type { IA2UISurface, IA2UIContextStore }
export { createA2UIStore }

interface StoreContextValue {
	store: IA2UIContextStore
	registry: ComponentRegistry
}

const StoreContext = createContext<StoreContextValue | null>(null)

export interface A2UIProviderProps {
	/** Optional external store (auto-created if not provided) */
	store?: IA2UIContextStore
	/** Component registry (merged with defaultRegistry) */
	components?: ComponentRegistry
}

/**
 * A2UIProvider renders all surfaces from the store.
 * If no store is provided, creates one automatically.
 */
export const A2UIProvider = observer(function A2UIProvider({
	store: externalStore,
	components,
}: A2UIProviderProps) {
	const [internalStore] = useState(() => createA2UIStore())
	const store = externalStore ?? internalStore

	const value = useMemo<StoreContextValue>(
		() => ({
			store,
			registry: components ? { ...defaultRegistry, ...components } : defaultRegistry,
		}),
		[store, components],
	)

	// Auto-render all surfaces
	const surfaces = Array.from(store.surfaces.values())

	return (
		<StoreContext.Provider value={value}>
			{surfaces.map((surface) => (
				<SurfaceView key={surface.surfaceId} surface={surface} />
			))}
		</StoreContext.Provider>
	)
})

/**
 * Get the A2UI store from context.
 */
export function useA2UIStore(): IA2UIContextStore {
	const ctx = useContext(StoreContext)
	if (!ctx) {
		throw new Error('useA2UIStore must be used within A2UIProvider')
	}
	return ctx.store
}

// Internal: Get registry (used by SurfaceView)
export function _useRegistry(): ComponentRegistry {
	const ctx = useContext(StoreContext)
	if (!ctx) {
		throw new Error('_useRegistry must be used within A2UIProvider')
	}
	return ctx.registry
}
