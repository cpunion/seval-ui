/**
 * A2UI Protocol Types
 */

export type ComponentDictionary = Record<string, unknown>

export interface ComponentDefinition {
    id: string
    component: ComponentDictionary
    weight?: number
    [key: string]: unknown
}

export interface SurfaceUpdateMessage {
    surfaceUpdate: {
        surfaceId: string
        components: ComponentDefinition[]
    }
}

export interface ValueEntry {
    key: string
    valueString?: string
    valueNumber?: number
    valueBoolean?: boolean
    valueNull?: boolean
    valueArray?: ValueEntry[]
    valueMap?: ValueEntry[]
}

export interface DataModelUpdateMessage {
    dataModelUpdate: {
        surfaceId: string
        path?: string
        contents: ValueEntry[]
    }
}

export interface BeginRenderingMessage {
    beginRendering: {
        surfaceId: string
        root: string
        catalogId?: string
        styles?: Record<string, unknown>
    }
}

export interface DeleteSurfaceMessage {
    deleteSurface: {
        surfaceId: string
    }
}

export type A2UIMessage =
    | SurfaceUpdateMessage
    | DataModelUpdateMessage
    | BeginRenderingMessage
    | DeleteSurfaceMessage

export interface BoundValue {
    literalString?: string
    literalNumber?: number
    literalBoolean?: boolean
    path?: string
}

export interface ActionContextEntry {
    key: string
    value?: BoundValue
}

export interface ActionDefinition {
    name: string
    context?: ActionContextEntry[]
}

export interface UserActionPayload {
    surfaceId: string
    sourceComponentId: string
    name: string
    context?: Record<string, unknown>
}

export interface SurfaceSnapshot {
    surfaceId: string
    root?: string
    catalogId?: string
    styles?: Record<string, unknown>
    components: Map<string, ComponentDefinition>
    dataModel: Record<string, unknown>
    version: number
}
