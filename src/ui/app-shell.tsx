import type { ReactNode } from 'react'

/**
 * The page shell: a masthead and the working area under it.
 *
 * It lives in `src/ui` rather than in the layout file so a test can render it
 * on its own and run jest-axe over it (B0-T1). The layout is then only three
 * lines of plumbing.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b-4 border-accent bg-paper-raised">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-0.5 px-4 py-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Tantya</h1>
          <p className="text-sm text-ink-soft">Sukat in, quotation out.</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>

      <footer className="mx-auto w-full max-w-3xl border-t border-rule px-4 pt-4 pb-6 text-sm text-ink-soft">
        <p>
          Quantities are estimates for budgeting, not structural design. Check every
          figure against your plans.
        </p>
      </footer>
    </div>
  )
}
