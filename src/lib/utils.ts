import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getOfferingData } from './middleware'
import { Transaction } from '@/app/page'
import { DBTransactionsPage } from '@/app/db/db'

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}
type Assert = (condition: unknown, message?: string) => asserts condition
export const assert: Assert = (
  condition: unknown,
  msg?: string,
): asserts condition => {
  if (!condition) {
    throw Error(msg)
  }
}

export const getTransactions = async (
  pages: DBTransactionsPage[],
  cursor?: number | null,
): Promise<Transaction[]> => {
  const offerings = await getOfferingData(pages, cursor)

  let transactions: Transaction[] = []

  transactions = pages
    .map((page) =>
      page.edges.map((edge) => {
        const offering = offerings.find(
          (offering) => offering.name === edge.node.offeringId,
        )
        return {
          id: edge.node.id,
          offeringId: edge.node.offeringId,
          readableName: offering?.readableName ?? edge.node.offeringId,
          imageUrl: offering?.imageUrl ?? '',
          deleted: edge.node.deleted,
          payerUsername: edge.node.payer.username,
          adminUsername: edge.node.admin.username,
          pricePaidCents: edge.node.pricePaidCents,
          timestamp: edge.node.timestamp,
        }
      }),
    )
    .flat()

  return transactions
}
