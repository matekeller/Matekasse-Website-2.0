import { DateTime } from 'luxon'
import { Transaction } from '@/app/page'

export const getTransactionTitle = (transaction: Transaction) => {
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
