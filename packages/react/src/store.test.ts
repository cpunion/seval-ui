/**
 * Tests for @seval-ui/react store and utils
 */
import { describe, expect, it } from 'bun:test'
import { A2UIStore, Surface, createStore } from './store'
import {
	applyEntries,
	decodePointer,
	encodePointerSegment,
	ensurePointer,
	getAtPointer,
	joinPointer,
	resolveBoundValue,
	valueEntriesToObject,
} from './utils'

describe('Surface', () => {
	it('creates a surface with id and empty data model', () => {
		const surface = new Surface('test-surface')
		expect(surface.id).toBe('test-surface')
		expect(surface.dataModel).toEqual({})
		expect(surface.version).toBe(0)
	})

	it('creates a surface with initial data model', () => {
		const surface = new Surface('test', { count: 0, name: 'test' })
		expect(surface.dataModel).toEqual({ count: 0, name: 'test' })
	})

	it('manages components', () => {
		const surface = new Surface('test')
		const component = { id: 'btn1', component: { Button: {} } }
		surface.addComponent(component)
		expect(surface.getComponent('btn1')).toBe(component)
		expect(surface.getComponent('nonexistent')).toBeUndefined()
	})

	it('sets data model', () => {
		const surface = new Surface('test')
		surface.setDataModel({ value: 42 })
		expect(surface.dataModel).toEqual({ value: 42 })
	})

	it('increments version', () => {
		const surface = new Surface('test')
		expect(surface.version).toBe(0)
		surface.incrementVersion()
		expect(surface.version).toBe(1)
		surface.incrementVersion()
		expect(surface.version).toBe(2)
	})
})

describe('A2UIStore', () => {
	it('creates an empty store', () => {
		const store = createStore()
		expect(store).toBeInstanceOf(A2UIStore)
		expect(store.getSurface('any')).toBeUndefined()
	})

	it('adds and retrieves surfaces', () => {
		const store = createStore()
		const surface = new Surface('main')
		store.addSurface(surface)
		expect(store.getSurface('main')).toBe(surface)
	})

	it('removes surfaces', () => {
		const store = createStore()
		const surface = new Surface('temp')
		store.addSurface(surface)
		expect(store.getSurface('temp')).toBe(surface)
		store.removeSurface('temp')
		expect(store.getSurface('temp')).toBeUndefined()
	})

	it('notifies subscribers on changes', () => {
		const store = createStore()
		let notifyCount = 0
		const unsubscribe = store.subscribe(() => {
			notifyCount++
		})

		store.addSurface(new Surface('a'))
		expect(notifyCount).toBe(1)

		store.removeSurface('a')
		expect(notifyCount).toBe(2)

		unsubscribe()
		store.addSurface(new Surface('b'))
		expect(notifyCount).toBe(2) // No more notifications
	})
})

describe('Pointer Utils', () => {
	describe('decodePointer', () => {
		it('handles empty pointer', () => {
			expect(decodePointer('')).toEqual([])
		})

		it('decodes simple path', () => {
			expect(decodePointer('/foo/bar')).toEqual(['foo', 'bar'])
		})

		it('handles escaped characters', () => {
			expect(decodePointer('/a~1b/c~0d')).toEqual(['a/b', 'c~d'])
		})
	})

	describe('getAtPointer', () => {
		const data = { user: { name: 'Alice', settings: { theme: 'dark' } } }

		it('returns base for empty pointer', () => {
			expect(getAtPointer(data, '')).toBe(data)
		})

		it('gets nested value', () => {
			expect(getAtPointer(data, '/user/name')).toBe('Alice')
			expect(getAtPointer(data, '/user/settings/theme')).toBe('dark')
		})

		it('returns undefined for missing path', () => {
			expect(getAtPointer(data, '/missing')).toBeUndefined()
			expect(getAtPointer(data, '/user/missing/deep')).toBeUndefined()
		})
	})

	describe('ensurePointer', () => {
		it('creates nested objects', () => {
			const base: Record<string, unknown> = {}
			ensurePointer(base, '/a/b/c')
			expect(base).toEqual({ a: { b: { c: {} } } })
		})
	})

	describe('encodePointerSegment', () => {
		it('escapes special characters', () => {
			expect(encodePointerSegment('a/b')).toBe('a~1b')
			expect(encodePointerSegment('a~b')).toBe('a~0b')
		})
	})

	describe('joinPointer', () => {
		it('handles absolute paths', () => {
			expect(joinPointer('/base', '/absolute')).toBe('/absolute')
		})

		it('joins relative paths', () => {
			expect(joinPointer('/base', 'child')).toBe('/base/child')
		})

		it('handles empty base', () => {
			expect(joinPointer(undefined, 'path')).toBe('/path')
		})

		it('handles empty relative path', () => {
			expect(joinPointer('/base', '')).toBe('/base')
		})
	})
})

