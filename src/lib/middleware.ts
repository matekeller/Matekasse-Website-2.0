import { DateTime } from 'luxon'
import { DBOffering, DBTransactionsPage, fetchOfferings } from '@/app/db/db'

export const getOfferingData = async (
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
        const offeringInfoFromTransactions = pages
          .map((page) => page.edges)
          .flat()
          .find((edge) => edge.node.offeringId === offeringObject.name)?.node

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
  if (expires !== null) {
    console.log(
      DateTime.fromISO(expires, { zone: 'UTC' }) > DateTime.now().toUTC(),
    )
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
