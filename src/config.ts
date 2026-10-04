export const APP_NAME = 'Hadith App'
export const APP_VERSION = '0.1.0'
export const DATA_VERSION = 'placeholder-1'
export const DATA_LAST_UPDATED = '2026-10-04'
const clientEnv = typeof import.meta.env === 'object' ? import.meta.env : {} as ImportMetaEnv

export const FEEDBACK_ENDPOINT = clientEnv.VITE_FEEDBACK_ENDPOINT ?? ''
export const FEEDBACK_KEY = clientEnv.VITE_FEEDBACK_KEY ?? ''
export const FEEDBACK_ENABLED = Boolean(FEEDBACK_ENDPOINT && FEEDBACK_KEY)
export const SHOW_FEEDBACK = FEEDBACK_ENABLED || Boolean(clientEnv.DEV)
export const DEFAULT_COLLECTION = 'nawawi-placeholder'
export const getDataRoot = () => `${import.meta.env.BASE_URL}data`