describe('Value Entry Utils', () => {
	describe('valueEntriesToObject', () => {
		it('converts string entries', () => {
			const entries = [{ key: 'name', valueString: 'Alice' }]
			expect(valueEntriesToObject(entries)).toEqual({ name: 'Alice' })
		})

		it('converts number entries', () => {
			const entries = [{ key: 'count', valueNumber: 42 }]
			expect(valueEntriesToObject(entries)).toEqual({ count: 42 })
		})

		it('converts boolean entries', () => {
			const entries = [{ key: 'active', valueBoolean: true }]
			expect(valueEntriesToObject(entries)).toEqual({ active: true })
		})

		it('converts null entries', () => {
			const entries = [{ key: 'empty', valueNull: true }]
			expect(valueEntriesToObject(entries)).toEqual({ empty: null })
		})

		it('converts nested map entries', () => {
			const entries = [
				{
					key: 'user',
					valueMap: [{ key: 'name', valueString: 'Bob' }],
				},
			]
			expect(valueEntriesToObject(entries)).toEqual({ user: { name: 'Bob' } })
		})

		it('converts array entries', () => {
			const entries = [
				{
					key: 'items',
					valueArray: [
						{ key: '0', valueNumber: 1 },
						{ key: '1', valueNumber: 2 },
					],
				},
			]
			expect(valueEntriesToObject(entries)).toEqual({ items: [1, 2] })
		})

		it('converts multiple entries', () => {
			const entries = [
				{ key: 'a', valueString: 'hello' },
				{ key: 'b', valueNumber: 123 },
				{ key: 'c', valueBoolean: false },
			]
			expect(valueEntriesToObject(entries)).toEqual({ a: 'hello', b: 123, c: false })
		})
	})

	describe('applyEntries', () => {
		it('applies entries to target object', () => {
			const target: Record<string, unknown> = { existing: 'value' }
			applyEntries(target, [
				{ key: 'new', valueString: 'data' },
				{ key: 'count', valueNumber: 5 },
			])
			expect(target).toEqual({ existing: 'value', new: 'data', count: 5 })
		})

		it('overwrites existing keys', () => {
			const target: Record<string, unknown> = { key: 'old' }
			applyEntries(target, [{ key: 'key', valueString: 'new' }])
			expect(target).toEqual({ key: 'new' })
		})
	})
})

describe('resolveBoundValue', () => {
	const dataModel = {
		user: { name: 'Alice', age: 30 },
		settings: { theme: 'dark' },
	}

	it('returns undefined for undefined value', () => {
		expect(resolveBoundValue(undefined, dataModel)).toBeUndefined()
	})

	it('resolves absolute path', () => {
		expect(resolveBoundValue({ path: '/user/name' }, dataModel)).toBe('Alice')
	})

	it('resolves relative path with base', () => {
		expect(resolveBoundValue({ path: 'name' }, dataModel, '/user')).toBe('Alice')
	})

	it('returns literalString', () => {
		expect(resolveBoundValue({ literalString: 'hello' }, dataModel)).toBe('hello')
	})

	it('returns literalNumber', () => {
		expect(resolveBoundValue({ literalNumber: 42 }, dataModel)).toBe(42)
	})

	it('returns literalBoolean', () => {
		expect(resolveBoundValue({ literalBoolean: true }, dataModel)).toBe(true)
		expect(resolveBoundValue({ literalBoolean: false }, dataModel)).toBe(false)
	})

	it('prefers path over literal when path resolves', () => {
		expect(resolveBoundValue({ path: '/user/name', literalString: 'fallback' }, dataModel)).toBe(
			'Alice',
		)
	})

	it('falls back to literal when path not found', () => {
		expect(resolveBoundValue({ path: '/missing', literalString: 'fallback' }, dataModel)).toBe(
			'fallback',
		)
	})
})
