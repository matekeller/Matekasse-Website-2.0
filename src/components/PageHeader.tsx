'use client'

import type { ReactNode } from 'react'
import { AutoRefresh } from '@/components/AutoRefresh'

export const PageHeader = ({ children }: { children: ReactNode }) => {
  return (
    <header
      data-slot="page-header"
      className="flex h-16 w-full shrink-0 items-center gap-2 overflow-hidden border-b px-4"
    >
      {children}
      <AutoRefresh />
    </header>
  )
}
