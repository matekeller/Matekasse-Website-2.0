'use client'
export const runtime = 'edge'
import { Cat } from 'lucide-react'
import { fetchOwnTransactions } from './db/db'
import { TransactionsArea } from '@/components/homepage/TransactionsArea'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { PageHeader } from '@/components/PageHeader'
import { useTransactionPages } from '@/hooks/transactions'

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
  const { transactions, loadMoreRef } =
    useTransactionPages(fetchOwnTransactions)

  return (
    <main>
      <PageHeader>
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Transactions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ScrollArea>
          <TransactionsArea transactions={transactions} />
          {transactions.length !== 0 && (
            <Cat className="text-muted w-full h-50" ref={loadMoreRef} />
          )}
        </ScrollArea>
      </div>
    </main>
  )
}
