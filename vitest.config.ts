import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'server/**'],
    setupFiles: './src/test/setup.ts',
  },
})
