/**
 * Simple A2UI Store Implementation
 */

import type { IA2UIStore, IComponent, ISurface } from './types'

/**
 * Simple Surface implementation
 */
export class Surface implements ISurface {
	id: string
	dataModel: Record<string, unknown>
	version: number
	private components: Map<string, IComponent>

	constructor(id: string, dataModel: Record<string, unknown> = {}) {
		this.id = id
		this.dataModel = dataModel
		this.version = 0
		this.components = new Map()
	}

	getComponent(id: string): IComponent | undefined {
		return this.components.get(id)
	}

	addComponent(component: IComponent): void {
		this.components.set(component.id, component)
	}

	setDataModel(model: Record<string, unknown>): void {
		this.dataModel = model
	}

	incrementVersion(): void {
		this.version++
	}
}

/**
 * Simple A2UI Store implementation
 */
export class A2UIStore implements IA2UIStore {
	surfaces: Map<string, ISurface>
	private listeners: Set<() => void>

	constructor() {
		this.surfaces = new Map()
		this.listeners = new Set()
	}

	getSurface(id: string): ISurface | undefined {
		return this.surfaces.get(id)
	}

	addSurface(surface: ISurface): void {
		this.surfaces.set(surface.id, surface)
		this.notify()
	}

	removeSurface(id: string): void {
		this.surfaces.delete(id)
		this.notify()
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}

	private notify(): void {
		for (const listener of this.listeners) {
			listener()
		}
	}
}

/**
 * Create a new A2UI store
 */
export function createStore(): A2UIStore {
	return new A2UIStore()
}
