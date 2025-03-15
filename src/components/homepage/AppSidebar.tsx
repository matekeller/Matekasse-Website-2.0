'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { CupSoda, Euro, ReceiptEuro, Unplug } from 'lucide-react'
import Image from 'next/image'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card'
import Link from 'next/link'
import { deleteSession } from '@/app/lib/session'
import { fetchOwnUserInfo } from '@/app/db/db'
import { useSession } from '@/hooks/session'
import { useEffect, useState } from 'react'

export function AppSidebar() {
  const { session } = useSession()

  const [userInfo, setUserInfo] = useState<{
    username: string
    fullName: string
    balance: number
  } | null>(null)
  const nameAbbr = getNameAbbreviation(userInfo?.fullName)

  useEffect(() => {
    if (!session) return

    const fetchData = async () => {
      const userInfoData = await fetchOwnUserInfo(session)

      if (userInfoData.data == null) return

      setUserInfo(userInfoData.data)
    }

    void fetchData()
  }, [session])

  return (
    <Sidebar>
      <SidebarHeader className="justify-center">
        <Image
          src={{ src: '/matemate.png', height: 150, width: 150 }}
          alt="MateMate Logo"
          className="self-center"
          priority={true}
        />
        <span
          style={{
            fontVariantCaps: 'small-caps',
          }}
          className="text-muted-foreground text-lg self-center font-semibold"
        >
          MateMate
        </span>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <ReceiptEuro />
                    <span>Transactions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="stats">
                    <LucideChartNoAxesCombined />
                    <span>Statistics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem> */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="offerings">
                    <CupSoda />
                    <span>Offerings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Separator />
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="https://api.matekasse.de/graphiql">
                    <Unplug />
                    <span>API</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Separator />
        <div className="flex items-center gap-3">
          <HoverCard>
            <HoverCardTrigger>
              <Avatar className="cursor-help">
                <AvatarFallback>{nameAbbr}</AvatarFallback>
              </Avatar>
            </HoverCardTrigger>
            <HoverCardContent>
              <div>
                <h4 className="font-semibold">
                  {session !== undefined ? userInfo?.fullName : ''}
                </h4>
                <span className="text-sm text-muted-foreground">
                  {session !== undefined ? '@' + userInfo?.username : ''}
                </span>
              </div>
            </HoverCardContent>
          </HoverCard>
          <Separator orientation="vertical" />
          <div className="flex justify-between w-full">
            <Euro />
            <span className="italic text-muted-foreground">
              {session !== undefined ?
                new Intl.NumberFormat('de-DE', {
                  style: 'decimal',
                  minimumFractionDigits: 2,
                }).format((-1 * (userInfo?.balance ?? 0)) / 100)
              : ''}
            </span>
          </div>
        </div>

        <Button onClick={() => deleteSession} className="w-full cursor-pointer">
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

const getNameAbbreviation = (
  fullName: string | undefined,
): string | undefined => {
  if (fullName !== undefined) {
    const nameSplit = fullName.split(' ')
    return (
      nameSplit[0][0].toUpperCase() +
      (nameSplit.length !== 1 ? nameSplit.pop()?.[0].toUpperCase() : '')
    )
  }

  return undefined
}
