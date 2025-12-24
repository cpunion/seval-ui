/**
 * A2UI SurfaceView Component
 */

import type React from 'react'
import { useA2UISurface, useRendererContext } from './context'

export interface SurfaceViewProps {
	surfaceId: string
}

export function SurfaceView({ surfaceId }: SurfaceViewProps) {
	const surface = useA2UISurface(surfaceId)
	const rendererContext = useRendererContext(surface)

	if (!surface || !surface.root) {
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

	const tree = rendererContext.renderComponent(surface.root)
	return (
		<div className="a2ui-surface-root" style={styleProps}>
			{tree}
		</div>
	)
}
