'use client'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { fetchOwnUserInfo, fetchUsers } from '../../db/db'
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
import { UsersArea } from '@/components/admin/users/UsersArea'
import { Input } from '@/components/ui/input'

export interface User {
  username: string
  fullName: string
  bluecardId: string
  isAdmin: boolean
  smartcards: { smartcardId: string }[]
  balance: number
}

export default function Home() {
  const { session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    if (!session) return

    const fetchData = async () => {
      const userInfoData = await fetchOwnUserInfo(session)

      if (userInfoData.data == null) return

      if (!userInfoData.data.isAdmin) {
        redirect('/')
      }

      const userData = await fetchUsers(session)

      if (userData.data == null) return

      setUsers(userData.data)
    }

    void fetchData()
  }, [session])

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-row justify-between w-full items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink>Admin</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink>Users</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Input
            placeholder="Search users…"
            className="w-max"
            onChange={(event) => setFilter(event.target.value.toLowerCase())}
          />
        </div>
      </header>

      <div className="flex flex-1 flex-col p-4">
        <ScrollArea>
          <UsersArea
            users={users.filter(
              (user) =>
                user.username.includes(filter) ||
                user.fullName.toLowerCase().includes(filter),
            )}
          />
        </ScrollArea>
      </div>
    </>
  )
}
