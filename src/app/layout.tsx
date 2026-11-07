'use client'

import './globals.css'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/homepage/AppSidebar'
import { LoginForm } from '@/components/LoginForm'
import { useSession } from '@/hooks/session'
import { useClearUserDataOnSignOut } from '@/hooks/data'
import { AdminActionsProvider } from '@/components/admin/actions/AdminActions'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { session, isLoading } = useSession()
  useClearUserDataOnSignOut()

  return (
    <html lang="de" className="dark">
      <body>
        <meta name="apple-mobile-web-app-title" content="MateMate" />
        <TooltipProvider>
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
        </TooltipProvider>
        <Toaster theme="dark" position="top-center" />
      </body>
    </html>
  )
}
