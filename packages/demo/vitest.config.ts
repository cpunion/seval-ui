import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			environment: 'jsdom',
			setupFiles: './vitest.setup.ts',
			pool: 'forks', // Use forks for better test isolation with SExpRuntime state
			fileParallelism: false, // Run test files sequentially to avoid state interference
		},
	}),
)
