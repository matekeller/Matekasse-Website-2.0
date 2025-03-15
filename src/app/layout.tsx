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
  const { session } = useSession()

  return (
    <html lang="de" className="dark">
      <body>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{session ? children : <LoginForm />}</SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  )
}
