import { cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { APP_NAME } from './src/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = '/Riyadh-as-Saliheen/'

  return {
    // 1. Set the repository base path for Vite
    base: base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
        manifest: {
          name: APP_NAME,
          short_name: APP_NAME,
          description: 'A private, offline-capable hadith reader.',
          theme_color: '#315c52',
          background_color: '#f7f8f5',
          display: 'standalone',
          // 2. Align PWA URLs with base path
          start_url: base,
          scope: base,
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          navigateFallback: `${base}index.html`,
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.includes('/data/') || url.pathname.includes('/data-local/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'hadith-chapters-v1',
                expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
      {
        name: 'copy-local-real-data',
        closeBundle() {
          if (env.VITE_DATA_MODE !== 'real') return
          const source = resolve('data-local/generated')
          if (!existsSync(source)) throw new Error('Real mode requires data-local/generated. Run npm run data:fetch:hadeethenc first.')
          cpSync(source, resolve('dist/data-local/generated'), { recursive: true })
        },
      },
    ],
  }
})
