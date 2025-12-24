/**
 * A2UI Component Catalog
 *
 * React component renderers for A2UI protocol components.
 */

import React, { useState } from 'react'
import type { BoundValue, ComponentDefinition, ComponentDictionary } from './a2ui-types'
import { getAtPointer, joinPointer } from './utils'

export type RendererContext = {
	surfaceId: string
	dataModel: Record<string, unknown>
	dataPath?: string
	getDefinition: (id: string) => ComponentDefinition | undefined
	renderComponent: (id: string, options?: { dataPath?: string }) => React.ReactNode | null
	resolveBoundValue: (value: BoundValue | undefined, options?: { dataPath?: string }) => unknown
	emitAction: (payload: {
		surfaceId: string
		sourceComponentId: string
		name: string
		context?: Record<string, unknown>
	}) => void
}

type RendererFn = (props: {
	id: string
	definition: ComponentDefinition
	component: ComponentDictionary
	context: RendererContext
}) => React.ReactNode

export type ComponentRegistry = Record<string, RendererFn>

function renderTextContent(value: unknown): React.ReactNode {
	if (value == null) return null
	if (typeof value === 'string') {
		const linkMatch = value.match(/^\[(.+?)\]\((https?:\/\/[^\s]+)\)$/)
		if (linkMatch) {
			return (
				<a href={linkMatch[2]} target="_blank" rel="noreferrer">
					{linkMatch[1]}
				</a>
			)
		}
		return value
	}
	return value as React.ReactNode
}

