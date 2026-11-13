'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { useInView } from 'react-intersection-observer'
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
import { useDataVersion } from '@/hooks/data'
import { Transaction } from '@/app/page'
import { TransactionsArea } from '@/components/homepage/TransactionsArea'
import { getTransactions } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'

export default function Home() {
  const { session } = useSession()
  // Token refreshes change `session`; reloading on them would reset the list.
  const hasSession = session !== undefined
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const dataVersion = useDataVersion()

  const { ref, inView } = useInView()

  useEffect(() => {
    if (!session) return

    const fetchData = async () => {
      const userInfoData = await fetchOwnUserInfo(session)

      if (userInfoData.data == null) return

      if (!userInfoData.data.isAdmin) {
        redirect('/')
      }

      const transactionData = await fetchAllTransactions(session)

      if (transactionData.data == null) return

      const serializedTransactions = await getTransactions(
        [transactionData.data],
        null,
      )

      setTransactions(serializedTransactions)
      setCursor(transactionData.data.pageInfo.endCursor)
    }

    void fetchData()
  }, [hasSession, dataVersion])

  useEffect(() => {
    if (!session || !inView || !cursor) return

    const fetchMoreTransactions = async () => {
      const moreTransactions = await fetchAllTransactions(session, cursor)

      if (moreTransactions.data == null) return

      const serializedTransactions = await getTransactions(
        [moreTransactions.data],
        cursor,
      )

      setTransactions((cur) => [...cur, ...serializedTransactions])
      setCursor(moreTransactions.data.pageInfo.endCursor)
    }

    void fetchMoreTransactions()
  }, [hasSession, cursor, inView])

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
            <Cat className="text-muted w-full h-50" ref={ref} />
          )}
        </ScrollArea>
      </div>
    </>
  )
}
