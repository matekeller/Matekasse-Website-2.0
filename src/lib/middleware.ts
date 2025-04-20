import { DateTime } from 'luxon'
import {
  DBOffering,
  DBTransaction,
  DBTransactionsPage,
  fetchOfferings,
} from '@/app/db/db'

export const getOfferingDataFromPages = async (
  pages: DBTransactionsPage[],
  cursor?: number | null,
): Promise<DBOffering[]> => {
  const offeringIds = new Set<string>(
    pages
      .map((page) =>
        page.edges
          .filter((edge) => edge.node.offeringId !== 'topup')
          .map((edge) => edge.node.offeringId),
      )
      .flat(),
  )

  return await fetchOfferingsFromStorage(
    Array.from(offeringIds),
    pages.map((page) => page.edges.map((edge) => edge.node)).flat(),
    cursor,
  )
}

export const getOfferingDataFromTransactions = async (
  transactions: DBTransaction[],
): Promise<DBOffering[]> => {
  const offeringIds = new Set<string>(
    transactions.map((transaction) => transaction.offeringId),
  )

  return await fetchOfferingsFromStorage(Array.from(offeringIds), transactions)
}

const fetchOfferingsFromStorage = async (
  offeringIds: string[],
  transactions: DBTransaction[],
  cursor?: number | null,
): Promise<DBOffering[]> => {
  let offeringData: DBOffering[] = []

  const expires = localStorage.getItem('expires')

  if (
    expires !== null &&
    DateTime.fromISO(expires, { zone: 'UTC' }) > DateTime.now().toUTC()
  ) {
    for (const offeringId of offeringIds) {
      const offering = localStorage.getItem(offeringId)

      if (offering != null) {
        const offeringObject = JSON.parse(offering) as DBOffering
        const offeringInfoFromTransactions = transactions.find(
          (edge) => edge.offeringId === offeringObject.name,
        )

        // important: fetch new if price differs in the most recent transactions (=> cursor === null)
        if (
          offeringInfoFromTransactions !== undefined &&
          offeringInfoFromTransactions.pricePaidCents !==
            offeringObject.priceCents &&
          cursor === null
        ) {
          offeringData = []
          break
        }

        offeringData.push(offeringObject)
      } else {
        offeringData = []
        break
      }
    }
  }

  if (offeringData.length === 0) {
    const dbOfferings = await fetchOfferings()

    if (dbOfferings.data != null) {
      localStorage.setItem(
        'expires',
        DateTime.now().toUTC().plus({ days: 30 }).toISO(),
      )

      for (const dbOffering of dbOfferings.data) {
        localStorage.setItem(dbOffering.name, JSON.stringify(dbOffering))
      }

      return dbOfferings.data
    }

    return []
  }

  return offeringData
}
