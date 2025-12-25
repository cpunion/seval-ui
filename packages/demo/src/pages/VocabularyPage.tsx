/**
 * Vocabulary Page
 *
 * Flashcard-style vocabulary learning with spaced repetition
 * Logic powered by Seval
 */

import { A2UIProvider, createA2UIStore, defaultComponents } from '@seval-ui/react'
import { createCodeComponent } from '@seval-ui/react-code'
import { useEffect, useState } from 'react'
import vocabularyMessages from '../data/vocabulary.json'

export function VocabularyPage() {
	const [store] = useState(() => createA2UIStore())
	const components = { ...defaultComponents, ...createCodeComponent(store) }

	// Initialize the vocabulary surface by ingesting A2UI messages
	useEffect(() => {
		for (const message of vocabularyMessages) {
			// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
			store.ingest(message as any)
		}
	}, [store])

	return (
		<div className="vocabulary-page">
			<h1>Vocabulary Flashcards</h1>
			<p className="subtitle">Logic powered by Seval</p>
			<div className="vocabulary-container">
				<A2UIProvider store={store} components={components} />
			</div>
		</div>
	)
}
