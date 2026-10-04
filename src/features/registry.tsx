import { lazy } from 'react'
import { BookOpen, Bookmark, House, Search, type LucideIcon } from 'lucide-react'

export const routeFeatures = [
  { path: '/', page: lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage }))) },
  { path: '/library', page: lazy(() => import('../pages/LibraryPage').then((module) => ({ default: module.LibraryPage }))) },
  { path: '/collection/:collectionId', page: lazy(() => import('../pages/CollectionPage').then((module) => ({ default: module.CollectionPage }))) },
  { path: '/collection/:collectionId/chapter/:chapterId', page: lazy(() => import('../pages/ReaderPage').then((module) => ({ default: module.ReaderPage }))) },
  { path: '/search', page: lazy(() => import('../pages/SearchPage').then((module) => ({ default: module.SearchPage }))) },
  { path: '/saved', page: lazy(() => import('../pages/SavedPage').then((module) => ({ default: module.SavedPage }))) },
  { path: '/settings', page: lazy(() => import('../pages/SettingsPage').then((module) => ({ default: module.SettingsPage }))) },
  { path: '/sources', page: lazy(() => import('../pages/SourcesPage').then((module) => ({ default: module.SourcesPage }))) },
  { path: '/about', page: lazy(() => import('../pages/AboutPage').then((module) => ({ default: module.AboutPage }))) },
  { path: '/privacy', page: lazy(() => import('../pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage }))) },
  { path: '/terms', page: lazy(() => import('../pages/TermsPage').then((module) => ({ default: module.TermsPage }))) },
] as const

type NavigationFeature = { path: string; label: string; ariaLabel: string; icon: LucideIcon; end?: boolean }

export const navigationFeatures: NavigationFeature[] = [
  { path: '/', label: 'Home', ariaLabel: 'Home', icon: House, end: true },
  { path: '/library', label: 'Library', ariaLabel: 'Library', icon: BookOpen },
  { path: '/search', label: 'Search', ariaLabel: 'Search', icon: Search },
  { path: '/saved', label: 'Saved', ariaLabel: 'Saved', icon: Bookmark },
]
