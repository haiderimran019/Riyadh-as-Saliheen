import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'

vi.mock('./data/db', () => ({ getSetting: async (_key: string, fallback: unknown) => fallback, setSetting: async () => undefined }))
vi.mock('./services/AccountContext', () => ({ AccountProvider: ({ children }: { children: ReactNode }) => children, useAccount: () => ({ account: null }) }))
vi.mock('./features/registry', () => ({ routeFeatures: [{ path: '/', page: () => <main>Reading home</main> }] }))
vi.mock('./components/FeedbackModal', () => ({ FeedbackModal: () => null }))
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

test('bottom More opens only reading settings while the top-left button opens navigation', async () => {
  const { container } = render(<MemoryRouter><App/></MemoryRouter>)
  const more = screen.getByRole('button', { name: 'Reading settings' })
  fireEvent.click(more)
  expect(await screen.findByRole('dialog', { name: 'Reading settings' })).toBeInTheDocument()
  expect(more).toHaveAttribute('aria-expanded', 'true')
  expect(container.querySelector('.workspace-sidebar')).not.toHaveClass('is-open')
  fireEvent.click(screen.getByRole('button', { name: 'Close reading settings' }))
  await waitFor(() => expect(more).toHaveAttribute('aria-expanded', 'false'))
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
  expect(container.querySelector('.workspace-sidebar')).toHaveClass('is-open')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(container.querySelector('.workspace-topbar .display-button')).toBeNull()
  expect(container.querySelector('.workspace-topbar .account-topbar-link')).toBeNull()
  expect(container.querySelector('.sidebar-note svg')).toBeNull()
})

test('footer keeps compact links while notices live on the linked About page', () => {
  const { container } = render(<MemoryRouter><App/></MemoryRouter>)
  const footer = container.querySelector('.site-footer')!
  expect(footer.querySelector('a[href="/about"]')).toHaveTextContent('About')
  expect(footer.querySelector('.footer-caution')).toBeNull()
  expect(footer.querySelector('.footer-source')).toBeNull()
  expect(footer.querySelector('.footer-meta')).toBeNull()
})
