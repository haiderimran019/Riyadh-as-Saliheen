import { defineConfig } from '@playwright/test'

const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173/Riyadh-as-Saliheen/'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  reporter: 'line',
  use: { baseURL: previewUrl },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/Riyadh-as-Saliheen/',
    reuseExistingServer: true,
  },
})
