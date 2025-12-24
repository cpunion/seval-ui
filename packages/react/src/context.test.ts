/**
 * Tests for @seval-ui/react context store
 */
import { describe, expect, it } from 'bun:test'
import type { A2UIMessage } from './a2ui-types'
import { createA2UIContextStore } from './context'

describe('createA2UIContextStore', () => {
	it('creates a store with no surfaces initially', () => {
		const store = createA2UIContextStore()
		expect(store.surfaceIds).toEqual([])
	})

	it('creates and retrieves surfaces', () => {
		const store = createA2UIContextStore()
		const surface = store.getOrCreateSurface('main')
		expect(surface.surfaceId).toBe('main')
		expect(store.surfaceIds).toEqual(['main'])
		expect(store.getSurface('main')).toBe(surface)
	})

	it('returns same surface on repeated getOrCreate', () => {
		const store = createA2UIContextStore()
		const surface1 = store.getOrCreateSurface('test')
		const surface2 = store.getOrCreateSurface('test')
		expect(surface1).toBe(surface2)
	})

	it('deletes surfaces', () => {
		const store = createA2UIContextStore()
		store.getOrCreateSurface('temp')
		expect(store.getSurface('temp')).toBeDefined()
		store.deleteSurface('temp')
		expect(store.getSurface('temp')).toBeUndefined()
	})

	it('subscribes and notifies on surface creation', () => {
		const store = createA2UIContextStore()
		let notifyCount = 0
		const unsubscribe = store.subscribe(() => notifyCount++)

		store.getOrCreateSurface('a')
		expect(notifyCount).toBe(1)

		// Same surface, no notify
		store.getOrCreateSurface('a')
		expect(notifyCount).toBe(1)

		store.getOrCreateSurface('b')
		expect(notifyCount).toBe(2)

		unsubscribe()
		store.getOrCreateSurface('c')
		expect(notifyCount).toBe(2) // unsubscribed
	})

	describe('ingest messages', () => {
		it('ingests beginRendering message', () => {
			const store = createA2UIContextStore()
			const message: A2UIMessage = {
				beginRendering: {
					surfaceId: 'main',
					root: 'root-component',
					catalogId: 'default',
				},
			}
			store.ingest(message)

			const surface = store.getSurface('main')
			expect(surface).toBeDefined()
			expect(surface?.root).toBe('root-component')
			expect(surface?.catalogId).toBe('default')
		})

		it('ingests surfaceUpdate message with components', () => {
			const store = createA2UIContextStore()
			const message: A2UIMessage = {
				surfaceUpdate: {
					surfaceId: 'ui',
					components: [
						{ id: 'btn1', component: { Button: { label: { literalString: 'Click' } } } },
						{ id: 'txt1', component: { Text: { text: { literalString: 'Hello' } } } },
					],
				},
			}
			store.ingest(message)

			const surface = store.getSurface('ui')
			expect(surface).toBeDefined()
			expect(surface?.getComponent('btn1')).toBeDefined()
			expect(surface?.getComponent('txt1')).toBeDefined()
		})

		it('ingests dataModelUpdate message without path (replaces all)', () => {
			const store = createA2UIContextStore()
			store.getOrCreateSurface('data')

			const message: A2UIMessage = {
				dataModelUpdate: {
					surfaceId: 'data',
					contents: [
						{ key: 'count', valueNumber: 42 },
						{ key: 'name', valueString: 'test' },
					],
				},
			}
			store.ingest(message)

			const surface = store.getSurface('data')
			expect(surface?.dataModel).toEqual({ count: 42, name: 'test' })
		})

		it('ingests dataModelUpdate message with path (partial update)', () => {
			const store = createA2UIContextStore()
			const surface = store.getOrCreateSurface('partial')
			surface.dataModel = { existing: 'value', user: {} }

			const message: A2UIMessage = {
				dataModelUpdate: {
					surfaceId: 'partial',
					path: '/user',
					contents: [{ key: 'name', valueString: 'Alice' }],
				},
			}
			store.ingest(message)

			expect(surface.dataModel).toEqual({
				existing: 'value',
				user: { name: 'Alice' },
			})
		})

		it('ingests deleteSurface message', () => {
			const store = createA2UIContextStore()
			store.getOrCreateSurface('toDelete')
			expect(store.getSurface('toDelete')).toBeDefined()

			const message: A2UIMessage = {
				deleteSurface: { surfaceId: 'toDelete' },
			}
			store.ingest(message)

			expect(store.getSurface('toDelete')).toBeUndefined()
		})

		it('ingestJsonLine parses and ingests', () => {
			const store = createA2UIContextStore()
			store.ingestJsonLine('{"beginRendering":{"surfaceId":"json","root":"r"}}')

			const surface = store.getSurface('json')
			expect(surface?.root).toBe('r')
		})

		it('ingestJsonLine ignores empty lines', () => {
			const store = createA2UIContextStore()
			store.ingestJsonLine('')
			store.ingestJsonLine('   ')
			expect(store.surfaceIds).toEqual([])
		})
	})

	describe('action handling', () => {
		it('emits actions to handler', () => {
			const actions: unknown[] = []
			const store = createA2UIContextStore({
				onAction: (action) => actions.push(action),
			})

			store.emitAction({
				surfaceId: 'main',
				sourceComponentId: 'btn1',
				name: 'click',
				context: { value: 42 },
			})

			expect(actions).toHaveLength(1)
			expect(actions[0]).toEqual({
				surfaceId: 'main',
				sourceComponentId: 'btn1',
				name: 'click',
				context: { value: 42 },
			})
		})

		it('setActionHandler updates handler', () => {
			const store = createA2UIContextStore()
			const actions: unknown[] = []

			store.emitAction({ surfaceId: 'x', sourceComponentId: 'y', name: 'test' })
			expect(actions).toHaveLength(0)

			store.setActionHandler((a) => actions.push(a))
			store.emitAction({ surfaceId: 'x', sourceComponentId: 'y', name: 'test' })
			expect(actions).toHaveLength(1)

			store.setActionHandler(undefined)
			store.emitAction({ surfaceId: 'x', sourceComponentId: 'y', name: 'test' })
			expect(actions).toHaveLength(1)
		})
	})
})

describe('Surface', () => {
	it('surface increments version', () => {
		const store = createA2UIContextStore()
		const surface = store.getOrCreateSurface('test')
		expect(surface.version).toBe(0)
		surface.incrementVersion()
		expect(surface.version).toBe(1)
	})

	it('surface setDataModel updates and notifies', () => {
		const store = createA2UIContextStore()
		let notified = false
		store.subscribe(() => {
			notified = true
		})

		const surface = store.getOrCreateSurface('test')
		notified = false

		surface.setDataModel({ value: 123 })
		expect(surface.dataModel).toEqual({ value: 123 })
		expect(notified).toBe(true)
	})
})
