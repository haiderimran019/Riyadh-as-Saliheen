import { copyFileSync, cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { APP_NAME } from './src/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/hadith-reader/'
  const dataVersion = env.VITE_DATA_MODE === 'real' ? `Riyad ${new Date().toISOString().slice(0, 10)}` : 'Arabic text pending'

  return {
    // 1. Set the repository base path for Vite
    base: base,
    define: { __DATA_VERSION__: JSON.stringify(dataVersion) },
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
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
          clientsClaim: true,
          navigateFallback: `${base}index.html`,
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.includes('/data/') || url.pathname.includes('/data-local/'),
              handler: 'CacheFirst',
              options: {
                cacheName: `hadith-content-${dataVersion}`,
                expiration: { maxEntries: 2500, maxAgeSeconds: 60 * 60 * 24 * 365 },
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
          if (!existsSync(source)) throw new Error('Real mode requires data-local/generated. Run npm run data:import:riyad first.')
          cpSync(source, resolve('dist/data-local/generated'), { recursive: true })
          copyFileSync(resolve('dist/index.html'), resolve('dist/404.html'))
        },
      },
    ],
  }
})
