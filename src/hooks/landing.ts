'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useOwnUserInfo } from './data'
import { useSession } from './session'

const LANDED_KEY = 'matekasse:landed'
// Used when the browser blocks storage, then only for this page load.
let landedFallback = false

const hasLanded = () => {
  try {
    return sessionStorage.getItem(LANDED_KEY) !== null
  } catch {
    return landedFallback
  }
}

const setLanded = (landed: boolean) => {
  landedFallback = landed
  try {
    if (landed) sessionStorage.setItem(LANDED_KEY, '1')
    else sessionStorage.removeItem(LANDED_KEY)
  } catch {
    // Storage is blocked, the fallback covers this page load.
  }
}

// Admins opening the site on "/" land on all transactions instead. After that,
// "/" stays reachable in this tab, reloads included, until the next sign-in.
export const useAdminLandingRedirect = () => {
  const { session, isLoading } = useSession()
  const isAdmin = useOwnUserInfo()?.isAdmin
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && session === undefined) {
      setLanded(false)
      return
    }
    if (isAdmin === undefined || hasLanded()) return

    setLanded(true)
    if (isAdmin && pathname === '/') router.replace('/admin/transactions')
  }, [session, isLoading, isAdmin, pathname, router])
}
