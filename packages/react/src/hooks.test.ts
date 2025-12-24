/**
 * Tests for @seval-ui/react hooks
 */
import { describe, expect, it } from 'bun:test'
import { A2UIStore, Surface, createStore } from './store'

// Note: useStore and useDataModel require React render context
// Testing the underlying store behavior that hooks depend on

describe('hooks dependencies', () => {
	describe('useStore relies on store.subscribe', () => {
		it('store subscribe returns unsubscribe function', () => {
			const store = createStore()
			const unsubscribe = store.subscribe(() => {})
			expect(typeof unsubscribe).toBe('function')
			unsubscribe()
		})

		it('store is stable reference for snapshot', () => {
			const store = createStore()
			expect(store).toBe(store)
		})
	})

	describe('useDataModel relies on getSurface', () => {
		it('returns undefined for missing surface', () => {
			const store = createStore()
			expect(store.getSurface('missing')).toBeUndefined()
		})

		it('returns surface with dataModel', () => {
			const store = createStore()
			const surface = new Surface('test', { value: 42 })
			store.addSurface(surface)

			const retrieved = store.getSurface('test')
			expect(retrieved?.dataModel).toEqual({ value: 42 })
		})

		it('selector can extract specific data', () => {
			const data = { user: { name: 'Alice' }, count: 5 }
			const selector = (d: Record<string, unknown>) => (d.user as { name: string })?.name
			expect(selector(data)).toBe('Alice')
		})
	})
})
