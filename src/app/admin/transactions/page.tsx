'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { Cat } from 'lucide-react'
import { fetchAllTransactions, fetchOwnUserInfo } from '../../db/db'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useSession } from '@/hooks/session'
import { useTransactionPages } from '@/hooks/transactions'
import { TransactionsArea } from '@/components/homepage/TransactionsArea'
import { PageHeader } from '@/components/PageHeader'

export default function Home() {
  const { session } = useSession()
  const hasSession = session !== undefined
  const [isAdmin, setIsAdmin] = useState(false)
  const { transactions, loadMoreRef } = useTransactionPages(
    fetchAllTransactions,
    isAdmin,
  )

  useEffect(() => {
    if (!session) return

    const checkAdmin = async () => {
      const userInfoData = await fetchOwnUserInfo(session)

      if (userInfoData.data == null) return

      if (!userInfoData.data.isAdmin) {
        redirect('/')
      }

      setIsAdmin(true)
    }

    void checkAdmin()
  }, [hasSession])

  return (
    <>
      <PageHeader>
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">Admin</BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>All Transactions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ScrollArea>
          <TransactionsArea
            transactions={transactions}
            showPayer
            mergeTransfers
          />
          {transactions.length !== 0 && (
            <Cat className="text-muted w-full h-50" ref={loadMoreRef} />
          )}
        </ScrollArea>
      </div>
    </>
  )
}
