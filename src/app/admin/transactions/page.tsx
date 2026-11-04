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
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useSession } from '@/hooks/session'
import { Transaction } from '@/app/page'
import { TransactionsArea } from '@/components/homepage/TransactionsArea'
import { getTransactions } from '@/lib/utils'

export default function Home() {
  const { session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cursor, setCursor] = useState<number | null>(null)

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
        cursor,
      )

      setTransactions(serializedTransactions)
      setCursor(transactionData.data.pageInfo.endCursor)
    }

    void fetchData()
  }, [session])

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
  }, [session, cursor, inView])

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink>Admin</BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink>All Transactions</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ScrollArea>
          <TransactionsArea transactions={transactions} showPayer />
          {transactions.length !== 0 && (
            <Cat className="text-muted w-full h-50" ref={ref} />
          )}
        </ScrollArea>
      </div>
    </>
  )
}
