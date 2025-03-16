import { DBOffering, DBTransactionsPage, fetchOfferings } from '@/app/db/db'

export const getOfferingData = async (
  pages: DBTransactionsPage[],
): Promise<DBOffering[]> => {
  const offeringIds = new Set<string>(
    pages.map((page) => page.edges.map((edge) => edge.node.offeringId)).flat(),
  )

  let offeringData: DBOffering[] = []

  for (const offeringId of offeringIds) {
    const offering = localStorage.getItem(offeringId)

    if (offering != null) {
      offeringData.push(JSON.parse(offering) as DBOffering)
    } else {
      offeringData = []
      break
    }
  }

  if (offeringData.length === 0) {
    const dbOfferings = await fetchOfferings()
    if (dbOfferings.data != null) {
      for (const dbOffering of dbOfferings.data) {
        localStorage.setItem(dbOffering.name, JSON.stringify(dbOffering))
      }

      return dbOfferings.data
    }

    return []
  }

  return offeringData
}
