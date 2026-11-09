import Image from 'next/image'
import { DateTime } from 'luxon'
import { Euro, Trash2, UsersRoundCollaboration } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Separator } from '../ui/separator'
import { Transaction } from '@/app/page'
import { useIsMobile } from '@/hooks/use-mobile'
import { OfferingImage } from '@/components/OfferingImage'
import { DeleteTransactionDialog } from '@/components/homepage/DeleteTransactionDialog'
import { useOwnUserInfo } from '@/hooks/data'
import {
  ListedTransaction,
  formatTransactionTime,
  getTransactionAmountCents,
  getTransactionTitle,
  mergeTransferPairs,
} from '@/lib/transactionDisplay'
import { cn } from '@/lib/utils'

export interface TransactionsAreaProps {
  transactions: Transaction[]
  showPayer?: boolean
  // Lists a top-up and a payout right after each other as one transfer.
  mergeTransfers?: boolean
}

export const TransactionsArea = (props: TransactionsAreaProps) => {
  const { showPayer, mergeTransfers } = props
  const isMobile = useIsMobile()
  const canDelete = useOwnUserInfo()?.isAdmin === true
  const [deletedIds, setDeletedIds] = useState<ReadonlySet<number>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<ListedTransaction | null>(
    null,
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Deleted cards update right away instead of reloading the list.
  const updatedTransactions = props.transactions.map((transaction) =>
    deletedIds.has(transaction.id) ?
      { ...transaction, deleted: true }
    : transaction,
  )
  const transactions: ListedTransaction[] =
    mergeTransfers === true ?
      mergeTransferPairs(updatedTransactions)
    : updatedTransactions

  const toDateTime = (timestamp: string) =>
    DateTime.fromISO(timestamp, {
      zone: 'UTC',
    }).setZone('Europe/Berlin')

  const getRelative = (timestamp: string): string => {
    const dateTime = toDateTime(timestamp)
    const toFormat = dateTime.toFormat('EEEE, dd.LL.yyyy')
    const toRelative = dateTime.toRelativeCalendar({ locale: 'en' })

    if (dateTime.diffNow('days').days < -1 || toRelative == null) {
      return toFormat
    }

    return toRelative[0].toUpperCase() + toRelative.slice(1) + ', ' + toFormat
  }

  return (
    <>
      {transactions.map((transaction, idx) => (
        <div key={transaction.id} className="mb-5">
          {(idx === 0 ||
            toDateTime(transactions[idx - 1].timestamp).day !==
              toDateTime(transaction.timestamp).day) && (
            <div className="flex w-full justify-evenly -mt-5">
              <Separator className="flex-1 self-center" />
              <span className="m-5 text-muted-foreground">
                {getRelative(transaction.timestamp)}
              </span>
              <Separator className="flex-1 self-center" />
            </div>
          )}
          <Card>
            <div
              className="flex flex-row"
              style={{
                display: 'grid',
                gridTemplateAreas:
                  !isMobile ?
                    `"left . image date"
                   "left . image ."
                   "left . image ."`
                  : `"left . . date" 
                   "left . . image"
                   "left . . image"`,
                gridTemplateColumns: 'auto max-content auto min-content',
                rowGap: '3em',
              }}
            >
              <div
                className="flex flex-col place-content-between"
                style={{ gridArea: 'left' }}
              >
                <CardHeader>
                  <CardTitle
                    className={transaction.deleted ? 'text-muted' : undefined}
                    style={
                      transaction.deleted ?
                        {
                          textDecorationLine: 'line-through',
                          textDecorationThickness: '2pt',
                        }
                      : undefined
                    }
                  >
                    {getTransactionTitle(transaction)}
                  </CardTitle>

                  <CardDescription
                    style={
                      transaction.deleted ?
                        {
                          textDecorationLine: 'line-through',
                          textDecorationThickness: '1pt',
                        }
                      : undefined
                    }
                    className={transaction.deleted ? 'text-muted' : undefined}
                  >
                    {transaction.transferPayout !== undefined ?
                      <>
                        from{' '}
                        <span
                          className={
                            transaction.deleted ? 'text-muted' : (
                              'text-accent-foreground'
                            )
                          }
                        >
                          @{transaction.transferPayout.payerUsername}
                        </span>{' '}
                        to{' '}
                        <span
                          className={
                            transaction.deleted ? 'text-muted' : (
                              'text-accent-foreground'
                            )
                          }
                        >
                          @{transaction.payerUsername}
                        </span>
                        <br />
                      </>
                    : showPayer && (
                        <>
                          paid by{' '}
                          <span
                            className={
                              transaction.deleted ? 'text-muted' : (
                                'text-accent-foreground'
                              )
                            }
                          >
                            @{transaction.payerUsername}
                          </span>
                          <br />
                        </>
                      )
                    }
                    authorized by{' '}
                    <span
                      className={
                        transaction.deleted ? 'text-muted' : (
                          'text-accent-foreground'
                        )
                      }
                    >
                      @{transaction.adminUsername}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <span
                    className={`text-3xl font-extrabold${
                      transaction.deleted ? ' text-muted' : ''
                    }`}
                    style={
                      transaction.deleted ?
                        {
                          textDecorationLine: 'line-through',
                          textDecorationThickness: '5pt',
                        }
                      : undefined
                    }
                  >
                    {new Intl.NumberFormat('de-DE', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(getTransactionAmountCents(transaction) / 100)}
                  </span>
                </CardFooter>
              </div>

              {!transaction.deleted && (
                <div
                  className="flex items-center justify-right justify-end"
                  style={{ gridArea: 'image' }}
                >
                  <div
                    className={`flex relative items-center justify-center group ${
                      isMobile ? ' right-2' : ''
                    }`}
                  >
                    <Image
                      className="relative group-hover:animate-spin-slow-pulsate-cw max-w-none"
                      src={{ src: '/star.svg', height: 150, width: 150 }}
                      alt="decorative star"
                    />
                    <Image
                      className="absolute group-hover:animate-spin-slow-ccw max-w-none"
                      src={{ src: '/star2.svg', height: 135, width: 135 }}
                      alt="decorative star2"
                    />
                    {transaction.transferPayout !== undefined ?
                      <UsersRoundCollaboration
                        height={120}
                        width={120}
                        className="text-background rotate-25 group-hover:animate-wiggle absolute max-w-none"
                      />
                    : transaction.offeringId !== 'topup' ?
                      <OfferingImage
                        className="rotate-25 group-hover:animate-wiggle absolute max-w-none text-background"
                        src={transaction.imageUrl}
                        size={120}
                        alt={transaction.offeringId}
                      />
                    : <Euro
                        height={120}
                        width={120}
                        className="text-background rotate-25 group-hover:animate-wiggle absolute max-w-none"
                      />
                    }
                  </div>
                </div>
              )}

              <div
                className={cn(
                  'flex items-center justify-end gap-1 justify-self-end pl-6',
                  canDelete && !transaction.deleted ? 'pr-3' : 'pr-6',
                )}
                style={{ gridArea: 'date' }}
              >
                <span
                  className={`text-xs text-muted${
                    transaction.deleted ? '' : '-foreground'
                  } whitespace-nowrap`}
                  style={
                    transaction.deleted ?
                      {
                        textDecorationLine: 'line-through',
                        textDecorationThickness: '1pt',
                      }
                    : undefined
                  }
                >
                  {formatTransactionTime(transaction.timestamp)}
                </span>
                {canDelete && !transaction.deleted && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="-my-2 text-muted-foreground hover:text-destructive"
                    aria-label={
                      transaction.transferPayout !== undefined ?
                        'Delete transfer'
                      : 'Delete transaction'
                    }
                    title={
                      transaction.transferPayout !== undefined ?
                        'Delete transfer'
                      : 'Delete transaction'
                    }
                    onClick={() => {
                      setDeleteTarget(transaction)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      ))}

      <DeleteTransactionDialog
        transaction={deleteTarget}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDeleted={(transactionIds) =>
          setDeletedIds((cur) => new Set([...cur, ...transactionIds]))
        }
      />
    </>
  )
}
