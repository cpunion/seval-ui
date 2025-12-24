/**
 * A2UI Store Model - MobX State Tree implementation
 */

import { type Instance, getSnapshot, onSnapshot, types } from 'mobx-state-tree'
import type { A2UIMessage, ComponentDefinition, UserActionPayload } from './a2ui-types'
import { applyEntries, ensurePointer, valueEntriesToObject } from './utils'

/**
 * Component Definition Model
 */
const ComponentDefinitionModel = types.model('ComponentDefinition', {
	id: types.identifier,
	component: types.frozen<Record<string, unknown>>(),
})

/**
 * Surface Model
 */
const SurfaceModel = types
	.model('Surface', {
		surfaceId: types.identifier,
		root: types.maybe(types.string),
		catalogId: types.maybe(types.string),
		styles: types.maybe(types.frozen<Record<string, unknown>>()),
		components: types.map(ComponentDefinitionModel),
		dataModel: types.frozen<Record<string, unknown>>({}),
		version: types.optional(types.number, 0),
	})
	.views((self) => ({
		getComponent(id: string): ComponentDefinition | undefined {
			return self.components.get(id) as ComponentDefinition | undefined
		},
	}))
	.actions((self) => ({
		setDataModel(model: Record<string, unknown>) {
			self.dataModel = model
		},
		incrementVersion() {
			self.version++
		},
		addComponent(component: ComponentDefinition) {
			self.components.set(component.id, component)
		},
		setRoot(root: string) {
			self.root = root
		},
		setCatalogId(catalogId: string) {
			self.catalogId = catalogId
		},
		setStyles(styles: Record<string, unknown>) {
			self.styles = styles
		},
	}))

export type IA2UISurface = Instance<typeof SurfaceModel>

/**
 * A2UI Store Model
 *
 * Use store.surfaces directly:
 * - store.surfaces.get('id')
 * - store.surfaces.keys()
 * - store.surfaces.values()
 * - store.surfaces.forEach(...)
 */
const A2UIStoreModel = types
	.model('A2UIStore', {
		surfaces: types.map(SurfaceModel),
	})
	.volatile(() => ({
		onAction: undefined as ((action: UserActionPayload) => void) | undefined,
	}))
	.actions((self) => ({
		getOrCreateSurface(surfaceId: string): IA2UISurface {
			let surface = self.surfaces.get(surfaceId)
			if (!surface) {
				surface = SurfaceModel.create({ surfaceId })
				self.surfaces.set(surfaceId, surface)
			}
			return surface
		},
		deleteSurface(surfaceId: string) {
			self.surfaces.delete(surfaceId)
		},
		setActionHandler(handler?: (action: UserActionPayload) => void) {
			self.onAction = handler
		},
		emitAction(action: UserActionPayload) {
			self.onAction?.(action)
		},
		ingest(message: A2UIMessage) {
			if ('surfaceUpdate' in message) {
				const surface = this.getOrCreateSurface(message.surfaceUpdate.surfaceId)
				for (const component of message.surfaceUpdate.components) {
					surface.addComponent(component)
				}
				surface.incrementVersion()
			} else if ('dataModelUpdate' in message) {
				const surface = this.getOrCreateSurface(message.dataModelUpdate.surfaceId)
				const { path, contents } = message.dataModelUpdate
				if (!path) {
					surface.setDataModel(valueEntriesToObject(contents))
				} else {
					const current = { ...surface.dataModel }
					const target = ensurePointer(current, path)
					applyEntries(target, contents)
					surface.setDataModel(current)
				}
				surface.incrementVersion()
			} else if ('beginRendering' in message) {
				const surface = this.getOrCreateSurface(message.beginRendering.surfaceId)
				surface.setRoot(message.beginRendering.root)
				if (message.beginRendering.catalogId) {
					surface.setCatalogId(message.beginRendering.catalogId)
				}
				if (message.beginRendering.styles) {
					surface.setStyles(message.beginRendering.styles)
				}
				surface.incrementVersion()
			} else if ('deleteSurface' in message) {
				this.deleteSurface(message.deleteSurface.surfaceId)
			}
		},
		ingestJsonLine(line: string) {
			const trimmed = line.trim()
			if (!trimmed) return
			this.ingest(JSON.parse(trimmed))
		},
	}))

export type IA2UIContextStore = Instance<typeof A2UIStoreModel>

/**
 * Create a new A2UI store
 */
export function createA2UIStore(options?: {
	onAction?: (action: UserActionPayload) => void
}): IA2UIContextStore {
	const store = A2UIStoreModel.create({})
	if (options?.onAction) {
		store.setActionHandler(options.onAction)
	}
	return store
}

// Re-export for backward compatibility
export { A2UIStoreModel, SurfaceModel }
