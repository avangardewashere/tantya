import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { AppShell } from '@/ui/app-shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tantya — Sukat in, quotation out',
  description:
    'A materials and cost estimator for small Philippine construction jobs. Type the ' +
    'measurements, get what to buy and what it costs.',
}

export const viewport: Viewport = {
  themeColor: '#faf9f5',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
