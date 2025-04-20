import Image from 'next/image'
import { DateTime } from 'luxon'
import { Euro } from 'lucide-react'
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

export interface TransactionsAreaProps {
  transactions: Transaction[]
  showPayer?: boolean
}

export const TransactionsArea = (props: TransactionsAreaProps) => {
  const { transactions, showPayer } = props
  const isMobile = useIsMobile()

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

  const getDateTimeFormat = (timestamp: string): string =>
    toDateTime(timestamp).toFormat('dd.LL.yyyy – HH:mm')

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
                    {transaction.offeringId !== 'topup' ?
                      transaction.readableName
                    : transaction.pricePaidCents < 0 ?
                      'Aufladung'
                    : 'Ausbuchung'}
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
                    {showPayer && (
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
                    )}
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
                    }).format(
                      (transaction.offeringId === 'topup' ?
                        -1 * transaction.pricePaidCents
                      : transaction.pricePaidCents) / 100,
                    )}
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
                    {transaction.offeringId !== 'topup' ?
                      <Image
                        className="rotate-25 group-hover:animate-wiggle absolute max-w-none"
                        src={{
                          src: transaction.imageUrl,
                          height: 120,
                          width: 120,
                        }}
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
                className={`text-xs text-muted${
                  transaction.deleted ? '' : '-foreground'
                } px-6 justify-self-end whitespace-nowrap`}
                style={
                  transaction.deleted ?
                    {
                      textDecorationLine: 'line-through',
                      textDecorationThickness: '1pt',
                      gridArea: 'date',
                    }
                  : {
                      gridArea: 'date',
                    }
                }
              >
                {getDateTimeFormat(transaction.timestamp)}
              </div>
            </div>
          </Card>
        </div>
      ))}
    </>
  )
}
