'use client'
export const runtime = 'edge'
import Link from 'next/link'
import { redirect, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Transaction } from '@/app/page'
import { useSession } from '@/hooks/session'
import { useDataVersion } from '@/hooks/data'
import {
  fetchOwnUserInfo,
  fetchUsers,
  fetchUserTransactions,
} from '@/app/db/db'
import { assert, getTransactionsFromRaw } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TransactionsArea } from '@/components/homepage/TransactionsArea'
import { PageHeader } from '@/components/PageHeader'

export default function Page() {
  const { username } = useParams()

  assert(typeof username === 'string')

  const { session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const dataVersion = useDataVersion()

  useEffect(() => {
    if (!session) return

    const fetchData = async () => {
      const userInfoData = await fetchOwnUserInfo(session)

      if (!userInfoData.data?.isAdmin) {
        redirect('/')
      }

      const requestedUserData = await fetchUsers(session)

      if (
        !requestedUserData.data?.map((user) => user.username).includes(username)
      ) {
        redirect('/')
      }

      const transactionData = await fetchUserTransactions(session, username)

      if (transactionData.data == null) return

      const serializedTransactions = await getTransactionsFromRaw(
        transactionData.data,
      )

      setTransactions(serializedTransactions)
    }

    void fetchData()
  }, [session, username, dataVersion])

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
              <BreadcrumbLink render={<Link href="/admin/transactions" />}>
                All Transactions
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{username}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ScrollArea>
          <TransactionsArea transactions={transactions} />
        </ScrollArea>
      </div>
    </>
  )
}
