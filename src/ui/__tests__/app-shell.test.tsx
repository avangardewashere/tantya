/**
 * B0-T1 · The shell renders, and has no obvious accessibility faults.
 *
 * jsdom has a page structure but no layout engine, so this proves the markup
 * and the labels, never how anything looks. The look is checked by hand, in
 * Chrome and on a real Android, and that list is in the block note.
 */
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AppShell } from '../app-shell'
import HomePage from '@/app/page'

const renderShell = () =>
  render(
    <AppShell>
      <HomePage />
    </AppShell>,
  )

describe('B0-T1 the page shell', () => {
  it('shows the name and the tagline', () => {
    renderShell()

    expect(screen.getByRole('heading', { level: 1, name: 'Tantya' })).toBeInTheDocument()
    expect(screen.getByText('Sukat in, quotation out.')).toBeInTheDocument()
  })

  it('puts the page content in a main landmark', () => {
    renderShell()

    const main = screen.getByRole('main')
    expect(main).toContainElement(screen.getByRole('heading', { level: 2 }))
  })

  it('carries the disclaimer from the first block onwards', () => {
    renderShell()

    // Block 3 settles the final wording and makes it un-removable on a quote.
    // Having it here from the start means no screen ever shipped without it.
    expect(
      screen.getByText(/estimates for budgeting, not structural design/i),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations jest-axe can see', async () => {
    const { container } = renderShell()

    expect(await axe(container)).toHaveNoViolations()
  })
})
