import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'MateMate',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className="dark">
      <body>
        <meta name="apple-mobile-web-app-title" content="MateMate" />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
