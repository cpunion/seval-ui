/**
 * @seval-ui/react - React integration for A2UI protocol
 *
 * Minimal API:
 * - A2UIProvider: Provides store context
 * - useA2UIStore: Access the store
 * - SurfaceView: Renders a surface
 * - createA2UIStore: Create store instance
 *
 * @example
 * ```tsx
 * import { A2UIProvider, useA2UIStore, SurfaceView } from '@seval-ui/react'
 * import { observer } from 'mobx-react-lite'
 *
 * const App = observer(() => {
 *   const store = useA2UIStore()
 *   const surface = store.surfaces.get('main')
 *   return surface ? <SurfaceView surface={surface} /> : null
 * })
 * ```
 */

// A2UI Store (MST)
export type { IA2UISurface, IA2UIContextStore } from './store'
export { createA2UIStore } from './store'

// A2UI Context & Provider
export type { A2UIProviderProps } from './context'
export { A2UIProvider, useA2UIStore } from './context'

// A2UI SurfaceView
export type { SurfaceViewProps } from './SurfaceView'
export { SurfaceView } from './SurfaceView'

// A2UI Protocol Types (for advanced usage)
export type {
	ComponentDefinition,
	A2UIMessage,
	UserActionPayload,
} from './a2ui-types'

// Component Catalog (for custom renderers)
export type { RendererContext, ComponentRegistry } from './catalog'
export { defaultRegistry as defaultComponents, mergeRegistries } from './catalog'
