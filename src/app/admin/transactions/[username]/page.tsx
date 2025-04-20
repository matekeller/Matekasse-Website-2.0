'use client'
export const runtime = 'edge'
import { redirect, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Transaction } from '@/app/page'
import { useSession } from '@/hooks/session'
import {
  fetchOwnUserInfo,
  fetchUsers,
  fetchUserTransactions,
} from '@/app/db/db'
import { assert, getTransactionsFromRaw } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TransactionsArea } from '@/components/homepage/TransactionsArea'

export default function Page() {
  const { username } = useParams()

  assert(typeof username === 'string')

  const { session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])

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
  }, [session, username])

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
              <BreadcrumbLink>Transactions</BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink>{username}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ScrollArea>
          <TransactionsArea transactions={transactions} />
        </ScrollArea>
      </div>
    </>
  )
}
