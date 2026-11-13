'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useDataVersion } from './data'
import { useSession } from './session'
import type { DBTransactionsPage } from '@/app/db/db'
import type { Transaction } from '@/app/page'
import { keepScrollPosition } from '@/lib/scroll'
import { getTransactions } from '@/lib/utils'

type FetchTransactionsPage = (
  session: string,
  cursor?: number,
) => Promise<{ data: DBTransactionsPage | null }>

interface TransactionList {
  transactions: Transaction[]
  // Where the next older page starts.
  cursor: number | null
}

// With more new transactions than these pages hold, the list starts over.
const MAX_REFRESH_PAGES = 5

// Loads transactions page by page while scrolling. On data changes, e.g. the
// automatic refresh, new transactions are added on top of the loaded pages.
export const useTransactionPages = (
  fetchPage: FetchTransactionsPage,
  enabled = true,
) => {
  const { session } = useSession()
  // Token refreshes change `session`; reloading on them would reset the list.
  const hasSession = session !== undefined
  const dataVersion = useDataVersion()
  const [list, setList] = useState<TransactionList>({
    transactions: [],
    cursor: null,
  })
  const listRef = useRef(list)
  const { ref, inView } = useInView()

  useEffect(() => {
    listRef.current = list
  }, [list])

  useEffect(() => {
    if (session === undefined || !enabled) return

    const newestId = listRef.current.transactions.at(0)?.id

    const loadNewest = async () => {
      const pages: DBTransactionsPage[] = []
      let reachedLoaded = false

      while (!reachedLoaded && pages.length < MAX_REFRESH_PAGES) {
        const response = await fetchPage(
          session,
          pages.at(-1)?.pageInfo.endCursor,
        )
        if (response.data == null) return

        pages.push(response.data)
        reachedLoaded =
          newestId === undefined ||
          !response.data.pageInfo.hasNextPage ||
          response.data.edges.some((edge) => edge.node.id <= newestId)
      }

      const newest = await getTransactions(pages, null)
      const newestCursor = pages.at(-1)?.pageInfo.endCursor ?? null
      const oldestNewId = newest.at(-1)?.id

      keepScrollPosition(() => {
        setList((cur) => {
          const older =
            reachedLoaded && oldestNewId !== undefined ?
              cur.transactions.filter(
                (transaction) => transaction.id < oldestNewId,
              )
            : []

          return {
            transactions: [...newest, ...older],
            cursor: older.length === 0 ? newestCursor : cur.cursor,
          }
        })
      })
    }

    void loadNewest()
  }, [hasSession, enabled, dataVersion])

  useEffect(() => {
    const { cursor } = list
    if (session === undefined || !inView || !cursor) return

    const loadOlder = async () => {
      const response = await fetchPage(session, cursor)
      if (response.data == null) return

      const nextCursor = response.data.pageInfo.endCursor
      const older = await getTransactions([response.data], cursor)

      // Dropped if the list changed meanwhile, e.g. started over.
      setList((cur) =>
        cur.cursor === cursor ?
          { transactions: [...cur.transactions, ...older], cursor: nextCursor }
        : cur,
      )
    }

    void loadOlder()
  }, [hasSession, list.cursor, inView])

  return { transactions: list.transactions, loadMoreRef: ref }
}
