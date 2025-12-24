/**
 * Vocabulary Page
 *
 * Flashcard-style vocabulary learning with spaced repetition
 * Logic powered by S-expressions
 */

import { useEffect, useMemo, useState } from 'react'
import {
  A2UIProvider,
  SurfaceView,
  useA2UIContextStore,
  createA2UIContextStore,
} from '@seval-ui/react'
import { SExpRuntime } from '@seval-ui/react-code'
import vocabularyMessages from '../data/vocabulary.json'

const SURFACE_ID = 'vocabulary'

function VocabularyContent() {
  const store = useA2UIContextStore()
  const [, setVersion] = useState(0)

  // Initialize the vocabulary surface
  useEffect(() => {
    // Ingest A2UI messages to set up the surface
    for (const message of vocabularyMessages) {
      // biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
      store.ingest(message as any)
    }

    // Create S-expression runtime for vocabulary logic
    const runtime = new SExpRuntime(store, SURFACE_ID)

    // Load function definitions from Code component (minijs)
    runtime.loadCodeComponent()

    // Initialize derived values
    runtime.handleAction('updateDerived', {})

    // Set up action handler
    store.setActionHandler((payload) => {
      if (payload.surfaceId === SURFACE_ID) {
        runtime.handleAction(payload.name, payload.context)
        // Update derived values after each action
        runtime.handleAction('updateDerived', {})
        setVersion((v) => v + 1)
      }
    })

    // Subscribe to store changes
    const unsubscribe = store.subscribe(() => setVersion((v) => v + 1))

    return () => {
      unsubscribe()
      store.deleteSurface(SURFACE_ID)
    }
  }, [store])

  return (
    <div className="vocabulary-page">
      <h1>Vocabulary Flashcards</h1>
      <p className="subtitle">Spaced repetition powered by S-expressions (SM-2 algorithm)</p>
      <div className="vocabulary-container">
        <SurfaceView surfaceId={SURFACE_ID} />
      </div>
    </div>
  )
}

export function VocabularyPage() {
  const store = useMemo(() => createA2UIContextStore(), [])

  return (
    <A2UIProvider store={store}>
      <VocabularyContent />
    </A2UIProvider>
  )
}
