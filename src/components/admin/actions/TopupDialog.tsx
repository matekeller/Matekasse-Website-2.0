'use client'
import { useActionState, useEffect, useState } from 'react'
import {
  ACTION_DIALOG_CLASS,
  ActionDialogProps,
  FormErrors,
  displayBalance,
  formatCents,
  toastWithUndo,
} from './shared'
import { UserPicker } from './UserPicker'
import { topup } from '@/app/actions/transactions'
import { BookingState } from '@/app/lib/definitions'
import { notifyDataChanged, useUsers } from '@/hooks/data'
import { useSession } from '@/hooks/session'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const QUICK_AMOUNTS_EUROS = [5, 10, 20, 50]

export const TopupDialog = (props: ActionDialogProps) => {
  const { open, onOpenChange } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={ACTION_DIALOG_CLASS}>
        <TopupForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

const TopupForm = (props: ActionDialogProps) => {
  const { initialUsername, onOpenChange } = props
  const { session } = useSession()
  const { users } = useUsers()

  const [username, setUsername] = useState(initialUsername ?? null)
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit')
  const [amount, setAmount] = useState('')
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    topup,
    {},
  )

  const user = users?.find((candidate) => candidate.username === username)
  const amountCents = Math.round(Number(amount) * 100)
  const isValidAmount = Number.isFinite(amountCents) && amountCents > 0
  const isCredit = direction === 'credit'
  const signedAmountCents =
    !isValidAmount ? 0
    : isCredit ? amountCents
    : -amountCents

  useEffect(() => {
    if (!state.success || !state.transactionIds || session === undefined) {
      return
    }

    toastWithUndo(
      `${isCredit ? 'Topped up' : 'Paid out'} ${formatCents(amountCents)} for @${username ?? ''}`,
      session,
      state.transactionIds,
    )
    notifyDataChanged()
    onOpenChange(false)
  }, [state])

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="session" value={session ?? ''} />
      <input type="hidden" name="payer" value={username ?? ''} />
      <input type="hidden" name="direction" value={direction} />

      <DialogHeader>
        <DialogTitle>{isCredit ? 'Top up' : 'Pay out'}</DialogTitle>
        <DialogDescription>
          {isCredit ?
            'Credit money a user has handed over.'
          : 'Debit money that is paid out to a user.'}
        </DialogDescription>
      </DialogHeader>

      <UserPicker
        users={users}
        value={username}
        onChange={setUsername}
        disabled={pending}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={isCredit ? 'default' : 'outline'}
          onClick={() => setDirection('credit')}
          disabled={pending}
        >
          Top up
        </Button>
        <Button
          type="button"
          variant={!isCredit ? 'default' : 'outline'}
          onClick={() => setDirection('debit')}
          disabled={pending}
        >
          Pay out
        </Button>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="topup-amount">Amount in €</Label>
        <Input
          id="topup-amount"
          name="amount"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          placeholder="0,00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          disabled={pending}
        />
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS_EUROS.map((quickAmount) => (
            <Button
              key={quickAmount}
              type="button"
              variant="secondary"
              size="sm"
              className="pointer-coarse:h-10"
              onClick={() => setAmount(String(quickAmount))}
              disabled={pending}
            >
              {formatCents(quickAmount * 100)}
            </Button>
          ))}
        </div>
      </div>

      {user && (
        <div className="grid grid-cols-2 gap-1 text-sm">
          <span className="text-muted-foreground">Current balance</span>
          <span className="text-right">{displayBalance(user.balance)}</span>
          <span className="text-muted-foreground">New balance</span>
          <span className="text-right font-semibold">
            {displayBalance(user.balance - signedAmountCents)}
          </span>
        </div>
      )}

      <FormErrors state={state} />

      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending || !isValidAmount || !user || session === undefined}
        >
          {pending ?
            'Booking…'
          : `${isCredit ? 'Top up' : 'Pay out'}${isValidAmount ? ' ' + formatCents(amountCents) : ''}`
          }
        </Button>
      </DialogFooter>
    </form>
  )
}
