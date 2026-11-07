'use client'

import { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { useSession } from './session'
import { fetchOfferings, fetchOwnUserInfo, fetchUsers } from '@/app/db/db'

const DATA_CHANGED_EVENT = 'matekasse:data-changed'

// Keyed per signed-in user, not per access token: a token refresh would
// otherwise empty the cache and briefly hide everything admin-only.
const USER_DATA_KEYS = new Set(['me', 'users'])

export const useOwnUserInfo = () => {
  const { session } = useSession()
  const { data } = useSWR(session === undefined ? null : 'me', () =>
    session === undefined ? null : fetchOwnUserInfo(session),
  )
  return data?.data ?? undefined
}

export const useUsers = () => {
  const { session } = useSession()
  const { data } = useSWR(session === undefined ? null : 'users', () =>
    session === undefined ? null : fetchUsers(session),
  )
  return { users: data?.data ?? undefined, errors: data?.errors }
}

// Drops the previous user's data once signed out, so the next one never sees it.
// Revalidating also discards SWR's request deduplication for these keys; no
// hook is subscribed to them while signed out, so nothing is fetched.
export const useClearUserDataOnSignOut = () => {
  const { session, isLoading } = useSession()

  useEffect(() => {
    if (!isLoading && session === undefined) {
      void mutate(
        (key) => typeof key === 'string' && USER_DATA_KEYS.has(key),
        undefined,
        { revalidate: true },
      )
    }
  }, [session, isLoading])
}

export const useOfferings = () => {
  const { data } = useSWR('offerings', () => fetchOfferings())
  return { offerings: data?.data ?? undefined, errors: data?.errors }
}

// Refreshes cached users, offerings and own user info, e.g. balances.
export const refreshSharedData = () => {
  void mutate((key) => key !== '/api/session')
}

// Also reloads pages that listen via useDataVersion.
export const notifyDataChanged = () => {
  refreshSharedData()
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
}

export const useDataVersion = () => {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const onChange = () => setVersion((cur) => cur + 1)
    window.addEventListener(DATA_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(DATA_CHANGED_EVENT, onChange)
  }, [])

  return version
}