export const defaultRegistry: ComponentRegistry = {
	Text: ({ component, context }) => {
		// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
		const textComponent = (component as any).Text ?? {}
		const value = context.resolveBoundValue(textComponent.text)
		if (value == null) return null
		const rendered = renderTextContent(value)
		const hint = textComponent.usageHint

		return (
			<section className="a2ui-text">
				{hint === 'h1' && <h1>{rendered}</h1>}
				{hint === 'h2' && <h2>{rendered}</h2>}
				{hint === 'h3' && <h3>{rendered}</h3>}
				{hint === 'h4' && <h4>{rendered}</h4>}
				{hint === 'h5' && <h5>{rendered}</h5>}
				{(!hint || hint === 'body') && <p>{rendered}</p>}
			</section>
		)
	},
	Column: ({ component, context }) => {
		// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
		const column = (component as any).Column ?? {}
		const template = column.children?.template
		const distribution = column.distribution
		const alignment = column.alignment

		const style: React.CSSProperties = {}
		if (distribution) {
			const justifyMap: Record<string, string> = {
				start: 'flex-start',
				center: 'center',
				end: 'flex-end',
				spaceBetween: 'space-between',
				spaceAround: 'space-around',
				spaceEvenly: 'space-evenly',
			}
			style.justifyContent = justifyMap[distribution] ?? distribution
		}
		if (alignment) {
			const alignMap: Record<string, string> = {
				start: 'flex-start',
				center: 'center',
				end: 'flex-end',
				stretch: 'stretch',
			}
			style.alignItems = alignMap[alignment] ?? alignment
		}

		if (template) {
			const bindingPath = template.dataBinding ?? ''
			const pointer = joinPointer(context.dataPath, bindingPath)
			const data = pointer ? getAtPointer(context.dataModel, pointer) : context.dataModel
			const entries: { key: string; path: string }[] = []
			if (Array.isArray(data)) {
				data.forEach((_, index) => {
					entries.push({ key: index.toString(), path: joinPointer(pointer, index.toString()) })
				})
			} else if (data && typeof data === 'object') {
				// biome-ignore lint/complexity/noForEach: Simpler for this use case
				Object.keys(data as Record<string, unknown>).forEach((key) => {
					entries.push({ key, path: joinPointer(pointer, key) })
				})
			}
			return (
				<div className="a2ui-column" style={style}>
					{entries.map(({ key, path }) => (
						<React.Fragment key={key}>
							{context.renderComponent(template.componentId, { dataPath: path })}
						</React.Fragment>
					))}
				</div>
			)
		}

		const childIds: string[] = column.children?.explicitList ?? []
		return (
			<div className="a2ui-column" style={style}>
				{childIds.map((childId: string) => (
					<React.Fragment key={childId}>{context.renderComponent(childId)}</React.Fragment>
				))}
			</div>
		)
	},
	Row: ({ component, context }) => {
		// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
		const row = (component as any).Row ?? {}
		const template = row.children?.template
		const distribution = row.distribution
		const alignment = row.alignment

		const style: React.CSSProperties = {}
		if (distribution) {
			const justifyMap: Record<string, string> = {
				start: 'flex-start',
				center: 'center',
				end: 'flex-end',
				spaceBetween: 'space-between',
				spaceAround: 'space-around',
				spaceEvenly: 'space-evenly',
			}
			style.justifyContent = justifyMap[distribution] ?? distribution
		}
		if (alignment) {
			const alignMap: Record<string, string> = {
				start: 'flex-start',
				center: 'center',
				end: 'flex-end',
				stretch: 'stretch',
			}
			style.alignItems = alignMap[alignment] ?? alignment
		}

		if (template) {
			const bindingPath = template.dataBinding ?? ''
			const pointer = joinPointer(context.dataPath, bindingPath)
			const data = pointer ? getAtPointer(context.dataModel, pointer) : context.dataModel
			const entries: { key: string; path: string }[] = []
			if (Array.isArray(data)) {
				data.forEach((_, index) => {
					entries.push({ key: index.toString(), path: joinPointer(pointer, index.toString()) })
				})
			} else if (data && typeof data === 'object') {
				// biome-ignore lint/complexity/noForEach: Simpler for this use case
				Object.keys(data as Record<string, unknown>).forEach((key) => {
					entries.push({ key, path: joinPointer(pointer, key) })
				})
			}
			return (
				<div className="a2ui-row" style={style}>
					{entries.map(({ key, path }) => (
						<div key={key} style={{ flex: 1, minWidth: 0 }}>
							{context.renderComponent(template.componentId, { dataPath: path })}
						</div>
					))}
				</div>
			)
		}

		const childIds: string[] = row.children?.explicitList ?? []
		return (
			<div className="a2ui-row" style={style}>
				{childIds.map((childId: string) => {
					const definition = context.getDefinition(childId)
					const weight = definition?.weight ? Number(definition.weight) : 1
					return (
						<div key={childId} style={{ flex: weight, minWidth: 0 }}>
							{context.renderComponent(childId)}
						</div>
					)
				})}
			</div>
		)
	},
	Card: ({ component, context }) => {
		// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
		const card = (component as any).Card ?? {}
		const childId = card.child
		if (!childId) return null
		return <div className="a2ui-card">{context.renderComponent(childId)}</div>
	},
	Image: ({ component, context }) => {
		// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
		const image = (component as any).Image ?? {}
		const src = context.resolveBoundValue(image.url)
		if (!src || typeof src !== 'string') return null
		const alt = context.resolveBoundValue(image.altText) ?? ''
		const hint = image.usageHint
		const isAvatar = hint === 'avatar'

		return <img src={src} alt={String(alt)} className={`a2ui-image ${isAvatar ? 'avatar' : ''}`} />
	},
	List: ({ component, context }) => {
		// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
		const list = (component as any).List ?? {}
		const template = list.children?.template
		if (template) {
			const bindingPath = template.dataBinding ?? ''
			const pointer = joinPointer(context.dataPath, bindingPath)
			const data = pointer ? getAtPointer(context.dataModel, pointer) : context.dataModel
			const entries: { key: string; path: string }[] = []
			if (Array.isArray(data)) {
				data.forEach((_, index) => {
					entries.push({ key: index.toString(), path: joinPointer(pointer, index.toString()) })
				})
			} else if (data && typeof data === 'object') {
				// biome-ignore lint/complexity/noForEach: Simpler for this use case
				Object.keys(data as Record<string, unknown>).forEach((key) => {
					entries.push({ key, path: joinPointer(pointer, key) })
				})
			}
			return (
				<div className="a2ui-list">
					{entries.map(({ key, path }) => (
						<div key={key}>{context.renderComponent(template.componentId, { dataPath: path })}</div>
					))}
				</div>
			)
		}

		const childIds: string[] = list.children?.explicitList ?? []
		return (
			<div className="a2ui-list">
				{childIds.map((childId: string) => (
					<div key={childId}>{context.renderComponent(childId)}</div>
				))}
			</div>
		)
	},
	Button: ({ id, component, context }) => {
		// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
		const button = (component as any).Button ?? {}
		const action = button.action as
			| { name: string; context?: { key: string; value?: BoundValue }[] }
			| undefined
		const childId = button.child
		const primary = button.primary
		const label = context.resolveBoundValue(button.label)

		const handleClick = () => {
			if (!action) return
			const contextEntries: Record<string, unknown> = {}
			for (const entry of action.context ?? []) {
				if (!entry || !entry.key) continue
				contextEntries[entry.key] = context.resolveBoundValue(entry.value)
			}
			context.emitAction({
				surfaceId: context.surfaceId,
				sourceComponentId: id,
				name: action.name,
				context: contextEntries,
			})
		}

		// Per A2UI spec, Button uses child to reference content component, or label for text
		const content = childId
			? context.renderComponent(childId)
			: label != null
				? String(label)
				: null
		if (!content) return null

		return (
			<button
				type="button"
				onClick={handleClick}
				className={`a2ui-button${primary ? ' primary' : ''}`}
			>
				{content}
			</button>
		)
	},
	Icon: ({ component, context }) => {
		// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
		const icon = (component as any).Icon ?? {}
		const name = context.resolveBoundValue(icon.name)
		if (!name || typeof name !== 'string') return null
		return <span className="a2ui-icon material-icons">{name}</span>
	},
	TextField: ({ id, component, context }) => {
		// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
		const textField = (component as any).TextField ?? {}
		const label = context.resolveBoundValue(textField.label)
		const value = context.resolveBoundValue(textField.text) ?? ''
		const fieldType = textField.textFieldType ?? 'shortText'
		// Prefer explicit inputBinding, fall back to bound text path
		const rawBinding = textField.inputBinding ?? textField.text?.path
		// Respect template dataPath so bindings inside lists work
		const bindingPath = rawBinding ? joinPointer(context.dataPath, rawBinding) : undefined

		const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			if (bindingPath) {
				context.emitAction({
					surfaceId: context.surfaceId,
					sourceComponentId: id,
					name: '__inputBinding',
					context: { path: bindingPath, value: e.target.value },
				})
			}
		}

		const inputType =
			fieldType === 'obscured'
				? 'password'
				: fieldType === 'number'
					? 'number'
					: fieldType === 'date'
						? 'date'
						: 'text'

		return (
			<div className="a2ui-textfield">
				{label != null && <label>{String(label)}</label>}
				{fieldType === 'longText' ? (
					<textarea value={String(value)} onChange={handleChange} rows={4} />
				) : (
					<input type={inputType} value={String(value)} onChange={handleChange} />
				)}
			</div>
		)
	},
	Checkbox: ({ id, component, context }) => {
		// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
		const checkbox = (component as any).Checkbox ?? {}
		const label = context.resolveBoundValue(checkbox.label)
		const value = context.resolveBoundValue(checkbox.value)
		// Prefer explicit inputBinding, fall back to bound value path
		const rawBinding = checkbox.inputBinding ?? checkbox.value?.path
		// Include template path context if present
		const bindingPath = rawBinding ? joinPointer(context.dataPath, rawBinding) : undefined

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			if (bindingPath) {
				context.emitAction({
					surfaceId: context.surfaceId,
					sourceComponentId: id,
					name: '__inputBinding',
					context: { path: bindingPath, value: e.target.checked },
				})
			}
		}

		return (
			<label className="a2ui-checkbox">
				<input type="checkbox" checked={Boolean(value)} onChange={handleChange} />
				{label != null && <span>{String(label)}</span>}
			</label>
		)
	},
	Divider: ({ component }) => {
		// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
		const divider = (component as any).Divider ?? {}
		const axis = divider.axis ?? 'horizontal'
		return <hr className={`a2ui-divider ${axis}`} />
	},
	Modal: ({ id, component, context }) => {
		return <ModalComponent key={id} component={component} context={context} />
	},
	Tabs: ({ id, component, context }) => {
		return <TabsComponent key={id} component={component} context={context} />
	},
}

