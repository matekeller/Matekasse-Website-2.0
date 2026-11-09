'use client'
export const runtime = 'edge'
import { Cat } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { fetchOwnTransactions } from './db/db'
import { TransactionsArea } from '@/components/homepage/TransactionsArea'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useSession } from '@/hooks/session'
import { useDataVersion, useOwnUserInfo } from '@/hooks/data'
import { getTransactions } from '@/lib/utils'

export interface Transaction {
  id: number
  offeringId: string
  readableName: string
  imageUrl: string
  deleted: boolean
  payerUsername: string
  adminUsername: string
  pricePaidCents: number
  timestamp: string
}

export default function Home() {
  const { session } = useSession()
  const isAdmin = useOwnUserInfo()?.isAdmin
  const router = useRouter()
  // Token refreshes change `session`; reloading on them would reset the list.
  const hasSession = session !== undefined
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const dataVersion = useDataVersion()

  const { ref, inView } = useInView()

  useEffect(() => {
    if (isAdmin) router.replace('/admin/transactions')
  }, [isAdmin, router])

  useEffect(() => {
    if (!session || isAdmin) return

    const fetchData = async () => {
      const transactionData = await fetchOwnTransactions(session)

      if (transactionData.data == null) return

      const serializedTransactions = await getTransactions(
        [transactionData.data],
        null,
      )

      setTransactions(serializedTransactions)
      setCursor(transactionData.data.pageInfo.endCursor)
    }

    void fetchData()
  }, [hasSession, dataVersion, isAdmin])

  useEffect(() => {
    if (!session || isAdmin || !inView || !cursor) return

    const fetchMoreTransactions = async () => {
      const moreTransactions = await fetchOwnTransactions(session, cursor)

      if (moreTransactions.data == null) return

      const serializedTransactions = await getTransactions(
        [moreTransactions.data],
        cursor,
      )

      setTransactions((cur) => [...cur, ...serializedTransactions])
      setCursor(moreTransactions.data.pageInfo.endCursor)
    }

    void fetchMoreTransactions()
  }, [hasSession, isAdmin, cursor, inView])

  if (isAdmin) return null

  return (
    <main>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink>Transactions</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ScrollArea>
          <TransactionsArea transactions={transactions} />
          {transactions.length !== 0 && (
            <Cat className="text-muted w-full h-50" ref={ref} />
          )}
        </ScrollArea>
      </div>
    </main>
  )
}
