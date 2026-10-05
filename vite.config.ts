import { copyFileSync, cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
