/**
 * Tests for @seval-ui/react catalog utilities
 */
import { describe, expect, it } from 'bun:test'
import { mergeRegistries, defaultRegistry } from './catalog'
import type { ComponentRegistry } from './catalog'

describe('mergeRegistries', () => {
    it('returns empty object for no arguments', () => {
        const result = mergeRegistries()
        expect(result).toEqual({})
    })

    it('returns copy of single registry', () => {
        const custom: ComponentRegistry = {
            Custom: () => null as unknown as React.ReactNode,
        }
        const result = mergeRegistries(custom)
        expect(Object.keys(result)).toContain('Custom')
    })

    it('merges multiple registries', () => {
        const reg1: ComponentRegistry = {
            A: () => null as unknown as React.ReactNode,
        }
        const reg2: ComponentRegistry = {
            B: () => null as unknown as React.ReactNode,
        }
        const result = mergeRegistries(reg1, reg2)
        expect(Object.keys(result)).toContain('A')
        expect(Object.keys(result)).toContain('B')
    })

    it('later registries override earlier ones', () => {
        const original = () => 'original' as unknown as React.ReactNode
        const override = () => 'override' as unknown as React.ReactNode

        const reg1: ComponentRegistry = { Same: original }
        const reg2: ComponentRegistry = { Same: override }

        const result = mergeRegistries(reg1, reg2)
        expect(result.Same).toBe(override)
    })
})

describe('defaultRegistry', () => {
    it('contains standard component renderers', () => {
        const components = Object.keys(defaultRegistry)
        expect(components).toContain('Text')
        expect(components).toContain('Column')
        expect(components).toContain('Row')
        expect(components).toContain('Card')
        expect(components).toContain('Image')
        expect(components).toContain('List')
        expect(components).toContain('Button')
        expect(components).toContain('Icon')
        expect(components).toContain('TextField')
        expect(components).toContain('Checkbox')
        expect(components).toContain('Divider')
        expect(components).toContain('Modal')
        expect(components).toContain('Tabs')
    })

    it('all renderers are functions', () => {
        for (const [name, renderer] of Object.entries(defaultRegistry)) {
            expect(typeof renderer).toBe('function')
        }
    })
})
