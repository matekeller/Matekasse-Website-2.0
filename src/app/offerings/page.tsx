'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import { DBOffering, fetchOfferings } from '../db/db'
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

export default function Home() {
  const [offerings, setOfferings] = useState<DBOffering[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const offeringData = await fetchOfferings()

      if (offeringData.data == null) return

      setOfferings(
        offeringData.data.toSorted((a, b) =>
          a.readableName.localeCompare(b.readableName),
        ),
      )
    }

    void fetchData()
  }, [])

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
          <OfferingsArea offerings={offerings} />
        </ScrollArea>
      </div>
    </>
  )
}
