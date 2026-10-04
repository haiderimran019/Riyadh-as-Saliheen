import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  reporter: 'line',
  use: { baseURL: 'http://127.0.0.1:4173/hadith-reader/' },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/hadith-reader/',
    reuseExistingServer: true,
  },
})
