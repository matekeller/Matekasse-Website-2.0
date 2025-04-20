import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  getOfferingDataFromPages,
  getOfferingDataFromTransactions,
} from './middleware'
import { Transaction } from '@/app/page'
import { DBTransaction, DBTransactionsPage } from '@/app/db/db'

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
  const offerings = await getOfferingDataFromPages(pages, cursor)

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

export const getTransactionsFromRaw = async (
  dbTransactions: DBTransaction[],
): Promise<Transaction[]> => {
  const offerings = await getOfferingDataFromTransactions(dbTransactions)

  let transactions: Transaction[] = []

  transactions = dbTransactions.map((transaction) => {
    const offering = offerings.find(
      (offering) => offering.name === transaction.offeringId,
    )
    return {
      id: transaction.id,
      offeringId: transaction.offeringId,
      readableName: offering?.readableName ?? transaction.offeringId,
      imageUrl: offering?.imageUrl ?? '',
      deleted: transaction.deleted,
      payerUsername: transaction.payer.username,
      adminUsername: transaction.admin.username,
      pricePaidCents: transaction.pricePaidCents,
      timestamp: transaction.timestamp,
    }
  })

  return transactions
}
