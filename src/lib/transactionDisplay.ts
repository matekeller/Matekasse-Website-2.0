import { DateTime } from 'luxon'
import { Transaction } from '@/app/page'

export interface ListedTransaction extends Transaction {
  transferPayout?: Transaction
}

export const getTransactionTitle = (transaction: ListedTransaction) => {
  if (transaction.transferPayout !== undefined) return 'Transfer'
  if (transaction.offeringId !== 'topup') return transaction.readableName
  return transaction.pricePaidCents < 0 ? 'Aufladung' : 'Ausbuchung'
}

// Top-ups store credit as a negative price, but are shown as positive.
export const getTransactionAmountCents = (transaction: Transaction) =>
  transaction.offeringId === 'topup' ?
    -transaction.pricePaidCents
  : transaction.pricePaidCents

export const formatTransactionTime = (timestamp: string) =>
  DateTime.fromISO(timestamp, { zone: 'UTC' })
    .setZone('Europe/Berlin')
    .toFormat('dd.LL.yyyy – HH:mm')

const TRANSFER_MAX_GAP_MS = 60_000

const toMillis = (timestamp: string) =>
  DateTime.fromISO(timestamp, { zone: 'UTC' }).toMillis()

const isTransfer = (topup: Transaction, payout: Transaction) =>
  topup.offeringId === 'topup' &&
  payout.offeringId === 'topup' &&
  topup.pricePaidCents < 0 &&
  topup.pricePaidCents === -payout.pricePaidCents &&
  topup.payerUsername !== payout.payerUsername &&
  topup.adminUsername === payout.adminUsername &&
  topup.deleted === payout.deleted &&
  Math.abs(toMillis(topup.timestamp) - toMillis(payout.timestamp)) <=
    TRANSFER_MAX_GAP_MS

export const mergeTransferPairs = (transactions: Transaction[]) => {
  const listed: ListedTransaction[] = []
  let idx = 0

  while (idx < transactions.length) {
    const current = transactions[idx]
    const next = transactions.at(idx + 1)
    const afterNext = transactions.at(idx + 2)

    if (next !== undefined && isTransfer(current, next)) {
      listed.push({ ...current, transferPayout: next })
      idx += 2
    } else if (
      next !== undefined &&
      isTransfer(next, current) &&
      !(afterNext !== undefined && isTransfer(next, afterNext))
    ) {
      listed.push({ ...next, transferPayout: current })
      idx += 2
    } else {
      listed.push(current)
      idx += 1
    }
  }

  return listed
}
