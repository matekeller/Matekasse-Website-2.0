'use client'

import './globals.css'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/homepage/AppSidebar'
import { LoginForm } from '@/components/LoginForm'
import { useSession } from '@/hooks/session'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { session, isLoading } = useSession()

  return (
    <html lang="de" className="dark">
      <body>
        <meta name="apple-mobile-web-app-title" content="MateMate" />
        <SidebarProvider>
          <AppSidebar />
          {!isLoading && (
            <SidebarInset>{session ? children : <LoginForm />}</SidebarInset>
          )}
        </SidebarProvider>
      </body>
    </html>
  )
}
