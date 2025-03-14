'use client'
export const runtime = 'edge'
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
import {
  DBTransactionsPage,
  fetchOfferings,
  fetchOwnTransactions,
} from './db/db'
import { useEffect, useState } from 'react'
import { useSession } from '@/hooks/session'
import { Cat } from 'lucide-react'
import { useInView } from 'react-intersection-observer'

export interface Transaction {
  id: number
  offeringId: string
  readableName: string
  imageUrl: string
  deleted: boolean
  adminUsername: string
  pricePaidCents: number
  timestamp: string
}

export default function Home() {
  const { session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cursor, setCursor] = useState<number | null>(null)

  const { ref, inView } = useInView()

  useEffect(() => {
    if (!session) return

    const fetchData = async () => {
      const transactionData = await fetchOwnTransactions(session)

      if (transactionData.data == null) return

      const serializedTransactions = await getTransactions([
        transactionData.data,
      ])

      setTransactions(serializedTransactions)
      setCursor(transactionData.data.pageInfo.endCursor)
    }

    void fetchData()
  }, [session])

  useEffect(() => {
    if (!session || !inView || !cursor) return

    const fetchMoreTransactions = async () => {
      const moreTransactions = await fetchOwnTransactions(session, cursor)

      if (moreTransactions.data == null) return

      const serializedTransactions = await getTransactions([
        moreTransactions.data,
      ])

      setTransactions((cur) => [...cur, ...serializedTransactions])
      setCursor(moreTransactions.data.pageInfo.endCursor)
    }

    void fetchMoreTransactions()
  }, [session, cursor, inView])

  return (
    <main>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
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

const getTransactions = async (
  pages: DBTransactionsPage[],
): Promise<Transaction[]> => {
  const offerings = await fetchOfferings()

  let transactions: Transaction[] = []

  if (offerings.data != null) {
    transactions = pages
      .map((page) =>
        page.edges.map((edge) => {
          const offering = offerings.data?.find(
            (offering) => offering.name === edge.node.offeringId,
          )
          return {
            id: edge.node.id,
            offeringId: edge.node.offeringId,
            readableName: offering?.readableName ?? edge.node.offeringId,
            imageUrl: offering?.imageUrl ?? '',
            deleted: edge.node.deleted,
            adminUsername: edge.node.admin.username,
            pricePaidCents: edge.node.pricePaidCents,
            timestamp: edge.node.timestamp,
          }
        }),
      )
      .flat()
  }

  return transactions
}
