export const APP_NAME = 'Riyad as-Salihin'
export const APP_VERSION = '0.2.0'
declare const __DATA_VERSION__: string
const clientEnv = typeof import.meta.env === 'object' ? import.meta.env : {} as ImportMetaEnv

export const DATA_MODE = clientEnv.VITE_DATA_MODE === 'real' ? 'real' : 'placeholder'
export const DATA_VERSION = typeof __DATA_VERSION__ === 'string' ? __DATA_VERSION__ : 'Arabic text pending'
export const DATA_LAST_UPDATED = DATA_VERSION === 'Arabic text pending' ? 'Not yet published' : DATA_VERSION.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? 'Not specified'

export const FEEDBACK_ENDPOINT = clientEnv.VITE_FEEDBACK_ENDPOINT ?? ''
export const FEEDBACK_KEY = clientEnv.VITE_FEEDBACK_KEY ?? ''
export const FEEDBACK_ENABLED = Boolean(FEEDBACK_ENDPOINT && FEEDBACK_KEY)
export const SHOW_FEEDBACK = FEEDBACK_ENABLED || Boolean(clientEnv.DEV)
export const DEFAULT_COLLECTION = 'riyad-as-salihin'
export const getDataRoot = () => DATA_MODE === 'real' ? `${clientEnv.BASE_URL ?? '/'}data-local/generated` : `${clientEnv.BASE_URL ?? '/'}data`
