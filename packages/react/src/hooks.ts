/**
 * React Hooks for A2UI
 *
 * Note: For S-expression runtime hooks (useSurface with code evaluation),
 * use the a2ui-react-code package.
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { A2UIStore } from './store'

/**
 * Hook to use an A2UI store with React
 */
export function useStore(store: A2UIStore): A2UIStore {
    const subscribe = useCallback(
        (callback: () => void) => store.subscribe(callback),
        [store]
    )
    const getSnapshot = useCallback(() => store, [store])

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Hook to get data from surface data model
 */
export function useDataModel<T = unknown>(
    store: A2UIStore,
    surfaceId: string,
    selector?: (data: Record<string, unknown>) => T
): T | undefined {
    const surface = store.getSurface(surfaceId)
    const data = surface?.dataModel ?? {}

    return useMemo(() => {
        if (selector) {
            return selector(data)
        }
        return data as T
    }, [data, selector])
}
