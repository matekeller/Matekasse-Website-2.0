'use client'

import { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { useSession } from './session'
import { fetchOfferings, fetchOwnUserInfo, fetchUsers } from '@/app/db/db'

const DATA_CHANGED_EVENT = 'matekasse:data-changed'

export const useOwnUserInfo = () => {
  const { session } = useSession()
  const { data } = useSWR(
    session ? ['me', session] : null,
    ([, jwt]: [string, string]) => fetchOwnUserInfo(jwt),
  )
  return data?.data ?? undefined
}

export const useUsers = () => {
  const { session } = useSession()
  const { data } = useSWR(
    session ? ['users', session] : null,
    ([, jwt]: [string, string]) => fetchUsers(jwt),
  )
  return { users: data?.data ?? undefined, errors: data?.errors }
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