// Separate React components for stateful renderers
function ModalComponent({
	component,
	context,
}: { component: ComponentDictionary; context: RendererContext }) {
	// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
	const modal = (component as any).Modal ?? {}
	const entryPointChild = modal.entryPointChild
	const contentChild = modal.contentChild
	const [isOpen, setIsOpen] = useState(false)

	return (
		<>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: modal trigger */}
			<div onClick={() => setIsOpen(true)} className="a2ui-modal-trigger">
				{entryPointChild && context.renderComponent(entryPointChild)}
			</div>
			{isOpen && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: modal overlay
				<div className="a2ui-modal-overlay" onClick={() => setIsOpen(false)}>
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: modal content */}
					<div className="a2ui-modal-content" onClick={(e) => e.stopPropagation()}>
						<button type="button" className="a2ui-modal-close" onClick={() => setIsOpen(false)}>
							×
						</button>
						{contentChild && context.renderComponent(contentChild)}
					</div>
				</div>
			)}
		</>
	)
}

function TabsComponent({
	component,
	context,
}: { component: ComponentDictionary; context: RendererContext }) {
	// biome-ignore lint/suspicious/noExplicitAny: A2UI protocol
	const tabs = (component as any).Tabs ?? {}
	const tabItems = tabs.tabItems ?? []
	const [activeIndex, setActiveIndex] = useState(0)

	return (
		<div className="a2ui-tabs">
			<div className="a2ui-tabs-header">
				{tabItems.map((tab: { title: BoundValue; child: string }, index: number) => (
					<button
						key={index}
						type="button"
						className={`a2ui-tab-button${index === activeIndex ? ' active' : ''}`}
						onClick={() => setActiveIndex(index)}
					>
						{renderTextContent(context.resolveBoundValue(tab.title))}
					</button>
				))}
			</div>
			<div className="a2ui-tabs-content">
				{tabItems[activeIndex]?.child && context.renderComponent(tabItems[activeIndex].child)}
			</div>
		</div>
	)
}

export function mergeRegistries(...registries: ComponentRegistry[]): ComponentRegistry {
	return Object.assign({}, ...registries)
}
