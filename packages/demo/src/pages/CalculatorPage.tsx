/**
 * Calculator Page
 *
 * A simple calculator demonstrating Seval based logic
 */

import { A2UIProvider, createA2UIStore, defaultComponents } from '@seval-ui/react'
import { createCodeComponent } from '@seval-ui/react-code'
import { useEffect, useState } from 'react'
import calculatorMessages from '../data/calculator.json'

export function CalculatorPage() {
	const [store] = useState(() => createA2UIStore())
	const components = { ...defaultComponents, ...createCodeComponent(store) }

	// Initialize the calculator surface by ingesting A2UI messages
	useEffect(() => {
		for (const message of calculatorMessages) {
			// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
			store.ingest(message as any)
		}
	}, [store])

	return (
		<div className="calculator-page">
			<h1>Calculator</h1>
			<p className="subtitle">Logic powered by Seval</p>
			<div className="calculator-container">
				<A2UIProvider store={store} components={components} />
			</div>
		</div>
	)
}
