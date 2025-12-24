/**
 * a2ui-react - React integration for A2UI protocol
 *
 * A pure UI rendering library for A2UI components.
 * For S-expression runtime support, use the a2ui-react-code package.
 *
 * @example
 * ```tsx
 * import { A2UIProvider, SurfaceView, createA2UIContextStore } from 'a2ui-react'
 *
 * const store = createA2UIContextStore()
 *
 * function App() {
 *   return (
 *     <A2UIProvider store={store}>
 *       <SurfaceView surfaceId="main" />
 *     </A2UIProvider>
 *   )
 * }
 * ```
 */

// A2UI Protocol Types
export type {
    ComponentDictionary,
    ComponentDefinition,
    SurfaceUpdateMessage,
    DataModelUpdateMessage,
    BeginRenderingMessage,
    DeleteSurfaceMessage,
    A2UIMessage,
    BoundValue,
    ActionContextEntry,
    ActionDefinition,
    UserActionPayload,
    SurfaceSnapshot,
    ValueEntry,
} from './a2ui-types'

// A2UI Utilities
export {
    decodePointer,
    getAtPointer,
    ensurePointer,
    encodePointerSegment,
    joinPointer,
    valueEntriesToObject,
    applyEntries,
    resolveBoundValue,
} from './utils'

// A2UI Component Catalog
export type { RendererContext, ComponentRegistry } from './catalog'
export { defaultRegistry, mergeRegistries } from './catalog'

// A2UI Context & Provider
export type { IA2UISurface, IA2UIContextStore, A2UIProviderProps } from './context'
export {
    createA2UIContextStore,
    A2UIProvider,
    useA2UIContextStore,
    useA2UIRegistry,
    useSurfaceIds,
    useA2UISurface,
    useA2UIIngest,
    useRendererContext,
} from './context'

// A2UI SurfaceView
export type { SurfaceViewProps } from './SurfaceView'
export { SurfaceView } from './SurfaceView'
