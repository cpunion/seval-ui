/**
 * A2UI SurfaceView Component
 */

import { observer } from 'mobx-react-lite'
import type React from 'react'
import { useMemo } from 'react'
import type { RendererContext } from './catalog'
import { _useRegistry, useA2UIStore } from './context'
import type { IA2UISurface } from './store'
import { resolveBoundValue } from './utils'

export interface SurfaceViewProps {
	surface: IA2UISurface
}

export const SurfaceView = observer(function SurfaceView({ surface }: SurfaceViewProps) {
	const store = useA2UIStore()
	const registry = _useRegistry()

	const rendererContext = useMemo((): RendererContext | null => {
		if (!surface || !surface.root) return null

		const renderComponentWithPath = (
			componentId: string,
			dataPath?: string,
		): React.ReactNode | null => {
			const definition = surface.getComponent(componentId)
			if (!definition) return null
			const component = definition.component
			const type = Object.keys(component)[0]
			if (!type) return null
			const renderer = registry[type]
			if (!renderer) return null
			const childContext = buildContext(dataPath)
			return renderer({
				id: componentId,
				// biome-ignore lint/suspicious/noExplicitAny: ComponentDefinition type mismatch
				definition: definition as any,
				component,
				context: childContext,
			})
		}

		const buildContext = (dataPath?: string): RendererContext => ({
			surfaceId: surface.surfaceId,
			dataModel: surface.dataModel,
			dataPath,
			// biome-ignore lint/suspicious/noExplicitAny: ComponentDefinition type mismatch
			getDefinition: (id) => surface.getComponent(id) as any,
			emitAction: (payload) => store.emitAction(payload),
			renderComponent: (id, options) => renderComponentWithPath(id, options?.dataPath ?? dataPath),
			resolveBoundValue: (bound, options) => {
				if (!bound) return undefined
				return resolveBoundValue(bound, surface.dataModel, options?.dataPath ?? dataPath)
			},
		})

		return buildContext()
	}, [surface, surface?.version, registry, store])

	if (!rendererContext) {
		return null
	}

	const styleProps: React.CSSProperties = {}
	if (surface.styles) {
		for (const [key, value] of Object.entries(surface.styles)) {
			if (typeof value === 'string') {
				;(styleProps as Record<string, string>)[`--a2ui-${key}`] = value
			}
		}
	}

	// biome-ignore lint/style/noNonNullAssertion: root is always defined when surface exists
	const tree = rendererContext.renderComponent(surface.root!)
	return (
		<div className="a2ui-surface-root" style={styleProps}>
			{tree}
		</div>
	)
})
