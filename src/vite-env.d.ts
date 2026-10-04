/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FEEDBACK_ENDPOINT?: string
  readonly VITE_FEEDBACK_KEY?: string
  readonly VITE_DATA_MODE?: 'placeholder' | 'real'
}
