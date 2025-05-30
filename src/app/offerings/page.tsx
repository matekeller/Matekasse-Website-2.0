'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import { DBOffering, fetchOfferings, fetchOwnUserInfo } from '../db/db'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@/components/ui/breadcrumb'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { OfferingsArea } from '@/components/offerings/OfferingsArea'
import { useSession } from '@/hooks/session'

export default function Home() {
  const [offerings, setOfferings] = useState<DBOffering[]>([])
  const { session } = useSession()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [needsUpdate, setNeedsUpdate] = useState(false)

  useEffect(() => {
    if (!session) return

    const fetchData = async () => {
      const userInfoData = await fetchOwnUserInfo(session)

      if (userInfoData.data == null) return

      setIsAdmin(userInfoData.data.isAdmin)
    }

    void fetchData()
  }, [session])

  useEffect(() => {
    const fetchData = async () => {
      console.log('fetsch')
      const offeringData = await fetchOfferings()

      if (offeringData.data == null) return

      setOfferings(
        offeringData.data.toSorted((a, b) =>
          a.readableName.localeCompare(b.readableName),
        ),
      )
    }

    void fetchData()
  }, [needsUpdate])

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink>Offerings</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ScrollArea>
          <OfferingsArea
            offerings={offerings}
            isAdmin={isAdmin ?? false}
            session={session}
            onUpdateOffering={() => setNeedsUpdate(!needsUpdate)}
          />
        </ScrollArea>
      </div>
    </>
  )
}
