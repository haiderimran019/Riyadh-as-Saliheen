/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare const __DATA_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_FEEDBACK_ENDPOINT?: string
  readonly VITE_FEEDBACK_KEY?: string
  readonly VITE_DATA_MODE?: 'placeholder' | 'real'
}
