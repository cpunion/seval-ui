/**
 * Component Showcase Page
 *
 * Demonstrates all A2UI components and S-expression capabilities
 */

import {
	A2UIProvider,
	SurfaceView,
	createA2UIContextStore,
	useA2UIContextStore,
} from '@seval-ui/react'
import { SExpRuntime } from '@seval-ui/react-code'
import { useEffect, useMemo, useState } from 'react'
import showcaseMessages from '../data/showcase.json'

const SURFACE_ID = 'showcase'

function ShowcaseContent() {
	const store = useA2UIContextStore()
	const [, setVersion] = useState(0)

	useEffect(() => {
		// Ingest A2UI messages to set up the surface
		for (const message of showcaseMessages) {
			// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
			store.ingest(message as any)
		}

		// Create S-expression runtime
		const runtime = new SExpRuntime(store, SURFACE_ID)

		// Load function definitions from Code component (minijs)
		runtime.loadCodeComponent()

		// Set up action handler
		store.setActionHandler((payload) => {
			if (payload.surfaceId === SURFACE_ID) {
				runtime.handleAction(payload.name, payload.context)
				// Update derived state after any action (for checkbox, todo stats, etc.)
				runtime.handleAction('updateDerived', {})
				setVersion((v) => v + 1)
			}
		})

		// Initial derived state calculation
		runtime.handleAction('updateDerived', {})

		// Subscribe to store changes
		const unsubscribe = store.subscribe(() => setVersion((v) => v + 1))

		return () => {
			unsubscribe()
			store.deleteSurface(SURFACE_ID)
		}
	}, [store])

	return (
		<div className="showcase-page">
			<SurfaceView surfaceId={SURFACE_ID} />
		</div>
	)
}

export function ShowcasePage() {
	const store = useMemo(() => createA2UIContextStore(), [])

	return (
		<A2UIProvider store={store}>
			<ShowcaseContent />
		</A2UIProvider>
	)
}
