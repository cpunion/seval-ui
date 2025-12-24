/**
 * Showcase Page
 *
 * Comprehensive demo of A2UI components
 * Logic powered by MiniJS
 */

import { A2UIProvider, createA2UIStore, defaultComponents } from '@seval-ui/react'
import { createCodeComponent } from '@seval-ui/react-code'
import { useEffect, useState } from 'react'
import showcaseMessages from '../data/showcase.json'

export function ShowcasePage() {
	const [store] = useState(() => createA2UIStore())
	const components = { ...defaultComponents, ...createCodeComponent(store) }

	// Initialize the showcase surface by ingesting A2UI messages
	useEffect(() => {
		for (const message of showcaseMessages) {
			// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
			store.ingest(message as any)
		}
	}, [store])

	return (
		<div className="showcase-page">
			<h1>Component Showcase</h1>
			<p className="subtitle">All A2UI components with MiniJS logic</p>
			<div className="showcase-container">
				<A2UIProvider store={store} components={components} />
			</div>
		</div>
	)
}
