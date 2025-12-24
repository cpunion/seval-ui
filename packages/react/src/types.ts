/**
 * S-Expression Types for A2UI
 */

/**
 * Surface interface - represents a UI surface with components and data model
 */
export interface ISurface {
    id: string
    dataModel: Record<string, unknown>
    version: number
    getComponent(id: string): IComponent | undefined
    setDataModel(model: Record<string, unknown>): void
    incrementVersion(): void
}

/**
 * Component interface
 */
export interface IComponent {
    id: string
    component: Record<string, unknown>
}

/**
 * A2UI Store interface
 */
export interface IA2UIStore {
    surfaces: Map<string, ISurface>
    getSurface(id: string): ISurface | undefined
    addSurface(surface: ISurface): void
    removeSurface(id: string): void
}

/**
 * Action payload
 */
export interface ActionPayload {
    surfaceId: string
    name: string
    context?: Record<string, unknown>
}

/**
 * Action handler function type
 */
export type ActionHandler = (payload: ActionPayload) => void
