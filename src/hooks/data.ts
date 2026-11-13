'use client'

import { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { useSession } from './session'
import {
  fetchOfferings,
  fetchOwnUserInfo,
  fetchSales,
  fetchUsers,
} from '@/app/db/db'

const DATA_CHANGED_EVENT = 'matekasse:data-changed'

// Keyed per signed-in user, not per access token: a token refresh would
// otherwise empty the cache and briefly hide everything admin-only.
const USER_DATA_KEYS = new Set(['me', 'users', 'sales'])
let refreshInProgress = false
let refreshFailed = false

const isUserDataKey = (key: unknown) => {
  const name: unknown = Array.isArray(key) ? key[0] : key
  return typeof name === 'string' && USER_DATA_KEYS.has(name)
}

const requireData = <T extends { data: unknown }>(result: T): T => {
  if (result.data === null) {
    throw new Error('Request returned no data')
  }

  return result
}

const recordRefreshFailure = () => {
  if (refreshInProgress) refreshFailed = true
}

const didRefreshFail = () => refreshFailed

export const useOwnUserInfo = () => {
  const { session } = useSession()
  const { data } = useSWR(
    session === undefined ? null : 'me',
    async () =>
      session === undefined ? null : (
        requireData(await fetchOwnUserInfo(session))
      ),
    { onError: recordRefreshFailure },
  )
  return data?.data ?? undefined
}

export const useUsers = () => {
  const { session } = useSession()
  const { data } = useSWR(
    session === undefined ? null : 'users',
    async () =>
      session === undefined ? null : requireData(await fetchUsers(session)),
    { onError: recordRefreshFailure },
  )
  return { users: data?.data ?? undefined, errors: data?.errors }
}

export const useSales = (username: string | null) => {
  const { session } = useSession()
  const { data } = useSWR(
    session === undefined ? null : (['sales', username] as const),
    async ([, user]) =>
      session === undefined ? null : (
        requireData(await fetchSales(session, user))
      ),
    { keepPreviousData: true, onError: recordRefreshFailure },
  )

  return data === undefined ? undefined : (data?.data ?? [])
}

// Drops the previous user's data once signed out, so the next one never sees it.
// Revalidating also discards SWR's request deduplication for these keys; no
// hook is subscribed to them while signed out, so nothing is fetched.
export const useClearUserDataOnSignOut = () => {
  const { session, isLoading } = useSession()

  useEffect(() => {
    if (!isLoading && session === undefined) {
      void mutate(isUserDataKey, undefined, { revalidate: true })
    }
  }, [session, isLoading])
}

export const useOfferings = () => {
  const { data } = useSWR(
    'offerings',
    async () => requireData(await fetchOfferings()),
    { onError: recordRefreshFailure },
  )
  return { offerings: data?.data ?? undefined, errors: data?.errors }
}

// Refreshes cached users, offerings and own user info, e.g. balances.
export const refreshSharedData = () => {
  return mutate((key) => key !== '/api/session')
}

export const refreshData = async () => {
  refreshFailed = false
  refreshInProgress = true
  try {
    await mutate('/api/session')
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve())
    })
    await refreshSharedData()
    if (didRefreshFail()) throw new Error('One or more requests failed')
    window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
  } finally {
    refreshInProgress = false
  }
}

// Also reloads pages that listen via useDataVersion.
export const notifyDataChanged = () => {
  void refreshData().catch((error: unknown) => {
    console.error('Failed to refresh shared data', error)
  })
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
