import type { Metadata } from 'next'
import './globals.css'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/homepage/AppSidebar'
import { LoginForm } from '@/components/LoginForm'
import { getSession } from './lib/session'
import { Dialog } from '@/components/ui/dialog'

export const metadata: Metadata = {
  title: 'Matekasse',
  description: 'Mate den ganzen Tag!',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <html lang="de" className="dark">
          <body>
            {session != undefined ?
              <>{children}</>
            : <Dialog>
                <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                  <div className="w-full max-w-sm">
                    <LoginForm />
                  </div>
                </div>
              </Dialog>
            }
          </body>
        </html>
      </SidebarInset>
    </SidebarProvider>
  )
}
