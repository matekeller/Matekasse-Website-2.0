import type { Metadata } from 'next'
import './globals.css'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/homepage/AppSidebar'
import { LoginForm } from '@/components/LoginForm'

export const metadata: Metadata = {
  title: 'Matekasse',
  description: 'Mate den ganzen Tag!',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className="dark">
      <body>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <LoginForm />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  )
}
