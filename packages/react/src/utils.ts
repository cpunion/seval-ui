/**
 * A2UI Utility Functions
 */

import type { BoundValue, ValueEntry } from './a2ui-types'

export function decodePointer(pointer: string): string[] {
	if (!pointer) return []
	return pointer
		.replace(/^\//, '')
		.split('/')
		.filter(Boolean)
		.map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
}

export function getAtPointer(base: Record<string, unknown>, pointer: string): unknown {
	if (!pointer) {
		return base
	}
	const segments = decodePointer(pointer)
	// biome-ignore lint/suspicious/noExplicitAny: dynamic pointer access
	let current: any = base
	for (const segment of segments) {
		if (current == null || typeof current !== 'object') {
			return undefined
		}
		current = (current as Record<string, unknown>)[segment]
	}
	return current
}

export function ensurePointer(
	base: Record<string, unknown>,
	pointer: string,
): Record<string, unknown> {
	const segments = decodePointer(pointer)
	let current: Record<string, unknown> = base
	for (const segment of segments) {
		if (current[segment] == null || typeof current[segment] !== 'object') {
			current[segment] = {}
		}
		current = current[segment] as Record<string, unknown>
	}
	return current
}

export function encodePointerSegment(segment: string): string {
	return segment.replace(/~/g, '~0').replace(/\//g, '~1')
}

export function joinPointer(basePath: string | undefined, relativePath: string): string {
	if (!relativePath) {
		return basePath ?? ''
	}
	if (relativePath.startsWith('/')) {
		return relativePath
	}
	const baseSegments = basePath ? decodePointer(basePath) : []
	const relativeSegments = decodePointer(relativePath)
	const segments = [...baseSegments, ...relativeSegments]
	return segments.length === 0
		? ''
		: `/${segments.map((segment) => encodePointerSegment(segment)).join('/')}`
}

export function valueEntriesToObject(entries: ValueEntry[]): Record<string, unknown> {
	const result: Record<string, unknown> = {}
	for (const entry of entries) {
		result[entry.key] = decodeValueEntry(entry)
	}
	return result
}

function decodeValueEntry(entry: ValueEntry): unknown {
	if (entry.valueMap) {
		return valueEntriesToObject(entry.valueMap)
	}
	if (entry.valueArray) {
		return entry.valueArray.map((child) => decodeValueEntry(child))
	}
	if (entry.valueBoolean !== undefined) {
		return entry.valueBoolean
	}
	if (entry.valueNumber !== undefined) {
		return entry.valueNumber
	}
	if (entry.valueString !== undefined) {
		return entry.valueString
	}
	if (entry.valueNull) {
		return null
	}
	return null
}

export function applyEntries(target: Record<string, unknown>, entries: ValueEntry[]): void {
	for (const entry of entries) {
		target[entry.key] = decodeValueEntry(entry)
	}
}

export function resolveBoundValue(
	value: BoundValue | undefined,
	dataModel: Record<string, unknown>,
	basePath?: string,
): unknown {
	if (!value) return undefined
	if (value.path) {
		const pointer = value.path.startsWith('/') ? value.path : joinPointer(basePath, value.path)
		const resolved = getAtPointer(dataModel, pointer)
		if (resolved !== undefined) {
			return resolved
		}
	}
	if (value.literalString !== undefined) return value.literalString
	if (value.literalNumber !== undefined) return value.literalNumber
	if (value.literalBoolean !== undefined) return value.literalBoolean
	return undefined
}
