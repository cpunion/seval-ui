import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
/// <reference types="vite/client" />
import { type Plugin, defineConfig } from 'vite'

const nodeModulesPath = path.resolve('./node_modules')

// Plugin to handle .seval and .sexp files as raw text
function sevalRawPlugin(): Plugin {
	return {
		name: 'seval-raw',
		load(id) {
			if (id.endsWith('.seval') || id.endsWith('.sexp')) {
				const content = fs.readFileSync(id, 'utf-8')
				return `export default ${JSON.stringify(content)}`
			}
		},
	}
}

export default defineConfig({
	plugins: [sevalRawPlugin(), react()],
	resolve: {
		alias: {
			react: path.join(nodeModulesPath, 'react'),
			'react-dom': path.join(nodeModulesPath, 'react-dom'),
		},
	},
	optimizeDeps: {
		include: ['react', 'react-dom'],
		exclude: ['@seval-ui/seval'],
	},
})
