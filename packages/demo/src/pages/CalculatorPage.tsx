/**
 * Calculator Page
 *
 * A simple calculator demonstrating MiniJS based logic
 */

import { useEffect, useMemo, useState } from 'react'
import {
  A2UIProvider,
  SurfaceView,
  useA2UIContextStore,
  createA2UIContextStore,
} from '@seval-ui/react'
import { SExpRuntime } from '@seval-ui/react-code'
import calculatorMessages from '../data/calculator.json'

const SURFACE_ID = 'calculator'

function CalculatorContent() {
  const store = useA2UIContextStore()
  const [, setVersion] = useState(0)

  // Initialize the calculator surface
  useEffect(() => {
    // Ingest A2UI messages to set up the surface
    for (const message of calculatorMessages) {
      // biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
      store.ingest(message as any)
    }

    // Create S-expression runtime for calculator logic
    const runtime = new SExpRuntime(store, SURFACE_ID)

    // Load function definitions from Code component (minijs)
    runtime.loadCodeComponent()

    // Set up action handler
    store.setActionHandler((payload) => {
      if (payload.surfaceId === SURFACE_ID) {
        runtime.handleAction(payload.name, payload.context)
        // Force re-render on action
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
    <div className="calculator-page">
      <h1>Calculator</h1>
      <p className="subtitle">Logic powered by MiniJS</p>
      <div className="calculator-container">
        <SurfaceView surfaceId={SURFACE_ID} />
      </div>
    </div>
  )
}

export function CalculatorPage() {
  const store = useMemo(() => createA2UIContextStore(), [])

  return (
    <A2UIProvider store={store}>
      <CalculatorContent />
    </A2UIProvider>
  )
}
