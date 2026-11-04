'use client'

import './globals.css'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/homepage/AppSidebar'
import { LoginForm } from '@/components/LoginForm'
import { useSession } from '@/hooks/session'
import { AdminActionsProvider } from '@/components/admin/actions/AdminActions'
import { Toaster } from '@/components/ui/sonner'

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
            <SidebarInset>
              {session ?
                <AdminActionsProvider>{children}</AdminActionsProvider>
              : <LoginForm />}
            </SidebarInset>
          )}
        </SidebarProvider>
        <Toaster theme="dark" position="top-center" />
      </body>
    </html>
  )
}
